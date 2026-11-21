import { asyncHandler } from "../middleware/errorHandler";
import { Router } from "express";
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "../controllers/appointmentController";
import { authenticate, isAdmin, requirePanelAccess } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, requirePanelAccess("schedule", "view"), asyncHandler(getAppointments));
router.post("/", authenticate, isAdmin, asyncHandler(createAppointment));
router.put("/:id", authenticate, isAdmin, asyncHandler(updateAppointment));
router.delete("/:id", authenticate, isAdmin, asyncHandler(deleteAppointment));

export default router;