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
import { recordVisit } from "./middleware/recordVisit.js";
import authRoutes from "./routes/auth.js"
import userRoutes from "./routes/user.js"
import productRoutes from "./routes/product.js"
import configRoutes from "./routes/config.js"
import logoRoutes from "./routes/logo.js"
import menuRoutes from "./routes/menu.js"
import carouselRoutes from "./routes/carousel.js"
import contactRoutes from "./routes/contact.js"
import categoryRoutes from "./routes/category.js"
import tagRoutes from "./routes/tag.js"
import seoDataRoutes from "./routes/seoData.js"
import visitorRoutes from "./routes/visitor.js"
import fileUpload from "express-fileupload";

dotenv.config(); // konfigurasi dotenv

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express()
const PORT = process.env.PORT || 3500

app.use(logger)

app.use(cors(corsOptions))

app.use(cookieParser())

app.use(express.json())

app.use(fileUpload())

app.use(recordVisit)

app.use('/', express.static(join(__dirname, '/public')));
app.use('/', root)
app.use('/auth', authRoutes)
app.use('/users', userRoutes)
app.use('/products', productRoutes)
app.use('/config', configRoutes)
app.use('/logo', logoRoutes)
app.use('/menus', menuRoutes)
app.use('/categories', categoryRoutes)
app.use('/carousels', carouselRoutes)
app.use('/tags', tagRoutes)
app.use('/contact', contactRoutes)
app.use('/seo-management', seoDataRoutes)
app.use('/visitors', visitorRoutes)

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