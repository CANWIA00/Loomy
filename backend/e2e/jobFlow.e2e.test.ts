import { api, createCompany, createUser, prisma } from "./helpers";

afterAll(async () => {
  await prisma.$disconnect();
});

async function setup() {
  const company = await createCompany();
  const user = await createUser({ companyId: company.id, password: "Sifre123!", role: "ADMIN" });
  const login = await api("POST", "/auth/login", { body: { email: user.email, password: "Sifre123!" } });
  const token = login.body.token as string;
  const team = await api("POST", "/teams", { token, body: { name: "Ekip A", leader: "E2E Kullanici", color: "#3B82F6", members: [] } });
  expect(team.status).toBe(201);
  const quote = await api("POST", "/quotes", {
    token,
    body: {
      title: "Kamera Kurulumu",
      customerName: "Akış Test A.Ş.",
      documentDate: "21/11/2026",
      validUntil: "05/12/2026",
      lines: [{ name: "IP Kamera", quantity: 4, unitPrice: 1250, currency: "TRY", unit: "Adet" }],
    },
  });
  expect(quote.status).toBe(201);
  return { token, teamId: team.body.id as number, quoteId: quote.body.id as number };
}

const awaiting = (token: string) => api("GET", "/appointments?status=AWAITING", { token });
const calendar = (token: string) => api("GET", "/appointments", { token });

