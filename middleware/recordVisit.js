import Visit from "../models/Visit.js";
import asyncHandler from "express-async-handler";

export const recordVisit = asyncHandler(async (req, res, next) => {
    const pathsToRecord = ["/products/:id", "/contact", "/categories/:id"];
    if (pathsToRecord.includes(req.path)) {
      try {
        const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
        await Visit.create({
          page: req.originalUrl,
          ipAddress: ip
        });
      } catch (error) {
        console.error("Error recording visit:", error);
      }
    }
    next();
});