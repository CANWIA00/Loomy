import { asyncHandler } from "../middleware/errorHandler";
import { Router } from "express";
import { submitApplication } from "../controllers/applyController";

const router = Router();

router.post("/", asyncHandler(submitApplication));

export default router;