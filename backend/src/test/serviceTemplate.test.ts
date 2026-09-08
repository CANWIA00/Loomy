import {
  listServiceTemplates,
  createServiceTemplate,
  updateServiceTemplate,
  setDefaultServiceTemplate,
  deleteServiceTemplate,
  defaultTemplateConfig,
} from "../controllers/serviceTemplateController";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";
import { Response } from "express";

jest.mock("../prisma", () => ({
  __esModule: true,
  default: {
    serviceFormTemplate: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
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

function makeTemplate(overrides: Record<string, unknown> = {}) {
  return {
    id: "t1",
    name: "Varsayılan",
    isDefault: true,
    fields: JSON.stringify(defaultTemplateConfig().fields),
    chipGroups: JSON.stringify(defaultTemplateConfig().chipGroups),
    ...overrides,
  };
}

describe("service template controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("defaultTemplateConfig", () => {
    it("returns fields and chip groups", () => {
      const config = defaultTemplateConfig();
      expect(config.fields.length).toBeGreaterThan(0);
      expect(config.chipGroups.length).toBe(2);
      expect(config.chipGroups.map((g: any) => g.key)).toEqual(["services", "technical"]);
    });
  });

  describe("listServiceTemplates", () => {
    it("creates a default template when none exist", async () => {
      (prisma.serviceFormTemplate.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.serviceFormTemplate.create as jest.Mock).mockResolvedValue(
        makeTemplate({ isDefault: true })
      );

      const res = mockRes();
      await listServiceTemplates(mockReq(), res);

      expect(prisma.serviceFormTemplate.create).toHaveBeenCalled();
      const data = (prisma.serviceFormTemplate.create as jest.Mock).mock.calls[0][0].data;
      expect(data.isDefault).toBe(true);
      expect(data.companyId).toBe("c1");
    });

    it("returns existing templates parsed", async () => {
      (prisma.serviceFormTemplate.findMany as jest.Mock).mockResolvedValue([
        makeTemplate(),
      ]);

      const res = mockRes();
      await listServiceTemplates(mockReq(), res);

      expect(res.json).toHaveBeenCalledWith([
        expect.objectContaining({
          id: "t1",
          name: "Varsayılan",
          isDefault: true,
          fields: expect.any(Array),
          chipGroups: expect.any(Array),
        }),
      ]);
    });
  });

  describe("createServiceTemplate", () => {
    it("returns 400 when name missing", async () => {
      const res = mockRes();
      await createServiceTemplate(mockReq({ body: {} }), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Şablon adı zorunludur." });
    });

    it("creates first template as default", async () => {
      (prisma.serviceFormTemplate.count as jest.Mock).mockResolvedValue(0);
      (prisma.serviceFormTemplate.create as jest.Mock).mockResolvedValue(makeTemplate());

      const res = mockRes();
      await createServiceTemplate(mockReq({ body: { name: "Yeni" } }), res);

      const data = (prisma.serviceFormTemplate.create as jest.Mock).mock.calls[0][0].data;
      expect(data.isDefault).toBe(true);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("unsets other defaults when creating a default", async () => {
      (prisma.serviceFormTemplate.count as jest.Mock).mockResolvedValue(2);
      (prisma.serviceFormTemplate.create as jest.Mock).mockResolvedValue(
        makeTemplate({ isDefault: true, id: "new" })
      );

      const res = mockRes();
      await createServiceTemplate(
        mockReq({ body: { name: "Yeni", isDefault: true } }),
        res
      );

      expect(prisma.serviceFormTemplate.updateMany).toHaveBeenCalledWith({
        where: { companyId: "c1", id: { not: "new" } },
        data: { isDefault: false },
      });
    });
  });

  describe("updateServiceTemplate", () => {
    it("returns 404 when not found", async () => {
      (prisma.serviceFormTemplate.findFirst as jest.Mock).mockResolvedValue(null);

      const res = mockRes();
      await updateServiceTemplate(mockReq({ params: { id: "x" }, body: {} }), res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Şablon bulunamadı." });
    });

    it("updates name", async () => {
      (prisma.serviceFormTemplate.findFirst as jest.Mock).mockResolvedValue(makeTemplate());
      (prisma.serviceFormTemplate.update as jest.Mock).mockResolvedValue(
        makeTemplate({ name: "Yeni Ad" })
      );

      const res = mockRes();
      await updateServiceTemplate(
        mockReq({ params: { id: "t1" }, body: { name: "Yeni Ad" } }),
        res
      );

      const data = (prisma.serviceFormTemplate.update as jest.Mock).mock.calls[0][0].data;
      expect(data.name).toBe("Yeni Ad");
    });
  });

  describe("setDefaultServiceTemplate", () => {
    it("returns 404 when not found", async () => {
      (prisma.serviceFormTemplate.findFirst as jest.Mock).mockResolvedValue(null);

      const res = mockRes();
      await setDefaultServiceTemplate(mockReq({ params: { id: "x" } }), res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("sets default and unsets others", async () => {
      (prisma.serviceFormTemplate.findFirst as jest.Mock).mockResolvedValue(makeTemplate());
      (prisma.serviceFormTemplate.update as jest.Mock).mockResolvedValue(
        makeTemplate({ isDefault: true })
      );

      const res = mockRes();
      await setDefaultServiceTemplate(mockReq({ params: { id: "t1" } }), res);

      expect(prisma.serviceFormTemplate.updateMany).toHaveBeenCalledWith({
        where: { companyId: "c1" },
        data: { isDefault: false },
      });
      expect(prisma.serviceFormTemplate.update).toHaveBeenCalledWith({
        where: { id: "t1" },
        data: { isDefault: true },
      });
    });
  });

  describe("deleteServiceTemplate", () => {
    it("returns 404 when not found", async () => {
      (prisma.serviceFormTemplate.findFirst as jest.Mock).mockResolvedValue(null);

      const res = mockRes();
      await deleteServiceTemplate(mockReq({ params: { id: "x" } }), res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("rejects deleting last template", async () => {
      (prisma.serviceFormTemplate.findFirst as jest.Mock).mockResolvedValue(makeTemplate());
      (prisma.serviceFormTemplate.count as jest.Mock).mockResolvedValue(1);

      const res = mockRes();
      await deleteServiceTemplate(mockReq({ params: { id: "t1" } }), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "En az bir şablon olmalıdır." });
    });

    it("deletes and reassigns default when deleting current default", async () => {
      (prisma.serviceFormTemplate.findFirst as jest.Mock)
        .mockResolvedValueOnce(makeTemplate({ isDefault: true }))
        .mockResolvedValueOnce(makeTemplate({ id: "next", name: "Sonraki" }));
      (prisma.serviceFormTemplate.count as jest.Mock).mockResolvedValue(2);

      const res = mockRes();
      await deleteServiceTemplate(mockReq({ params: { id: "t1" } }), res);

      expect(prisma.serviceFormTemplate.delete).toHaveBeenCalledWith({ where: { id: "t1" } });
      expect(prisma.serviceFormTemplate.update).toHaveBeenCalledWith({
        where: { id: "next" },
        data: { isDefault: true },
      });
      expect(res.json).toHaveBeenCalledWith({ message: "Şablon silindi." });
    });
  });
});
