import { Router } from "express";
import { register, login, logout, validate } from "../controllers/authController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/validate", authenticate, validate);

export default router;
