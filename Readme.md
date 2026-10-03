Library Management System (backend)

A REST API for running a library end to end. Students search the catalog and request books online. Librarians approve requests at the counter and record the exact physical copy handed over. Late returns are fined automatically using rates set by management, and students can pay the fine online before returning the book.

Stack: Node.js · Express · MongoDB · Mongoose · JWT · bcrypt · dotenv · nodemon · Prettier

# role
Student	- Register and log in, search books, request books, view own borrows and fines, pay fines, start a return
Librarian -	Review pending requests, issue books (recording the copy number), accept returns, add books and copies
Admin -	Everything a librarian can, plus manage library settings (loan period, fine rate, limits) and users

# Project Structure
library_managment_sys/
├── public/
│   └── temp/                 # temporary uploads (book covers)
├── src/
│   ├── controllers/          # request handlers
│   ├── db/                   # MongoDB connection
│   ├── middlewares/          # auth, role checks, error handling
│   ├── models/               # Mongoose schemas
│   ├── routes/               # route definitions
│   ├── utils/                # asyncHandler, ApiError, ApiResponse, calcFine
│   ├── app.js                # Express app and middleware setup
│   ├── constants.js          # DB_NAME and shared constants
│   └── index.js              # entry point: connect DB, then start server
├── .env
├── .env.example
├── .gitignore
├── .prettierrc
└── package.json

# Roadmap
- Book and BookCopy models and CRUD
- Auth with roles (student, librarian, admin)
- Settings model and admin endpoints
- Borrow request, issue, return flow
- Fine calculation and mock payment
- Real payment gateway (e.g. Razorpay)
- Scheduled job to expire uncollected requests and mark overdue loans
- Email notifications: request approved, due soon, overdue
- One-time renewal of a loan if no one else is waiting
- Reservation queue when all copies are out
- Lost and damaged book handling with replacement charges
- Audit log of every issue, return, and settings change
- Rate limiting and security headers (express-rate-limit, helmet)
- Automated tests for fine calculation and the borrow flow
- API documentation (Swagger / OpenAPI)
- Deployment