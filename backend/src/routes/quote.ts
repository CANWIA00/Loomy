import { Router } from "express";
import {
  getQuoteRecords,
  createQuoteRecord,
  updateQuoteRecord,
  deleteQuoteRecord,
} from "../controllers/quoteController";
import { authenticate, isAdmin } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, isAdmin, getQuoteRecords);
router.post("/", authenticate, isAdmin, createQuoteRecord);
router.put("/:id", authenticate, isAdmin, updateQuoteRecord);
router.delete("/:id", authenticate, isAdmin, deleteQuoteRecord);

export default router;
