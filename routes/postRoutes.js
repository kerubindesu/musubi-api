import express from "express";
import { getPosts, createPost, updatePost, deletePost } from "../controllers/postsController.js"

const router = express.Router()

router.route("/")
    .get(getPosts)
    .post(createPost)
    .patch(updatePost)
    .delete(deletePost)

export default router 