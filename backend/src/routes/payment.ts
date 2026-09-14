import { getPayments, getPaymentSummary, updatePaymentStatus } from "../controllers/paymentController";
import { authenticate, requirePanelAccess } from "../middleware/auth";
import { Router } from "express";

const router = Router();

router.use(authenticate);

router.get("/", requirePanelAccess("finans", "view"), getPayments);
router.get("/summary", requirePanelAccess("finans", "view"), getPaymentSummary);
router.put("/:id/status", requirePanelAccess("finans", "manage"), updatePaymentStatus);

export default router;