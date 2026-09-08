import request from "supertest";
import app from "../app";
import prisma from "../prisma";
import { verifyToken, generateToken } from "../services/jwt";

jest.mock("../services/jwt");
(generateToken as jest.Mock).mockReturnValue("test-token-value");

jest.mock("../prisma", () => {
  const model = () => ({
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn(),
  });
  return {
    __esModule: true,
    default: {
      user: model(),
      company: model(),
      adminKey: model(),
      customer: model(),
      serviceRecord: model(),
      serviceFormTemplate: model(),
      quoteRecord: model(),
      team: model(),
      appointment: model(),
      $transaction: jest.fn(),
    },
  };
});

describe("auth API routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/register", () => {
    it("returns 400 when required fields missing", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: "Test" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Tüm alanlar zorunludur.");
    });

    it("returns 400 when invite code format is invalid", async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "test@example.com",
        phone: "5551234567",
        password: "password123",
        inviteCode: "BADCODE",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Geçersiz davet kodu formatı");
    });

    it("returns 400 when email already exists", async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: "existing-id",
        email: "test@example.com",
        phone: "5551234567",
      });

      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "test@example.com",
        phone: "5551234567",
        password: "password123",
        inviteCode: "INVITE-ABC",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("zaten kullanılıyor");
    });

    it("creates a USER with INVITE- code", async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.company.findUnique as jest.Mock).mockResolvedValue({
        id: "c1",
        isFrozen: false,
      });
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: "u1",
        name: "Test User",
      });

      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "test@example.com",
        phone: "5551234567",
        password: "password123",
        inviteCode: "INVITE-ABC",
      });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(
        expect.objectContaining({ requiresVerification: true })
      );
      const createCall = (prisma.user.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.role).toBe("USER");
    });

    it("rejects expired/invalid ADMIN key", async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.adminKey.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).post("/api/auth/register").send({
        name: "Admin User",
        email: "admin@example.com",
        phone: "5551234900",
        password: "password123",
        inviteCode: "ADMIN-KEY",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Geçersiz admin davet kodu");
    });
  });

  describe("POST /api/auth/login", () => {
    it("returns 400 when missing fields", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com" });

      expect(res.status).toBe(400);
    });

    it("returns 401 for unknown user", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).post("/api/auth/login").send({
        email: "nobody@example.com",
        password: "secret",
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("E-posta veya şifre hatalı");
    });

    it("returns 403 for inactive user", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "u1",
        password: "hash",
        role: "USER",
        isActive: false,
        emailVerified: true,
        companyId: "c1",
        company: { isFrozen: false },
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "secret",
      });

      expect(res.status).toBe(403);
    });

    it("returns 403 for frozen company", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "u1",
        password: "hash",
        role: "USER",
        isActive: true,
        emailVerified: true,
        companyId: "c1",
        company: { isFrozen: true },
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "secret",
      });

      expect(res.status).toBe(403);
      expect(res.body.frozen).toBe(true);
    });

    it("returns 403 when email not verified", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "u1",
        password: "hash",
        role: "USER",
        isActive: true,
        emailVerified: false,
        enableVerification: true,
        companyId: "c1",
        company: { isFrozen: false },
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "secret",
      });

      expect(res.status).toBe(403);
      expect(res.body.requiresVerification).toBe(true);
    });

    it("returns 401 for wrong password", async () => {
      const bcrypt = jest.requireActual("bcryptjs");
      const hashed = await bcrypt.hash("correct-password", 4);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "u1",
        password: hashed,
        role: "USER",
        isActive: true,
        emailVerified: true,
        phone: "5551112222",
        email: "test@example.com",
        companyId: "c1",
        company: { isFrozen: false, profileCompleted: true },
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "wrong-password",
      });

      expect(res.status).toBe(401);
    });

    it("returns token on successful login", async () => {
      (verifyToken as jest.Mock).mockReturnValue({ id: "u1" });
      const bcrypt = jest.requireActual("bcryptjs");
      const hashed = await bcrypt.hash("correct-password", 4);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "u1",
        email: "test@example.com",
        password: hashed,
        role: "ADMIN",
        isActive: true,
        emailVerified: true,
        phone: "5551112222",
        companyId: "c1",
        company: { isFrozen: false, profileCompleted: true },
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "correct-password",
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body.role).toBe("ADMIN");
      expect(res.body.profileCompleted).toBe(true);
    });
  });

  describe("GET /api/health", () => {
    it("returns ok status", async () => {
      const res = await request(app).get("/api/health");

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
    });
  });
});
