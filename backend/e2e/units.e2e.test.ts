import { api, createCompany, createUser, prisma, uid } from "./helpers";

afterAll(async () => {
  await prisma.$disconnect();
});

async function loginNew(role: "ADMIN" | "USER", companyId?: string) {
  const company = companyId ? { id: companyId } : await createCompany();
  const user = await createUser({ companyId: company.id, password: "Sifre123!", role });
  const login = await api("POST", "/auth/login", { body: { email: user.email, password: "Sifre123!" } });
  expect(login.status).toBe(200);
  return { token: login.body.token as string, companyId: company.id };
}

describe("ozel birimler", () => {
  it("personel birim ekler, ayni sirketteki herkes gorur; tekrar eklemek kopya olusturmaz", async () => {
    const admin = await loginNew("ADMIN");
    const staff = await loginNew("USER", admin.companyId);
    const name = `Bidon-${uid().slice(0, 4)}`;

    const created = await api("POST", "/units", { token: staff.token, body: { name: `  ${name}  ` } });
    expect(created.status).toBe(201);
    expect(created.body.name).toBe(name);

    const again = await api("POST", "/units", { token: admin.token, body: { name } });
    expect(again.status).toBe(201);
    expect(again.body.id).toBe(created.body.id);

    const list = await api("GET", "/units", { token: admin.token });
    expect(list.body.filter((u: any) => u.name === name)).toHaveLength(1);
  });

  it("birimler sirketler arasinda gorunmez ve silinemez", async () => {
    const a = await loginNew("ADMIN");
    const b = await loginNew("ADMIN");
    const unit = await api("POST", "/units", { token: a.token, body: { name: "Varil" } });

    const listB = await api("GET", "/units", { token: b.token });
    expect(listB.body.some((u: any) => u.id === unit.body.id)).toBe(false);

    const delB = await api("DELETE", `/units/${unit.body.id}`, { token: b.token });
    expect(delB.status).toBe(404);
    expect(await prisma.customUnit.findUnique({ where: { id: unit.body.id } })).not.toBeNull();
  });

  it("yalnizca yonetici silebilir", async () => {
    const admin = await loginNew("ADMIN");
    const staff = await loginNew("USER", admin.companyId);
    const unit = await api("POST", "/units", { token: staff.token, body: { name: "Kangal" } });

    const byStaff = await api("DELETE", `/units/${unit.body.id}`, { token: staff.token });
    expect(byStaff.status).toBe(403);

    const byAdmin = await api("DELETE", `/units/${unit.body.id}`, { token: admin.token });
    expect(byAdmin.status).toBe(204);
    const list = await api("GET", "/units", { token: admin.token });
    expect(list.body.some((u: any) => u.id === unit.body.id)).toBe(false);
  });

  it("gecersiz isimleri reddeder", async () => {
    const admin = await loginNew("ADMIN");
    expect((await api("POST", "/units", { token: admin.token, body: { name: "" } })).status).toBe(400);
    expect((await api("POST", "/units", { token: admin.token, body: { name: "x".repeat(21) } })).status).toBe(400);
  });
});
