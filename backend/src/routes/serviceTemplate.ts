import { asyncHandler } from "../middleware/errorHandler";
import { Router } from "express";
import {
  listServiceTemplates,
  createServiceTemplate,
  updateServiceTemplate,
  setDefaultServiceTemplate,
  deleteServiceTemplate,
} from "../controllers/serviceTemplateController";
import { authenticate, isAdmin, requirePanelAccess } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, requirePanelAccess("services", "view"), asyncHandler(listServiceTemplates));
router.post("/", authenticate, isAdmin, asyncHandler(createServiceTemplate));
router.post("/:id/set-default", authenticate, isAdmin, asyncHandler(setDefaultServiceTemplate));
router.put("/:id", authenticate, isAdmin, asyncHandler(updateServiceTemplate));
router.delete("/:id", authenticate, isAdmin, asyncHandler(deleteServiceTemplate));

export default router;