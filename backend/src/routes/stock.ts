import { asyncHandler } from "../middleware/errorHandler";
import { Router } from "express";
import {
  listStockItems,
  getStockItem,
  createStockItem,
  updateStockItem,
  deleteStockItem,
  addStockTransaction,
  listInvoices,
  importInvoiceXml,
  deleteInvoice,
  listSavedProductNames,
  saveProductName,
} from "../controllers/stockController";
import { authenticate, requirePanelAccess } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/saved-names", requirePanelAccess("stock", "view"), asyncHandler(listSavedProductNames));
router.post("/saved-names", requirePanelAccess("stock", "manage"), asyncHandler(saveProductName));
router.get("/invoices", requirePanelAccess("stock", "view"), asyncHandler(listInvoices));
router.post("/import-xml", requirePanelAccess("stock", "manage"), asyncHandler(importInvoiceXml));
router.delete("/invoices/:id", requirePanelAccess("stock", "manage"), asyncHandler(deleteInvoice));

router.get("/", requirePanelAccess("stock", "view"), asyncHandler(listStockItems));
router.post("/", requirePanelAccess("stock", "manage"), asyncHandler(createStockItem));
router.get("/:id", requirePanelAccess("stock", "view"), asyncHandler(getStockItem));
router.put("/:id", requirePanelAccess("stock", "manage"), asyncHandler(updateStockItem));
router.post("/:id/transactions", requirePanelAccess("stock", "manage"), asyncHandler(addStockTransaction));
router.delete("/:id", requirePanelAccess("stock", "manage"), asyncHandler(deleteStockItem));

export default router;