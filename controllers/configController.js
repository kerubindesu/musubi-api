import Config from "../models/Config.js";
import asyncHandler from "express-async-handler";
import path from "path"
import fs from "fs"

export const getConfig = asyncHandler(async (req, res) => {
    console.log("get config nih")
    try {
        const config = await Config.findOne();
        res.json(config);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export const updateConfig = asyncHandler(async (req, res) => {
    const {
        theme,
        primary,
        secondary,
        background,
        text,
        description,
        site_name,
        site_description,
        keywords,
        email_server,
        port,
        username,
        password,
        sender_email
    } = req.body;

    const config = await Config.findOne();

    let fileName;

    if ( req.files ){
        const file = req.files.file;
        const fileSize = file.size;
        const extention = path.extname(file.name);
        fileName = file.md5 + extention; // convert to md5

        const allowedType = [".png", ".jpg", ".jpeg"];
        
        if (!allowedType.includes(extention.toLocaleLowerCase())) {
            return res.status(422).json({ message: "Invalid images" });
        }

        if (fileSize > (1000 * 5000)) {
            return res.status(422).json({ message: "Image must be less than 5MB" });
        }

        // Hapus file lama jika ada
        const oldFilePath = `./public/logo/${config.image}`;
        if (config.image && fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
        }

        // Pindahkan file baru ke direktori
        try {
            await file.mv(`./public/logo/${fileName}`);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Failed to upload file" });
        }
    }

    const url = fileName ? `${req.protocol}://${req.get("host")}/logo/${fileName}` : null;

    try {
        const updatedConfig = await Config.findOneAndUpdate({}, {
            theme,
            "color_palette.primary": primary,
            "color_palette.secondary": secondary,
            "color_palette.background": background,
            "color_palette.text": text,
            logo_url: url,
            description,
            site_name,
            site_description,
            keywords,
            email_server,
            port,
            username,
            password,
            sender_email,
        });

        return res.status(200).json({ message: "Config updated successfully", config: updatedConfig });
    } catch (error) {
        console.error(error);
        return res.status(400).json({ message: error.message });
    }
});