import { Router } from "express";
import { getFinanceOverview } from "../controllers/financeController";
import { authenticate, isAdmin } from "../middleware/auth";

const router = Router();

router.use(authenticate, isAdmin);

router.get("/overview", getFinanceOverview);

export default router;