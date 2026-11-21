import { asyncHandler } from "../middleware/errorHandler";
import { Router } from "express";
import { getTcmbRates } from "../controllers/currencyRatesController";

const router = Router();

router.get("/tcmb", asyncHandler(getTcmbRates));

export default router;