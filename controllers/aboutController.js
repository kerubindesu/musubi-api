import About from "../models/About.js"
import asyncHandler from "express-async-handler"
import path from "path"
import fs from "fs"

const getAbout = asyncHandler( async(req, res) => {
    try {
        const about = await About.findOne();
        res.json(about);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
})

const getAboutById = asyncHandler( async(req, res) => {
    const { id } = req.params

    try {
        const about = await About.findById(id)

        return res.status(200).json(about)
    } catch (error) {
        return res.status(400).json({ message: error.message})
    }
})

const createAbout = asyncHandler( async(req, res) => {
    const { title, text, maps } = req.body

    if (!title) return res.status(400).json({ message: "Title is required." })
    
    if (!text) return res.status(400).json({ message: "Text is required." })


    if (req.files === null) return res.status(400).json({ message: "No file uploaded." })

    if (!maps) return res.status(400).json({ message: "Maps is required." })

    try {
        const file = req.files.file
        const fileSize = file.data.length
        const extention = path.extname(file.name)
        const currentDateTime = new Date();
        const timestamp = currentDateTime.toISOString().replace(/[-:]/g, "").replace("T", "").split(".")[0];
        const fileName = file.md5 + timestamp + extention // convert to md5
        const url = `${req.protocol}://${req.get("host")}/images/${fileName}`

        const allowedType = [".png", ".jpg", ".jpeg"]

        if (!allowedType.includes(extention.toLocaleLowerCase())) return res.status(422).json({ message: "Invalid images." })

        if (fileSize > (3200 * 5000)) return res.status(422).json({ message: "Image must be less than 16MB." })

        file.mv(`./public/images/${fileName}`, async(error) => {
            if (error) return res.status(500).json({ message: error.message })

            try {
                await About.create({ title, text, image: fileName, img_url: url, maps })

                res.status(201).json({ message: "About created successfully." })
            } catch (error) {
                console.log(error.message)
            }
        })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
    
})

const updateAbout = asyncHandler( async(req, res) => {
    const { title, text, maps } = req.body

    // Confirm data
    if (!title) return res.status(400).json({ message: "Title is required." })
    
    if (!text) return res.status(400).json({ message: "Text is required." })

    if (!maps) return res.status(400).json({ message: "Maps is required." })

    // Confirm about exists to delete 
    const about = await About.findOne({})

    if (!about) return res.status(404).json({ message: "No data found." })

    let fileName
    if (req.files === null) {
        fileName = about.image
    } else {
        const file = req.files.file
        const fileSize = file.data.length
        const extention = path.extname(file.name)
        const currentDateTime = new Date();
        const timestamp = currentDateTime.toISOString().replace(/[-:]/g, "").replace("T", "").split(".")[0];
        fileName = file.md5 + timestamp + extention // convert to md5

        const allowedType = [".png", ".jpg", ".jpeg"]
        
        if (!allowedType.includes(extention.toLocaleLowerCase())) return res.status(422).json({ message: "Invalid images." })

        if (fileSize > (3200 * 5000)) return res.status(422).json({ message: "Image must be less than 16MB." })

        const filePath = `./public/images/${about.image}`
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        file.mv(`./public/images/${fileName}`, (error) => {
            if (error) return res.status(500).json({ message: error.message })
        })
    }

    const url = `${req.protocol}://${req.get("host")}/images/${fileName}`

    try {
        await about.updateOne({ title, text, image: fileName, img_url: url })

        return res.status(200).json({ message: "About updated successfully." })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})

const deleteAbout = asyncHandler( async(req, res) => {
    
    const about = await About.findOne({})

    if (!about) return res.status(404).json({ message: "No data found." })

    try {
        const filePath = `./public/images/${about.image}`
        fs.unlinkSync(filePath)

        await about.deleteOne()
        res.status(200).json({ message: "About deleted successfully."})
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})

export {
    getAbout,
    getAboutById,
    createAbout,
    updateAbout,
    deleteAbout
}