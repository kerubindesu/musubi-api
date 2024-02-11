import mongoose from "mongoose";
import Post from '../models/Post.js'
import User from '../models/User.js'
import asyncHandler from 'express-async-handler'
import path from "path"
import fs from "fs"
import { title } from "process";

// @desc Get all posts 
// @route GET /posts
// @access Private
const getPosts = asyncHandler( async(req, res) => {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;

    try {
        const users = await User.find({
            $or: [
                { "name": { $regex: search, $options: "i" } },
                { "username": { $regex: search, $options: "i" } },
                { "email": { $regex: search, $options: "i" } },
            ]
        }).select("_id")

        const posts = await Post.find({
            $or: [
                { user: users },
                { "title": { $regex: search, $options: "i" } },
                { "text": { $regex: search, $options: "i" } },
                { "image": { $regex: search, $options: "i" } },
            ]
        })
        .skip(limit * page)
        .sort({ createdAt: "desc" })
        .limit(limit)

        const totalRows = await Post.countDocuments({
            $or: [
                { user: users },
                { "title": { $regex: search, $options: "i" } },
                { "text": { $regex: search, $options: "i" } },
                { "image": { $regex: search, $options: "i" } },
            ]
        })

        // Menghitung totalPage berdasarkan totalRows dan limit
        const totalPage = Math.ceil(totalRows/limit);

        if (posts.length === 0) {
            return res.status(200).json({ message: "No found post" });
        }

        return res.status(200).json({ result: posts, page, totalRows, totalPage });
    } catch (error) {
        console.error("Error fetching posts:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
})

// @desc Get post by _id 
// @route GET /posts/:id
// @access Private
const getPostById = asyncHandler( async(req, res) => {
    const { id } = req.params

    try {
        const post = await Post.findById(id)

        return res.status(200).json(post)
    } catch (error) {
        return res.status(400).json({ message: error.message})
    }
})

// under construction
// @desc Create new post
// @route POST /posts
// @access Private
const createPost = asyncHandler( async(req, res) => {
    const { username, title, text } = req.body

    if (!username) return res.status(403).json({ message: 'Forbidden' })

    if (!title) return res.status(403).json({ message: 'Title is required' })
    
    if (!text) return res.status(403).json({ message: 'Text is required' })


    if (req.files === null) return res.status(400).json({ message: 'No file uploaded' })

    try {
        const user = await User.findOne({username})
        
        const file = req.files.file
        const fileSize = file.data.length
        const extention = path.extname(file.name)
        const fileName = file.md5 + extention // convert to md5
        const url = `${req.protocol}://${req.get("host")}/images/${fileName}`

        const allowedType = [".png", ".jpg", ".jpeg"]

        if (!allowedType.includes(extention.toLocaleLowerCase())) return res.status(422).json({ message: "Invalid images" })

        if (fileSize > (1000 * 5000)) return res.status(422).json({ message: "Image must be less than 5MB" })

        file.mv(`./public/images/${fileName}`, async(error) => {
            if (error) return res.status(500).json({ message: error.message })

            try {
                await Post.create({ user: user, title, text, image: fileName, img_url: url })

                res.status(201).json({ message: "Post created successfuly" })
            } catch (error) {
                console.log(error.message)
            }
        })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
    
})

// @desc Update a post
// @route PATCH /posts
// @access Private
const updatePost = asyncHandler( async(req, res) => {
    const { id } = req.params

    const { title, text } = req.body

    // Confirm data
    if (!id) return res.status(400).json({ message: 'Post id required' })

    if (!title) return res.status(403).json({ message: 'Title is required' })
    
    if (!text) return res.status(403).json({ message: 'Text is required' })

    // Confirm post exists to delete 
    const post = await Post.findById(id).exec()

    if (!post) return res.status(404).json({ message: 'No data found' })

    let fileName
    if (req.files === null) {
        fileName = post.image
    } else {
        const file = req.files.file
        const fileSize = file.data.length
        const extention = path.extname(file.name)
        fileName = file.md5 + extention // convert to md5

        const allowedType = [".png", ".jpg", ".jpeg"]
        
        if (!allowedType.includes(extention.toLocaleLowerCase())) return res.status(422).json({ message: "Invalid images" })

        if (fileSize > (1000 * 5000)) return res.status(422).json({ message: "Image must be less than 5MB" })

        const filePath = `./public/images/${post.image}`
        fs.unlinkSync(filePath)

        file.mv(`./public/images/${fileName}`, (error) => {
            if (error) return res.status(500).json({ message: error.message })
        })
    }

    const url = `${req.protocol}://${req.get("host")}/images/${fileName}`

    try {
        await post.updateOne({ title, text, image: fileName, img_url: url })

        return res.status(200).json({ message: "Post updated successfuly" })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})

// @desc Delete a post
// @route DELETE /posts
// @access Private
const deletePost = asyncHandler( async(req, res) => {
    const { id } = req.params

    // Confirm data
    if (!id) return res.status(400).json({ message: 'Post id required' })

    // Confirm post exists to delete 
    const post = await Post.findById(id).exec()

    if (!post) return res.status(404).json({ message: 'No data found' })

    try {
        const filePath = `./public/images/${post.image}`
        fs.unlinkSync(filePath)

        await post.deleteOne()
        res.status(200).json({ message: "Post deleted successfuly"})
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})

export {
    getPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost
}