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
import { validateBody } from "../middleware/validate";
import { createCustomerSchema, updateCustomerSchema } from "../schemas/customer";

const router = Router();

router.get("/all", authenticate, requirePanelAccess("customers", "view"), asyncHandler(getAllCustomersSimple));
router.get("/search", authenticate, requirePanelAccess("customers", "view"), asyncHandler(searchCustomers));
router.get("/", authenticate, requirePanelAccess("customers", "view"), asyncHandler(getCustomers));
router.get("/:id/related-counts", authenticate, requirePanelAccess("customers", "view"), asyncHandler(getCustomerRelatedCounts));
router.get("/:id", authenticate, requirePanelAccess("customers", "view"), asyncHandler(getCustomerById));
router.post("/", authenticate, isAdmin, validateBody(createCustomerSchema, "Şirket adı zorunludur."), asyncHandler(createCustomer));
router.put("/:id", authenticate, isAdmin, validateBody(updateCustomerSchema), asyncHandler(updateCustomer));
router.delete("/:id", authenticate, isAdmin, asyncHandler(deleteCustomer));

export default router;