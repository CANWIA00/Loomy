import {
  getCompanyUsers,
  getTeams,
  createTeam,
  deleteTeam,
  updateTeam,
  addTeamMember,
  removeTeamMembers,
} from "../controllers/teamController";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";
import { Response } from "express";

jest.mock("../prisma", () => ({
  __esModule: true,
  default: {
    user: {
      findMany: jest.fn(),
    },
    team: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

function mockRes() {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides: Partial<AuthRequest> = {}): AuthRequest {
  return {
    body: {},
    params: {},
    query: {},
    user: { id: "u1", email: "a@b.com", role: "ADMIN", companyId: "c1" },
    ...overrides,
  } as AuthRequest;
}

describe("team controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCompanyUsers", () => {
    it("returns active company users", async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: "u1", name: "A", email: "a@b.com", role: "USER" },
      ]);

      const res = mockRes();
      await getCompanyUsers(mockReq(), res);

      const call = (prisma.user.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where).toEqual({ companyId: "c1", isActive: true });
      expect(res.json).toHaveBeenCalledWith([{ id: "u1", name: "A", email: "a@b.com", role: "USER" }]);
    });
  });

  describe("getTeams", () => {
    it("parses members JSON in response", async () => {
      (prisma.team.findMany as jest.Mock).mockResolvedValue([
        { id: 1, name: "Ekip", leader: "L", color: "#fff", members: '["u1","u2"]' },
      ]);

      const res = mockRes();
      await getTeams(mockReq(), res);

      expect(res.json).toHaveBeenCalledWith([
        { id: 1, name: "Ekip", leader: "L", color: "#fff", members: ["u1", "u2"] },
      ]);
    });
  });

  describe("createTeam", () => {
    it("returns 400 when name missing", async () => {
      const res = mockRes();
      await createTeam(mockReq({ body: {} }), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Ekip adı zorunludur." });
    });

    it("returns 400 when leader missing", async () => {
      const res = mockRes();
      await createTeam(mockReq({ body: { name: "Ekip" } }), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Ekip lideri zorunludur." });
    });

    it("creates team with stringified members and default color", async () => {
      (prisma.team.create as jest.Mock).mockResolvedValue({
        id: 1,
        name: "Ekip",
        leader: "L",
        color: "#3B82F6",
        members: '["u1"]',
      });

      const res = mockRes();
      const req = mockReq({ body: { name: "  Ekip  ", leader: "L", members: ["u1"] } });

      await createTeam(req, res);

      const data = (prisma.team.create as jest.Mock).mock.calls[0][0].data;
      expect(data.name).toBe("Ekip");
      expect(data.color).toBe("#3B82F6");
      expect(data.members).toBe('["u1"]');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ members: ["u1"] })
      );
    });
  });

  describe("deleteTeam", () => {
    it("returns 404 when not found", async () => {
      (prisma.team.findFirst as jest.Mock).mockResolvedValue(null);

      const res = mockRes();
      await deleteTeam(mockReq({ params: { id: "99" } }), res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Ekip bulunamadı." });
    });

    it("deletes on success", async () => {
      (prisma.team.findFirst as jest.Mock).mockResolvedValue({ id: 1 });

      const res = mockRes();
      await deleteTeam(mockReq({ params: { id: "1" } }), res);

      expect(prisma.team.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(res.json).toHaveBeenCalledWith({ message: "Ekip silindi." });
    });
  });

  describe("updateTeam", () => {
    it("returns 404 when not found", async () => {
      (prisma.team.findFirst as jest.Mock).mockResolvedValue(null);

      const res = mockRes();
      await updateTeam(mockReq({ params: { id: "99" }, body: { name: "X" } }), res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("renames team and returns updated team", async () => {
      (prisma.team.findFirst as jest.Mock).mockResolvedValue({
        id: 1, name: "Ekip", leader: "L", color: "#fff", members: '["u1"]',
      });
      (prisma.team.update as jest.Mock).mockResolvedValue({
        id: 1, name: "Yeni Ekip", leader: "L", color: "#fff", members: '["u1"]',
      });

      const res = mockRes();
      await updateTeam(mockReq({ params: { id: "1" }, body: { name: "  Yeni Ekip  " } }), res);

      const data = (prisma.team.update as jest.Mock).mock.calls[0][0].data;
      expect(data.name).toBe("Yeni Ekip");
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Yeni Ekip", members: ["u1"] })
      );
    });

    it("moves new leader out of members and keeps old leader as member", async () => {
      (prisma.team.findFirst as jest.Mock).mockResolvedValue({
        id: 1, name: "Ekip", leader: "EskiL", color: "#fff", members: '["u1","YeniL"]',
      });
      (prisma.team.update as jest.Mock).mockResolvedValue({
        id: 1, name: "Ekip", leader: "YeniL", color: "#fff", members: '["u1","EskiL"]',
      });

      const res = mockRes();
      await updateTeam(mockReq({ params: { id: "1" }, body: { leader: "YeniL" } }), res);

      const data = (prisma.team.update as jest.Mock).mock.calls[0][0].data;
      expect(data.leader).toBe("YeniL");
      expect(JSON.parse(data.members)).toEqual(["u1", "EskiL"]);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ leader: "YeniL", members: ["u1", "EskiL"] })
      );
    });
  });

  describe("addTeamMember", () => {
    it("returns 404 when team not found", async () => {
      (prisma.team.findFirst as jest.Mock).mockResolvedValue(null);

      const res = mockRes();
      await addTeamMember(mockReq({ params: { id: "99" }, body: { name: "u" } }), res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("rejects adding the leader", async () => {
      (prisma.team.findFirst as jest.Mock).mockResolvedValue({
        id: 1, name: "Ekip", leader: "L", color: "#fff", members: "[]",
      });

      const res = mockRes();
      await addTeamMember(mockReq({ params: { id: "1" }, body: { name: "L" } }), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Bu kişi ekip lideridir." });
    });

    it("appends member to list", async () => {
      (prisma.team.findFirst as jest.Mock).mockResolvedValue({
        id: 1, name: "Ekip", leader: "L", color: "#fff", members: '["u1"]',
      });
      (prisma.team.update as jest.Mock).mockResolvedValue({
        id: 1, name: "Ekip", leader: "L", color: "#fff", members: '["u1","u2"]',
      });

      const res = mockRes();
      await addTeamMember(mockReq({ params: { id: "1" }, body: { name: " u2 " } }), res);

      const data = (prisma.team.update as jest.Mock).mock.calls[0][0].data;
      expect(JSON.parse(data.members)).toEqual(["u1", "u2"]);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ members: ["u1", "u2"] }));
    });
  });

  describe("removeTeamMembers", () => {
    it("returns 400 when list empty", async () => {
      (prisma.team.findFirst as jest.Mock).mockResolvedValue({
        id: 1, name: "Ekip", leader: "L", color: "#fff", members: '["u1"]',
      });

      const res = mockRes();
      await removeTeamMembers(mockReq({ params: { id: "1" }, body: { members: [] } }), res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("rejects removing the leader", async () => {
      (prisma.team.findFirst as jest.Mock).mockResolvedValue({
        id: 1, name: "Ekip", leader: "L", color: "#fff", members: '["u1"]',
      });

      const res = mockRes();
      await removeTeamMembers(mockReq({ params: { id: "1" }, body: { members: ["L"] } }), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Ekip lideri çıkarılamaz." });
    });

    it("filters removed members", async () => {
      (prisma.team.findFirst as jest.Mock).mockResolvedValue({
        id: 1, name: "Ekip", leader: "L", color: "#fff", members: '["u1","u2","u3"]',
      });
      (prisma.team.update as jest.Mock).mockResolvedValue({
        id: 1, name: "Ekip", leader: "L", color: "#fff", members: '["u1"]',
      });

      const res = mockRes();
      await removeTeamMembers(mockReq({ params: { id: "1" }, body: { members: ["u2", "u3"] } }), res);

      const data = (prisma.team.update as jest.Mock).mock.calls[0][0].data;
      expect(JSON.parse(data.members)).toEqual(["u1"]);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ members: ["u1"] }));
    });
  });
});
