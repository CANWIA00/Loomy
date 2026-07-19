import { Router } from "express";
import {
  getCustomers,
  searchCustomers,
  getAllCustomersSimple,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController";
import { authenticate, isAdmin } from "../middleware/auth";

const router = Router();

router.get("/all", authenticate, getAllCustomersSimple);
router.get("/search", authenticate, searchCustomers);
router.get("/", authenticate, getCustomers);
router.get("/:id", authenticate, getCustomerById);
router.post("/", authenticate, isAdmin, createCustomer);
router.put("/:id", authenticate, isAdmin, updateCustomer);
router.delete("/:id", authenticate, isAdmin, deleteCustomer);

export default router;
