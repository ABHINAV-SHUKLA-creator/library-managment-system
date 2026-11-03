import { ApiError } from "../utils/ApiError"
import { ApiResponse } from "../utils/ApiResponse"
import { User } from "../models/user.model"
import jwt from "jsonwebtoken"
import {AsyncHandler} from "../utils/asyncHandler"

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

const login = AsyncHandler(async (req, res) => {
    const { username , password } = req.body
    
    if([username, password].some(field => field?.trim() === '')) {
        throw new errror(400, "All fields are required")
    }

    const existingUser = await User.findOne({username})
    if(!existingUser){
        throw new ApiError(400, "Invalid username")
    }

    const isPasswordValid = await existingUser.comparePassword(password)
    if(!isPasswordValid){
        throw new ApiError(400, "wrong password")
    }

    
})
