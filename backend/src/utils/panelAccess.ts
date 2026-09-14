export const PANEL_KEYS = [
  "services",
  "customers",
  "schedule",
  "stock",
  "quotes",
  "finans",
] as const;

export function isPanelKey(value: unknown): value is string {
  return typeof value === "string" && (PANEL_KEYS as readonly string[]).includes(value);
}

export function parsePanelAccess(raw?: string | null): string[] | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isPanelKey) : undefined;
  } catch {
    return undefined;
  }
}

export function parsePanelAccessOrEmpty(raw?: string | null): string[] {
  return parsePanelAccess(raw) ?? [];
}

export function normalizePanelAccess(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(isPanelKey))];
}