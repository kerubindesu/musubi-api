import express from "express";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import root from "./routes/root.js";
import { logger } from "./middleware/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express()
const PORT = process.env.PORT || 3500

app.use(logger)

app.use('/', express.static(join(__dirname, '/public')));

app.use('/', root)

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

app.listen(PORT, () => console.log(`server berjalan di port ${PORT}`))