import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { promises as fsPromise, access, mkdir, appendFile, stat } from "fs";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logEvents = async (message, logFileName) => {
    const dateTime = `${format(new Date(), 'yyyyMMdd\tHH:mm:ss')}`;
    const logItem = `${dateTime}\t${uuidv4()}\t${message}\n`;

    try {
        const logsDir = join(__dirname, '..', 'logs');

        // Periksa keberadaan direktori
        try {
            await fsPromise.stat(logsDir);
        } catch (err) {
            // Jika direktori tidak ada, buat direktori
            await fsPromise.mkdir(logsDir);
        }

        // Tambahkan logItem ke file
        await fsPromise.appendFile(join(logsDir, logFileName), logItem);
    } catch (err) {
        console.error(err);
    }
};


const logger = (req, res, next) => {
    logEvents(`${req.method}\t${req.url}\t${req.headers.origin}`, 'reqLog.log');

    console.log(`${req.method} ${req.path}`);
    next();
};

export { logEvents, logger };
