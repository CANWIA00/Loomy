import {
  generateVerificationCode,
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../services/email";

describe("email service", () => {
  describe("generateVerificationCode", () => {
    it("returns a 6-digit string", () => {
      for (let i = 0; i < 50; i++) {
        const code = generateVerificationCode();
        expect(code).toMatch(/^\d{6}$/);
        expect(Number(code)).toBeGreaterThanOrEqual(100000);
        expect(Number(code)).toBeLessThanOrEqual(999999);
      }
    });
  });

  describe("sendVerificationEmail", () => {
    it("throws when no email provider configured", async () => {
      const originalKey = process.env.SENDGRID_API_KEY;
      const originalHost = process.env.SMTP_HOST;
      const originalUser = process.env.SMTP_USER;
      const originalPass = process.env.SMTP_PASS;

      delete process.env.SENDGRID_API_KEY;
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      // reset module-level config
      jest.resetModules();
      const { sendVerificationEmail: fn } = require("../services/email");

      await expect(fn("a@b.com", "123456", "Test")).rejects.toThrow(
        /SENDGRID_API_KEY veya SMTP/
      );

      process.env.SENDGRID_API_KEY = originalKey;
      process.env.SMTP_HOST = originalHost;
      process.env.SMTP_USER = originalUser;
      process.env.SMTP_PASS = originalPass;
    });

    it("sends via SMTP when configured", async () => {
      jest.resetModules();
      process.env.SMTP_HOST = "smtp.test.com";
      process.env.SMTP_USER = "user";
      process.env.SMTP_PASS = "pass";
      process.env.SMTP_PORT = "587";
      delete process.env.SENDGRID_API_KEY;

      const nodemailer = require("nodemailer");
      const sendMail = jest.fn().mockResolvedValue({ messageId: "1" });
      nodemailer.createTransport = jest.fn().mockReturnValue({ sendMail });

      const { sendVerificationEmail: fn } = require("../services/email");
      await fn("a@b.com", "123456", "Test");

      expect(nodemailer.createTransport).toHaveBeenCalled();
      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "a@b.com",
          subject: "Loomy - E-posta Dogrulama Kodu",
        })
      );
    });
  });
});
