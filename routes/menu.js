import express from "express";
import { getMenus, createMenu, getMenuById, updateMenu, deleteMenu } from "../controllers/menusController.js"
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router()

router.get("/", getMenus)
router.post("/", verifyToken,  createMenu)
router.get("/:id", getMenuById)
router.patch("/:id", verifyToken, updateMenu)
router.delete("/:id", verifyToken, deleteMenu)

export default router 