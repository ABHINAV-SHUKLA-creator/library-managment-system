import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    copyNumber: {
        type: Number,
        required: true
    },
    status: {
        type: string,
        enum: ['available', 'issued', 'lost', 'damaged'],
        default: 'available'
    }
}, { timestamps: true });


//indexing the book and copyNumber fields for faster search " how many copies of a book are available in the library ?"
bookSchema.index({ book: 1, status: 1 }, { unique: true });


export const BookCopy = mongoose.model("BookCopy", bookSchema);