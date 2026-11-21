import { asyncHandler } from "../middleware/errorHandler";
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

router.get("/all", authenticate, requirePanelAccess("customers", "view"), asyncHandler(getAllCustomersSimple));
router.get("/search", authenticate, requirePanelAccess("customers", "view"), asyncHandler(searchCustomers));
router.get("/", authenticate, requirePanelAccess("customers", "view"), asyncHandler(getCustomers));
router.get("/:id/related-counts", authenticate, requirePanelAccess("customers", "view"), asyncHandler(getCustomerRelatedCounts));
router.get("/:id", authenticate, requirePanelAccess("customers", "view"), asyncHandler(getCustomerById));
router.post("/", authenticate, isAdmin, asyncHandler(createCustomer));
router.put("/:id", authenticate, isAdmin, asyncHandler(updateCustomer));
router.delete("/:id", authenticate, isAdmin, asyncHandler(deleteCustomer));

export default router;