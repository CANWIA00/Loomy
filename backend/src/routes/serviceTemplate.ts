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

router.get("/", authenticate, requirePanelAccess("services"), listServiceTemplates);
router.post("/", authenticate, isAdmin, createServiceTemplate);
router.post("/:id/set-default", authenticate, isAdmin, setDefaultServiceTemplate);
router.put("/:id", authenticate, isAdmin, updateServiceTemplate);
router.delete("/:id", authenticate, isAdmin, deleteServiceTemplate);

export default router;
