import request from "supertest";
import app from "../app";
import prisma from "../prisma";
import { verifyToken } from "../services/jwt";

jest.mock("../services/jwt");
jest.mock("../prisma", () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
    customUnit: { findMany: jest.fn(), upsert: jest.fn(), deleteMany: jest.fn() },
  },
}));

function loginAs(role: "ADMIN" | "USER") {
  (verifyToken as jest.Mock).mockReturnValue({ id: "u1" });
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({
    id: "u1",
    email: "a@b.com",
    role,
    isActive: true,
    companyId: "c1",
    panelAccess: null,
    company: { isFrozen: false },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/units", () => {
  it("yalnizca kullanicinin sirketine ait birimleri listeler", async () => {
    loginAs("USER");
    (prisma.customUnit.findMany as jest.Mock).mockResolvedValue([{ id: 1, name: "Bidon" }]);
    const res = await request(app).get("/api/units").set("Authorization", "Bearer t");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1, name: "Bidon" }]);
    expect((prisma.customUnit.findMany as jest.Mock).mock.calls[0][0].where).toEqual({ companyId: "c1" });
  });

  it("token olmadan 401 doner", async () => {
    const res = await request(app).get("/api/units");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/units", () => {
  it("normal kullanici birim ekleyebilir; bosluklar temizlenir", async () => {
    loginAs("USER");
    (prisma.customUnit.upsert as jest.Mock).mockResolvedValue({ id: 2, name: "Bidon" });
    const res = await request(app).post("/api/units").set("Authorization", "Bearer t").send({ name: "  Bidon  " });
    expect(res.status).toBe(201);
    const args = (prisma.customUnit.upsert as jest.Mock).mock.calls[0][0];
    expect(args.where).toEqual({ companyId_name: { companyId: "c1", name: "Bidon" } });
    expect(args.create).toEqual({ companyId: "c1", name: "Bidon" });
  });

  it("bos ve cok uzun isimleri reddeder", async () => {
    loginAs("USER");
    const empty = await request(app).post("/api/units").set("Authorization", "Bearer t").send({ name: "   " });
    expect(empty.status).toBe(400);
    const long = await request(app).post("/api/units").set("Authorization", "Bearer t").send({ name: "x".repeat(21) });
    expect(long.status).toBe(400);
    const wrongType = await request(app).post("/api/units").set("Authorization", "Bearer t").send({ name: 5 });
    expect(wrongType.status).toBe(400);
    expect(prisma.customUnit.upsert).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/units/:id", () => {
  it("yalnizca admin silebilir", async () => {
    loginAs("USER");
    const res = await request(app).delete("/api/units/3").set("Authorization", "Bearer t");
    expect(res.status).toBe(403);
    expect(prisma.customUnit.deleteMany).not.toHaveBeenCalled();
  });

  it("admin kendi sirketinin birimini siler", async () => {
    loginAs("ADMIN");
    (prisma.customUnit.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
    const res = await request(app).delete("/api/units/3").set("Authorization", "Bearer t");
    expect(res.status).toBe(204);
    expect((prisma.customUnit.deleteMany as jest.Mock).mock.calls[0][0].where).toEqual({ id: 3, companyId: "c1" });
  });

  it("baska sirketin birimi silinemez (404)", async () => {
    loginAs("ADMIN");
    (prisma.customUnit.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
    const res = await request(app).delete("/api/units/99").set("Authorization", "Bearer t");
    expect(res.status).toBe(404);
  });
});
