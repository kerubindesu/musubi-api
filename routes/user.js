import express from "express";
import { getUsers, createUser, getUserById, updateUser, deleteUser } from "../controllers/usersController.js"
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router()

router.get("/", verifyToken, getUsers)
router.post("/",  createUser)
router.get("/:id", verifyToken, getUserById)
router.patch("/:id", verifyToken, updateUser)
router.delete("/:id", verifyToken, deleteUser)

export default router