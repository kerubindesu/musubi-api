import Logo from "../models/Logo.js";
import asyncHandler from "express-async-handler";
import path from "path"
import fs from "fs"

const getLogo = asyncHandler(async (req, res) => {
    try {
        const logo = await Logo.findOne();
        res.json(logo);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const createLogo = asyncHandler( async(req, res) => {
    if (req.files === null) return res.status(400).json({ message: 'No file uploaded' })

    try {
        const file = req.files.file
        const fileSize = file.data.length
        const extention = path.extname(file.name)
        const currentDateTime = new Date();
        const timestamp = currentDateTime.toISOString().replace(/[-:]/g, '').replace('T', '').split('.')[0];
        const fileName = file.md5 + timestamp + extention // convert to md5
        const url = `${req.protocol}://${req.get("host")}/logo/${fileName}`

        const allowedType = [".png", ".jpg", ".jpeg"]

        if (!allowedType.includes(extention.toLocaleLowerCase())) return res.status(422).json({ message: "Invalid images" })

        if (fileSize > (1000 * 5000)) return res.status(422).json({ message: "Image must be less than 5MB" })

        file.mv(`./public/logo/${fileName}`, async(error) => {
            if (error) return res.status(500).json({ message: error.message })

            try {
                await Logo.create({ image: fileName, img_url: url })

                console.log("success")
                res.status(201).json({ message: "Logo created successfully" })
            } catch (error) {
                console.log(error.message)
            }
        })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
    
})

const updateLogo =  async(req, res) => {
    try {
        const logo = await Logo.findOne({}).exec()

        if (!logo) return res.status(404).json({ message: 'No data found' })

        let fileName
        if (req.files === null) {
            fileName = logo.image
        } else {
            const file = req.files.file
            const fileSize = file.data.length
            const extention = path.extname(file.name)
            const currentDateTime = new Date();
            const timestamp = currentDateTime.toISOString().replace(/[-:]/g, '').replace('T', '').split('.')[0];
            fileName = file.md5 + timestamp + extention // convert to md5

            const allowedType = [".png", ".jpg", ".jpeg"]
            
            if (!allowedType.includes(extention.toLocaleLowerCase())) return res.status(422).json({ message: "Invalid images" })

            if (fileSize > (1000 * 5000)) return res.status(422).json({ message: "Image must be less than 5MB" })

            const filePath = `./public/logo/${logo.image}`
            console.log(fs.existsSync(filePath))
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            file.mv(`./public/logo/${fileName}`, (error) => {
                if (error) return res.status(500).json({ message: error.message })
            })
        }

        const url = `${req.protocol}://${req.get("host")}/logo/${fileName}`

        try {
            await Logo.findOneAndUpdate({ image: fileName, img_url: url })

            return res.status(200).json({ message: "Logo updated successfully" })
        } catch (error) {
            return res.status(400).json({ message: error.message })
        }
    } catch (error) {
        console.log(error)
    }
}

export { getLogo, createLogo, updateLogo }