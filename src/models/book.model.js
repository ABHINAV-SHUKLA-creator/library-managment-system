import mongoose from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: String,
        required: true,
        trim: true
    },
    language: {
        type: String,
        default: "en",
        enum: [
        "en", "hi", "bn", "te", "mr", "ta", "ur",
        "gu", "kn", "ml", "pa", "or", "as",
        "ar", "fr", "de", "es", "zh", "ja", "ko",
        "ru", "pt", "it", "nl", "tr", "pl", "sv"
        ],
        index: true
    },
    isbn: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    category: {
        type: [String],
        required: true,
        trim: true,
        lowercase: true,
        index: true
    },
    coverImage: {
        type: String,
        trim: true
    },
    publishedDate: {
        type: Date
    },
    publisher: {
        type: String,
        default: ""
    },
    description: { 
        type: String,
        trim: true 
    },
    pageCount: {
        type: Number,
        min: 1
    },
}, {timestamps: true});

// indexing the title, author, description, and category fields for text search
bookSchema.index({ title: 'text', author: 'text' , description: 'text' , category: 'text' }, { weights: { title: 5, author: 3, description: 2, category: 1 } });

// pagination
bookSchema.plugin(mongooseAggregatePaginate)

export const Book = mongoose.model("Book", bookSchema);
