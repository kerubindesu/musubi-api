import express from "express";
import { Login, Logout, refreshToken } from "../controllers/authController.js";


const router = express.Router()

router.post("/login", Login)

router.get("/token", refreshToken)

router.delete("/logout", Logout)

export default router 