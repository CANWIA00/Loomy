import { z } from "zod";

const REQUIRED = "Tüm alanlar zorunludur.";

// Bos string de "eksik" sayilir; mevcut controller davranisiyla ayni mesaj.
const requiredString = (max: number, message = REQUIRED) =>
  z.string({ invalid_type_error: message }).trim().min(1, message).max(max, "Alan çok uzun.");

const email = z
  .string({ invalid_type_error: "Geçerli bir e-posta adresi girin." })
  .trim()
  .min(1, REQUIRED)
  .max(254, "E-posta adresi çok uzun.")
  .email("Geçerli bir e-posta adresi girin.");

// bcrypt 72 bayttan sonrasini yok sayar; daha uzun sifreleri kabul etmek yaniltici olur.
const newPassword = z
  .string({ invalid_type_error: "Şifre en az 6 karakter olmalıdır." })
  .min(6, "Şifre en az 6 karakter olmalıdır.")
  .max(72, "Şifre en fazla 72 karakter olabilir.");

const code = z
  .union([z.string(), z.number()])
  .transform((v) => String(v).trim())
  .pipe(z.string().min(1, REQUIRED).max(10, "Geçersiz kod."));

export const registerSchema = z.object({
  name: requiredString(100),
  email,
  phone: requiredString(30),
  password: newPassword,
  inviteCode: requiredString(64),
  // KVKK onayi controller'da ozel mesajla kontrol edilir.
  privacyAccepted: z.unknown().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, "E-posta ve şifre zorunludur.").max(254),
  password: z.string().min(1, "E-posta ve şifre zorunludur.").max(1024),
});

export const verifyEmailSchema = z.object({
  email: z.string().trim().min(1, "E-posta ve dogrulama kodu zorunludur.").max(254),
  code,
});

export const emailOnlySchema = z.object({
  email: z.string().trim().min(1, "E-posta adresi zorunludur.").max(254),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().min(1, "E-posta, kod ve yeni sifre zorunludur.").max(254),
  code,
  newPassword,
});
