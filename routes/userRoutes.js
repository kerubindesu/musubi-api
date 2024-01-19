import express from "express";
import { getUsers, createUser, updateUser, deleteUser } from "../controllers/usersController.js"

const router = express.Router()

router.route("/")
    .get(getUsers)
    .post(createUser)
    .patch(updateUser)
    .delete(deleteUser)

export default router 