import express from "express";
import { getProducts, getProductBySlug, getProductById, createProduct, updateProduct, deleteProduct } from "../controllers/productsController.js"
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router()

router.get("/", getProducts)
router.post("/", verifyToken, createProduct)
router.get("/slug/:slug", getProductBySlug)
router.get("/:id", getProductById)
router.patch("/:id", verifyToken, updateProduct)
router.delete("/:id", verifyToken, deleteProduct)

export default router 