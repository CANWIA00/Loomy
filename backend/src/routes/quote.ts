import { asyncHandler } from "../middleware/errorHandler";
import { Router } from "express";
import {
  getQuoteRecords,
  createQuoteRecord,
  updateQuoteRecord,
  deleteQuoteRecord,
  updateQuoteStatus,
} from "../controllers/quoteController";
import { validateBody } from "../middleware/validate";
import { quoteStatusSchema } from "../schemas/quote";
import { authenticate, requirePanelAccess } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, requirePanelAccess("quotes", "view"), asyncHandler(getQuoteRecords));
router.post("/", authenticate, requirePanelAccess("quotes", "manage"), asyncHandler(createQuoteRecord));
router.put("/:id", authenticate, requirePanelAccess("quotes", "manage"), asyncHandler(updateQuoteRecord));
router.patch("/:id/status", authenticate, requirePanelAccess("quotes", "manage"), validateBody(quoteStatusSchema, "Teklif durumu zorunludur."), asyncHandler(updateQuoteStatus));
router.delete("/:id", authenticate, requirePanelAccess("quotes", "manage"), asyncHandler(deleteQuoteRecord));

export default router;