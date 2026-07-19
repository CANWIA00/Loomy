import { Router } from "express";
import { getPayments, getPaymentSummary, updatePaymentStatus, searchPayments } from "../controllers/paymentController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, getPayments);
router.get("/summary", authenticate, getPaymentSummary);
router.get("/search", authenticate, searchPayments);
router.put("/:id/status", authenticate, updatePaymentStatus);

export default router;
