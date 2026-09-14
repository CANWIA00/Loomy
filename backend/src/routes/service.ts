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

const router = Router();

router.post("/count-by-template", authenticate, requirePanelAccess("services"), countServiceRecordsByTemplate);
router.put("/apply-template-config", authenticate, isAdmin, applyTemplateConfigToRecords);
router.get("/", authenticate, requirePanelAccess("services"), getServiceRecords);
router.post("/", authenticate, requirePanelAccess("services"), createServiceRecord);
router.put("/:id", authenticate, requirePanelAccess("services"), updateServiceRecord);
router.delete("/:id", authenticate, isAdmin, deleteServiceRecord);

export default router;
