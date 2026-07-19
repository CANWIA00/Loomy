import { Router } from "express";
import { getProfile, updateUser, updateCompany } from "../controllers/profileController";
import { authenticate, isAdmin } from "../middleware/auth";

const router = Router();

router.get("/me", authenticate, getProfile);
router.put("/me", authenticate, updateUser);
router.put("/my-company", authenticate, isAdmin, updateCompany);

export default router;
