import express from "express";
import { getVisitsData } from "../controllers/visitorController.js"
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router()

router.get("/", verifyToken, getVisitsData)

export default router 