import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import jwt from "jsonwebtoken"
import {asyncHandler} from "../utils/asyncHandler.js"
import { randomInt } from 'node:crypto'

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
    
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})
    
        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,'error to create refresh and access token')
    }
}

const ROLE_PREFIX = { student: 'STU', employee: 'EMP', admin: 'ADM' }

// builds STU/EMP/ADM + 6 digits and retries until the id is unused
const generateUniqueMemberId = async (role) => {
    const prefix = ROLE_PREFIX[role]
    for (let i = 0; i < 10; i++) {
        const candidate = `${prefix}${randomInt(100000, 1000000)}`
        const taken = await User.exists({ memberId: candidate })
        if (!taken) return candidate
    }
    throw new ApiError(500, 'Could not generate a unique member id, please try again')
}

// register user
const register = asyncHandler(async (req, res) => {
    const { username, email, password, role, secret, phoneNumber } = req.body
    let { memberId } = req.body

    if([username, email, password].some(field => typeof field !== 'string' || !field?.trim())) {
        throw new ApiError(400, "valid fields are required")
    }

    const existingUser = await User.findOne({$or: [{email}, {username}]})
    if(existingUser){
        throw new ApiError(400, "User with this email or username already exists")
    }

    const userRole = role ?? 'student'
    if (!Object.keys(ROLE_PREFIX).includes(userRole)) {
        throw new ApiError(400, "role must be 'student', 'employee' or 'admin'")
    }

    // 3. staff roles need their own secret
    if (userRole !== 'student') {
        const expected = userRole === 'admin'
            ? process.env.ADMIN_REGISTER_SECRET
            : process.env.EMPLOYEE_REGISTER_SECRET

        // `!expected` stops a missing env value from matching a missing secret
        if (!expected || secret !== expected) {
            throw new ApiError(403, `Invalid ${userRole} registration secret`)
        }
    }

    // 4. normalise, then check each unique field with its own message
    const cleanUsername = username.trim()
    const cleanEmail = email.trim().toLowerCase()

    if (await User.exists({ username: cleanUsername })) {
        throw new ApiError(409, 'Username is already taken')
    }
    if (await User.exists({ email: cleanEmail })) {
        throw new ApiError(409, 'Email is already registered')
    }

    // 5. member id: use the supplied one, or generate EMP/STU/ADM + number
    let finalMemberId
    if (typeof memberId === 'string' && memberId.trim()) {
        finalMemberId = memberId.trim().toUpperCase()
        if (await User.exists({ memberId: finalMemberId })) {
            throw new ApiError(409, 'This member id is already in use')
        }
    } else {
        finalMemberId = await generateUniqueMemberId(userRole)
    }
    
    const newUser = await User.create({ 
        username: cleanUsername, email: cleanEmail, password, role: userRole, memberId: finalMemberId, phoneNumber })

    const createdUser = await User.findById(newUser._id).select('-password -refreshToken')
    if(!createdUser){
        throw new ApiError(500, "Something went wrong ,registering faild")
    }

    res.status(201).json(new ApiResponse(201,"User registered successfully", createdUser))
})

// login user
const login = asyncHandler(async (req, res) => {
    const { username , password } = req.body
    
    if(!username || !password || [username, password].some(field => field?.trim() === '')) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findOne({username}).select('+password')
    if(!user){
        throw new ApiError(400, "Invalid username")
    }
    if(!user.isActive){
        throw new ApiError(403, "User account is deactivated")
    }

    const isPasswordValid = await user.comparePassword(password)
    if(!isPasswordValid){
        throw new ApiError(400, "wrong password")
    }

    const { accessToken,refreshToken}=await generateAccessAndRefreshToken(user.id)  
    if(!accessToken || !refreshToken){
        throw new ApiError(500, "Failed to generate access and refresh tokens")
    }
    const loggedInUser = await User.findById(user._id).select('-refreshToken')
    const options = {
        httpOnly:true,
        secure:true,
        path:'/'
    }

    return res
    .status(200)
    .cookie('accessToken',accessToken,options)
    .cookie('refreshToken',refreshToken,options)
    .json(
        new ApiResponse(200,'successfully loggedIn',{user: loggedInUser, accessToken, refreshToken})
    )
})

// logout user
const logout = asyncHandler(async (req, res) =>{
    await User.findByIdAndUpdate(
        req.user._id,{refreshToken:undefined},{new:true}
    )

    const options = {
        httpOnly: true,
        secure: true,
        path:'/'
    }

    return res
    .status(200)
    .clearCookie('accessToken',options)
    .clearCookie('refreshToken',options)
    .json(
        new ApiResponse(200,'loggedOut sucessfully!',{})
    )
})

export { register, login, logout, generateAccessAndRefreshToken }
