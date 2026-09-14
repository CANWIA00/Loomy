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
} from "../controllers/stockController";
import { authenticate, requirePanelAccess } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/invoices", requirePanelAccess("stock", "view"), listInvoices);
router.post("/import-xml", requirePanelAccess("stock", "manage"), importInvoiceXml);
router.delete("/invoices/:id", requirePanelAccess("stock", "manage"), deleteInvoice);

router.get("/", requirePanelAccess("stock", "view"), listStockItems);
router.post("/", requirePanelAccess("stock", "manage"), createStockItem);
router.get("/:id", requirePanelAccess("stock", "view"), getStockItem);
router.put("/:id", requirePanelAccess("stock", "manage"), updateStockItem);
router.post("/:id/transactions", requirePanelAccess("stock", "manage"), addStockTransaction);
router.delete("/:id", requirePanelAccess("stock", "manage"), deleteStockItem);

export default router;