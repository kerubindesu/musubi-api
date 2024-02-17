import express from "express";
import { getTags, getTagById, createTag, updateTag, deleteTag } from "../controllers/tagsController.js"
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router()

router.get("/", getTags)
router.post("/", verifyToken, createTag)
router.get("/:id", getTagById)
router.patch("/:id", verifyToken, updateTag)
router.delete("/:id", verifyToken, deleteTag)

export default router 