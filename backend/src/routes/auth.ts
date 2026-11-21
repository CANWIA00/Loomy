import { asyncHandler } from "../middleware/errorHandler";
import { Router } from "express";
import { register, login, logout, validate, verifyEmail, resendVerification, deleteAccount, forgotPassword, resetPassword } from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  emailOnlySchema,
  resetPasswordSchema,
} from "../schemas/auth";

const router = Router();

router.post("/register", validateBody(registerSchema, "Tüm alanlar zorunludur."), asyncHandler(register));
router.post("/login", validateBody(loginSchema, "E-posta ve şifre zorunludur."), asyncHandler(login));
router.post("/logout", asyncHandler(logout));
router.post("/verify-email", validateBody(verifyEmailSchema, "E-posta ve dogrulama kodu zorunludur."), asyncHandler(verifyEmail));
router.post("/resend-verification", validateBody(emailOnlySchema, "E-posta adresi zorunludur."), asyncHandler(resendVerification));
router.post("/forgot-password", validateBody(emailOnlySchema, "E-posta adresi zorunludur."), asyncHandler(forgotPassword));
router.post("/reset-password", validateBody(resetPasswordSchema, "E-posta, kod ve yeni sifre zorunludur."), asyncHandler(resetPassword));
router.delete("/account", authenticate, asyncHandler(deleteAccount));
router.get("/validate", authenticate, asyncHandler(validate));

export default router;
