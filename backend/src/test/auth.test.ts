import { authenticate, isAdmin, AuthRequest } from "../middleware/auth";
import { verifyToken } from "../services/jwt";
import prisma from "../prisma";
import { Response, NextFunction } from "express";

jest.mock("../services/jwt");
jest.mock("../prisma", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

function mockRes() {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides: Partial<AuthRequest> = {}): AuthRequest {
  return {
    headers: {},
    user: undefined,
    ...overrides,
  } as AuthRequest;
}

describe("auth middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("authenticate", () => {
    it("returns 401 when no Authorization header", async () => {
      const req = mockReq();
      const res = mockRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Yetkilendirme hatası. Token bulunamadı.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("returns 401 when header is not Bearer", async () => {
      const req = mockReq({ headers: { authorization: "Basic abc" } });
      const res = mockRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("returns 401 when token is invalid", async () => {
      (verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error("invalid");
      });
      const req = mockReq({ headers: { authorization: "Bearer bad-token" } });
      const res = mockRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Geçersiz veya süresi dolmuş token.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("returns 401 when user not found", async () => {
      (verifyToken as jest.Mock).mockReturnValue({ id: "nope" });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const req = mockReq({ headers: { authorization: "Bearer token" } });
      const res = mockRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Kullanıcı bulunamadı." });
      expect(next).not.toHaveBeenCalled();
    });

    it("returns 403 when user is inactive", async () => {
      (verifyToken as jest.Mock).mockReturnValue({ id: "u1" });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "u1",
        isActive: false,
        companyId: null,
        company: null,
      });

      const req = mockReq({ headers: { authorization: "Bearer token" } });
      const res = mockRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Hesabınız devre dışı bırakılmıştır.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("returns 403 when company is frozen", async () => {
      (verifyToken as jest.Mock).mockReturnValue({ id: "u1" });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "u1",
        isActive: true,
        companyId: "c1",
        company: { isFrozen: true },
      });

      const req = mockReq({ headers: { authorization: "Bearer token" } });
      const res = mockRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ frozen: true })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("sets req.user and calls next on success", async () => {
      (verifyToken as jest.Mock).mockReturnValue({ id: "u1" });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "u1",
        email: "a@b.com",
        role: "USER",
        isActive: true,
        companyId: "c1",
        company: { isFrozen: false },
      });

      const req = mockReq({ headers: { authorization: "Bearer token" } });
      const res = mockRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(req.user).toEqual({
        id: "u1",
        email: "a@b.com",
        role: "USER",
        companyId: "c1",
      });
      expect(next).toHaveBeenCalled();
    });
  });

  describe("isAdmin", () => {
    it("returns 403 when user is not admin", () => {
      const req = mockReq({ user: { id: "u1", email: "a", role: "USER" } });
      const res = mockRes();
      const next = jest.fn();

      isAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it("calls next when user is admin", () => {
      const req = mockReq({ user: { id: "u1", email: "a", role: "ADMIN" } });
      const res = mockRes();
      const next = jest.fn();

      isAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
