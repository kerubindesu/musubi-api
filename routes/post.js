import express from "express";
import { getPosts, getPostById, createPost, updatePost, deletePost } from "../controllers/postsController.js"
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router()

router.get("/", verifyToken, getPosts)
router.post("/", verifyToken, createPost)
router.get("/:id", verifyToken, getPostById)
router.patch("/:id", verifyToken, updatePost)
router.delete("/:id", verifyToken, deletePost)

export default router 