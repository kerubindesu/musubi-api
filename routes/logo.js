import express from "express";
import { createLogo, getLogo, updateLogo } from "../controllers/logoController.js";
// import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router()

router.get("/", getLogo)
router.post("/", createLogo)
router.patch("/", updateLogo)

export default router 