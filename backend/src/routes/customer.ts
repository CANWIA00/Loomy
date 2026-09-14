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

router.get("/all", authenticate, requirePanelAccess("customers"), getAllCustomersSimple);
router.get("/search", authenticate, requirePanelAccess("customers"), searchCustomers);
router.get("/", authenticate, requirePanelAccess("customers"), getCustomers);
router.get("/:id/related-counts", authenticate, requirePanelAccess("customers"), getCustomerRelatedCounts);
router.get("/:id", authenticate, requirePanelAccess("customers"), getCustomerById);
router.post("/", authenticate, isAdmin, createCustomer);
router.put("/:id", authenticate, isAdmin, updateCustomer);
router.delete("/:id", authenticate, isAdmin, deleteCustomer);

export default router;
