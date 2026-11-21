import { asyncHandler } from "../middleware/errorHandler";
import { Router } from "express";
import {
  getCompanyManagement,
  updateUserPanelAccess,
  applyPanelAccessToAll,
} from "../controllers/companyController";
import { authenticate, isAdmin } from "../middleware/auth";

const router = Router();

router.use(authenticate, isAdmin);

router.get("/users", asyncHandler(getCompanyManagement));
router.patch("/users/:id/access", asyncHandler(updateUserPanelAccess));
router.patch("/access", asyncHandler(applyPanelAccessToAll));

export default router;