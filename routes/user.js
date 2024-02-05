import express from "express";
import { getUsers, createUser, getUserById, updateUser, deleteUser } from "../controllers/usersController.js"
// import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router()

router.get("/", getUsers)
router.post("/", createUser)
router.get("/:id", getUserById)
router.patch("/:id", updateUser)
router.delete("/:id", deleteUser)

export default router 