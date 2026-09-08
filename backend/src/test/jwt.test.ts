import { generateToken, verifyToken, generateDevToken, verifyDevToken } from "../services/jwt";
import jwt from "jsonwebtoken";

jest.mock("jsonwebtoken");

describe("jwt service", () => {
  const mockPayload = {
    id: "user-123",
    email: "test@example.com",
    role: "ADMIN",
    companyId: "company-123",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateToken", () => {
    it("signed with correct payload and expiration", () => {
      (jwt.sign as jest.Mock).mockReturnValue("signed-token");

      const token = generateToken(mockPayload);

      expect(jwt.sign).toHaveBeenCalledWith(mockPayload, expect.any(String), {
        expiresIn: "24h",
      });
      expect(token).toBe("signed-token");
    });
  });

  describe("verifyToken", () => {
    it("verifies and returns payload", () => {
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const result = verifyToken("some-token");

      expect(jwt.verify).toHaveBeenCalledWith("some-token", expect.any(String));
      expect(result).toEqual(mockPayload);
    });

    it("throws on invalid token", () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("invalid token");
      });

      expect(() => verifyToken("bad-token")).toThrow("invalid token");
    });
  });

  describe("generateDevToken", () => {
    it("signs a dev token with 12h expiry", () => {
      (jwt.sign as jest.Mock).mockReturnValue("dev-token");

      const token = generateDevToken();

      expect(jwt.sign).toHaveBeenCalledWith(
        { dev: true },
        expect.any(String),
        { expiresIn: "12h" }
      );
      expect(token).toBe("dev-token");
    });
  });

  describe("verifyDevToken", () => {
    it("verifies dev token and returns payload", () => {
      (jwt.verify as jest.Mock).mockReturnValue({ dev: true });

      const result = verifyDevToken("dev-token");

      expect(jwt.verify).toHaveBeenCalledWith("dev-token", expect.any(String));
      expect(result).toEqual({ dev: true });
    });
  });
});
