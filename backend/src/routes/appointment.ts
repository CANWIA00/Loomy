import { Router } from "express";
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "../controllers/appointmentController";
import { authenticate, isAdmin } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, getAppointments);
router.get("/:id", authenticate, getAppointmentById);
router.post("/", authenticate, isAdmin, createAppointment);
router.put("/:id", authenticate, isAdmin, updateAppointment);
router.delete("/:id", authenticate, isAdmin, deleteAppointment);

export default router;
