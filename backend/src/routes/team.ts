import { Router } from "express";
import {
  getCompanyUsers,
  getTeams,
  createTeam,
  deleteTeam,
} from "../controllers/teamController";
import { authenticate, isAdmin } from "../middleware/auth";

const router = Router();

router.get("/company-users", authenticate, getCompanyUsers);
router.get("/", authenticate, getTeams);
router.post("/", authenticate, isAdmin, createTeam);
router.delete("/:id", authenticate, isAdmin, deleteTeam);

export default router;
