import { Router } from "express";
import { register, login, logout, validate, verifyEmail, resendVerification, deleteAccount, forgotPassword, resetPassword } from "../controllers/authController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.delete("/account", authenticate, deleteAccount);
router.get("/validate", authenticate, validate);

export default router;
