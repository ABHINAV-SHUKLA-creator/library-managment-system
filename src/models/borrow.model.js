import mongoose from "mongoose"

const borrowSchema = new mongoose.Schema({
    bookCopy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BookCopy',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    borrowDate: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date,
        required: true
    },
    returnDate: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['borrowed', 'returned'],
        default: 'borrowed'
    }
}, { timestamps: true });


// indexing the user and status fields for faster search("What has user X borrowed?")
borrowSchema.index({ user: 1, status: 1 });
// indexing the bookCopy and status fields for faster search("How many copies of book X are currently borrowed?")
borrowSchema.index({ bookCopy: 1, status: 1 });   
// indexing status and dueDate fields for faster search("Which books are overdue?")
borrowSchema.index({ status: 1, dueDate: 1 });

export const Borrow = mongoose.model("Borrow", borrowSchema);
