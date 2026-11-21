import { asyncHandler } from "../middleware/errorHandler";
import { Router } from "express";
import {
  getQuoteRecords,
  createQuoteRecord,
  updateQuoteRecord,
  deleteQuoteRecord,
} from "../controllers/quoteController";
import { authenticate, requirePanelAccess } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, requirePanelAccess("quotes", "view"), asyncHandler(getQuoteRecords));
router.post("/", authenticate, requirePanelAccess("quotes", "manage"), asyncHandler(createQuoteRecord));
router.put("/:id", authenticate, requirePanelAccess("quotes", "manage"), asyncHandler(updateQuoteRecord));
router.delete("/:id", authenticate, requirePanelAccess("quotes", "manage"), asyncHandler(deleteQuoteRecord));

export default router;