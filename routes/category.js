import express from "express";
import { getCategories, createCategory, getCategoryById, updateCategory, deleteCategory, getProductsByCategory } from "../controllers/categoriesController.js"
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router()

router.get("/", getCategories)
router.post("/", verifyToken,  createCategory)
router.get("/products:id", getProductsByCategory)
router.get("/:id", getCategoryById)
router.patch("/:id", verifyToken, updateCategory)
router.delete("/:id", verifyToken, deleteCategory)

export default router 