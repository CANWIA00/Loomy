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
import { authenticate, isAdmin } from "../middleware/auth";

const router = Router();

router.use(authenticate, isAdmin);

router.get("/invoices", listInvoices);
router.post("/import-xml", importInvoiceXml);
router.delete("/invoices/:id", deleteInvoice);

router.get("/", listStockItems);
router.post("/", createStockItem);
router.get("/:id", getStockItem);
router.put("/:id", updateStockItem);
router.post("/:id/transactions", addStockTransaction);
router.delete("/:id", deleteStockItem);

export default router;