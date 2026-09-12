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
import { authenticate, isAdmin } from "../middleware/auth";

const router = Router();

router.get("/company-users", authenticate, getCompanyUsers);
router.get("/", authenticate, getTeams);
router.post("/", authenticate, isAdmin, createTeam);
router.patch("/:id", authenticate, isAdmin, updateTeam);
router.post("/:id/members", authenticate, isAdmin, addTeamMember);
router.delete("/:id/members", authenticate, isAdmin, removeTeamMembers);
router.delete("/:id", authenticate, isAdmin, deleteTeam);

export default router;
