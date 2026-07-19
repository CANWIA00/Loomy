import { Router } from "express";
import {
  getCompanyUsers,
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  addMember,
  removeMembers,
} from "../controllers/teamController";
import { authenticate, isAdmin } from "../middleware/auth";

const router = Router();

router.get("/company-users", authenticate, getCompanyUsers);
router.get("/", authenticate, getTeams);
router.get("/:id", authenticate, getTeamById);
router.post("/", authenticate, isAdmin, createTeam);
router.put("/:id", authenticate, isAdmin, updateTeam);
router.delete("/:id", authenticate, isAdmin, deleteTeam);
router.post("/:id/members", authenticate, isAdmin, addMember);
router.delete("/:id/members", authenticate, isAdmin, removeMembers);

export default router;
