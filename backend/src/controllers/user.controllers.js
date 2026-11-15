import { User } from '../models/user.model.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'

// makes text safe to use inside a regular expression ("a.b(c" stays literal)
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// find users by member id, username or email (?search=&role=&page=&limit=)
const searchUsers = asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50)
    const { search, role } = req.query

    const filter = {}

    if(role !== undefined) {
        if(!['student', 'employee', 'admin'].includes(role)) {
            throw new ApiError(400, "role must be 'student', 'employee' or 'admin'")
        }
        filter.role = role
    }

    if(typeof search === 'string' && search.trim()) {
        const regex = new RegExp(escapeRegex(search.trim()), 'i')
        filter.$or = [{ memberId: regex }, { username: regex }, { email: regex }]
    }

    const [users, total] = await Promise.all([
        User.find(filter)
            .select('username email role memberId phoneNumber isActive createdAt')
            .sort({ username: 1 })
            .skip((page - 1) * limit)
            .limit(limit),
        User.countDocuments(filter)
    ])

    return res.status(200).json(
        new ApiResponse(200, 'users fetched', {
            users,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        })
    )
})

export { searchUsers }
