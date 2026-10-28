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
        type: String,
        enum: ['available', 'issued', 'lost', 'damaged'],
        default: 'available'
    }
}, { timestamps: true });


// indexing the book and status fields for faster search
// For "how many copies of book X are available?"
bookSchema.index({ book: 1, status: 1 });
// indexing the book and copyNumber fields for uniqueness
// For "is copy #3 of book X already taken?"
bookSchema.index({ book: 1, copyNumber: 1 }, { unique: true });

export const BookCopy = mongoose.model("BookCopy", bookSchema);
