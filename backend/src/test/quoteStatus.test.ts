import request from "supertest";
import app from "../app";
import prisma from "../prisma";
import { verifyToken } from "../services/jwt";

jest.mock("../services/jwt");
jest.mock("../prisma", () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
    quoteRecord: { updateMany: jest.fn(), findFirst: jest.fn() },
  },
}));

function loginAs(role: "ADMIN" | "USER", panelAccess: string | null = null) {
  (verifyToken as jest.Mock).mockReturnValue({ id: "u1" });
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({
    id: "u1",
    email: "a@b.com",
    role,
    isActive: true,
    companyId: "c1",
    panelAccess,
    company: { isFrozen: false },
  });
}

beforeEach(() => jest.clearAllMocks());

describe("PATCH /api/quotes/:id/status", () => {
  it("durumu kullanicinin sirketindeki teklif icin gunceller", async () => {
    loginAs("ADMIN");
    (prisma.quoteRecord.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.quoteRecord.findFirst as jest.Mock).mockResolvedValue({ id: 7, status: "ACCEPTED" });

    const res = await request(app).patch("/api/quotes/7/status").set("Authorization", "Bearer t").send({ status: "ACCEPTED" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ACCEPTED");
    const args = (prisma.quoteRecord.updateMany as jest.Mock).mock.calls[0][0];
    expect(args.where).toEqual({ id: 7, companyId: "c1" });
    expect(args.data.status).toBe("ACCEPTED");
    expect(args.data.statusUpdatedAt).toBeInstanceOf(Date);
  });

  it("gecersiz durum degerini reddeder", async () => {
    loginAs("ADMIN");
    const res = await request(app).patch("/api/quotes/7/status").set("Authorization", "Bearer t").send({ status: "DONE" });
    expect(res.status).toBe(400);
    expect(prisma.quoteRecord.updateMany).not.toHaveBeenCalled();
  });

  it("durum alani yoksa 400 doner", async () => {
    loginAs("ADMIN");
    const res = await request(app).patch("/api/quotes/7/status").set("Authorization", "Bearer t").send({});
    expect(res.status).toBe(400);
  });

  it("baska sirketin teklifi icin 404 doner", async () => {
    loginAs("ADMIN");
    (prisma.quoteRecord.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
    const res = await request(app).patch("/api/quotes/99/status").set("Authorization", "Bearer t").send({ status: "REJECTED" });
    expect(res.status).toBe(404);
  });

  it("teklif paneline yalnizca goruntuleme yetkisi olan kullanici degistiremez", async () => {
    loginAs("USER", JSON.stringify({ quotes: "view" }));
    const res = await request(app).patch("/api/quotes/7/status").set("Authorization", "Bearer t").send({ status: "ACCEPTED" });
    expect(res.status).toBe(403);
    expect(prisma.quoteRecord.updateMany).not.toHaveBeenCalled();
  });
});
