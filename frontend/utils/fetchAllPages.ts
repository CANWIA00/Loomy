export interface PageResponse<T> {
  data: { content: T[]; totalPages: number };
}

/**
 * Sayfali bir liste endpoint'inin tum sayfalarini sirayla ceker.
 * `maxPages` sonsuz donguye karsi bir emniyettir.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<PageResponse<T>>,
  maxPages = 25
): Promise<T[]> {
  const all: T[] = [];
  for (let page = 0; page < maxPages; page++) {
    const res = await fetchPage(page);
    all.push(...res.data.content);
    if (page + 1 >= res.data.totalPages) break;
  }
  return all;
}
