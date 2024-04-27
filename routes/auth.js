import express from "express";
import { verifyEmail, requestNewEmailToken, sendResetPasswordToken, resetPassword, Login, Logout, refreshToken, getUserAuth } from "../controllers/authController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router()

router.get("/verify-email", verifyEmail);
router.post("/request-new-email-token", requestNewEmailToken);
router.post("/send-reset-password-token", sendResetPasswordToken);
router.post("/reset-password/:token", resetPassword)
router.post("/login", Login)
router.get("/user", verifyToken, getUserAuth)
router.get("/token", refreshToken)
router.delete("/logout", Logout)

export default router