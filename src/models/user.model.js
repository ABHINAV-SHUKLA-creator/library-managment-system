import mongoose from "mongoose"
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,}$/, 'enter a valid email address'],
    },
    password: {
        type: String,
        required: true,
        select: false,
        minlength:[6,'password must contain 6 or more characters']
    },
    role: {
        type: String,
        enum: ['student', 'employee', 'admin'],
        default: 'student'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    memberId: {
        type: String,
        unique: true,
        trim: true,
        required: true,
        uppercase: true
    },
    phoneNumber: {
        type: String,
        trim: true,
        match: [/^\+?[1-9]\d{1,14}$/, 'enter a valid phone number'],
    },
    isActive: {
        type: Boolean,
        default: true
    },
    refreshToken: {
        type: String,
        select: false
    }
}, {timestamps: true});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
})

userSchema.methods.comparePassword = async function(password){
    return await bcrypt.compare(password,this.password)
}

// generate access token fun
userSchema.methods.generateAccessToken = async function (userId){
    return jwt.sign({
        user_Id: this._id,
        email:this.email,
        username: this.username
    },
    process.env.ACCESS_SECRET_TOKEN,{
    expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    })
}

// generate refresh token fun
userSchema.methods.generateRefreshToken = async function(userId){
    return jwt.sign({
        user_Id: this._id
    },process.env.REFRESH_SECRET_TOKEN,{
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    })
}

// indexing the username fields for faster search
userSchema.index({ username: 'text'});

export const User = mongoose.model("User", userSchema);
