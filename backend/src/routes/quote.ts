import { asyncHandler } from "../middleware/errorHandler";
import { Router } from "express";
import {
  getQuoteRecords,
  createQuoteRecord,
  updateQuoteRecord,
  deleteQuoteRecord,
  updateQuoteStatus,
  getQuoteRecord,
  saveQuoteCustomer,
} from "../controllers/quoteController";
import { validateBody } from "../middleware/validate";
import { quoteStatusSchema, quoteBodySchema } from "../schemas/quote";
import { authenticate, isAdmin, requirePanelAccess } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, requirePanelAccess("quotes", "view"), asyncHandler(getQuoteRecords));
// Musteri kaydi olusturur; musteri ekleme yetkisi gibi yalnizca yonetici.
router.post("/:id/save-customer", authenticate, isAdmin, asyncHandler(saveQuoteCustomer));
router.get("/:id", authenticate, requirePanelAccess("quotes", "view"), asyncHandler(getQuoteRecord));
router.post("/", authenticate, requirePanelAccess("quotes", "manage"), validateBody(quoteBodySchema, "Teklifin zorunlu alanları eksik."), asyncHandler(createQuoteRecord));
router.put("/:id", authenticate, requirePanelAccess("quotes", "manage"), validateBody(quoteBodySchema, "Teklifin zorunlu alanları eksik."), asyncHandler(updateQuoteRecord));
router.patch("/:id/status", authenticate, requirePanelAccess("quotes", "manage"), validateBody(quoteStatusSchema, "Teklif durumu zorunludur."), asyncHandler(updateQuoteStatus));
router.delete("/:id", authenticate, requirePanelAccess("quotes", "manage"), asyncHandler(deleteQuoteRecord));

export default router;