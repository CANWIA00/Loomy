export const MAX_PAGE_SIZE = 200;

/**
 * Sorgu parametrelerinden guvenli sayfalama degerleri uretir. `size` ust
 * siniri, tek istekte tum tablonun cekilmesini engeller.
 */
export function parsePagination(
  query: Record<string, unknown>,
  defaultSize: number
): { page: number; size: number } {
  const rawPage = parseInt(String(query.page ?? ""), 10);
  const rawSize = parseInt(String(query.size ?? ""), 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 0;
  const size = Number.isFinite(rawSize) && rawSize > 0 ? Math.min(rawSize, MAX_PAGE_SIZE) : defaultSize;
  return { page, size };
}
