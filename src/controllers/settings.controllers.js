import {asyncHandler} from "../utils/asyncHandler.js"
import {Settings} from "../models/settings.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const getSettings = asyncHandler(async (req, res) => {
    const settings = await Settings.findOne({})
    if (!settings) {
        settings = await Settings.create({
            libraryName: "My Library",
            libraryAddress: "IET DAVV,Indore",
            libraryContactNumber: "+1234567890",
            libraryEmail: "info@mylibrary.com",
            libraryWebsite: "https://www.mylibrary.com",
            maxBorrowLimit: 5,
            finePerDay: 5.00
        });
    }
    return res.status(200).json(new ApiResponse(200, settings, "Settings retrieved successfully"));
});

const updateSettings = asyncHandler(async (req, res) => {
    const {libraryName, libraryAddress, libraryContactNumber, libraryEmail, libraryWebsite, maxBorrowLimit, finePerDay} = req.body

    const updateFields = {}

    Object.keys(req.body).forEach(key => req.body[key] !== undefined) && (updateFields[key] = req.body[key])
    
    if(updateFields.maxBorrowLimit!== undefined && updateFields.maxBorrowLimit < 1) {
        throw new ApiError(400, "Max borrow limit must be at least 1")
    }

    if(updateFields.finePerDay!== undefined && updateFields.finePerDay < 0) {
        throw new ApiError(400, "Fine per day cannot be negative")
    }

    const updatedSettings = await Settings.findOneAndUpdate(
        {}, 
        {$set: updateFields}, 
        {new: true}
    )

    if (!updatedSettings) {
        throw new ApiError(500, "Failed to update settings")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedSettings, "Settings updated successfully")
    )
});

export {getSettings, updateSettings};
