import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendResetPasswordEmail } from "../config/mailer.js";
import generateResetToken from '../utils/generateResetToken.js';
import { sendEmail } from "../config/mailer.js";

export const Login = asyncHandler( async(req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username })
        if (user.isVerified === false) return res.status(400).json({ message: "Please check your email and verify your account!" })
        
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

export const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.query;

    try {
        // Decode the token to get email
        const decoded = jwt.verify(token, process.env.JWT_EMAIL_SECRET);
        const email = decoded.email;

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            // User not found or email doesn't match
            return res.status(400).json({ message: "Invalid or expired email verification link" });
        }

        // Mark user as verified and clear emailToken
        user.emailToken = null;
        user.isVerified = true;
        await user.save();

        // Respond with success message
        res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            // Token has expired
            return res.status(400).json({ message: "Email verification link has expired. Please request a new one." });
        } else if (error.name === 'JsonWebTokenError') {
            // Invalid token
            return res.status(400).json({ message: "Invalid email verification link" });
        } else {
            console.error('Error verifying email: ', error);
            return res.status(500).json({ message: 'Failed to verify email' });
        }
    }
});

export const requestNewEmailToken = async (req, res) => {
    const { email } = req.body;
    console.log(email)

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate new email token
        const newEmailToken = jwt.sign({ email }, process.env.JWT_EMAIL_SECRET, { expiresIn: '1d' });

        // Update user's email token
        user.emailToken = newEmailToken;
        await user.save();

        // Send email with new token
        await sendEmail(email, newEmailToken);
        
        res.status(200).json({ message: "New email verification token sent successfully" });
    } catch (error) {
        console.error('Error requesting new token: ', error);
        res.status(500).json({ message: 'Failed to request new token' });
    }
};

export const sendResetPasswordToken = asyncHandler( async (req, res) => {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required"})

    try {
        const user = await User.findOne({ email })

        if (!user) return res.status(404).json({ message: "Email not registered" })
        
        // Here you generate a unique token and store it in your database
        const resetToken = generateResetToken(email); // Implement your own function

        user.emailToken = resetToken;
        await user.save();
    
        // Send reset password email
        await sendResetPasswordEmail(email, resetToken);
    
        res.status(200).json({ message: 'Reset password email sent successfully' });
    } catch (error) {
        console.error('Error sending reset password email:', error);
        res.status(500).json({ error: 'Failed to send reset password email' });
    }
});

export const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        // Verifikasi token reset password
        const decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);
        if (!decoded) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Cari user berdasarkan email yang ada di token
        const user = await User.findOne({ email: decoded.email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update password user
        user.password = password;
        await user.save();

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});
