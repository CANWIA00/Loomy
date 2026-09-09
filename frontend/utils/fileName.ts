const TURKISH_MAP: Record<string, string> = {
  ğ: "g",
  Ğ: "G",
  ü: "u",
  Ü: "U",
  ş: "s",
  Ş: "S",
  ı: "i",
  İ: "I",
  ö: "o",
  Ö: "O",
  ç: "c",
  Ç: "C",
};

export function toSafeFileName(name: string): string {
  return String(name)
    .replace(/[ğĞüÜşŞıİöÖçÇ]/g, (c) => TURKISH_MAP[c] ?? c)
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s{2,}/g, " ")
    .trim();
}