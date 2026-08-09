import { Router } from "express";
import { getPayments, getPaymentSummary, updatePaymentStatus } from "../controllers/paymentController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, getPayments);
router.get("/summary", authenticate, getPaymentSummary);
router.put("/:id/status", authenticate, updatePaymentStatus);

export default router;
