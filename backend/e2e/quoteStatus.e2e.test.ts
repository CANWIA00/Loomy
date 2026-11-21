import { api, createCompany, createUser, prisma } from "./helpers";

afterAll(async () => {
  await prisma.$disconnect();
});

async function loginNewAdmin() {
  const company = await createCompany();
  const user = await createUser({ companyId: company.id, password: "Sifre123!", role: "ADMIN" });
  const login = await api("POST", "/auth/login", { body: { email: user.email, password: "Sifre123!" } });
  expect(login.status).toBe(200);
  return login.body.token as string;
}

const quoteBody = {
  title: "Kamera Kurulumu",
  customerName: "Durum Test A.Ş.",
  documentDate: "21/11/2026",
  lines: [{ name: "IP Kamera", quantity: 2, unitPrice: 1000, currency: "TRY", unit: "Adet" }],
};

describe("teklif durumu", () => {
  it("yeni teklif PENDING baslar; istemci status gonderse bile degismez", async () => {
    const token = await loginNewAdmin();
    const res = await api("POST", "/quotes", { token, body: { ...quoteBody, status: "ACCEPTED" } });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("PENDING");
  });

  it("durum degisir, kalici olur ve teklif duzenlemesi durumu bozmaz", async () => {
    const token = await loginNewAdmin();
    const created = await api("POST", "/quotes", { token, body: quoteBody });
    const id = created.body.id;

    const changed = await api("PATCH", `/quotes/${id}/status`, { token, body: { status: "ACCEPTED" } });
    expect(changed.status).toBe(200);
    expect(changed.body.status).toBe("ACCEPTED");
    expect(changed.body.statusUpdatedAt).toBeTruthy();

    const edited = await api("PUT", `/quotes/${id}`, { token, body: { ...quoteBody, title: "Revize", status: "REJECTED" } });
    expect(edited.status).toBe(200);
    expect(edited.body.title).toBe("Revize");
    expect(edited.body.status).toBe("ACCEPTED");

    const list = await api("GET", "/quotes?page=0&size=50", { token });
    expect(list.body.content.find((q: any) => q.id === id).status).toBe("ACCEPTED");
  });

  it("gecersiz durumu reddeder", async () => {
    const token = await loginNewAdmin();
    const created = await api("POST", "/quotes", { token, body: quoteBody });
    const res = await api("PATCH", `/quotes/${created.body.id}/status`, { token, body: { status: "SENT" } });
    expect(res.status).toBe(400);
  });

  it("baska sirketin teklifinin durumu degistirilemez", async () => {
    const tokenA = await loginNewAdmin();
    const tokenB = await loginNewAdmin();
    const created = await api("POST", "/quotes", { token: tokenA, body: quoteBody });

    const res = await api("PATCH", `/quotes/${created.body.id}/status`, { token: tokenB, body: { status: "REJECTED" } });
    expect(res.status).toBe(404);
    const row = await prisma.quoteRecord.findUnique({ where: { id: created.body.id } });
    expect(row?.status).toBe("PENDING");
  });
});
