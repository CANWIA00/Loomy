import { Router } from "express";
import {
  getCompanyManagement,
  updateUserPanelAccess,
  applyPanelAccessToAll,
} from "../controllers/companyController";
import { authenticate, isAdmin } from "../middleware/auth";

const router = Router();

router.use(authenticate, isAdmin);

router.get("/users", getCompanyManagement);
router.patch("/users/:id/access", updateUserPanelAccess);
router.patch("/access", applyPanelAccessToAll);

export default router;