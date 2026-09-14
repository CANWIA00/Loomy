import { Router } from "express";
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "../controllers/appointmentController";
import { authenticate, isAdmin, requirePanelAccess } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, requirePanelAccess("schedule", "view"), getAppointments);
router.post("/", authenticate, isAdmin, createAppointment);
router.put("/:id", authenticate, isAdmin, updateAppointment);
router.delete("/:id", authenticate, isAdmin, deleteAppointment);

export default router;