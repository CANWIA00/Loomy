import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";
const JWT_EXPIRES_IN = "24h";

interface TokenPayload {
  id: string;
  email: string;
  role: string;
  companyId?: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

interface DevTokenPayload {
  dev: boolean;
}

export function generateDevToken(): string {
  const payload: DevTokenPayload = { dev: true };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
}

export function verifyDevToken(token: string): DevTokenPayload {
  return jwt.verify(token, JWT_SECRET) as DevTokenPayload;
}
