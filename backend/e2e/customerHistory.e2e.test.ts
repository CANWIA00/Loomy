import { api, createCompany, createUser, prisma } from "./helpers";
// Musteri detay ekraninin kullandigi sayfalama fonksiyonunun kendisi.
import { fetchAllPages } from "../../frontend/utils/fetchAllPages";

const X_RECORDS = 250; // tek sayfa (200) ve eski 100'luk siniri asar
const Y_RECORDS = 150;

let token: string;
let customerXId: string;
let customerXName: string;

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

beforeAll(async () => {
  const company = await createCompany();
  const other = await createCompany();
  const admin = await createUser({ companyId: company.id, password: "Sifre123!" });

  const customerX = await prisma.customer.create({
    data: { companyName: `Acme Teknik ${company.id.slice(0, 6)}`, companyId: company.id },
  });
  const customerY = await prisma.customer.create({
    data: { companyName: `Baska Musteri ${company.id.slice(0, 6)}`, companyId: company.id },
  });
  customerXId = customerX.id;
  customerXName = customerX.companyName;

  // X'in kayitlari ESKI (son 1 yil), Y'nin kayitlari YENI (son gunler).
  // Eski davranista "son 100 kayit" yalnizca Y'yi getirirdi.
  await prisma.serviceRecord.createMany({
    data: Array.from({ length: X_RECORDS }, (_, i) => ({
      documentDate: "01.01.2026",
      customerName: customerX.companyName,
      customerId: customerX.id,
      serviceType: "Bakim",
      fee: "100.00",
      companyId: company.id,
      createdAt: daysAgo(400 - i),
    })),
  });
  await prisma.serviceRecord.createMany({
    data: Array.from({ length: Y_RECORDS }, (_, i) => ({
      documentDate: "01.11.2026",
      customerName: customerY.companyName,
      customerId: customerY.id,
      serviceType: "Kurulum",
      companyId: company.id,
      createdAt: daysAgo(10 - i / 100),
    })),
  });
  // customerId'si olmayan eski kayit: isim eslesmesiyle bulunmali (buyuk/kucuk harf farkli)
  await prisma.serviceRecord.create({
    data: {
      documentDate: "01.01.2025",
      customerName: customerX.companyName.toUpperCase(),
      serviceType: "Eski Kayit",
      companyId: company.id,
      createdAt: daysAgo(800),
    },
  });
  // Baska sirketin ayni isim/ID ile kaydi: ASLA donmemeli
  await prisma.serviceRecord.create({
    data: {
      documentDate: "01.01.2026",
      customerName: customerX.companyName,
      customerId: customerX.id,
      serviceType: "Baska Sirket",
      companyId: other.id,
    },
  });

  await prisma.quoteRecord.createMany({
    data: [
      ...Array.from({ length: 3 }, () => ({ documentDate: "01.01.2026", customerName: customerX.companyName, customerId: customerX.id, companyId: company.id })),
      ...Array.from({ length: 2 }, () => ({ documentDate: "01.01.2026", customerName: customerY.companyName, customerId: customerY.id, companyId: company.id })),
    ],
  });

  const login = await api("POST", "/auth/login", { body: { email: admin.email, password: "Sifre123!" } });
  expect(login.status).toBe(200);
  token = login.body.token;
});

afterAll(async () => {
  await prisma.$disconnect();
});

const filterQuery = () =>
  `customerId=${encodeURIComponent(customerXId)}&customerName=${encodeURIComponent(customerXName)}`;

describe("musteri gecmisi", () => {
  it("ESKI davranis: sirketin son 100 kaydi musteri X'in kayitlarini icermiyordu (hatanin kaniti)", async () => {
    const res = await api("GET", "/services?page=0&size=100", { token });
    expect(res.status).toBe(200);
    const xCount = res.body.content.filter((r: any) => r.customerId === customerXId).length;
    expect(xCount).toBe(0);
  });

  it("YENI: ekranin sayfalama fonksiyonu musterinin TUM servis kayitlarini getirir", async () => {
    const pagesRequested: number[] = [];
    const records = await fetchAllPages<any>(async (page) => {
      pagesRequested.push(page);
      const res = await api("GET", `/services?page=${page}&size=200&${filterQuery()}`, { token });
      expect(res.status).toBe(200);
      return { data: res.body };
    });

    expect(pagesRequested).toEqual([0, 1]); // 251 kayit -> 2 sayfa
    expect(records).toHaveLength(X_RECORDS + 1); // + customerId'siz eski kayit
    expect(records.some((r) => r.serviceType === "Eski Kayit")).toBe(true);
    expect(records.some((r) => r.serviceType === "Baska Sirket")).toBe(false);
    expect(records.some((r) => r.serviceType === "Kurulum")).toBe(false);
    expect(new Set(records.map((r) => r.id)).size).toBe(records.length); // sayfalar arasi tekrar yok
  });

  it("odemeler endpoint'i de ayni filtreyle tum kayitlari dondurur", async () => {
    const records = await fetchAllPages<any>(async (page) => {
      const res = await api("GET", `/payments?page=${page}&size=200&${filterQuery()}`, { token });
      return { data: res.body };
    });
    expect(records).toHaveLength(X_RECORDS + 1);
  });

  it("teklifler endpoint'i yalnizca musterinin tekliflerini dondurur", async () => {
    const res = await api("GET", `/quotes?page=0&size=200&${filterQuery()}`, { token });
    expect(res.status).toBe(200);
    expect(res.body.totalElements).toBe(3);
  });

  it("filtre olmadan eski davranis korunur (sirketin tum kayitlari)", async () => {
    const res = await api("GET", "/services?page=0&size=1", { token });
    expect(res.body.totalElements).toBe(X_RECORDS + Y_RECORDS + 1);
  });

  it("sayfa boyutu 200 ile sinirli, negatif sayfa 0 sayilir", async () => {
    const res = await api("GET", "/services?page=-5&size=100000", { token });
    expect(res.status).toBe(200);
    expect(res.body.content).toHaveLength(200);
    expect(res.body.number).toBe(0);
  });

  it("token olmadan erisilemez", async () => {
    const res = await api("GET", `/services?${filterQuery()}`);
    expect(res.status).toBe(401);
  });
});
