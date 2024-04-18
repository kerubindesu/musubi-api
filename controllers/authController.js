import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const Login = asyncHandler( async(req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username })
        
        const match = await bcrypt.compare(req.body.password, user.password)

        if (!match) return res.status(400).json({ message: "Incorrect username or password."})

        const uid = user._id
        const name = user.name
        const username = user.username
        const email = user.email

        const accessToken = jwt.sign({ uid, name, username, email}, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "20s"})

        const refreshToken = jwt.sign({ uid, name, username, email}, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "1d"})

        await User.updateOne({ _id: uid }, {refresh_token: refreshToken })

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            secure: true,
            sameSite: "None"
        })

        res.status(200).json({ message: "Login successfully." })
    } catch (error) {
        res.status(400).json({ message: "Incorrect username or password." })
    }
})

export const refreshToken = asyncHandler( async(req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken

        if (!refreshToken) return res.sendStatus(401)

        const user = await User.findOne({refresh_token: refreshToken})

        if (!user) return res.sendStatus(403)

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) {
                console.log(error);
                return res.sendStatus(403);
            }

            const uid = user._id
            const name = user.name
            const username = user.username
            const email = user.email

            const accessToken = jwt.sign({ uid, name, username, email}, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "16m"})

            res.json({ accessToken })
        })
    } catch (error) {
        return Promise.reject(error);
    }
})

export const Logout = asyncHandler( async(req, res) => {
    const refreshToken = req.cookies.refreshToken

    if (!refreshToken) return res.sendStatus(204)

    const user = await User.findOne({refresh_token: refreshToken})

    if (!user) return res.sendStatus(204)

    // find user & set refresh_token to null 
    const uid = user._id
    await User.findOneAndUpdate({ _id: uid }, { refresh_token: null })

    res.clearCookie("refreshToken") // delete cookie

    return res.sendStatus(200)
})

export const getUserAuth = asyncHandler( async(req, res) => {
    const refreshToken = req.cookies.refreshToken

    try {
        if (refreshToken) {
            const user = await User.findOne({refresh_token: refreshToken}).select("-_id -password -email -refresh_token -createDAt -updatedAt")
    
            return res.status(200).json({user})
        } else {
            console.log("duh error")
            return res.sendStatus(204)
        }
    } catch (error) {
        console.log(error)
    }
})