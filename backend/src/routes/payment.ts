import { asyncHandler } from "../middleware/errorHandler";
import { getPayments, getPaymentSummary, updatePaymentStatus } from "../controllers/paymentController";
import { authenticate, requirePanelAccess } from "../middleware/auth";
import { Router } from "express";

const router = Router();

router.use(authenticate);

router.get("/", requirePanelAccess("finans", "view"), asyncHandler(getPayments));
router.get("/summary", requirePanelAccess("finans", "view"), asyncHandler(getPaymentSummary));
router.put("/:id/status", requirePanelAccess("finans", "manage"), asyncHandler(updatePaymentStatus));

export default router;