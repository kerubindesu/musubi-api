import Banner from '../models/Banner.js'
import asyncHandler from 'express-async-handler'
import path from "path"
import fs from "fs"

const getBanners = asyncHandler( async(req, res) => {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;

    try {
        const banners = await Banner.find({
            $or: [
                { "title": { $regex: search, $options: "i" } },
                { "text": { $regex: search, $options: "i" } },
                { "image": { $regex: search, $options: "i" } },
            ]
        })
        .skip(limit * page)
        .sort({ createdAt: "desc" })
        .limit(limit)

        const totalRows = await Banner.countDocuments({
            $or: [
                { "title": { $regex: search, $options: "i" } },
                { "text": { $regex: search, $options: "i" } },
                { "image": { $regex: search, $options: "i" } },
            ]
        })

        // Menghitung totalPage berdasarkan totalRows dan limit
        const totalPage = Math.ceil(totalRows/limit);

        if (banners.length === 0) {
            return res.status(200).json({ message: "No found banner" });
        }

        return res.status(200).json({ result: banners, page, totalRows, totalPage });
    } catch (error) {
        console.error("Error fetching banners:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
})

const getBannerById = asyncHandler( async(req, res) => {
    const { id } = req.params

    try {
        const banner = await Banner.findById(id)

        return res.status(200).json(banner)
    } catch (error) {
        return res.status(400).json({ message: error.message})
    }
})

const createBanner = asyncHandler( async(req, res) => {
    const { title, text } = req.body

    if (!title) return res.status(403).json({ message: 'Title is required' })
    
    if (!text) return res.status(403).json({ message: 'Text is required' })


    if (req.files === null) return res.status(400).json({ message: 'No file uploaded' })

    try {
        const file = req.files.file
        const fileSize = file.data.length
        const extention = path.extname(file.name)
        const currentDateTime = new Date();
        const timestamp = currentDateTime.toISOString().replace(/[-:]/g, '').replace('T', '').split('.')[0];
        const fileName = file.md5 + timestamp + extention // convert to md5
        const url = `${req.protocol}://${req.get("host")}/images/${fileName}`

        const allowedType = [".png", ".jpg", ".jpeg"]

        if (!allowedType.includes(extention.toLocaleLowerCase())) return res.status(422).json({ message: "Invalid images" })

        if (fileSize > (1000 * 5000)) return res.status(422).json({ message: "Image must be less than 5MB" })

        file.mv(`./public/images/${fileName}`, async(error) => {
            if (error) return res.status(500).json({ message: error.message })

            try {
                await Banner.create({ title, text, image: fileName, img_url: url })

                res.status(201).json({ message: "Banner created successfully" })
            } catch (error) {
                console.log(error.message)
            }
        })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
    
})

const updateBanner = asyncHandler( async(req, res) => {
    const { id } = req.params

    const { title, text } = req.body

    // Confirm data
    if (!id) return res.status(400).json({ message: 'Banner id required' })

    if (!title) return res.status(403).json({ message: 'Title is required' })
    
    if (!text) return res.status(403).json({ message: 'Text is required' })

    // Confirm banner exists to delete 
    const banner = await Banner.findById(id).exec()

    if (!banner) return res.status(404).json({ message: 'No data found' })

    let fileName
    if (req.files === null) {
        fileName = banner.image
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

        const filePath = `./public/images/${banner.image}`
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        file.mv(`./public/images/${fileName}`, (error) => {
            if (error) return res.status(500).json({ message: error.message })
        })
    }

    const url = `${req.protocol}://${req.get("host")}/images/${fileName}`

    try {
        await banner.updateOne({ title, text, image: fileName, img_url: url })

        return res.status(200).json({ message: "Banner updated successfully" })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})

const deleteBanner = asyncHandler( async(req, res) => {
    const { id } = req.params

    // Confirm data
    if (!id) return res.status(400).json({ message: 'Banner id required' })

    // Confirm banner exists to delete 
    const banner = await Banner.findById(id).exec()

    if (!banner) return res.status(404).json({ message: 'No data found' })

    try {
        const filePath = `./public/images/${banner.image}`
        fs.unlinkSync(filePath)

        await banner.deleteOne()
        res.status(200).json({ message: "Banner deleted successfully"})
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})

export {
    getBanners,
    getBannerById,
    createBanner,
    updateBanner,
    deleteBanner
}