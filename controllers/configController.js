import Config from "../models/Config.js";
import asyncHandler from "express-async-handler";

export const getConfig = asyncHandler(async (req, res) => {
    try {
        const config = await Config.findOne();
        res.json(config);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export const updateConfig = asyncHandler(async (req, res) => {
    try {
        const updatedConfig = await Config.findOneAndUpdate({}, req.body, { new: true });
        res.json(updatedConfig);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});