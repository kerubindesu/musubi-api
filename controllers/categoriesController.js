import Category from "../models/Category.js";
import asyncHandler from "express-async-handler";
import Post from "../models/Post.js";
import path from "path"
import fs from "fs"
import User from "../models/User.js";
import Tag from "../models/Tag.js";

export const getCategories = asyncHandler(async (req, res) => {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 32;

    try {
        const categories = await Category.find({
            $or: [
                { "name": { $regex: search, $options: "i" } },
                { "text": { $regex: search, $options: "i" } },
                { "image": { $regex: search, $options: "i" } }
            ]
        })
        .skip(limit * page)
        .select("-createdAt -updatedAt")
        .sort({ "createdAt": "asc" })
        .limit(limit)

        const totalRows = await Category.countDocuments({
            $or: [
                { "name": { $regex: search, $options: "i" } },
                { "text": { $regex: search, $options: "i" } },
                { "image": { $regex: search, $options: "i" } }
            ]
        })

        // Menghitung totalPage berdasarkan totalRows dan limit
        const totalPage = Math.ceil(totalRows/limit);

        if (categories.length === 0) {
            return res.status(200).json({ message: "No found category." });
        }

        return res.status(200).json({ result: categories, page, totalRows, totalPage });
    } catch (error) {
        console.error("Error fetching categories:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
});

export const createCategory = asyncHandler(async (req, res) => {
    const name = req.body.name.charAt(0).toUpperCase() + req.body.name.slice(1);
    const { text } = req.body;

    if (!name) return res.status(400).json({ message: "Name is required." });

    const duplicateName = await Category.findOne({ name })
    if (duplicateName) return res.status(400).json({ message: "Name already exist."})

    if (!text) return res.status(400).json({ message: "Text is required." })

    if (req.files === null) return res.status(400).json({ message: "No file uploaded." })

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
                await Category.create({ name, text, image: fileName, img_url: url })

                res.status(201).json({ message: "Category created successfully." })
            } catch (error) {
                console.log(error.message)
            }
        })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})

export const getCategoryById = asyncHandler(async (req, res) => {
    const { id } = req.params

    try {
        const category = await Category.findById(id)

        return res.status(200).json(category)
    } catch (error) {
        return res.status(400).json({ message: error.message})
    }
})

export const updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params
    const name = req.body.name.charAt(0).toUpperCase() + req.body.name.slice(1);
    const { text } = req.body

    const category = await Category.findById({_id: id})
    if (!category) return res.status(400).json({ message: "No category found." })

    if (!name) return res.status(400).json({ message: "Name is required." });

    // Check if name is already exists
    const findByName = await Category.findOne({ name })
    if (findByName && findByName.id !== category.id) return res.status(400).json({ message: "Name is already exists."})

    if (!text) return res.status(400).json({ message: "Text is required." })
    
    let fileName
    if (req.files === null) {
        fileName = category.image
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

        const filePath = `./public/images/${category.image}`
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        file.mv(`./public/images/${fileName}`, (error) => {
            if (error) return res.status(500).json({ message: error.message })
        })
    }

    const url = `${req.protocol}://${req.get("host")}/images/${fileName}`

    try {
        await category.updateOne({ name, text, image: fileName, img_url: url })

        return res.status(200).json({ message: "Category updated successfully." })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})

export const deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!id) return res.status(400).json({ message: "Category id required." })

    const postsCount = await Post.countDocuments({ category: id });
    if (postsCount > 0) return res.status(400).json({ message: "Can't delete category. Please delete linked posts first." })

    const category = await Category.findById(id)

    if (!category) return res.status(400).json({ message: "Category not found."})

    try {
        const category = await Category.findOneAndDelete({ _id: id })

        return res.status(200).json({ message: `Category successfully deleted.`})
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})

export const getPostsByCategory = asyncHandler(async (req, res) => {
    const { id } = req.params
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;

    try {
        // Mencari kategori berdasarkan ID
        const category = await Category.findById(id);

        // Jika kategori tidak ditemukan
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        const users = await User.find({
            $or: [
                { "name": { $regex: search, $options: "i" } },
                { "username": { $regex: search, $options: "i" } },
                { "email": { $regex: search, $options: "i" } },
            ]
        }).select("_id");

        const tags = await Tag.find({
            $or: [
                { "name": { $regex: search, $options: "i" } },
            ]
        }).select("_id");

        const query = {
            $and: [
                { category: id },
                {
                    $or: [
                        { user: { $in: users } },
                        { tags: { $in: tags } },
                        { "title": { $regex: search, $options: "i" } },
                        { "text": { $regex: search, $options: "i" } },
                        { "image": { $regex: search, $options: "i" } }
                    ]
                }
            ]
        };

        const posts = await Post.find(query)
            .populate("author", "-_id -password")
            .populate("category", "-_id -createdAt -updatedAt")
            .populate("tags", "-_id -createdAt -updatedAt")
            .skip(limit * page)
            .sort({ createdAt: "desc" })
            .limit(limit);

        const totalRows = await Post.countDocuments(query);
        const totalPage = Math.ceil(totalRows / limit);

        if (posts.length === 0) {
            return res.status(200).json({ message: "No found post in this category." });
        }

        return res.status(200).json({ result: posts, page, totalRows, totalPage });
    } catch (error) {
        console.error("Error fetching posts by category:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
});
