import express from "express";
import { createLogo, getLogo, updateLogo } from "../controllers/logoController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router()

router.get("/", getLogo)
router.post("/", verifyToken, createLogo)
router.patch("/", verifyToken, updateLogo)

export default router 