import { ApiError } from '../utils/ApiError.js'

export const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || err.status || 500
    let message = err.message || 'Internal Server Error'
    let errors = err instanceof ApiError ? err.errors : []

    if (err.name === 'ValidationError') {
        statusCode = 400
        errors = Object.values(err.errors).map((e) => e.message)
        message = 'Validation failed'
    } else if (err.name === 'CastError') {
        statusCode = 400
        message = `Invalid ${err.path}`
    } else if (err.code === 11000) {
        statusCode = 409
        message = `Duplicate value for: ${Object.keys(err.keyValue || {}).join(', ')}`
    } else if (err.type === 'entity.parse.failed') {
        statusCode = 400
        message = 'Invalid JSON in request body'
    }

    if (statusCode === 500) console.error(err)

    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors,
        data: null,
    })
}
