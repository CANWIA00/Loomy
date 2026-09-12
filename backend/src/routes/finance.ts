import { Router } from "express";
import { getFinanceOverview, getFinanceTimeline } from "../controllers/financeController";
import { authenticate, isAdmin } from "../middleware/auth";

const router = Router();

router.use(authenticate, isAdmin);

router.get("/overview", getFinanceOverview);
router.get("/timeline", getFinanceTimeline);

export default router;