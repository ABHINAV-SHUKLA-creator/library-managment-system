import {DB_NAME} from '../constants.js'
import mongoose from 'mongoose'

const connectDB = async () => {
     try {
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI,{
         dbName:DB_NAME
        });
   
        console.log(`DataBase connected: ${connectionInstance.connection.host}`);
     } catch (error) {
         console.error('Error connecting database : ',error);
         process.exit(1);
     }
}

export {connectDB};
