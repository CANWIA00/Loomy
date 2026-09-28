import {
  getServiceRecords,
  createServiceRecord,
  updateServiceRecord,
  countServiceRecordsByTemplate,
  applyTemplateConfigToRecords,
  deleteServiceRecord,
} from "../controllers/serviceController";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";
import { Response } from "express";

jest.mock("../prisma", () => {
  const serviceRecord = {
    findMany: jest.fn(), findFirst: jest.fn(), count: jest.fn(),
    create: jest.fn(), update: jest.fn(), updateMany: jest.fn(), delete: jest.fn(),
  };
  const stockItem = { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn() };
  const stockTransaction = { create: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() };
  const financeRecomputeJob = { upsert: jest.fn(), updateMany: jest.fn(), delete: jest.fn() };
  const prismaMock: any = { serviceRecord, stockItem, stockTransaction, financeRecomputeJob };
  prismaMock.$transaction = jest.fn(async (fn: any) => fn(prismaMock));
  return { __esModule: true, default: prismaMock };
});

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

describe("service controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getServiceRecords", () => {
    it("returns paginated records scoped to company", async () => {
      (prisma.serviceRecord.findMany as jest.Mock).mockResolvedValue([{ id: 1 }]);
      (prisma.serviceRecord.count as jest.Mock).mockResolvedValue(5);

      const res = mockRes();
      await getServiceRecords(mockReq(), res);

      const where = (prisma.serviceRecord.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.companyId).toBe("c1");
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ totalElements: 5, totalPages: 1 })
      );
    });
  });

  describe("createServiceRecord", () => {
    it("returns 400 when customerName missing", async () => {
      const res = mockRes();
      await createServiceRecord(mockReq({ body: {} }), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Müşteri adı zorunludur." });
    });

    it("stringifies array fields and sets defaults", async () => {
      (prisma.serviceRecord.create as jest.Mock).mockResolvedValue({ id: 1 });

      const res = mockRes();
      const req = mockReq({
        body: {
          customerName: "M",
          services: ["alarm", "cctv"],
          technical: ["battery"],
          fee: "150.50",
        },
      });

      await createServiceRecord(req, res);

      const data = (prisma.serviceRecord.create as jest.Mock).mock.calls[0][0].data;
      expect(data.services).toBe('["alarm","cctv"]');
      expect(data.technical).toBe('["battery"]');
      expect(data.fee).toBe("150.50");
      expect(data.signed).toBe(false);
      expect(data.paid).toBe(false);
      expect(data.companyId).toBe("c1");
      expect(res.status).toHaveBeenCalledWith(201);
    });

    // Regresyon: stok dusmeli kayitlarda "ucret" alani gizli oldugu icin 0.00
    // gonderiliyor ve odeme listesi 0 gosteriyordu. Genel toplam backend'de
    // hesaplanip fee alanina TRY olarak yazilmali.
    it("productsMode: genel toplami hesaplayip fee alanina yazar", async () => {
      (prisma.serviceRecord.create as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.serviceRecord.findFirst as jest.Mock).mockResolvedValue({
        id: 1, usedProducts: "[]", productsMode: true, deducted: false,
      });

      const res = mockRes();
      const req = mockReq({
        body: {
          customerName: "M",
          productsMode: true,
          deductStock: false,
          fee: "0.00",
          labor: "50",
          laborCurrency: "TRY",
          kdvRate: "20",
          usedProducts: [{ name: "Kamera", quantity: 2, unitPrice: 100, currency: "TRY" }],
        },
      });

      await createServiceRecord(req, res);

      const updateData = (prisma.serviceRecord.update as jest.Mock).mock.calls[0][0].data;
      // 200 urun + 50 iscilik = 250, %20 KDV = 50 -> 300
      expect(updateData.fee).toBe("300.00");
      expect(updateData.feeCurrency).toBe("TRY");
      expect(updateData.usedProducts).toContain("Kamera");
    });

    it("productsMode: KDV'siz kayitta yalnizca urun+labor yazilir", async () => {
      (prisma.serviceRecord.create as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.serviceRecord.findFirst as jest.Mock).mockResolvedValue({ id: 1, usedProducts: "[]" });

      const res = mockRes();
      const req = mockReq({
        body: {
          customerName: "M",
          productsMode: true,
          deductStock: false,
          fee: "0.00",
          labor: "0",
          kdvRate: "0",
          usedProducts: [{ name: "Kamera", quantity: 1, unitPrice: 750.25, currency: "TRY" }],
        },
      });

      await createServiceRecord(req, res);

      const updateData = (prisma.serviceRecord.update as jest.Mock).mock.calls[0][0].data;
      expect(updateData.fee).toBe("750.25");
    });

    it("productsMode: ucret/tutar yoksa fee 0.00 olarak yazilir", async () => {
      (prisma.serviceRecord.create as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.serviceRecord.findFirst as jest.Mock).mockResolvedValue({ id: 1, usedProducts: "[]" });

      const res = mockRes();
      const req = mockReq({
        body: { customerName: "M", productsMode: true, deductStock: false, fee: "0.00" },
      });

      await createServiceRecord(req, res);

      expect((prisma.serviceRecord.update as jest.Mock).mock.calls[0][0].data.fee).toBe("0.00");
    });

    it("productsMode false: elle girilen fee'ye dokunmaz", async () => {
      (prisma.serviceRecord.create as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.serviceRecord.findFirst as jest.Mock).mockResolvedValue({ id: 1, usedProducts: "[]" });

      const res = mockRes();
      const req = mockReq({
        body: {
          customerName: "M",
          productsMode: false,
          deductStock: false,
          fee: "150.50",
          feeCurrency: "EUR",
          usedProducts: [{ name: "Kamera", quantity: 1, unitPrice: 100, currency: "TRY" }],
        },
      });

      await createServiceRecord(req, res);

      const updateData = (prisma.serviceRecord.update as jest.Mock).mock.calls[0][0].data;
      expect(updateData.fee).toBeUndefined();
      expect(updateData.feeCurrency).toBeUndefined();
    });
  });

  describe("updateServiceRecord", () => {
    it("returns 404 when not found", async () => {
      (prisma.serviceRecord.findFirst as jest.Mock).mockResolvedValue(null);

      const res = mockRes();
      await updateServiceRecord(mockReq({ params: { id: "1" }, body: {} }), res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Servis kaydı bulunamadı." });
    });

    it("updates only provided fields", async () => {
      (prisma.serviceRecord.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        documentDate: "d",
        customerName: "Old",
        customerId: null,
        serviceType: "",
        address: null,
        startTime: null,
        endTime: null,
        phone: null,
        internalIp: null,
        externalIp: null,
        details: null,
        fee: "0.00",
        technician: null,
        technicianPhone: null,
        services: "[]",
        technical: "[]",
        customChips: null,
        customValues: null,
        signed: false,
        paid: false,
        signature: null,
        technicianSignature: null,
        templateName: null,
        templateConfig: null,
      });
      (prisma.serviceRecord.update as jest.Mock).mockImplementation(
        async ({ data }) => data
      );

      const res = mockRes();
      const req = mockReq({
        params: { id: "1" },
        body: { customerName: "New", services: ["alarm"] },
      });

      await updateServiceRecord(req, res);

      const data = (prisma.serviceRecord.update as jest.Mock).mock.calls[0][0].data;
      expect(data.customerName).toBe("New");
      expect(data.services).toBe('["alarm"]');
      expect(data.fee).toBe("0.00");
    });

    it("productsMode: guncellenirken genel toplam yeniden hesaplanir", async () => {
      (prisma.serviceRecord.findFirst as jest.Mock)
        .mockResolvedValueOnce({
          id: 1,
          documentDate: "08/09/2026",
          customerName: "M",
          customerId: null,
          serviceType: "",
          address: null,
          startTime: null,
          endTime: null,
          phone: null,
          internalIp: null,
          externalIp: null,
          details: null,
          fee: "0.00",
          feeCurrency: "TRY",
          labor: "50",
          laborCurrency: "TRY",
          kdvRate: "20",
          technician: null,
          technicianPhone: null,
          services: "[]",
          technical: "[]",
          customChips: null,
          customValues: null,
          signed: false,
          paid: false,
          signature: null,
          technicianSignature: null,
          templateName: null,
          templateConfig: null,
          usedProducts: "[]",
          productsMode: true,
        })
        .mockResolvedValueOnce({ id: 1, documentDate: "08/09/2026", usedProducts: "[]" });
      (prisma.serviceRecord.update as jest.Mock).mockImplementation(async ({ data }) => data);

      const res = mockRes();
      const req = mockReq({
        params: { id: "1" },
        body: {
          customerName: "M",
          deductStock: false,
          usedProducts: [{ name: "Kamera", quantity: 2, unitPrice: 100, currency: "TRY" }],
        },
      });

      await updateServiceRecord(req, res);

      // Ilk update alan gecisidir (fee: fee ?? existing.fee), ikinci hesaplanan toplam patch'idir.
      const patch = (prisma.serviceRecord.update as jest.Mock).mock.calls[1][0].data;
      expect(patch.fee).toBe("300.00");
      expect(patch.feeCurrency).toBe("TRY");
    });

    it("productsMode: usedProducts gonderilmese bile kayitli urunlerden toplam hesaplanir", async () => {
      (prisma.serviceRecord.findFirst as jest.Mock)
        .mockResolvedValueOnce({
          id: 1,
          documentDate: "08/09/2026",
          customerName: "M",
          customerId: null,
          serviceType: "",
          address: null,
          startTime: null,
          endTime: null,
          phone: null,
          internalIp: null,
          externalIp: null,
          details: null,
          fee: "0.00",
          feeCurrency: "TRY",
          labor: "0",
          laborCurrency: "TRY",
          kdvRate: "0",
          technician: null,
          technicianPhone: null,
          services: "[]",
          technical: "[]",
          customChips: null,
          customValues: null,
          signed: false,
          paid: false,
          signature: null,
          technicianSignature: null,
          templateName: null,
          templateConfig: null,
          usedProducts: JSON.stringify([
            { name: "Kamera", quantity: 1, unitPrice: 99.99, currency: "TRY" },
          ]),
          productsMode: true,
        })
        .mockResolvedValueOnce({ id: 1, documentDate: "08/09/2026", usedProducts: "[]" });
      (prisma.serviceRecord.update as jest.Mock).mockImplementation(async ({ data }) => data);

      const res = mockRes();
      const req = mockReq({ params: { id: "1" }, body: { customerName: "M2" } });

      await updateServiceRecord(req, res);

      const patch = (prisma.serviceRecord.update as jest.Mock).mock.calls[1][0].data;
      expect(patch.fee).toBe("99.99");
    });
  });

  describe("countServiceRecordsByTemplate", () => {
    it("returns count for given template name", async () => {
      (prisma.serviceRecord.count as jest.Mock).mockResolvedValue(7);

      const res = mockRes();
      await countServiceRecordsByTemplate(mockReq({ body: { name: "Varsayılan" } }), res);

      expect(prisma.serviceRecord.count).toHaveBeenCalledWith({
        where: { companyId: "c1", templateName: "Varsayılan" },
      });
      expect(res.json).toHaveBeenCalledWith({ count: 7 });
    });

    it("returns 0 when no name", async () => {
      const res = mockRes();
      await countServiceRecordsByTemplate(mockReq({ body: {} }), res);

      expect(res.json).toHaveBeenCalledWith({ count: 0 });
    });
  });

  describe("applyTemplateConfigToRecords", () => {
    it("returns 400 when names missing", async () => {
      const res = mockRes();
      await applyTemplateConfigToRecords(mockReq({ body: {} }), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Şablon adı zorunludur." });
    });

    it("updates many with deduplicated names", async () => {
      (prisma.serviceRecord.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

      const res = mockRes();
      const req = mockReq({ body: { oldName: "A", newName: "B", templateConfig: { x: 1 } } });

      await applyTemplateConfigToRecords(req, res);

      const call = (prisma.serviceRecord.updateMany as jest.Mock).mock.calls[0][0];
      expect(call.where.templateName.in).toEqual(["A", "B"]);
      expect(call.data.templateName).toBe("B");
      expect(call.data.templateConfig).toBe('{"x":1}');
      expect(res.json).toHaveBeenCalledWith({ updated: 3 });
    });
  });

  describe("deleteServiceRecord", () => {
    it("returns 404 when not found", async () => {
      (prisma.serviceRecord.findFirst as jest.Mock).mockResolvedValue(null);

      const res = mockRes();
      await deleteServiceRecord(mockReq({ params: { id: "1" } }), res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("deletes on success", async () => {
      (prisma.serviceRecord.findFirst as jest.Mock).mockResolvedValue({ id: 1 });

      const res = mockRes();
      await deleteServiceRecord(mockReq({ params: { id: "1" } }), res);

      expect(prisma.serviceRecord.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(res.json).toHaveBeenCalledWith({ message: "Servis kaydı silindi." });
    });
  });
});
