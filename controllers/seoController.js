import SEOData from "../models/SeoData.js"
import asyncHandler from "express-async-handler"

const getAllSEOData = asyncHandler( async(req, res) => {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;

    try {
        const query = {
            $or: [
                { "keyword": { $regex: search, $options: "i" } },
                { "description": { $regex: search, $options: "i" } }
            ]
        };

        const seoData = await SEOData.find(query)
        .skip(limit * page)
        .sort({ createdAt: "desc" })
        .limit(limit)

        const totalRows = await SEOData.countDocuments(query)

        // Menghitung totalPage berdasarkan totalRows dan limit
        const totalPage = Math.ceil(totalRows/limit);

        if (seoData.length === 0) {
            return res.status(200).json({ message: "No found SEO data." });
        }

        return res.status(200).json({ result: seoData, page, totalRows, totalPage });
    } catch (error) {
        console.error("Error fetching SEO data:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
})

const createSEOData = asyncHandler( async(req, res) => {
    const { keyword, description } = req.body

    if (!keyword) return res.status(400).json({ message: "Keyword is required." })
    if (!description) return res.status(400).json({ message: "Description is required." })

    try {
        await SEOData.create({ keyword, description })

        return res.status(201).json({ message: "SEO Data created successfully." })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})

const getSEODataById = asyncHandler( async(req, res) => {
    const { id } = req.params

    try {
        const seoDataById = await SEOData.findById(id)

        return res.status(200).json(seoDataById)
    } catch (error) {
        return res.status(400).json({ message: error.message})
    }
})

const updateSEOData = asyncHandler( async(req, res) => {
    const { id } = req.params
    const { keyword, description } = req.body

    if (!id) return res.status(400).json({ message: "SEO data id is required." })
    if (!keyword) return res.status(400).json({ message: "Keyword is required." })
    if (!description) return res.status(400).json({ message: "Description is required." })

    const seoDataById = await SEOData.findById(id)
    if (!seoDataById) return res.status(404).json({ message: "No data found." })

    try {
        // Memperbarui data SEO
        seoDataById.keyword = keyword;
        seoDataById.description = description;

        // Menyimpan perubahan pada seoDataById
        await seoDataById.save();

        return res.status(200).json({ message: "SEO data updated successfully." })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})

const deleteSEOData = asyncHandler( async(req, res) => {
    const { id } = req.params

    if (!id) return res.status(400).json({ message: "SEO data id is required." })

    const seoDataById = await SEOData.findById(id)
    if (!seoDataById) return res.status(404).json({ message: "No data found." })

    try {
        await seoDataById.deleteOne()

        res.status(200).json({ message: "SEO data deleted successfully."})
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})

export {
    getAllSEOData,
    createSEOData,
    getSEODataById,
    updateSEOData,
    deleteSEOData
}