import { Request, Response } from "express";
import prisma from "../prisma";
import { verifyEmail, forgotPassword, resetPassword, resendVerification } from "../controllers/authController";
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/email";

jest.mock("../services/email", () => ({
  generateVerificationCode: jest.fn(() => "123456"),
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

jest.mock("../prisma", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const findUnique = prisma.user.findUnique as jest.Mock;
const update = prisma.user.update as jest.Mock;

function mockRes() {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

let counter = 0;
function uniqueEmail() {
  counter += 1;
  return `user${counter}@example.com`;
}

function req(body: Record<string, unknown>): Request {
  return { body, headers: {}, ip: "1.2.3.4" } as unknown as Request;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("verifyEmail", () => {
  it("does not issue a token for an already verified account", async () => {
    findUnique.mockResolvedValue({ id: "u1", emailVerified: true, company: null });
    const res = mockRes();
    await verifyEmail(req({ email: uniqueEmail(), code: "000000" }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect((res.json as jest.Mock).mock.calls[0][0].token).toBeUndefined();
  });

  it("invalidates the code after 5 wrong attempts", async () => {
    const email = uniqueEmail();
    findUnique.mockResolvedValue({
      id: "u1",
      emailVerified: false,
      verificationCode: "654321",
      verificationExpires: new Date(Date.now() + 60_000),
      company: null,
    });
    let res = mockRes();
    for (let i = 0; i < 5; i++) {
      res = mockRes();
      await verifyEmail(req({ email, code: "000000" }), res);
    }
    expect(res.status).toHaveBeenLastCalledWith(429);
    expect(update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { verificationCode: null, verificationExpires: null },
    });

    // Dogru kod bile artik kabul edilmez.
    res = mockRes();
    await verifyEmail(req({ email, code: "654321" }), res);
    expect(res.status).toHaveBeenCalledWith(429);
  });
});

describe("resetPassword", () => {
  it("blocks brute force and clears the reset code", async () => {
    const email = uniqueEmail();
    findUnique.mockResolvedValue({
      id: "u2",
      resetCode: "111111",
      resetCodeExpires: new Date(Date.now() + 60_000),
    });
    let res = mockRes();
    for (let i = 0; i < 5; i++) {
      res = mockRes();
      await resetPassword(req({ email, code: String(200000 + i), newPassword: "secret12" }), res);
    }
    expect(res.status).toHaveBeenLastCalledWith(429);
    expect(update).toHaveBeenCalledWith({
      where: { id: "u2" },
      data: { resetCode: null, resetCodeExpires: null },
    });

    res = mockRes();
    await resetPassword(req({ email, code: "111111", newPassword: "secret12" }), res);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it("does not reveal whether the account exists", async () => {
    findUnique.mockResolvedValue(null);
    const res = mockRes();
    await resetPassword(req({ email: uniqueEmail(), code: "111111", newPassword: "secret12" }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("forgotPassword / resendVerification", () => {
  it("returns the same response for unknown and known emails", async () => {
    findUnique.mockResolvedValueOnce(null);
    const unknownRes = mockRes();
    await forgotPassword(req({ email: uniqueEmail() }), unknownRes);

    findUnique.mockResolvedValueOnce({ id: "u3", isActive: true, name: "A" });
    const knownRes = mockRes();
    await forgotPassword(req({ email: uniqueEmail() }), knownRes);

    expect(unknownRes.status).not.toHaveBeenCalled();
    expect(knownRes.status).not.toHaveBeenCalled();
    expect((unknownRes.json as jest.Mock).mock.calls[0][0]).toEqual(
      (knownRes.json as jest.Mock).mock.calls[0][0]
    );
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
  });

  it("limits how many reset emails can be requested", async () => {
    const email = uniqueEmail();
    findUnique.mockResolvedValue({ id: "u4", isActive: true, name: "A" });
    let res = mockRes();
    for (let i = 0; i < 6; i++) {
      res = mockRes();
      await forgotPassword(req({ email }), res);
    }
    expect(res.status).toHaveBeenCalledWith(429);
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(5);
  });

  it("resendVerification does not reveal unknown emails", async () => {
    findUnique.mockResolvedValue(null);
    const res = mockRes();
    await resendVerification(req({ email: uniqueEmail() }), res);
    expect(res.status).not.toHaveBeenCalled();
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });
});
