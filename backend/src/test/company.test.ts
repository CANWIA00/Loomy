import {
  getCompanyManagement,
  updateUserPanelAccess,
  applyPanelAccessToAll,
} from "../controllers/companyController";
import prisma from "../prisma";
import { Response } from "express";
import { AuthRequest } from "../middleware/auth";

jest.mock("../prisma", () => ({
  __esModule: true,
  default: {
    company: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides: Partial<AuthRequest> = {}): AuthRequest {
  return { body: {}, params: {}, query: {}, headers: {} as any, ...overrides } as AuthRequest;
}

const adminReq = mockReq({
  user: { id: "admin-1", email: "boss@loomy.com", role: "ADMIN", companyId: "company-1" },
});

describe("company controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCompanyManagement", () => {
    it("returns company info and parsed users", async () => {
      (prisma.company.findUnique as jest.Mock).mockResolvedValue({
        id: "company-1",
        name: "Test Co",
        invitationCode: "INVITE-ABC",
        _count: { users: 2 },
      });
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: "u1", name: "Ali", email: "ali@x.com", phone: "0555", role: "ADMIN", isActive: true, panelAccess: null, createdAt: new Date().toISOString() },
        { id: "u2", name: "Veli", email: "veli@x.com", phone: "0556", role: "USER", isActive: true, panelAccess: JSON.stringify(["services", "customers"]), createdAt: new Date().toISOString() },
      ]);

      const res = mockRes();
      await getCompanyManagement(adminReq, res as Response);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { companyId: "company-1" } })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          company: expect.objectContaining({ name: "Test Co", userCount: 2 }),
          users: expect.arrayContaining([
            expect.objectContaining({ id: "u1", panelAccess: [] }),
            expect.objectContaining({ id: "u2", panelAccess: ["services", "customers"] }),
          ]),
        })
      );
    });

    it("returns 404 when company missing", async () => {
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(null);

      const res = mockRes();
      await getCompanyManagement(adminReq, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("updateUserPanelAccess", () => {
    it("updates a USER within the company", async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: "u2", role: "USER" });
      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: "u2",
        panelAccess: JSON.stringify(["services", "stock"]),
      });

      const req = mockReq({
        user: { id: "admin-1", email: "boss@loomy.com", role: "ADMIN", companyId: "company-1" },
        params: { id: "u2" },
        body: { panelAccess: ["services", "stock", "unknown", "services"] },
      });

      const res = mockRes();
      await updateUserPanelAccess(req, res as Response);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "u2" },
        data: { panelAccess: JSON.stringify(["services", "stock"]) },
        select: { id: true, panelAccess: true },
      });
      expect(res.json).toHaveBeenCalledWith({ id: "u2", panelAccess: ["services", "stock"] });
    });

    it("rejects editing an ADMIN", async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: "admin-1", role: "ADMIN" });

      const req = mockReq({
        user: { id: "admin-1", email: "boss@loomy.com", role: "ADMIN", companyId: "company-1" },
        params: { id: "admin-1" },
        body: { panelAccess: [] },
      });

      const res = mockRes();
      await updateUserPanelAccess(req, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("returns 404 when user not in company", async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      const req = mockReq({
        user: { id: "admin-1", email: "boss@loomy.com", role: "ADMIN", companyId: "company-1" },
        params: { id: "u99" },
        body: { panelAccess: ["services"] },
      });

      const res = mockRes();
      await updateUserPanelAccess(req, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("applyPanelAccessToAll", () => {
    it("updates all USERS in the company", async () => {
      (prisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

      const req = mockReq({
        user: { id: "admin-1", email: "boss@loomy.com", role: "ADMIN", companyId: "company-1" },
        body: { panelAccess: ["quotes", "stock", "nonsense"] },
      });

      const res = mockRes();
      await applyPanelAccessToAll(req, res as Response);

      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { companyId: "company-1", role: "USER" },
        data: { panelAccess: JSON.stringify(["quotes", "stock"]) },
      });
      expect(res.json).toHaveBeenCalledWith({ updated: 3, panelAccess: ["quotes", "stock"] });
    });
  });
});