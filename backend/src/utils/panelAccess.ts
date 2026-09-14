export const PANEL_KEYS = [
  "services",
  "customers",
  "schedule",
  "stock",
  "quotes",
  "finans",
] as const;

export type PanelKey = (typeof PANEL_KEYS)[number];
export type PanelAccessLevel = "view" | "manage";
export type PanelAccessMap = Partial<Record<PanelKey, PanelAccessLevel>>;

export const DEFAULT_USER_ACCESS: PanelAccessMap = {
  services: "manage",
  customers: "manage",
  schedule: "manage",
};

export function isPanelKey(value: unknown): value is PanelKey {
  return typeof value === "string" && (PANEL_KEYS as readonly string[]).includes(value as PanelKey);
}

function isAccessLevel(v: unknown): v is PanelAccessLevel {
  return v === "view" || v === "manage";
}

export function parsePanelAccess(raw?: string | null): PanelAccessMap | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
    const result: PanelAccessMap = {};
    for (const key of Object.keys(parsed)) {
      if (isPanelKey(key) && isAccessLevel(parsed[key])) {
        result[key as PanelKey] = parsed[key];
      }
    }
    return result;
  } catch {
    return undefined;
  }
}

export function parsePanelAccessOrEmpty(raw?: string | null): PanelAccessMap {
  return parsePanelAccess(raw) ?? {};
}

export function normalizePanelAccess(value: unknown): PanelAccessMap {
  const result: PanelAccessMap = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  for (const [key, level] of Object.entries(value)) {
    if (isPanelKey(key) && isAccessLevel(level)) {
      result[key] = level;
    }
  }
  return result;
}

export function hasAccess(
  panelAccess: PanelAccessMap | undefined | null,
  panel: string,
  minimumMode: PanelAccessLevel
): boolean {
  if (!panelAccess) return false;
  const level = panelAccess[panel as PanelKey];
  if (!level) return false;
  if (minimumMode === "view") return true;
  return level === "manage";
}

export function accessLevel(panelAccess: PanelAccessMap | undefined | null, panel: string): PanelAccessLevel | null {
  return panelAccess?.[panel as PanelKey] ?? null;
}
