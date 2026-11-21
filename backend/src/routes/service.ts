import { Router } from "express";
import {
  getServiceRecords,
  createServiceRecord,
  updateServiceRecord,
  deleteServiceRecord,
  countServiceRecordsByTemplate,
  applyTemplateConfigToRecords,
} from "../controllers/serviceController";
import { authenticate, isAdmin, requirePanelAccess } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

router.post("/count-by-template", authenticate, requirePanelAccess("services", "view"), asyncHandler(countServiceRecordsByTemplate));
router.put("/apply-template-config", authenticate, isAdmin, asyncHandler(applyTemplateConfigToRecords));
router.get("/", authenticate, requirePanelAccess("services", "view"), asyncHandler(getServiceRecords));
router.post("/", authenticate, requirePanelAccess("services", "manage"), asyncHandler(createServiceRecord));
router.put("/:id", authenticate, requirePanelAccess("services", "manage"), asyncHandler(updateServiceRecord));
router.delete("/:id", authenticate, isAdmin, asyncHandler(deleteServiceRecord));

export default router;