import { ApiError } from "../utils/ApiError"
import { ApiResponse } from "../utils/ApiResponse"
import { User } from "../models/user.model"
import jwt from "jsonwebtoken"
import {AsyncHandler} from "../utils/asyncHandler"


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const access = user.generateAccessToken()
        const refresh = user.generateRefreshToken()
    
        user.refreshToken = refresh
        user.save({validateBeforeSave:false})
    
        return {access,refresh}
    } catch (error) {
        throw new ApiError(500,'error to create refresh and access token')
    }
}

// register user
const register = AsyncHandler(async (req, res) => {
    const { username, email, password } = req.body

    if([username, email, password].some(field => field?.trim() === '')) {
        throw new ApiError(400, "All fields are required")
    }

    const existingUser = await User.findOne({$or: [{email}, {username}]})
    if(existingUser){
        throw new ApiError(400, "User with this email or username already exists")
    }
    
    const newUser = await User.create({ username, email, password })

    const createdUser = await User.findById(newUser._id).select('-password -refreshToken -createdAt -updatedAt')
    if(!createdUser){
        throw new ApiError(500, "Something went wrong ,registering faild")
    }

    res.status(201).json(new ApiResponse(201,"User registered successfully", createdUser))
})

// login user
const login = AsyncHandler(async (req, res) => {
    const { username , password } = req.body
    
    if([username, password].some(field => field?.trim() === '')) {
        throw new errror(400, "All fields are required")
    }

    const user = await User.findOne({username})
    if(!user){
        throw new ApiError(400, "Invalid username")
    }

    const isPasswordValid = await existingUser.comparePassword(password)
    if(!isPasswordValid){
        throw new ApiError(400, "wrong password")
    }

    const {refreshToken, accessToken}=generateAccessAndRefreshToken(user.id)  
    
    const loggedInUser = await user.findById(user._id).select('-refreshToken')
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
        new ApiResponse(200,'successfully loggedIn',{accessToken,refreshToken})
    )
})

// logout user
const logout = AsyncHandler(async (req, res) =>{
    await User.findByIdAndUpdate(
        req.user_id,{refreshToken:undefined},{new:true}
    )

    const options = {
        httpOnly: true,
        secure: false,
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

