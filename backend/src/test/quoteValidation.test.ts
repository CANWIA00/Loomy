import request from "supertest";
import app from "../app";
import prisma from "../prisma";
import { verifyToken } from "../services/jwt";

jest.mock("../services/jwt");
jest.mock("../prisma", () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
    quoteRecord: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
  },
}));

const valid = {
  customerName: "Acme",
  documentDate: "21/11/2026",
  validUntil: "05/12/2026",
  lines: [{ name: "Kamera", quantity: 2, unitPrice: 1000, currency: "TRY", unit: "Adet" }],
};

beforeEach(() => {
  jest.clearAllMocks();
  (verifyToken as jest.Mock).mockReturnValue({ id: "u1" });
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({
    id: "u1", email: "a@b.com", role: "ADMIN", isActive: true, companyId: "c1", panelAccess: null, company: { isFrozen: false },
  });
  (prisma.quoteRecord.create as jest.Mock).mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data }));
});

const post = (body: unknown) => request(app).post("/api/quotes").set("Authorization", "Bearer t").send(body as object);

describe("teklif zorunlu alanlari (sunucu)", () => {
  it("tum zorunlu alanlar doluysa olusturur", async () => {
    const res = await post(valid);
    expect(res.status).toBe(201);
  });

  it("eski noktali tarih bicimini kabul eder", async () => {
    const res = await post({ ...valid, documentDate: "13.11.2026", validUntil: "23.11.2026" });
    expect(res.status).toBe(201);
  });

  it.each([
    ["musteri adi bos", { customerName: "  " }, "Müşteri adı zorunludur."],
    ["belge tarihi yok", { documentDate: undefined }, "Belge tarihi zorunludur."],
    ["belge tarihi gecersiz", { documentDate: "31/02/2026" }, "Belge tarihi geçerli bir tarih olmalıdır (GG/AA/YYYY)."],
    ["gecerlilik yok", { validUntil: "" }, "Geçerlilik tarihi zorunludur."],
    ["gecerlilik belge tarihinden once", { validUntil: "20/11/2026" }, "Geçerlilik tarihi belge tarihinden önce olamaz."],
    ["urun satiri yok", { lines: [] }, "En az bir ürün satırı zorunludur."],
    ["urun adi bos", { lines: [{ ...valid.lines[0], name: "" }] }, "Her satırda ürün adı zorunludur."],
    ["miktar 0", { lines: [{ ...valid.lines[0], quantity: 0 }] }, "Her satırda miktar 0'dan büyük olmalıdır."],
    ["birim fiyat 0", { lines: [{ ...valid.lines[0], unitPrice: 0 }] }, "Her satırda birim fiyat 0'dan büyük olmalıdır."],
  ])("%s -> 400", async (_name, patch, message) => {
    const res = await post({ ...valid, ...patch });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(message);
    expect(prisma.quoteRecord.create).not.toHaveBeenCalled();
  });

  it("guncellemede de ayni kurallar gecerli", async () => {
    const res = await request(app).put("/api/quotes/1").set("Authorization", "Bearer t").send({ ...valid, validUntil: "" });
    expect(res.status).toBe(400);
    expect(prisma.quoteRecord.update).not.toHaveBeenCalled();
  });
});
