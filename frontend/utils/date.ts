export const durationToMs = (duration: string): number => {
  const map: Record<string, number> = {
    "30dk": 30 * 60 * 1000,
    "1saat": 60 * 60 * 1000,
    "1.5saat": 90 * 60 * 1000,
    "2saat": 120 * 60 * 1000,
  };
  return map[duration] || 60 * 60 * 1000;
};

export const parseSaat = (s: string): { h: number; m: number } => {
  const [h, m] = s.split(":").map(Number);
  return { h, m: m || 0 };
};

export const dateToStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const strToDate = (s: string): Date => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
