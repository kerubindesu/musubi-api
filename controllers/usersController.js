import mongoose from "mongoose";
import User from "../models/User.js";
import Post from "../models/Post.js";
import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import validator from "email-validator"
import jwt from "jsonwebtoken";

// @desc get all users
// @route GET /users
// @access Private
export const getUsers = asyncHandler(async (req, res) => {
    const q = req.query.q
    const limit = parseInt(req.query.limit) || 10

    let totalItems

    try {
        await User.find({}).countDocuments().then(async (count) => {
            totalItems = count

            await User.find({
                $or: [
                    { "name": { $regex: q, $options: "i" } },
                    { "username": { $regex: q, $options: "i" }, },
                    { "email": { $regex: q, $options: "i" }, },
                    { "role": { $regex: q, $options: "i" } },
                ]
            })
                .where({ "role": { $ne: 'admin' } },)
                .select("-password -access_token -createDAt -updatedAt")
                .sort({ "name": "asc" })
                .limit(limit)
                .then((users) => {
                    if (users.length === 0) return res.status(200).json({ message: "no found user" })

                    return res.status(200).json({ data: users, totalItems })
                })
        });
    } catch (error) {
        console.error("error fetching users:", error.message);
        res.status(500).json({ message: "internal server error" });
    }
})

// @desc create new user
// @route GET /users
// @access Private
export const createUser = asyncHandler(async (req, res) => {
    const { name, username, email, password } = req.body

    // confirm data

    // Check if username is provided
    if (!name) return res.status(400).json({ message: "name is required" });

    // Check if username is provided
    if (!username) return res.status(400).json({ message: "username is required" });

    // Check if username is already exists
    const duplicateUsername = await User.findOne({ username })
    if (duplicateUsername) return res.status(400).json({ message: "username is already exists"})

    // Check if email is provided
    if (!email) return res.status(400).json({ message: "email is required" });

    // Check if email is valid
    const isValidEmail = validator.validate(email)
    if (!isValidEmail) return res.status(400).json({ message: "email is not valid" })

    // Check if email is already exists
    const duplicateEmail = await User.findOne({ email })
    if (duplicateEmail) return res.status(400).json({ message: "email is already exists"})

    // Check if password is provided
    if (!password) {
        return res.status(400).json({ message: "password is required" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10) // salt rounds

    try {
        const user = await User.create({ 
            name,
            username, 
            email,
            "password": hashedPassword
        })

        if (!user) return res.status(400).json({ message: "invalid user data recivied" })

        return res.status(200).json({ message:  `${user.name} created successfully` })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})

// @desc get single user by id
// @route GET /user/:id
// @access Private
export const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params

    try {
        const user = await User.findById(id)

        return res.status(200).json(user)
    } catch (error) {
        return res.status(400).json({ message: error.message})
    }
})

// @desc update a user
// @route PATCH /users
// @access Private
export const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { name, username, email, password } = req.body

    // chek if user found
    const user = await User.findById({_id: id})
    if (!user) return res.status(400).json({ message: "no user found" })

    // confirm data
    // Check if username is provided
    if (!name) return res.status(400).json({ message: "name is required" });

    // Check if username is provided
    if (!username) return res.status(400).json({ message: "username is required" });

    // Check if username is already exists
    const findByUsername = await User.findOne({ username })
    if (findByUsername._id !== user._id) return res.status(400).json({ message: "username is already exists"})

    // Check if email is provided
    if (!email) return res.status(400).json({ message: "email is required" });

    // Check if email is valid
    const isValidEmail = validator.validate(email)
    if (!isValidEmail) return res.status(400).json({ message: "email is not valid" })

    // Check if email is already exists
    const findByEmail = await User.findOne({ email })
    if (findByEmail._id !== user._id) return res.status(400).json({ message: "email is already exists"})

    try {
        user.name = name
        user.username = username
        user.email = email
        
        if (password) {
            // hash password
            user.password = await bcrypt.hash(password, 10) // salt rounds
        }

        await user.save()
        
        return res.status(200).json({ message: `${user.name} updated successfully` })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})

// @desc delete a user
// @route DELETE /users
// @access Private
export const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!id) {
        return res.status(400).json({ message: "user id required" })
    }

    const posts = await Post.findOne({ user: id }).lean().exec()

    const user = await User.findById(id).exec()

    if (!user) {
        return res.status(400).json({ message: "user not found"})
    }

    try {
        const user = await User.findOneAndDelete({ _id: id })

        return res.status(200).json({ message: `user with id ${ user._id } deleted`})
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})