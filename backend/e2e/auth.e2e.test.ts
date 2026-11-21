import { api, createCompany, createUser, listMails, prisma, uid, waitForCode } from "./helpers";

afterAll(async () => {
  await prisma.$disconnect();
});

describe("giris (login)", () => {
  it("dogru bilgilerle token verir ve token korumali endpoint'lerde calisir", async () => {
    const company = await createCompany();
    const user = await createUser({ companyId: company.id, password: "Sifre123!" });

    const login = await api("POST", "/auth/login", { body: { email: user.email, password: "Sifre123!" } });
    expect(login.status).toBe(200);
    expect(typeof login.body.token).toBe("string");

    const validate = await api("GET", "/auth/validate", { token: login.body.token });
    expect(validate.status).toBe(200);

    const services = await api("GET", "/services", { token: login.body.token });
    expect(services.status).toBe(200);
  });

  it("yanlis sifreye 401 doner, token vermez", async () => {
    const company = await createCompany();
    const user = await createUser({ companyId: company.id, password: "Sifre123!" });

    const res = await api("POST", "/auth/login", { body: { email: user.email, password: "yanlis" } });
    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  it("5 hatali denemeden sonra dogru sifreyle bile 429 doner", async () => {
    const company = await createCompany();
    const user = await createUser({ companyId: company.id, password: "Sifre123!" });

    for (let i = 0; i < 5; i++) {
      const res = await api("POST", "/auth/login", { body: { email: user.email, password: `yanlis-${i}` } });
      expect(res.status).toBe(401);
    }
    const blocked = await api("POST", "/auth/login", { body: { email: user.email, password: "Sifre123!" } });
    expect(blocked.status).toBe(429);
  });

  it("gecersiz/sahte token reddedilir", async () => {
    const res = await api("GET", "/auth/validate", { token: "sahte.token.degeri" });
    expect(res.status).toBe(401);
  });

  it("eksik alanda eski Turkce mesaji korur, bozuk JSON'a 400 doner", async () => {
    const missing = await api("POST", "/auth/login", { body: { email: "a@b.com" } });
    expect(missing.status).toBe(400);
    expect(missing.body.message).toBe("E-posta ve şifre zorunludur.");

    const malformed = await api("POST", "/auth/login", { rawBody: '{"email": ' });
    expect(malformed.status).toBe(400);
  });
});

describe("kayit ve e-posta dogrulama", () => {
  it("davet koduyla kayit -> maildeki kodla dogrulama -> giris", async () => {
    const company = await createCompany();
    const email = `kayit-${uid()}@e2e.test`;

    const register = await api("POST", "/auth/register", {
      body: {
        name: "Yeni Personel",
        email,
        phone: `53${Math.floor(Math.random() * 1e8).toString().padStart(8, "0")}`,
        password: "Sifre123!",
        inviteCode: company.invitationCode,
        privacyAccepted: true,
      },
    });
    expect(register.status).toBe(201);

    // Dogrulanmadan giris yapilamaz
    const early = await api("POST", "/auth/login", { body: { email, password: "Sifre123!" } });
    expect(early.status).toBe(403);

    const code = await waitForCode(email);
    const verify = await api("POST", "/auth/verify-email", { body: { email, code } });
    expect(verify.status).toBe(200);
    expect(typeof verify.body.token).toBe("string");

    const login = await api("POST", "/auth/login", { body: { email, password: "Sifre123!" } });
    expect(login.status).toBe(200);
  });

  it("GUVENLIK: dogrulanmis hesap icin rastgele kodla token VERMEZ", async () => {
    const company = await createCompany();
    const user = await createUser({ companyId: company.id, password: "Sifre123!", emailVerified: true });

    const res = await api("POST", "/auth/verify-email", { body: { email: user.email, code: "000000" } });
    expect(res.status).toBe(400);
    expect(res.body.token).toBeUndefined();
  });

  it("kisa sifreyle kayit reddedilir", async () => {
    const company = await createCompany();
    const res = await api("POST", "/auth/register", {
      body: {
        name: "X",
        email: `kisa-${uid()}@e2e.test`,
        phone: "5550000000",
        password: "123",
        inviteCode: company.invitationCode,
        privacyAccepted: true,
      },
    });
    expect(res.status).toBe(400);
  });
});

describe("sifre sifirlama", () => {
  it("mail -> kod -> yeni sifre: eski sifre calismaz, yeni sifre calisir, kod tekrar kullanilamaz", async () => {
    const company = await createCompany();
    const user = await createUser({ companyId: company.id, password: "EskiSifre1" });

    const forgot = await api("POST", "/auth/forgot-password", { body: { email: user.email } });
    expect(forgot.status).toBe(200);

    const code = await waitForCode(user.email);
    const reset = await api("POST", "/auth/reset-password", {
      body: { email: user.email, code, newPassword: "YeniSifre1" },
    });
    expect(reset.status).toBe(200);

    const oldLogin = await api("POST", "/auth/login", { body: { email: user.email, password: "EskiSifre1" } });
    expect(oldLogin.status).toBe(401);
    const newLogin = await api("POST", "/auth/login", { body: { email: user.email, password: "YeniSifre1" } });
    expect(newLogin.status).toBe(200);

    const reuse = await api("POST", "/auth/reset-password", {
      body: { email: user.email, code, newPassword: "BaskaSifre1" },
    });
    expect(reuse.status).toBe(400);
  });

  it("GUVENLIK: 5 yanlis koddan sonra dogru kod da reddedilir ve kod DB'den silinir", async () => {
    const company = await createCompany();
    const user = await createUser({ companyId: company.id, password: "EskiSifre1" });

    await api("POST", "/auth/forgot-password", { body: { email: user.email } });
    const realCode = await waitForCode(user.email);
    const wrong = (n: number) => String((Number(realCode) + n) % 900000 + 100000);

    for (let i = 1; i <= 4; i++) {
      const res = await api("POST", "/auth/reset-password", {
        body: { email: user.email, code: wrong(i), newPassword: "Saldirgan1" },
      });
      expect(res.status).toBe(400);
    }
    const fifth = await api("POST", "/auth/reset-password", {
      body: { email: user.email, code: wrong(5), newPassword: "Saldirgan1" },
    });
    expect(fifth.status).toBe(429);

    const withRealCode = await api("POST", "/auth/reset-password", {
      body: { email: user.email, code: realCode, newPassword: "Saldirgan1" },
    });
    expect(withRealCode.status).toBe(429);

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    expect(dbUser?.resetCode).toBeNull();

    // Sifre degismemis olmali
    const login = await api("POST", "/auth/login", { body: { email: user.email, password: "EskiSifre1" } });
    expect(login.status).toBe(200);
  });

  it("GUVENLIK: kayitli olmayan e-posta icin ayni yanit doner ve mail gitmez", async () => {
    const company = await createCompany();
    const user = await createUser({ companyId: company.id, password: "Sifre123!" });
    const ghost = `yok-${uid()}@e2e.test`;

    const known = await api("POST", "/auth/forgot-password", { body: { email: user.email } });
    const unknown = await api("POST", "/auth/forgot-password", { body: { email: ghost } });

    expect(unknown.status).toBe(known.status);
    expect(unknown.body).toEqual(known.body);

    await waitForCode(user.email);
    expect(await listMails(ghost)).toHaveLength(0);
  });

  it("ayni adrese 15 dakikada en fazla 5 sifirlama maili gonderilir", async () => {
    const company = await createCompany();
    const user = await createUser({ companyId: company.id, password: "Sifre123!" });

    for (let i = 0; i < 5; i++) {
      const res = await api("POST", "/auth/forgot-password", { body: { email: user.email } });
      expect(res.status).toBe(200);
    }
    const sixth = await api("POST", "/auth/forgot-password", { body: { email: user.email } });
    expect(sixth.status).toBe(429);

    await waitForCode(user.email, 5);
    expect(await listMails(user.email)).toHaveLength(5);
  });

  it("kod alanina obje gonderilirse 400 doner (sunucu cokmez)", async () => {
    const res = await api("POST", "/auth/reset-password", {
      body: { email: "a@b.com", code: { $ne: null }, newPassword: "Sifre123!" },
    });
    expect(res.status).toBe(400);
  });
});
