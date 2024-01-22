import mongoose from "mongoose";
import Post from '../models/Post.js'
import User from '../models/User.js'
import asyncHandler from 'express-async-handler'

// @desc Get all posts 
// @route GET /posts
// @access Private
const getPosts = asyncHandler(async (req, res) => {
    // Get all posts from MongoDB
    const posts = await Post.find().lean()

    // If no posts 
    if (!posts?.length) {
        return res.status(400).json({ message: 'No posts found' })
    }

    // Add username to each post before sending the response 
    // See Promise.all with map() here: https://youtu.be/4lqJBBEpjRE 
    // You could also do this with a for...of loop
    const postsWithUser = await Promise.all(posts.map(async (post) => {
        const user = await User.findById(post.user).lean().exec()
        return { ...post, username: user.username }
    }))

    res.json(postsWithUser)
})

// @desc Create new post
// @route POST /posts
// @access Private
const createPost = asyncHandler(async (req, res) => {
    const { user, title, text } = req.body

    // Confirm data
    if (!user || !title || !text) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    // Check for duplicate title
    const duplicate = await Post.findOne({ title }).lean().exec()

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate post title' })
    }

    // Create and store the new user 
    const post = await Post.create({ user, title, text })

    if (post) { // Created 
        return res.status(201).json({ message: 'New post created' })
    } else {
        return res.status(400).json({ message: 'Invalid post data received' })
    }

})

// @desc Update a post
// @route PATCH /posts
// @access Private
const updatePost = asyncHandler(async (req, res) => {
    const { id, user, title, text, completed } = req.body

    // Confirm data
    if (!id || !user || !title || !text || typeof completed !== 'boolean') {
        return res.status(400).json({ message: 'All fields are required' })
    }

    // Confirm post exists to update
    const post = await Post.findById(id).exec()

    if (!post) {
        return res.status(400).json({ message: 'Post not found' })
    }

    // Check for duplicate title
    const duplicate = await Post.findOne({ title }).lean().exec()

    // Allow renaming of the original post 
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate post title' })
    }

    post.user = user
    post.title = title
    post.text = text
    post.completed = completed

    const updatedPost = await post.save()

    res.json(`'${updatedPost.title}' updated`)
})

// @desc Delete a post
// @route DELETE /posts
// @access Private
const deletePost = asyncHandler(async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'Post ID required' })
    }

    // Confirm post exists to delete 
    const post = await Post.findById(id).exec()

    if (!post) {
        return res.status(400).json({ message: 'Post not found' })
    }

    const result = await post.deleteOne()

    const reply = `Post '${result.title}' with ID ${result._id} deleted`

    res.json(reply)
})

export {
    getPosts,
    createPost,
    updatePost,
    deletePost
}