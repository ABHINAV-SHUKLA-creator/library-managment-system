import { Borrow } from '../models/borrow.model.js'
import { BookCopy } from '../models/bookCopy.model.js'
import { Settings } from '../models/settings.model.js'
import { User } from '../models/user.model.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { calcFine } from '../utils/calcFine.js'
import { GRACE_PERIOD_DAYS, DAILY_FINE } from '../constants.js'

const borrowBook = asyncHandler(async (req, res) => {
    const { bookCopyId, userId } = req.body

    if(!bookCopyId || !userId) {
        throw new ApiError(400, 'bookCopyId and userId are required')
    }
    
    const [user, bookCopy, settings] = await Promise.all([
        User.findById(userId),
        BookCopy.findById(bookCopyId),
        Settings.findOne({})
    ])

    if(!user) {
        throw new ApiError(404, 'User not found')
    }
    if(!bookCopy) {
        throw new ApiError(404, 'Book copy not found')
    }
    if(user.isActive === false) {
        throw new ApiError(403, 'User is not active')
    }

    const maxLimit = settings?.maxBorrowLimit || 5
    const activeCount = await Borrow.countDocuments({ user: userId, status: 'borrowed' })
    if(activeCount >= maxLimit){
        throw new ApiError(400,'borrowing limit exceeded')
    }
    
    const claimed = await BookCopy.findOneAndUpdate(
        { _id: bookCopyId, status: 'available' },
        { $set: { status: 'issued' } },
        { new: true }
    )
    if(!claimed) {
        throw new ApiError(400, 'Book copy is not available for borrowing')
    }
    
    const borrowDate = new Date()
    let dueDate

    if(settings?.dueDatePolicy === 'semester_end' && settings?.semesterEndDate) {
        dueDate = new Date(settings.semesterEndDate)

        if(dueDate <= borrowDate) {
            throw new ApiError(400, 'Semester end date is in the past. Cannot borrow book.')
        }
    } else {
        dueDate = new Date(borrowDate)
        dueDate.setDate(dueDate.getDate() + (settings?.borrowDurationDays || 14))
    }

    bookCopy.status = 'issued'
    user.borrowedBooks.push(bookCopyId)

    const newBorrow = await Borrow.create({
        bookCopy: bookCopyId,
        user: userId,
        borrowDate,
        dueDate,
        status: 'borrowed',
    })

    return res.status(201).json(new ApiResponse(201, newBorrow, 'Book borrowed successfully'))
})    

const returnBook = asyncHandler(async (req, res) => {
    const { borrowId } = req.body

    if(!borrowId) {
        throw new ApiError(400, 'borrowId is required')
    }

    const borrowRecord = await Borrow.findById(borrowId)
    if(!borrowRecord) {
        throw new ApiError(404, 'Borrow record not found')
    }

    if(borrowRecord.status !== 'borrowed') {
        throw new ApiError(400, 'This book has already been returned or is not currently borrowed')
    }

    const [bookCopy, user, settings] = await Promise.all([
        BookCopy.findById(borrowRecord.bookCopy),
        User.findById(borrowRecord.user),
        Settings.findOne({})
    ])

    const returnDate = new Date()
    const dailyFine = settings?.dailyFine || 0
    const gracePeriodDays = settings?.gracePeriodDays || 0
    const fine = calcFine(borrowRecord.dueDate, returnDate, dailyFine, gracePeriodDays)

    if(bookCopy) {
        bookCopy.status = 'available'
    }

    if(user) {
        user.borrowedBooks = user.borrowedBooks.filter(id => id.toString() !== bookCopy._id.toString())
    }

    borrowRecord.status = 'returned'
    borrowRecord.returnDate = returnDate
    borrowRecord.fine = fine

    await Promise.all([
        borrowRecord.save(),
        bookCopy?.save(),
        user?.save(),
    ])

    return res
    .status(200)
    .json(new ApiResponse(200,`Book returned successfully. Fine: ${fine}`),{borrowRecord, fine})
})

export { borrowBook, returnBook }

