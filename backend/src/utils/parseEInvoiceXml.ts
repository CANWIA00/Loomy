import { XMLParser } from "fast-xml-parser";

export interface ParsedInvoiceLine {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineAmount: number;
  vatRate: number;
}

export interface ParsedEInvoice {
  invoiceNo: string;
  invoiceType: string | null;
  date: string | null;
  supplierName: string | null;
  supplierTaxNumber: string | null;
  supplierAddress: string | null;
  totalAmount: number | null;
  vatAmount: number | null;
  currency: string;
  lines: ParsedInvoiceLine[];
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  parseTagValue: true,
  parseAttributeValue: true,
  trimValues: true,
  processEntities: true,
});

const UNIT_MAP: Record<string, string> = {
  C62: "AD",
  NAR: "AD",
  CST: "SET",
  MTR: "MT",
  MMT: "MM",
  CMT: "CM",
  KMT: "KM",
  MTK: "M2",
  MTQ: "M3",
  LTR: "LT",
  MLT: "ML",
  GRM: "GR",
  KGM: "KG",
  TNE: "TON",
  PA: "PAKET",
  PK: "PAKET",
  BX: "KUTU",
  CT: "KARTON",
  EA: "AD",
  PCE: "AD",
  NO: "AD",
};

export function resolveUnit(code: string | null | undefined): string {
  if (!code) return "AD";
  const upper = String(code).trim().toUpperCase();
  return UNIT_MAP[upper] ?? upper;
}

function toStr(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") {
    const s = v.trim();
    return s || null;
  }
  return String(v);
}

function nodeText(v: unknown): unknown {
  if (v != null && typeof v === "object") {
    const obj = v as Record<string, unknown>;
    return obj["#text"] ?? null;
  }
  return v;
}

function nodeAttr(v: unknown, name: string): string | null {
  if (v != null && typeof v === "object") {
    return toStr((v as Record<string, unknown>)[`@_${name}`]);
  }
  return null;
}

function toNum(v: unknown): number | null {
  const text = nodeText(v);
  if (text == null) return null;
  const n = typeof text === "number" ? text : Number.parseFloat(String(text).trim());
  return Number.isFinite(n) ? n : null;
}

function asArray<T>(v: T | T[] | null | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function currencyOf(o: any): string {
  return nodeAttr(o, "currencyID") ?? "TRY";
}

export function parseEInvoiceXml(xml: string): ParsedEInvoice {
  const parsed = parser.parse(xml);
  const root = parsed?.Invoice ?? parsed?.InvoiceEnvelope ?? parsed?.EInvoice ?? parsed;
  if (!root || typeof root !== "object" || Array.isArray(root)) {
    throw new Error("Belge geçersiz: Invoice kök öğesi bulunamadı.");
  }

  const inv: any = root;
  const supplierParty = inv.AccountingSupplierParty?.Party ?? {};
  const partyLegalEntity = supplierParty.PartyLegalEntity ?? {};
  const postal = supplierParty.PostalAddress ?? {};
  const supplierAddress = [postal.StreetName, postal.BuildingNumber, postal.CityName, postal.CountrySubentity]
    .map((p) => toStr(p))
    .filter(Boolean)
    .join(", ") || null;

  const lmt = inv.LegalMonetaryTotal ?? {};
  const payable = lmt.PayableAmount;

  const invoiceType =
    toStr(inv.InvoiceTypeCode) ?? toStr(inv.InvoiceDocumentType) ?? toStr(inv.ProfileID);

  const lines = asArray<any>(inv.InvoiceLine).map((line) => {
    const item = line.Item ?? {};
    const priceNode = line.Price?.PriceAmount;
    const vatNodes = item.ClassifiedTaxCategory
      ? asArray<any>(item.ClassifiedTaxCategory)
      : [];
    const vatRateValue = (vatNodes[0] && (vatNodes[0].Percent ?? vatNodes[0].TaxPercent)) ?? null;
    const name = toStr(item.Name) ?? "Adsız Ürün";
    const quantity = toNum(line.InvoicedQuantity) ?? 0;
    const lineAmount = toNum(line.LineExtensionAmount) ?? 0;
    const unitPrice =
      toNum(priceNode) ?? (quantity > 0 ? Math.round((lineAmount / quantity) * 100) / 100 : 0);

    return {
      name,
      quantity,
      unit: resolveUnit(nodeAttr(line.InvoicedQuantity, "unitCode") ?? null),
      unitPrice,
      lineAmount,
      vatRate: toNum(vatRateValue) ?? 0,
    };
  });

  const currency = currencyOf(payable);

  return {
    invoiceNo: toStr(inv.ID) ?? "BİLİNMEYEN",
    invoiceType,
    date: toStr(inv.IssueDate) ?? toStr(inv.IssueTime) ?? null,
    supplierName:
      toStr(partyLegalEntity.RegistrationName) ??
      toStr(supplierParty.PartyName?.Name) ??
      null,
    supplierTaxNumber: toStr(partyLegalEntity.CompanyID) ?? null,
    supplierAddress,
    totalAmount: toNum(payable) ?? toNum(lmt.TaxInclusiveAmount) ?? null,
    vatAmount: toNum(inv.TaxTotal?.TaxAmount) ?? null,
    currency,
    lines,
  };
}