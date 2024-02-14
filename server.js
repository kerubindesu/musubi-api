import dotenv from "dotenv"
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import root from "./routes/root.js";
import { logger } from "./middleware/logger.js";
import errorHandler from "./middleware/errorHandler.js";
import cookieParser from "cookie-parser";
import cors from "cors"
import corsOptions from "./config/corsOptions.js";
import mongoose from "mongoose";
import { logEvents } from "./middleware/logger.js";
import authRoutes from "./routes/auth.js"
import userRoutes from "./routes/user.js"
import postRoutes from "./routes/post.js"
import configRoute from "./routes/config.js"
import logoRoute from "./routes/logo.js"
import menuRoute from "./routes/menu.js"
import fileUpload from "express-fileupload";

dotenv.config(); // konfigurasi dotenv

console.log(process.env.NODE_ENV)

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express()
const PORT = process.env.PORT || 3500

app.use(logger)

app.use(cors(corsOptions))

app.use(cookieParser())

app.use(express.json())

app.use(fileUpload())

app.use('/', express.static(join(__dirname, '/public')));
app.use('/', root)
app.use('/auth', authRoutes)
app.use('/users', userRoutes)
app.use('/posts', postRoutes)
app.use('/config', configRoute)
app.use('/logo', logoRoute)
app.use('/menus', menuRoute)

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

try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('sucessfuly connect to database')

    app.listen(PORT, () => {
        console.log(`listening for request on port ${PORT}`)
    })
} catch (error) {
    console.log(error)
}