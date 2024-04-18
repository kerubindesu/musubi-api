import express from "express";
import { getAllSEOData, getSEODataById, createSEOData, updateSEOData, deleteSEOData } from "../controllers/seoController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router()

router.get("/", getAllSEOData)
router.post("/", verifyToken, createSEOData)
router.get("/:id", getSEODataById)
router.patch("/:id", verifyToken, updateSEOData)
router.delete("/:id", verifyToken, deleteSEOData)

export default router 