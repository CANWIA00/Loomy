import { getProfile, updateUser, updateCompany } from "../controllers/profileController";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";
import { Response } from "express";

jest.mock("jimp", () => {
  class MockImage {
    bitmap = { width: 100, height: 50, data: new Uint8Array(100 * 50 * 4) };
    resize() {
      return this;
    }
    scan() {
      return this;
    }
    static read() {
      return Promise.resolve(new MockImage());
    }
  }
  return { Jimp: MockImage };
});

jest.mock("imagetracerjs", () => ({
  __esModule: true,
  default: {
    imagedataToSVG: jest.fn(() => "<svg></svg>"),
  },
}));

jest.mock("../prisma", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    company: {
      update: jest.fn(),
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
  return {
    body: {},
    params: {},
    query: {},
    user: { id: "u1", email: "a@b.com", role: "ADMIN", companyId: "c1" },
    ...overrides,
  } as AuthRequest;
}

describe("profile controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getProfile", () => {
    it("returns 404 when user not found", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = mockRes();
      await getProfile(mockReq(), res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Kullanıcı bulunamadı." });
    });

    it("maps _count.users to userCount", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "u1",
        name: "A",
        email: "a@b.com",
        phone: "5",
        role: "ADMIN",
        companyId: "c1",
        signature: null,
        company: {
          id: "c1",
          name: "Co",
          _count: { users: 3 },
        },
      });

      const res = mockRes();
      await getProfile(mockReq(), res);

      const result = res.json.mock.calls[0][0];
      expect(result.company.userCount).toBe(3);
      expect(result.company._count).toBeUndefined();
    });

    it("returns company null when user has no company", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "u1",
        company: null,
      });

      const res = mockRes();
      await getProfile(mockReq(), res);

      const result = res.json.mock.calls[0][0];
      expect(result.company).toBeNull();
    });
  });

  describe("updateUser", () => {
    it("returns 400 when name or phone missing", async () => {
      const res = mockRes();
      await updateUser(mockReq({ body: {} }), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "İsim ve telefon zorunludur.",
      });
    });

    it("returns 400 when phone already taken", async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: "other" });

      const res = mockRes();
      await updateUser(mockReq({ body: { name: "A", phone: "555" } }), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Bu telefon numarası zaten kullanılıyor.",
      });
    });

    it("updates user when phone is unique", async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.update as jest.Mock).mockImplementation(async ({ data }) => data);

      const res = mockRes();
      await updateUser(mockReq({ body: { name: "A", phone: "555", signature: "sig" } }), res);

      const where = (prisma.user.update as jest.Mock).mock.calls[0][0];
      expect(where.where.id).toBe("u1");
      expect(where.data).toEqual({ name: "A", phone: "555", signature: "sig" });
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("updateCompany", () => {
    it("returns 400 when name missing", async () => {
      const res = mockRes();
      await updateCompany(mockReq({ body: {} }), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Şirket adı zorunludur." });
    });

    it("returns 404 when user has no company", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ companyId: null });

      const res = mockRes();
      await updateCompany(mockReq({ body: { name: "Co" } }), res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Şirket bulunamadı." });
    });

    it("updates company and sets profileCompleted", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ companyId: "c1" });
      (prisma.company.update as jest.Mock).mockImplementation(async ({ data }) => data);

      const res = mockRes();
      await updateCompany(
        mockReq({ body: { name: "New Co", address: "Addr", logoUrl: "http://x/logo.png" } }),
        res
      );

      const call = (prisma.company.update as jest.Mock).mock.calls[0][0];
      expect(call.where.id).toBe("c1");
      expect(call.data.name).toBe("New Co");
      expect(call.data.profileCompleted).toBe(true);
      expect(res.json).toHaveBeenCalled();
    });
  });
});
