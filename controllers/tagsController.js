import Tag from "../models/Tag.js";
import Post from "../models/Post.js";
import asyncHandler from "express-async-handler";

export const getTags = asyncHandler(async (req, res) => {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 32;

    try {
        const tags = await Tag.find({
            $or: [
                { "name": { $regex: search, $options: "i" } },
            ]
        })
        .skip(limit * page)
        .select("-createdAt -updatedAt")
        .sort({ "createdAt": "asc" })
        .limit(limit)

        const totalRows = await Tag.countDocuments({
            $or: [
                { "name": { $regex: search, $options: "i" } },
            ]
        })

        // Menghitung totalPage berdasarkan totalRows dan limit
        const totalPage = Math.ceil(totalRows/limit);

        if (tags.length === 0) {
            return res.status(200).json({ message: "No found tag." });
        }

        return res.status(200).json({ result: tags, page, totalRows, totalPage });
    } catch (error) {
        console.error("Error fetching tags:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
});

export const createTag = asyncHandler(async (req, res) => {
    const name = req.body.name.charAt(0).toUpperCase() + req.body.name.slice(1);

    if (!name) return res.status(400).json({ message: "Name is required." });

    const duplicateName = await Tag.findOne({ name })
    if (duplicateName) return res.status(400).json({ message: "Name already exist."})

    try {
        const tag = await Tag.create({ name })

        if (!tag) return res.status(400).json({ message: "Invalid tag data recivied." })

        return res.status(200).json({ message:  `${tag.name} created successfully.` })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})

export const getTagById = asyncHandler(async (req, res) => {
    const { id } = req.params

    try {
        const tag = await Tag.findById(id)

        return res.status(200).json(tag)
    } catch (error) {
        return res.status(400).json({ message: error.message})
    }
})

export const updateTag = asyncHandler(async (req, res) => {
    const { id } = req.params
    const name = req.body.name.charAt(0).toUpperCase() + req.body.name.slice(1);

    const tag = await Tag.findById({_id: id})
    if (!tag) return res.status(400).json({ message: "No tag found." })

    // Check if name is already exists
    const findByName = await Tag.findOne({ name })
    if (findByName && findByName.id !== tag.id) return res.status(400).json({ message: "Name is already exists."})

    try {
        tag.name = name

        await tag.save()
        
        return res.status(200).json({ message: "Tag successfully updated." })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})

export const deleteTag = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!id) return res.status(400).json({ message: "Tag id required." })

    const postsCount = await Post.countDocuments({ tags: id });
    if (postsCount > 0) return res.status(400).json({ message: "Can't delete tags. Please delete linked posts first." })

    const tag = await Tag.findById(id).exec()

    if (!tag) return res.status(404).json({ message: "Tag not found."})

    try {
        const tag = await Tag.findOneAndDelete({ _id: id })

        return res.status(200).json({ message: `Tag successfully deleted.`})
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})