import { getFinanceOverview, getFinanceTimeline } from "../controllers/financeController";
import { authenticate, requirePanelAccess } from "../middleware/auth";
import { Router } from "express";

const router = Router();

router.use(authenticate, requirePanelAccess("finans", "view"));

router.get("/overview", getFinanceOverview);
router.get("/timeline", getFinanceTimeline);

export default router;