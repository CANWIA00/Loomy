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

router.post("/count-by-template", authenticate, requirePanelAccess("services", "view"), countServiceRecordsByTemplate);
router.put("/apply-template-config", authenticate, isAdmin, applyTemplateConfigToRecords);
router.get("/", authenticate, requirePanelAccess("services", "view"), getServiceRecords);
router.post("/", authenticate, requirePanelAccess("services", "manage"), createServiceRecord);
router.put("/:id", authenticate, requirePanelAccess("services", "manage"), updateServiceRecord);
router.delete("/:id", authenticate, isAdmin, deleteServiceRecord);

export default router;