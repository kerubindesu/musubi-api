import mongoose from "mongoose";
import User from "../models/User.js";
import Post from "../models/Post.js";
import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";

// @desc get all usersx
// @route GET /users
// @access Private
const getUsers = asyncHandler(async (req, res) => {
    try {
        const users = await User.find().select("-password").lean();
        
        if (users.length === 0) {
            return res.status(400).json({ message: "no user found" });
        }

        res.json(users);
    } catch (err) {
        // Handle any database error
        console.error("error fetching users:", err);
        res.status(500).json({ message: "internal server error" });
    }
})

// @desc create new user
// @route GET /users
// @access Private
const createUser = asyncHandler(async (req, res) => {
    const { username, password, roles } = req.body

    // confirm data
    // Check if username is provided
    if (!username) {
        return res.status(400).json({ message: "Username is required" });
    }

    // Check if password is provided
    if (!password) {
        return res.status(400).json({ message: "Password is required" });
    }

    // Check if roles is provided and is an array with at least one element
    if (roles.length === 0) {
        return res.status(400).json({ message: "Roles is required" });

    }

    if (!Array.isArray(roles)) {
        return res.status(400).json({ message: "Roles must be an array with at least one element" });
    }

    // check for duplicate
    const duplicate = await User.findOne({ username }).lean().exec()

    if (duplicate) {
        return res.status(400).json({ message: "username is already exist"})
    }

    // hash password
    const hashedPwd = await bcrypt.hash(password, 10) // salt rounds

    const userObject = { username, "password": hashedPwd, roles }

    // Create and store new user 
    const user = await User.create(userObject)

    // create and store new user
    if (user) {
        res.status(201).json({ message: `new user ${username} created`})
    } else {
        res.status(400).json({ message: "invalid user data recivied" })
    }
})

// @desc update a user
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { username, roles, active, password} = req.body

    // confirm
    // check if id is provided
    if (!id) {
        return res.status(400).json({ message: "id is required" });
    }

    // check if username is provided
    if (!username) {
        return res.status(400).json({ message: "Username is required" });
    }

    // check if roles is provided and is an array with at least one element
    if (!Array.isArray(roles) || roles.length === 0) {
        return res.status(400).json({ message: "Roles must be an array with at least one element" });
    }

    // check if type of active is boolean
    if (typeof active !== "boolean") {
        return res.status(400).json({ message: "active must be a boolean" });
    }

    const user = await User.findById(id).exec()

    if (!user) {
        return res.status(400).json({ message: "user not found"})
    }

    // check for duplicatex
    const duplicate = await User.findOne({ username }).lean().exec()
    // allow updates to the origin user
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: "duplicate username" })
    }

    user.username = username
    user.roles = roles
    user.active = active

    if (password) {
        // hash password
        user.password = await bcrypt.hash(password, 10) // salt rounds
    }

    const updateUser = await user.save()

    res.json({ message: `${updateUser.username } updated`})
})

// @desc delete a user
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!id) {
        return res.status(400).json({ message: "user id required" })
    }

    const posts = await Post.findOne({ user: id }).lean().exec()
    if (posts?.length) {
        console.log("user has assigned posts")

        await Post.updateMany({ user: id }, { $unset: { user: 1 } });
        console.log(`posts user reference updated`)
    }

    const user = await User.findById(id).exec()

    if (!user) {
        return res.status(400).json({ message: "user not found"})
    }

    const result = await user.deleteOne()

    const reply = `username ${result.username} with id ${result.id} deleted`

    res.json({ message: reply })
})

export { getUsers, createUser, updateUser, deleteUser }