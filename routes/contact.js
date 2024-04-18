import express from "express";
import { getContact, getWhatsappNumber, getContactById, createContact, updateContact, deleteContact } from "../controllers/contactController.js"
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router()

router.get("/", getContact)
router.get("/whatsapp-number", getWhatsappNumber)
router.post("/", verifyToken, createContact)
router.get("/:id", getContactById)
router.patch("/:id", verifyToken, updateContact)
router.delete("/:id", verifyToken, deleteContact)

export default router