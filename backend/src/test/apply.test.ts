import request from "supertest";
import app from "../app";
import { sendApplicationEmail } from "../services/email";
import { resetApplyRateLimits } from "../controllers/applyController";

jest.mock("../services/email", () => ({
  sendApplicationEmail: jest.fn().mockResolvedValue(undefined),
}));

describe("POST /api/apply", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetApplyRateLimits();
    delete process.env.APPLY_MAX_PER_HOUR;
  });

  const valid = {
    businessName: "Örnek Isı Sistemleri",
    name: "Ahmet Yılmaz",
    email: "ahmet@example.com",
    phone: "0532 000 00 00",
    message: "Servis yönetimi için Loomy kullanmak istiyorum.",
  };

  it("returns 400 when required fields are missing", async () => {
    const res = await request(app).post("/api/apply").send({ name: "Ahmet" });
    expect(res.status).toBe(400);
  });

  it("returns 400 for an invalid email", async () => {
    const res = await request(app)
      .post("/api/apply")
      .send({ ...valid, email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Geçerli bir e-posta adresi girin.");
  });

  it("returns 400 when message exceeds max length", async () => {
    const res = await request(app)
      .post("/api/apply")
      .send({ ...valid, message: "x".repeat(2001) });
    expect(res.status).toBe(400);
  });

  it("sends the application email on valid input", async () => {
    const res = await request(app).post("/api/apply").send(valid);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(sendApplicationEmail).toHaveBeenCalledWith({
      businessName: valid.businessName,
      name: valid.name,
      email: valid.email,
      phone: valid.phone,
      message: valid.message,
    });
  });

  it("responds 500 when email sending fails", async () => {
    (sendApplicationEmail as jest.Mock).mockRejectedValueOnce(new Error("smtp down"));
    const res = await request(app).post("/api/apply").send(valid);
    expect(res.status).toBe(500);
  });

  it("rate limits repeated submissions per IP", async () => {
    process.env.APPLY_MAX_PER_HOUR = "2";
    await request(app).post("/api/apply").send(valid);
    await request(app).post("/api/apply").send(valid);
    const third = await request(app).post("/api/apply").send(valid);
    expect(third.status).toBe(429);
  });
});