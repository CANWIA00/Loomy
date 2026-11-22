export const durationToMs = (duration: string): number => {
  if (duration === "tümgün") return 24 * 60 * 60 * 1000;
  const hours = /^(\d+(\.\d+)?)saat$/.exec(duration);
  if (hours) return parseFloat(hours[1]) * 60 * 60 * 1000;
  const map: Record<string, number> = {
    "30dk": 30 * 60 * 1000,
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

/** "2026-11-25" -> "25/11/2026" (uygulamanin geri kalaniyla ayni bicim) */
export const formatIsoDate = (s: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
};

/** "1saat" / "1.5saat" / "30dk" -> "1 sa" / "1 sa 30 dk" / "30 dk" */
export const formatDuration = (duration: string, units = { h: "sa", m: "dk" }): string => {
  if (!duration) return "";
  const totalMin = Math.round(durationToMs(duration) / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return [h ? `${h} ${units.h}` : "", m ? `${m} ${units.m}` : ""].filter(Boolean).join(" ");
};
