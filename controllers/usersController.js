import User from "../models/User.js";
import Product from "../models/Product.js";
import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import validator from "email-validator"
import jwt from "jsonwebtoken";
import { sendEmail } from "../config/mailer.js";
import validatePassword from "../utils/passwordValidator.js";

export const getUsers = asyncHandler(async (req, res) => {
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
        })
        .skip(limit * page)
        .select("-password -email_token -refresh_token -createdAt -updatedAt")
        .sort({ "name": "asc" })
        .limit(limit)

        const totalRows = await User.countDocuments({
            $or: [
                { "name": { $regex: search, $options: "i" } },
                { "username": { $regex: search, $options: "i" } },
                { "email": { $regex: search, $options: "i" } },
            ]
        })

        // Menghitung totalPage berdasarkan totalRows dan limit
        const totalPage = Math.ceil(totalRows/limit);

        if (users.length === 0) {
            return res.status(200).json({ message: "No found user." });
        }

        return res.status(200).json({ result: users, page, totalRows, totalPage });
    } catch (error) {
        console.error("Error fetching users:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
});

export const createUser = asyncHandler(async (req, res) => {
    const { name, username, email, password } = req.body

    // confirm data
    // validate name
    if (!name) return res.status(400).json({ message: "Name is required." });

    // validate username
    if (!username) return res.status(400).json({ message: "Username is required." });

    if (username.length < 5) return res.status(400).json({ message: "Username must be at least 5 characters." });

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) return res.status(400).json({ message: "Username may only contain letters, numbers, underscores and hypenes." });

    const duplicateUsername = await User.findOne({ username })
    if (duplicateUsername) return res.status(400).json({ message: "Username already exist."})

    // validate email
    if (!email) return res.status(400).json({ message: "Email is required." });

    const isValidEmail = validator.validate(email)
    if (!isValidEmail) return res.status(400).json({ message: "Email is not valid." })

    const duplicateEmail = await User.findOne({ email })
    if (duplicateEmail) return res.status(400).json({ message: "Email is already exists."})

    const emailToken = jwt.sign({ email }, process.env.JWT_EMAIL_SECRET, { expiresIn: '1d' });

    // validate password
    if (!password) {
        return res.status(400).json({ message: "Password is required." });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
        return res.status(400).json({ message: passwordValidation.message });
    }

    try {
        const user = await User.create({ 
            name,
            username, 
            email,
            "password": password,
            emailToken
        })

        if (!user) return res.status(400).json({ message: "Invalid user data recivied." })

        const url = `http://localhost:3000/auth/verify-email?token=${emailToken}`;

        await sendEmail(email, emailToken);

        res.status(201).json({ message: "User registered, please verify your email." });
    } catch (error) {
        console.error('Error creating user: ', error);
        res.status(500).json({ message: 'Failed to register user' });
    }
})

export const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params

    try {
        const user = await User.findById(id)

        return res.status(200).json(user)
    } catch (error) {
        return res.status(400).json({ message: error.message})
    }
})

export const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { name, username, email, password } = req.body

    // chek if user found
    const user = await User.findById({_id: id})
    if (!user) return res.status(400).json({ message: "No user found." })

    // confirm data
    // Check if username is provided
    if (!name) return res.status(400).json({ message: "Name is required." });

    // Check if username is provided
    if (!username) return res.status(400).json({ message: "Username is required." });

    // Check if username is already exists
    const findByUsername = await User.findOne({ username })
    if (findByUsername && findByUsername.id !== user.id) return res.status(400).json({ message: "Username is already exists."})

    // Check if email is provided
    if (!email) return res.status(400).json({ message: "Email is required." });

    // Check if email is valid
    const isValidEmail = validator.validate(email)
    if (!isValidEmail) return res.status(400).json({ message: "Email is not valid." })

    // Check if email is already exists
    const findByEmail = await User.findOne({ email })
    if (findByEmail && findByEmail.id !== user.id) return res.status(400).json({ message: "Email is already exists."})

    if(password) {
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return res.status(400).json({ message: passwordValidation });
        }
    }

    try {
        user.name = name
        user.username = username
        user.email = email
        if (password) user.password = password
        await user.save()

        return res.status(200).json({ message: "User successfully updated." })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})

export const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!id) return res.status(400).json({ message: "User id is required." })

    const products = await Product.findOne({ user: id })
    if (products) return res.status(400).json({ message: "Can't delete user. Please delete linked products first." })

    const user = await User.findById(id)

    if (!user) return res.status(400).json({ message: "User not found"})

    try {
        const user = await User.findOneAndDelete({ _id: id })

        return res.status(200).json({ message: `User deleted successfully.`})
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})