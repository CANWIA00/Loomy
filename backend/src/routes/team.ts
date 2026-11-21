import { asyncHandler } from "../middleware/errorHandler";
import { Router } from "express";
import {
  getCompanyUsers,
  getTeams,
  createTeam,
  deleteTeam,
  updateTeam,
  addTeamMember,
  removeTeamMembers,
} from "../controllers/teamController";
import { authenticate, isAdmin, requirePanelAccess } from "../middleware/auth";

const router = Router();

router.get("/company-users", authenticate, requirePanelAccess("schedule", "view"), asyncHandler(getCompanyUsers));
router.get("/", authenticate, requirePanelAccess("schedule", "view"), asyncHandler(getTeams));
router.post("/", authenticate, isAdmin, asyncHandler(createTeam));
router.patch("/:id", authenticate, isAdmin, asyncHandler(updateTeam));
router.post("/:id/members", authenticate, isAdmin, asyncHandler(addTeamMember));
router.delete("/:id/members", authenticate, isAdmin, asyncHandler(removeTeamMembers));
router.delete("/:id", authenticate, isAdmin, asyncHandler(deleteTeam));

export default router;