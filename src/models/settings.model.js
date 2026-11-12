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
    gracePeriodDays: {
        type: Number,
        default: 7,
        min: 0
    },
    dueDatePolicy: {
        type: String,
        enum: ['fixed_days', 'semester_end'],
        default: 'fixed_days',
        required: true
    },
    semesterEndDate: {
        type: Date,
        default: null
    },
    borrowDurationDays: {
        type: Number,
        default: 14
    }
}, {timestamps: true});

export const Settings = mongoose.model("Settings", settingsSchema);
