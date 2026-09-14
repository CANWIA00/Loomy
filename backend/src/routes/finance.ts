import { Router } from "express";
import { getFinanceOverview, getFinanceTimeline } from "../controllers/financeController";
import { authenticate, requirePanelAccess } from "../middleware/auth";

const router = Router();

router.use(authenticate, requirePanelAccess("finans"));

router.get("/overview", getFinanceOverview);
router.get("/timeline", getFinanceTimeline);

export default router;