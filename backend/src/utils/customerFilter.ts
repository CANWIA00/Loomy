/**
 * Liste endpointleri icin istege bagli musteri filtresi. Musteri detay ekrani
 * daha once sirketin son N kaydini cekip istemcide filtreliyordu; N'den eski
 * kayitlar musteri gecmisinde gorunmuyordu. Eski kayitlarda customerId bos
 * olabildigi icin isim eslesmesi de desteklenir.
 */
export function customerWhere(query: Record<string, unknown>) {
  const customerId = typeof query.customerId === "string" ? query.customerId.trim() : "";
  const customerName = typeof query.customerName === "string" ? query.customerName.trim().slice(0, 300) : "";

  const or: Array<Record<string, unknown>> = [];
  if (customerId) or.push({ customerId });
  if (customerName) or.push({ customerName: { contains: customerName, mode: "insensitive" as const } });

  return or.length ? { OR: or } : {};
}
