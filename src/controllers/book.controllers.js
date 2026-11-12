import {Book} from '../models/book.model.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'

// get all books from database
const allBooks = asyncHandler(async(req,res) => {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20

    const bookAggregate = Book.aggregate([])

    const options = {
        page,
        limit,
        customLabels: {
            totalDocs: 'totalBooks',
            docs: 'books'
        }
    }

    const executed = await Book.aggregatePaginate(bookAggregate,options)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            'books fetched',
            executed
        )
    )
})

// get book by id
const getById = asyncHandler (async(req,res) => {
    const { id } = req.params

    const book = await Book.findById(id)
    if(!book){
        throw new ApiError(404 , 'book not found')
    }

    return res.status(200).json(
        new ApiResponse(200, 'book fetched', book)
    )
})

// get book by category
const getByCategory = asyncHandler(async(req,res) => {
    const { category } = req.params
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20

    const searchCategory = category.tolowerCase().trim()

    const bookAggregate = Book.aggregate([
        {
            $match: {
                category: searchCategory
            }
        }
    ])

    const options = {
        page,
        limit,
        customLabels:{
           totalDocs: 'totalBooks',
           docs: 'books'
        }
    }

    const result = await Book.aggregatePaginate(bookAggregate,options)

    return res
    .status(200)
    .json(
        new ApiResponse(200,'books fetched', result)
    )
})

// add book
const addBook = asyncHandler(async(req,res) => {
    const {
        title, 
        author, 
        category, 
        isbn, 
        language, 
        coverImage, 
        publishedDate, 
        publisher, 
        description, 
        pageCount
    } = req.body

    if(!title?.trim()  || !author?.trim() || !isbn?.trim()){
        throw new ApiError(400, 'title, author and isbn are required')
    }

    if(!category || (!Array.isArray(category) && category.length === 0)){
        throw new ApiError(400, 'at least one category is required')
    }

    if(!pageCount || pageCount < 1){
        throw new ApiError(400, 'pageCount must be greater than 0')
    }

    const existingBook = await Book.findOne({isbn: isbn.trim()})
    if(existingBook){
        throw new ApiError(400, 'book with this isbn already exists')
    }

    const newBook = await Book.create({
        title,
        author,
        category: Array.isArray(category) ? category.map(cat => cat.trim().toLowerCase()) : [category.trim().toLowerCase()],
        isbn: isbn.trim(),
        language: language || 'en',
        coverImage,
        publishedDate,
        publisher,
        description,
        pageCount
    })

    return res
    .status(201)
    .json(
        new ApiResponse(201, 'book added successfully', newBook)
    )
})

// remove book
const removeBook = asyncHandler(async(req,res) => {
    const { id } = req.params

    if(!id){
        throw new ApiError(400, 'book id is required')
    }
    const book = await Book.findByIdAndDelete(id)
    if(!book){
        throw new ApiError(404, 'cannnot delete, book not found')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, 'book deleted successfully', book)
    )
})

// update bookDetails
const updateBook = asyncHandler(async(req,res) => {
    const { id } = req.params

    if(!id){
        throw new ApiError(400, 'book id is required')
    }

    const updateFields = {}
    Object.keys(req.body).forEach((key) => {
        if(req.body[key] !== undefined) {
            updateFields[key] = req.body[key]
        }
    })
    
    if(updateFields.category) {
        updateFields.category = Array.isArray(updateFields.category) ? updateFields.category:[updateFields.category]
    }

    if(updateFields.pageCount && updateFields.pageCount < 1){
        throw new ApiError(400, 'pageCount must be greater than 0')
    }

    const updatedBook = await Book.findByIdAndUpdate(id, updateFields, {new: true})
    if(!updatedBook){
        throw new ApiError(404, 'book not found')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, 'book updated successfully', updatedBook)
    )   
})

export { allBooks, getById, getByCategory, addBook, removeBook, updateBook }
