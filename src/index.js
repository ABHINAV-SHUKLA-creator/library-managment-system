import dotenv from 'dotenv'
import {app} from './app.js'
import {connectDB} from './db/index.js'
import express from 'express'
import mongoose from 'mongoose';

dotenv.config({path: './.env'});

connectDB()
.then(()=>{
    console.log(`mongoDB connected: ${mongoose.connect.host}`);
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`server is running on port ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log('Error connecting database: ', error);
    process.exit(1);
})
