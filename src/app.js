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

export {app};
