import { Request } from "express";

interface AttemptEntry {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

const store = new Map<string, AttemptEntry>();

function cleanup(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"]?.toString().split(",")[0].trim();
  return forwarded || req.socket.remoteAddress || "unknown";
}

export function attemptKey(req: Request, email: string, prefix: string): string {
  const normalized = email.trim().toLowerCase();
  return `${prefix}:${normalized}:${clientIp(req)}`;
}

export function isBlocked(key: string): boolean {
  cleanup();
  const entry = store.get(key);
  return !!entry && entry.resetAt > Date.now() && entry.count >= MAX_FAILURES;
}

export function recordFailure(key: string): void {
  cleanup();
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export function clearAttempts(key: string): void {
  store.delete(key);
}