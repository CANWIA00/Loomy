import { Router } from "express";
import {
  getServiceRecords,
  createServiceRecord,
  updateServiceRecord,
  deleteServiceRecord,
  countServiceRecordsByTemplate,
  applyTemplateConfigToRecords,
} from "../controllers/serviceController";
import { authenticate, isAdmin } from "../middleware/auth";

const router = Router();

router.post("/count-by-template", authenticate, countServiceRecordsByTemplate);
router.put("/apply-template-config", authenticate, isAdmin, applyTemplateConfigToRecords);
router.get("/", authenticate, getServiceRecords);
router.post("/", authenticate, createServiceRecord);
router.put("/:id", authenticate, updateServiceRecord);
router.delete("/:id", authenticate, isAdmin, deleteServiceRecord);

export default router;
