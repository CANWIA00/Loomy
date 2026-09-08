import { Router } from "express";
import { submitApplication } from "../controllers/applyController";

const router = Router();

router.post("/", submitApplication);

export default router;