describe("teklif -> planlama -> servis akisi", () => {
  it("kabul: atama bekleyen is olusur; takvimde gorunmez", async () => {
    const { token, quoteId } = await setup();
    const res = await api("PATCH", `/quotes/${quoteId}/status`, { token, body: { status: "ACCEPTED" } });
    expect(res.status).toBe(200);
    expect(res.body.job.status).toBe("AWAITING");

    const list = await awaiting(token);
    const job = list.body.find((j: any) => j.quoteId === quoteId);
    expect(job).toMatchObject({ customerName: "Akış Test A.Ş.", tur: "Kamera Kurulumu", status: "AWAITING", ekipId: null });
    expect(job.notes).toContain("IP Kamera x4");
    expect((await calendar(token)).body.some((j: any) => j.quoteId === quoteId)).toBe(false);
  });

  it("red: atanmamis is iptal olur; tekrar kabulde yeniden acilir (kopya olusmaz)", async () => {
    const { token, quoteId } = await setup();
    await api("PATCH", `/quotes/${quoteId}/status`, { token, body: { status: "ACCEPTED" } });
    const rej = await api("PATCH", `/quotes/${quoteId}/status`, { token, body: { status: "REJECTED" } });
    expect(rej.body.job.status).toBe("CANCELLED");
    expect((await awaiting(token)).body.some((j: any) => j.quoteId === quoteId)).toBe(false);

    await api("PATCH", `/quotes/${quoteId}/status`, { token, body: { status: "ACCEPTED" } });
    expect(await prisma.appointment.count({ where: { quoteId } })).toBe(1);
    expect((await awaiting(token)).body.filter((j: any) => j.quoteId === quoteId)).toHaveLength(1);
  });

  it("atama: ekip+tarih verilince takvime gecer; sonra red edilirse is kalir ve uyari doner", async () => {
    const { token, teamId, quoteId } = await setup();
    const acc = await api("PATCH", `/quotes/${quoteId}/status`, { token, body: { status: "ACCEPTED" } });
    const jobId = acc.body.job.id;

    const noDate = await api("PUT", `/appointments/${jobId}`, { token, body: { ekipId: teamId } });
    expect(noDate.status).toBe(400);

    const assigned = await api("PUT", `/appointments/${jobId}`, { token, body: { ekipId: teamId, tarih: "2026-11-25", startTime: "10:00", duration: "2saat" } });
    expect(assigned.status).toBe(200);
    expect(assigned.body).toMatchObject({ status: "SCHEDULED", ekipId: teamId, ekip: "Ekip A", tarih: "2026-11-25" });
    expect((await calendar(token)).body.some((j: any) => j.id === jobId)).toBe(true);
    expect((await awaiting(token)).body.some((j: any) => j.id === jobId)).toBe(false);

    const rej = await api("PATCH", `/quotes/${quoteId}/status`, { token, body: { status: "REJECTED" } });
    expect(rej.body.jobWarning).toBe("scheduled");
    expect((await calendar(token)).body.find((j: any) => j.id === jobId).status).toBe("SCHEDULED");
  });

  it("is detayi teklif kalemlerini doner; servis kaydi olusunca is tamamlanir", async () => {
    const { token, teamId, quoteId } = await setup();
    const acc = await api("PATCH", `/quotes/${quoteId}/status`, { token, body: { status: "ACCEPTED" } });
    const jobId = acc.body.job.id;
    await api("PUT", `/appointments/${jobId}`, { token, body: { ekipId: teamId, tarih: "2026-11-26" } });

    const detail = await api("GET", `/appointments/${jobId}`, { token });
    expect(detail.body.quoteLines).toEqual([expect.objectContaining({ name: "IP Kamera", quantity: 4 })]);

    const svc = await api("POST", "/services", {
      token,
      body: { customerName: "Akış Test A.Ş.", documentDate: "26/11/2026", serviceType: "Kurulum", appointmentId: jobId },
    });
    expect(svc.status).toBe(201);
    const after = await api("GET", `/appointments/${jobId}`, { token });
    expect(after.body).toMatchObject({ status: "DONE", serviceRecordId: svc.body.id });
    expect((await calendar(token)).body.find((j: any) => j.id === jobId).status).toBe("DONE");
  });

  it("elle atama bekleyen is eklenir ve iptal edilebilir", async () => {
    const { token } = await setup();
    const created = await api("POST", "/appointments", { token, body: { customerName: "Telefonla Arayan", tur: "Arıza", notes: "Kamera kayıt yapmıyor", awaiting: true } });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe("AWAITING");

    const cancel = await api("PATCH", `/appointments/${created.body.id}/cancel`, { token });
    expect(cancel.body.status).toBe("CANCELLED");
    expect((await awaiting(token)).body.some((j: any) => j.id === created.body.id)).toBe(false);
    expect((await api("PATCH", `/appointments/${created.body.id}/cancel`, { token })).status).toBe(404);
  });

  it("teklif detayi bagli isi doner (tekliften servis formu icin)", async () => {
    const { token, quoteId } = await setup();
    expect((await api("GET", `/quotes/${quoteId}`, { token })).body.job).toBeNull();
    const acc = await api("PATCH", `/quotes/${quoteId}/status`, { token, body: { status: "ACCEPTED" } });
    const detail = await api("GET", `/quotes/${quoteId}`, { token });
    expect(detail.status).toBe(200);
    expect(detail.body.job).toEqual({ id: acc.body.job.id, status: "AWAITING", serviceRecordId: null });

    // atama beklerken servis kaydi olusturulursa is dogrudan tamamlanir
    const svc = await api("POST", "/services", {
      token,
      body: { customerName: "Akış Test A.Ş.", documentDate: "26/11/2026", serviceType: "Kurulum", appointmentId: acc.body.job.id },
    });
    expect(svc.status).toBe(201);
    expect((await api("GET", `/quotes/${quoteId}`, { token })).body.job).toMatchObject({ status: "DONE", serviceRecordId: svc.body.id });
  });

  it("teklif silinince atanmamis is iptal olur", async () => {
    const { token, quoteId } = await setup();
    const acc = await api("PATCH", `/quotes/${quoteId}/status`, { token, body: { status: "ACCEPTED" } });
    expect((await api("DELETE", `/quotes/${quoteId}`, { token })).status).toBe(200);
    expect((await awaiting(token)).body.some((j: any) => j.id === acc.body.job.id)).toBe(false);
  });

  it("baska sirket isi goremez ve atayamaz", async () => {
    const a = await setup();
    const b = await setup();
    const acc = await api("PATCH", `/quotes/${a.quoteId}/status`, { token: a.token, body: { status: "ACCEPTED" } });
    const jobId = acc.body.job.id;
    expect((await api("GET", `/appointments/${jobId}`, { token: b.token })).status).toBe(404);
    expect((await api("PUT", `/appointments/${jobId}`, { token: b.token, body: { ekipId: b.teamId, tarih: "2026-11-27" } })).status).toBe(404);
    expect((await api("PATCH", `/appointments/${jobId}/cancel`, { token: b.token })).status).toBe(404);
  });
});
