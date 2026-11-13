import {asyncHandler} from "../utils/asyncHandler.js"
import {Settings} from "../models/settings.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const getSettings = asyncHandler(async (req, res) => {
    let settings = await Settings.findOne({})
    if (!settings) {
        settings = await Settings.create({
            libraryName: "My Library",
            libraryAddress: "IET DAVV,Indore",
            libraryContactNumber: "+1234567890",
            libraryEmail: "info@mylibrary.com",
            libraryWebsite: "https://www.mylibrary.com",
            maxBorrowLimit: 5,
            finePerDay: 5.00,
            dueDatePolicy: "fixed_days",
            borrowDurationDays: 14
        });
    }
    return res.status(200).json(new ApiResponse(200, "Settings retrieved successfully", settings));
});

const updateSettings = asyncHandler(async (req, res) => {

    const updateFields = {}

    const allowed = ['libraryName','libraryAddress','libraryContactNumber','libraryEmail','libraryWebsite','maxBorrowLimit','finePerDay','gracePeriodDays','dueDatePolicy','semesterEndDate','borrowDurationDays']
    allowed.forEach((key) => {
        if (req.body[key] !== undefined) updateFields[key] = req.body[key]
    })

    if(updateFields.maxBorrowLimit!== undefined && updateFields.maxBorrowLimit < 1) {
        throw new ApiError(400, "Max borrow limit must be at least 1")
    }

    if(updateFields.finePerDay!== undefined && updateFields.finePerDay < 0) {
        throw new ApiError(400, "Fine per day cannot be negative")
    }
     
    // Validate dueDatePolicy and semesterEndDate if they are being updated
    if(updateFields.dueDatePolicy!==undefined) {
        const validPolicies = ['fixed_days', 'semester_end']
        if(!validPolicies.includes(updateFields.dueDatePolicy)) {
            throw new ApiError(400, "Invalid due date policy")
        }
    }

    if(updateFields.borrowDurationDays!== undefined && updateFields.borrowDurationDays < 1) {
        throw new ApiError(400, "Borrow duration must be at least 1 day")
    }

    if(updateFields.semesterEndDate!== undefined ){
        const parsedDate = new Date(updateFields.semesterEndDate)
        if(isNaN(parsedDate.getTime())|| parsedDate <= new Date()){
            throw new ApiError(400, "Invalid semester end date")
        }
        updateFields.semesterEndDate = parsedDate
    }
    //prevent switching to semester_end policy without a valid semesterEndDate
    if(updateFields.dueDatePolicy === 'semester_end' && !updateFields.semesterEndDate) {
        const currentSettings = await Settings.findOne({})
        if(!currentSettings?.semesterEndDate || currentSettings.semesterEndDate <= new Date()){
            throw new ApiError(400, "Semester end date must be set when due date policy is 'semester_end'")
        }
    }
   
    const updatedSettings = await Settings.findOneAndUpdate(
        {}, 
        {$set: updateFields}, 
        {new: true, runValidators: true},
        
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Settings updated successfully", updatedSettings)
    )
});

export {getSettings, updateSettings};
