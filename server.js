import dotenv from 'dotenv'
import express from "express";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import root from "./routes/root.js";
import { logger } from "./middleware/logger.js";
import errorHandler from "./middleware/errorHandler.js";
import cookieParser from "cookie-parser";
import cors from 'cors'
import corsOptions from "./config/corsOptions.js";
import connectDB from './config/dbConn.js';
import mongoose from 'mongoose';
import { logEvents } from './middleware/logger.js';
import userRoutes from "./routes/userRoutes.js"

dotenv.config(); // konfigurasi dotenv

console.log(process.env.NODE_ENV)

connectDB()

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express()
const PORT = process.env.PORT || 3500

app.use(logger)

app.use(cors(corsOptions))

app.use(express.json())

app.use(cookieParser())

app.use('/', express.static(join(__dirname, '/public')));

app.use('/', root)

app.use('/users', userRoutes)

app.all('*', (req, res) => {
    res.status(404)

    if (req.accepts('html')) {
        res.sendFile(join(__dirname, 'views', '404.html'))
    } else if (req.accepts('json')) {
        res.json({ message: '404 Not Found' })
    } else {
        res.type('txt').send('404 Not Found')
    }
})

app.use(errorHandler)

mongoose.connection.once("open", () => {
    console.log("terkoneksi ke MongoDB.")
    app.listen(PORT, () => console.log(`server berjalan di port ${PORT}`))
})

mongoose.connection.on("error", err => {
    console.error(err)
    logEvents(`${err.no}: ${err.code}\t${err.sycall}\t${err.hostname}`, "mongoErrlog.log")
})