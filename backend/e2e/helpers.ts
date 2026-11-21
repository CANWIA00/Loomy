import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const API_URL = process.env.E2E_API_URL || "http://127.0.0.1:58080/api";
export const MAILPIT_URL = process.env.E2E_MAILPIT_URL || "http://127.0.0.1:58025";
export const DATABASE_URL =
  process.env.E2E_DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:55432/loomy_e2e?schema=public";

export const prisma = new PrismaClient({ datasourceUrl: DATABASE_URL });

export interface ApiResult<T = any> {
  status: number;
  body: T;
}

export async function api<T = any>(
  method: string,
  path: string,
  options: { body?: unknown; token?: string; rawBody?: string } = {}
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: options.rawBody ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
  });
  const text = await res.text();
  let body: any = text;
  try {
    body = JSON.parse(text);
  } catch {
    /* JSON olmayan yanit */
  }
  return { status: res.status, body };
}

/** Her test icin cakismayan benzersiz bir sonek. */
export function uid(): string {
  return crypto.randomBytes(5).toString("hex");
}

export async function createCompany(name = `E2E Firma ${uid()}`) {
  return prisma.company.create({
    data: { name, invitationCode: `INVITE-${uid().toUpperCase()}`, profileCompleted: true },
  });
}

export async function createUser(opts: {
  companyId: string;
  password: string;
  role?: "ADMIN" | "USER";
  emailVerified?: boolean;
  email?: string;
}) {
  const email = opts.email ?? `user-${uid()}@e2e.test`;
  const user = await prisma.user.create({
    data: {
      name: "E2E Kullanici",
      email,
      phone: `5${Math.floor(Math.random() * 1e9).toString().padStart(9, "0")}`,
      password: await bcrypt.hash(opts.password, 10),
      role: opts.role ?? "ADMIN",
      emailVerified: opts.emailVerified ?? true,
      inviteCode: "E2E",
      companyId: opts.companyId,
    },
  });
  return { ...user, email };
}

// ---- Mailpit ----

interface MailSummary {
  ID: string;
  To: Array<{ Address: string }>;
  Subject: string;
}

export async function listMails(to: string): Promise<MailSummary[]> {
  const res = await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`);
  const data = (await res.json()) as { messages: MailSummary[] };
  return data.messages ?? [];
}

/** Belirtilen adrese gelen en yeni mailden 6 haneli kodu okur (gerekirse bekler). */
export async function waitForCode(to: string, minCount = 1, timeoutMs = 20000): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const mails = await listMails(to);
    if (mails.length >= minCount) {
      const res = await fetch(`${MAILPIT_URL}/api/v1/message/${mails[0].ID}`);
      const msg = (await res.json()) as { Text: string };
      const match = msg.Text.match(/kodunuz:\s*(\d{6})/);
      if (!match) throw new Error(`Mailde kod bulunamadi: ${msg.Text}`);
      return match[1];
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`${to} adresine ${timeoutMs}ms icinde mail gelmedi`);
}
