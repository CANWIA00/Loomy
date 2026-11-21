import request from "supertest";
import app from "../app";
import prisma from "../prisma";
import { verifyToken } from "../services/jwt";
import { parsePagination, MAX_PAGE_SIZE } from "../utils/pagination";

jest.mock("../services/jwt");
jest.mock("../services/email", () => ({
  ...jest.requireActual("../services/email"),
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../prisma", () => {
  const model = () => ({
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  });
  return {
    __esModule: true,
    default: { user: model(), serviceRecord: model(), adminKey: model(), company: model() },
  };
});

const validRegister = {
  name: "Test User",
  email: "test@example.com",
  phone: "5551234567",
  password: "password123",
  inviteCode: "INVITE-ABC",
  privacyAccepted: true,
};

function loginAsAdmin() {
  (verifyToken as jest.Mock).mockReturnValue({ id: "u1" });
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({
    id: "u1",
    email: "a@b.com",
    role: "ADMIN",
    isActive: true,
    companyId: "c1",
    panelAccess: null,
    company: { isFrozen: false },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("request validation", () => {
  it("rejects malformed JSON with 400 instead of 500", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email": ');
    expect(res.status).toBe(400);
  });

  it("rejects a non-string code with 400 instead of crashing", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ email: "a@b.com", code: { $ne: null }, newPassword: "secret12" });
    expect(res.status).toBe(400);
  });

  it("enforces minimum password length on register", async () => {
    const res = await request(app).post("/api/auth/register").send({ ...validRegister, password: "123" });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("en az 6");
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it("rejects an invalid email format on register", async () => {
    const res = await request(app).post("/api/auth/register").send({ ...validRegister, email: "not-an-email" });
    expect(res.status).toBe(400);
  });

  it("keeps the legacy message for missing fields", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "a@b.com" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("E-posta ve şifre zorunludur.");
  });
});

describe("error handling", () => {
  it("returns JSON 404 for unknown API routes", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.message).toBeDefined();
  });

  it("turns unexpected errors into a generic 500 without leaking details", async () => {
    loginAsAdmin();
    (prisma.serviceRecord.findMany as jest.Mock).mockRejectedValue(new Error("db password=hunter2"));
    (prisma.serviceRecord.count as jest.Mock).mockResolvedValue(0);
    const res = await request(app).get("/api/services").set("Authorization", "Bearer t");
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain("hunter2");
  });

  it("caps the page size for list endpoints", async () => {
    loginAsAdmin();
    (prisma.serviceRecord.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.serviceRecord.count as jest.Mock).mockResolvedValue(0);
    const res = await request(app).get("/api/services?size=1000000&page=-3").set("Authorization", "Bearer t");
    expect(res.status).toBe(200);
    const args = (prisma.serviceRecord.findMany as jest.Mock).mock.calls[0][0];
    expect(args.take).toBe(MAX_PAGE_SIZE);
    expect(args.skip).toBe(0);
  });
});

describe("customer filter on list endpoints", () => {
  it("filters service records by customerId or name within the company", async () => {
    loginAsAdmin();
    (prisma.serviceRecord.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.serviceRecord.count as jest.Mock).mockResolvedValue(0);
    const res = await request(app)
      .get("/api/services?customerId=cust-1&customerName=Acme")
      .set("Authorization", "Bearer t");
    expect(res.status).toBe(200);
    const { where } = (prisma.serviceRecord.findMany as jest.Mock).mock.calls[0][0];
    expect(where.companyId).toBe("c1");
    expect(where.OR).toEqual([
      { customerId: "cust-1" },
      { customerName: { contains: "Acme", mode: "insensitive" } },
    ]);
    expect((prisma.serviceRecord.count as jest.Mock).mock.calls[0][0].where).toEqual(where);
  });

  it("does not filter when no customer params are given", async () => {
    loginAsAdmin();
    (prisma.serviceRecord.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.serviceRecord.count as jest.Mock).mockResolvedValue(0);
    await request(app).get("/api/services").set("Authorization", "Bearer t");
    const { where } = (prisma.serviceRecord.findMany as jest.Mock).mock.calls[0][0];
    expect(where).toEqual({ companyId: "c1" });
  });
});

describe("parsePagination", () => {
  it("falls back to defaults for invalid input", () => {
    expect(parsePagination({ page: "abc", size: "0" }, 20)).toEqual({ page: 0, size: 20 });
    expect(parsePagination({ page: "2", size: "50" }, 20)).toEqual({ page: 2, size: 50 });
  });
});

describe("body size limits", () => {
  it("rejects large bodies on public auth endpoints with 413", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@b.com", password: "x".repeat(200 * 1024) });
    expect(res.status).toBe(413);
  });
});
