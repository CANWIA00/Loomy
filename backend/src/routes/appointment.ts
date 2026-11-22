import { asyncHandler } from "../middleware/errorHandler";
import { Router } from "express";
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointment,
  cancelAppointment,
  unassignAppointment,
} from "../controllers/appointmentController";
import { authenticate, isAdmin, requirePanelAccess } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, requirePanelAccess("schedule", "view"), asyncHandler(getAppointments));
router.post("/", authenticate, isAdmin, asyncHandler(createAppointment));
router.get("/:id", authenticate, requirePanelAccess("schedule", "view"), asyncHandler(getAppointment));
router.patch("/:id/cancel", authenticate, isAdmin, asyncHandler(cancelAppointment));
router.patch("/:id/unassign", authenticate, isAdmin, asyncHandler(unassignAppointment));
router.put("/:id", authenticate, isAdmin, asyncHandler(updateAppointment));
router.delete("/:id", authenticate, isAdmin, asyncHandler(deleteAppointment));

export default router;