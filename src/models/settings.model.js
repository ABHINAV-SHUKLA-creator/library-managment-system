import mongoose from "mongoose"

const settingsSchema = new mongoose.Schema({
    libraryName: {
        type: String,
        required: true,
        trim: true
    },
    libraryAddress: {
        type: String,
        required: true,
        trim: true
    },
    libraryContactNumber: {
        type: String,
        required: true,
        trim: true
    },
    libraryEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    libraryWebsite: {
        type: String,
        trim: true
    },
    maxBorrowLimit: {
        type: Number,
        required: true,
        default: 5,
    },
    finePerDay: {
        type: Number,
        required: true,
        default: 5.00,
    },
}, {timestamps: true});

export const Settings = mongoose.model("Settings", settingsSchema);
