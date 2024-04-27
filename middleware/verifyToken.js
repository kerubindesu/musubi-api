import jwt from "jsonwebtoken"

export const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token == null) {
        console.log('Token not provided');
        return res.sendStatus(401);
    }

    try {
        const decoded = await new Promise((resolve, reject) => {
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
                if (error) reject(error);
                resolve(decoded);
            });
        });
        
        req.username = decoded.username;
        next();
    } catch (error) {
        return res.sendStatus(403);
    }
}