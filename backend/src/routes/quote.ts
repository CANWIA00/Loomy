import { Router } from "express";
import {
  getQuoteRecords,
  createQuoteRecord,
  updateQuoteRecord,
  deleteQuoteRecord,
} from "../controllers/quoteController";
import { authenticate, requirePanelAccess } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, requirePanelAccess("quotes"), getQuoteRecords);
router.post("/", authenticate, requirePanelAccess("quotes"), createQuoteRecord);
router.put("/:id", authenticate, requirePanelAccess("quotes"), updateQuoteRecord);
router.delete("/:id", authenticate, requirePanelAccess("quotes"), deleteQuoteRecord);

export default router;
