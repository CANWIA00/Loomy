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

router.post("/register", validateBody(registerSchema, "Tüm alanlar zorunludur."), register);
router.post("/login", validateBody(loginSchema, "E-posta ve şifre zorunludur."), login);
router.post("/logout", logout);
router.post("/verify-email", validateBody(verifyEmailSchema, "E-posta ve dogrulama kodu zorunludur."), verifyEmail);
router.post("/resend-verification", validateBody(emailOnlySchema, "E-posta adresi zorunludur."), resendVerification);
router.post("/forgot-password", validateBody(emailOnlySchema, "E-posta adresi zorunludur."), forgotPassword);
router.post("/reset-password", validateBody(resetPasswordSchema, "E-posta, kod ve yeni sifre zorunludur."), resetPassword);
router.delete("/account", authenticate, deleteAccount);
router.get("/validate", authenticate, validate);

export default router;
