import express from "express";
import { getAbout, getAboutById, createAbout, updateAbout, deleteAbout } from "../controllers/aboutController.js"
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router()

router.get("/", getAbout)
router.post("/", verifyToken, createAbout)
router.get("/:id", getAboutById)
router.patch("/:id", verifyToken, updateAbout)
router.delete("/:id", verifyToken, deleteAbout)

export default router 