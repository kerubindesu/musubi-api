import express from "express";
import { getBanners, getBannerById, createBanner, updateBanner, deleteBanner } from "../controllers/bannersController.js"
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router()

router.get("/", getBanners)
router.post("/", verifyToken, createBanner)
router.get("/:id", getBannerById)
router.patch("/:id", verifyToken, updateBanner)
router.delete("/:id", verifyToken, deleteBanner)

export default router 