import express from "express";
import { getPosts, getPostById, createPost, updatePost, deletePost } from "../controllers/postsController.js"

const router = express.Router()

router.get("/", getPosts)
router.post("/", createPost)
router.get("/:id", getPostById)
router.patch("/:id", updatePost)
router.delete("/:id", deletePost)

export default router 