export function toSafeFileName(name: string): string {
  return String(name)
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s{2,}/g, " ")
    .trim();
}