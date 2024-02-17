import express from "express";
import { getCarousels, getCarouselById, createCarousel, updateCarousel, deleteCarousel } from "../controllers/carouselsController.js"
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router()

router.get("/", getCarousels)
router.post("/", verifyToken, createCarousel)
router.get("/:id", getCarouselById)
router.patch("/:id", verifyToken, updateCarousel)
router.delete("/:id", verifyToken, deleteCarousel)

export default router 