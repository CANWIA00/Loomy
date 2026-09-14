import { Router } from "express";
import { getPayments, getPaymentSummary, updatePaymentStatus } from "../controllers/paymentController";
import { authenticate, requirePanelAccess } from "../middleware/auth";

const router = Router();

router.use(authenticate, requirePanelAccess("finans"));

router.get("/", getPayments);
router.get("/summary", getPaymentSummary);
router.put("/:id/status", updatePaymentStatus);

export default router;
