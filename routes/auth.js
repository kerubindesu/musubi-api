import express from "express";
import { Login, Logout, refreshToken, getUserAuth } from "../controllers/authController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router()

router.post("/login", Login)
router.get("/token", refreshToken)
router.get("/user", verifyToken, getUserAuth)
router.delete("/logout", Logout)
export default router 