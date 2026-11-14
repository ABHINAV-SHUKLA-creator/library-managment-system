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
    
    const claimed = await BookCopy.findOneAndUpdate(
        { _id: bookCopyId, status: 'available' },
        { $set: { status: 'issued' } },
        { new: true }
    )
    if(!claimed) {
        throw new ApiError(400, 'Book copy is not available for borrowing')
    }

    let newBorrow

    try{
        newBorrow = await Borrow.create({
            bookCopy: bookCopyId,
            user: userId,
            borrowDate,
            dueDate,
            status: 'borrowed',
        })
    } catch (error) {
        await BookCopy.findByIdAndUpdate(bookCopyId, { $set: { status: 'available' } })
        throw new ApiError(500, 'Error occurred while creating borrow record')
    }

    return res.status(201).json(new ApiResponse(201,'Book borrowed successfully', newBorrow))
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

    const [bookCopy, settings] = await Promise.all([
        BookCopy.findById(borrowRecord.bookCopy),
        Settings.findOne({})
    ])

    const returnDate = new Date()
    const dailyFine = settings?.finePerDay ?? DAILY_FINE
    const gracePeriodDays = settings?.gracePeriodDays ?? GRACE_PERIOD_DAYS
    const fine = calcFine(borrowRecord.dueDate, returnDate, dailyFine, gracePeriodDays)

    if(bookCopy) {
        bookCopy.status = 'available'
    }

    borrowRecord.status = 'returned'
    borrowRecord.returnDate = returnDate
    borrowRecord.fine = fine

    await Promise.all([
        borrowRecord.save(),
        bookCopy?.save(),
    ])

    return res
    .status(200)
    .json(new ApiResponse(200,`Book returned successfully. Fine: ${fine}`, {borrowRecord, fine}))
})

// logged-in user's own borrows (?status=borrowed|returned&page=&limit=)
const getMyBorrows = asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50)

    const filter = { user: req.user._id }

    if(req.query.status !== undefined) {
        if(!['borrowed', 'returned'].includes(req.query.status)) {
            throw new ApiError(400, "status must be 'borrowed' or 'returned'")
        }
        filter.status = req.query.status
    }

    const [records, total, settings] = await Promise.all([
        Borrow.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate({
                path: 'bookCopy',
                select: 'copyNumber book',
                populate: { path: 'book', select: 'title author isbn coverImage' }
            })
            .lean(),
        Borrow.countDocuments(filter),
        Settings.findOne({}).lean()
    ])

    const now = new Date()
    const dailyFine = settings?.finePerDay ?? DAILY_FINE
    const gracePeriodDays = settings?.gracePeriodDays ?? GRACE_PERIOD_DAYS

    const borrows = records.map((record) => {
        const isBorrowed = record.status === 'borrowed'
        return {
            ...record,
            isOverdue: isBorrowed && new Date(record.dueDate) < now,
            currentFine: isBorrowed
                ? calcFine(record.dueDate, now, dailyFine, gracePeriodDays)
                : record.fine
        }
    })

    return res.status(200).json(
        new ApiResponse(200, 'borrows fetched', {
            borrows,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        })
    )
})
export { borrowBook, returnBook, getMyBorrows }
