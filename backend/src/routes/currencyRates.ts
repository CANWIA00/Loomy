import { Router } from "express";
import { getTcmbRates } from "../controllers/currencyRatesController";

const router = Router();

router.get("/tcmb", getTcmbRates);

export default router;