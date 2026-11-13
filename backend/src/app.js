import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

const app =express()

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}))

app.use(express.json({limit: '10kb'}))
app.use(express.urlencoded({extended: true , limit: '10kb'}))

app.use(cookieParser())
app.use(express.static('public'))

// routes
import authRoutes from './routes/auth.routes.js'
import bookRoutes from './routes/book.routes.js'
import borrowRoutes from './routes/borrow.routes.js'
import settingsRoutes from './routes/settings.routes.js'

app.use('/api/auth', authRoutes)
app.use('/api/books', bookRoutes)
app.use('/api/borrow', borrowRoutes)
app.use('/api/settings', settingsRoutes)

// error handling middleware
import { errorHandler } from './middlewares/error.middleware.js'
app.use(errorHandler)

export {app};
