import { Router } from "express";
import {
  getQuoteRecords,
  createQuoteRecord,
  updateQuoteRecord,
  deleteQuoteRecord,
} from "../controllers/quoteController";
import { authenticate, requirePanelAccess } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, requirePanelAccess("quotes", "view"), getQuoteRecords);
router.post("/", authenticate, requirePanelAccess("quotes", "manage"), createQuoteRecord);
router.put("/:id", authenticate, requirePanelAccess("quotes", "manage"), updateQuoteRecord);
router.delete("/:id", authenticate, requirePanelAccess("quotes", "manage"), deleteQuoteRecord);

export default router;