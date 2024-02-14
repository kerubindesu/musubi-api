import express from "express";
import { getConfig, updateConfig } from "../controllers/configController.js"
// import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router()

router.get("/", getConfig)
router.patch("/", updateConfig)

export default router 