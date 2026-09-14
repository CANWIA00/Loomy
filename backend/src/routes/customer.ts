import { Router } from "express";
import {
  getCustomers,
  searchCustomers,
  getAllCustomersSimple,
  getCustomerById,
  getCustomerRelatedCounts,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController";
import { authenticate, isAdmin, requirePanelAccess } from "../middleware/auth";

const router = Router();

router.get("/all", authenticate, requirePanelAccess("customers", "view"), getAllCustomersSimple);
router.get("/search", authenticate, requirePanelAccess("customers", "view"), searchCustomers);
router.get("/", authenticate, requirePanelAccess("customers", "view"), getCustomers);
router.get("/:id/related-counts", authenticate, requirePanelAccess("customers", "view"), getCustomerRelatedCounts);
router.get("/:id", authenticate, requirePanelAccess("customers", "view"), getCustomerById);
router.post("/", authenticate, isAdmin, createCustomer);
router.put("/:id", authenticate, isAdmin, updateCustomer);
router.delete("/:id", authenticate, isAdmin, deleteCustomer);

export default router;