import { asyncHandler } from "../middleware/errorHandler";
import { Router } from "express";
import { getProfile, updateUser, updateCompany, exportData } from "../controllers/profileController";
import { authenticate, isAdmin } from "../middleware/auth";

const router = Router();

router.get("/me", authenticate, asyncHandler(getProfile));
router.get("/data", authenticate, asyncHandler(exportData));
router.put("/me", authenticate, asyncHandler(updateUser));
router.put("/my-company", authenticate, isAdmin, asyncHandler(updateCompany));

export default router;
