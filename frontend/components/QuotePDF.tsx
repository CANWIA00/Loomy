import type { QuotePdfData } from "./quotes/types";
import { formatMoney, round2, KDV_RATE, getCurrencySymbol } from "./quotes/types";
import { convertToTry } from "../utils/currencyRates";

function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderCompanyFooter(
  data: Pick<QuotePdfData, "companyName" | "companyAddress" | "companyPhone" | "companyGsm" | "companyEmail" | "companyFax" | "companyWebsite" | "companyTaxNumber">,
  lang: "tr" | "en",
  t: (key: string, params?: Record<string, string>) => string
): string {
  const lines: string[] = [];
  lines.push(`<div class="footer-text">${escapeHtml(data.companyName || t("pdf.companyNameLabel"))}</div>`);
  lines.push(`<div class="footer-text">${escapeHtml(data.companyAddress || t("pdf.companyAddressLabel"))}</div>`);
  let phone = "";
  if (data.companyPhone) phone += `Tel: ${escapeHtml(data.companyPhone)}`;
  if (data.companyGsm) phone += (phone ? " &nbsp;&nbsp; " : "") + `Gsm: ${escapeHtml(data.companyGsm)}`;
  if (phone) lines.push(`<div class="footer-text">${phone}</div>`);
  const extra: string[] = [];
  if (data.companyEmail) extra.push(`Email: ${escapeHtml(data.companyEmail)}`);
  if (data.companyFax) extra.push(`Fax: ${escapeHtml(data.companyFax)}`);
  if (data.companyWebsite) extra.push(`Web: ${escapeHtml(data.companyWebsite)}`);
  if (extra.length) lines.push(`<div class="footer-text">${extra.join(" &nbsp;&nbsp; ")}</div>`);
  if (data.companyTaxNumber) lines.push(`<div class="footer-text">${lang === "tr" ? "Vergi No" : "Tax No"}: ${escapeHtml(data.companyTaxNumber)}</div>`);
  return `<div class="footer footer-push">\n${lines.join("\n    ")}\n  </div>`;
}

export function generateQuotePDFHtml(
  data: QuotePdfData,
  t: (key: string, params?: Record<string, string>) => string,
  lang: "tr" | "en" = "tr"
): string {
  const lines = (data.lines || []).filter((l) => l && (l.name || l.details) && l.quantity > 0);

  const titleSuffix = lang === "tr" ? "Teklifi" : "Quote";
  const displayTitle = data.title
    ? new RegExp(`${titleSuffix}$`, "i").test(data.title.trim())
      ? data.title
      : `${data.title.trim()} ${titleSuffix}`
    : "";

  const currencyGroups: Record<string, { subTotal: number; kdv: number; grandTotal: number }> = {};
  lines.forEach((l) => {
    const cur = l.currency || "TRY";
    if (!currencyGroups[cur]) currencyGroups[cur] = { subTotal: 0, kdv: 0, grandTotal: 0 };
    currencyGroups[cur].subTotal += l.quantity * l.unitPrice;
  });
  Object.keys(currencyGroups).forEach((cur) => {
    currencyGroups[cur].subTotal = round2(currencyGroups[cur].subTotal);
    currencyGroups[cur].kdv = round2(currencyGroups[cur].subTotal * KDV_RATE);
    currencyGroups[cur].grandTotal = round2(currencyGroups[cur].subTotal + currencyGroups[cur].kdv);
  });

  const rows = lines
    .map((l, i) => {
      const total = round2(l.quantity * l.unitPrice);
      const cur = l.currency || "TRY";
      const sym = getCurrencySymbol(cur);
      const totalTry = convertToTry(total, cur, data.tryRates);
      const showTry = cur !== "TRY" && totalTry !== null;
      return `
      <div class="quote-row">
        <div class="qcell num" style="width:22px">${i + 1}</div>
        <div class="qcell" style="flex:1">
          <div class="prod-name">${escapeHtml(l.name)}</div>
          ${l.details ? `<div class="prod-details">${escapeHtml(l.details)}</div>` : ""}
        </div>
        <div class="qcell num" style="width:34px">${l.quantity}</div>
        <div class="qcell num" style="width:44px">${escapeHtml(l.unit || "Adet")}</div>
        <div class="qcell num" style="width:62px">${formatMoney(l.unitPrice)} ${sym}</div>
        <div class="qcell num" style="width:74px">${formatMoney(total)} ${sym}${showTry ? `<div class="converted">≈ ${formatMoney(totalTry!)} ₺</div>` : ""}</div>
      </div>`;
    })
    .join("");

  const totals = Object.keys(currencyGroups)
    .map((cur) => {
      const sym = getCurrencySymbol(cur);
      const isTry = cur === "TRY";
      const subTry = isTry ? null : convertToTry(currencyGroups[cur].subTotal, cur, data.tryRates);
      const kdvTry = isTry ? null : convertToTry(currencyGroups[cur].kdv, cur, data.tryRates);
      const grandTry = isTry ? null : convertToTry(currencyGroups[cur].grandTotal, cur, data.tryRates);
      return `
    <tr class="total-row">
      <td class="tot-label" colspan="5">${lang === "tr" ? "Ara Toplam" : "Subtotal"} (${cur})</td>
      <td class="num tot-value">${formatMoney(currencyGroups[cur].subTotal)} ${sym}${subTry !== null ? `<div class="converted">≈ ${formatMoney(subTry)} ₺</div>` : ""}</td>
    </tr>
    <tr class="total-row">
      <td class="tot-label" colspan="5">${lang === "tr" ? `KDV (%${Math.round(KDV_RATE * 100)})` : `VAT (${Math.round(KDV_RATE * 100)}%)`}</td>
      <td class="num tot-value">${formatMoney(currencyGroups[cur].kdv)} ${sym}${kdvTry !== null ? `<div class="converted">≈ ${formatMoney(kdvTry)} ₺</div>` : ""}</td>
    </tr>
    <tr class="grand-row">
      <td class="tot-label" colspan="5">${lang === "tr" ? "Genel Toplam" : "Grand Total"} (${cur})</td>
      <td class="num grand-value">${formatMoney(currencyGroups[cur].grandTotal)} ${sym}${grandTry !== null ? `<div class="converted">≈ ${formatMoney(grandTry)} ₺</div>` : ""}</td>
    </tr>`;
    })
    .join(`<tr><td colspan="5" style="height:6px"></td></tr>`);

  const grandTotalTry = Object.keys(currencyGroups).reduce((s, cur) => {
    const conv = convertToTry(currencyGroups[cur].grandTotal, cur, data.tryRates);
    return conv === null ? s : s + conv;
  }, 0);
  const hasForeignCurrency = Object.keys(currencyGroups).some((cur) => cur !== "TRY");
  const ratesAvailable = !!data.tryRates && hasForeignCurrency;

  const rateLabel = lang === "tr" ? "Efektif Satış Kuru" : "Effective Selling Rate";

  const tryInfoRows = ratesAvailable
    ? `
    <tr class="total-row">
      <td class="tot-label" colspan="5">${rateLabel} (${data.tryRates!.source} · ${escapeHtml(data.tryRates!.rateDate)})</td>
    </tr>
    ${Object.keys(currencyGroups)
      .filter((cur) => cur !== "TRY")
      .map(
        (cur) => `<tr class="total-row">
      <td class="tot-label" colspan="5">1 ${cur}</td>
      <td class="num tot-value">${data.tryRates!.rates[cur].toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ₺</td>
    </tr>`
      )
      .join("")}
    <tr class="grand-row">
      <td class="tot-label" colspan="5">${lang === "tr" ? "Genel Toplam (₺)" : "Grand Total (₺)"}</td>
      <td class="num grand-value">≈ ${formatMoney(grandTotalTry)} ₺</td>
    </tr>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    @page { margin: 8mm; size: A4; }
    html, body {
      margin: 0;
      padding: 0;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 8.5px;
      color: #222238;
    }
    .content-wrapper {
      padding-bottom: 0;
      min-height: 264mm;
      display: flex;
      flex-direction: column;
    }
    .company-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      border-bottom: 2px solid #222238;
      padding-bottom: 5px;
      margin-bottom: 8px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .company-left {
      flex: 1;
      display: flex;
      align-items: center;
    }
    .company-logo {
      max-height: 48px;
      max-width: 140px;
      object-fit: contain;
    }
    .header-title {
      flex: 1;
      text-align: center;
    }
    .title {
      font-size: 15px;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    .quote-title {
      font-size: 10px;
      font-weight: bold;
      margin-top: 3px;
    }
    .title-area {
      flex: 1;
      text-align: right;
    }
    .title-date {
      font-size: 7px;
      color: #444;
      margin-top: 1px;
      text-align: right;
    }
    .section {
      margin-bottom: 5px;
    }
    .section-title {
      font-size: 7.5px;
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 1px solid #222238;
      padding-bottom: 1px;
      margin-bottom: 3px;
    }
    .two-column {
      display: flex;
      gap: 16px;
      margin-bottom: 5px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .two-column .section {
      flex: 1;
      margin-bottom: 0;
    }
    .info-list {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .info-item {
      font-size: 8px;
      line-height: 1.3;
    }
    .label {
      font-weight: bold;
    }
    .items-table {
      margin-bottom: 5px;
    }
    .qthead {
      display: flex;
      align-items: center;
      border-bottom: 1.5px solid #222238;
      padding: 2px 0;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .qth {
      font-size: 7px;
      font-weight: bold;
      text-transform: uppercase;
      padding: 0 4px;
    }
    .qth.num {
      text-align: right;
      white-space: nowrap;
    }
    .quote-row {
      display: flex;
      align-items: flex-start;
      border-bottom: 1px solid #ddd;
      padding: 3px 0;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .qcell {
      font-size: 8px;
      padding: 0 4px;
    }
    .qcell.num {
      text-align: right;
      white-space: nowrap;
    }
    .prod-name {
      font-weight: bold;
      font-size: 8px;
    }
    .prod-details {
      font-size: 7px;
      color: #666;
      margin-top: 0;
    }
    .total-section {
      display: flex;
      justify-content: flex-end;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .total-table {
      border-collapse: collapse;
      min-width: 180px;
    }
    .total-table td {
      padding: 2px 4px;
    }
    .total-row .tot-label {
      font-weight: normal;
      text-align: right;
    }
    .total-row .tot-value {
      font-weight: bold;
    }
    .converted {
      font-size: 6px;
      color: #666;
      font-weight: normal;
      margin-top: 0;
    }
    .grand-row .tot-label {
      font-weight: bold;
      border-top: 1.5px solid #222238;
    }
    .grand-row .grand-value {
      font-weight: bold;
      font-size: 11px;
      border-top: 1.5px solid #222238;
      color: #222238;
    }
    .notes-content {
      font-size: 6.5px;
      white-space: pre-wrap;
      color: #444;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .footer {
      margin-top: 6px;
      border-top: 1px solid #ddd;
      padding-top: 4px;
      text-align: center;
    }
    .footer-push {
      margin-top: auto;
    }
    .footer-text {
      font-size: 6.5px;
      color: #999;
      line-height: 1.3;
      text-align: center;
    }
    .privacy-note {
      margin-top: 4px;
      padding-top: 3px;
      border-top: 1px solid #eee;
      text-align: center;
      page-break-inside: avoid;
    }
    .privacy-title {
      font-size: 5.5px;
      font-weight: bold;
      color: #888;
    }
    .privacy-body {
      font-size: 5.5px;
      color: #888;
      line-height: 1.2;
      margin-top: 0;
    }
  </style>
</head>
<body>
  <div class="content-wrapper">
    <div class="company-header">
      <div class="company-left">
        ${data.companyLogo ? `<img class="company-logo" src="${data.companyLogo}" onerror="this.style.display='none'" />` : ""}
      </div>
<div class="header-title">
        <div class="title">${escapeHtml(data.companyName)}</div>
        ${displayTitle ? `<div class="quote-title">${escapeHtml(displayTitle)}</div>` : ""}
      </div>
      <div class="title-area">
        <div class="title-date">${t("qot.date")} ${escapeHtml(data.documentDate) || ""}</div>
        ${data.validUntil ? `<div class="title-date">${t("qot.validUntil")} ${escapeHtml(data.validUntil)}</div>` : ""}
      </div>
    </div>

    <div class="two-column">
      <div class="section">
        <div class="section-title">${t("qot.companyInfo")}</div>
        <div class="info-list">
          <div class="info-item"><span class="label">${t("qot.companyName")}</span> <span class="value">${escapeHtml(data.companyName)}</span></div>
          <div class="info-item"><span class="label">${t("qot.address")}</span> <span class="value">${escapeHtml(data.companyAddress) || ""}</span></div>
          <div class="info-item"><span class="label">${t("qot.companyPhone")}</span> <span class="value">${escapeHtml(data.companyPhone) || ""}</span></div>
          ${data.companyGsm ? `<div class="info-item"><span class="label">${t("qot.companyGsm")}</span> <span class="value">${escapeHtml(data.companyGsm)}</span></div>` : ""}
          <div class="info-item"><span class="label">${t("qot.companyFax")}</span> <span class="value">${escapeHtml(data.companyFax) || ""}</span></div>
          <div class="info-item"><span class="label">${t("qot.companyEmail")}</span> <span class="value">${escapeHtml(data.companyEmail) || ""}</span></div>
          <div class="info-item"><span class="label">${t("qot.companyWebsite")}</span> <span class="value">${escapeHtml(data.companyWebsite) || ""}</span></div>
          ${data.companyTaxNumber ? `<div class="info-item"><span class="label">${t("qot.companyTax")}</span> <span class="value">${escapeHtml(data.companyTaxNumber)}</span></div>` : ""}
        </div>
      </div>
      <div class="section">
        <div class="section-title">${t("qot.customerInfo")}</div>
        <div class="info-list">
          <div class="info-item"><span class="label">${t("qot.customerName")}</span> <span class="value">${escapeHtml(data.customerName)}</span></div>
          ${data.contactPerson ? `<div class="info-item"><span class="label">${t("qot.contactPerson")}</span> <span class="value">${escapeHtml(data.contactPerson)}</span></div>` : ""}
          ${data.phone ? `<div class="info-item"><span class="label">${t("qot.phone")}</span> <span class="value">${escapeHtml(data.phone)}</span></div>` : ""}
          ${data.fax ? `<div class="info-item"><span class="label">${t("qot.fax")}</span> <span class="value">${escapeHtml(data.fax)}</span></div>` : ""}
          ${data.address ? `<div class="info-item"><span class="label">${t("qot.address")}</span> <span class="value">${escapeHtml(data.address)}</span></div>` : ""}
          ${data.website ? `<div class="info-item"><span class="label">${t("qot.website")}</span> <span class="value">${escapeHtml(data.website)}</span></div>` : ""}
          ${data.subscriberNo ? `<div class="info-item"><span class="label">${t("qot.subscriberNo")}</span> <span class="value">${escapeHtml(data.subscriberNo)}</span></div>` : ""}
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">${t("qot.notes")}</div>
      <div class="notes-content">${escapeHtml(data.notes)}</div>
    </div>

    <div class="section">
      <div class="section-title">${t("qot.items")}</div>
      <div class="items-table">
        <div class="qthead">
          <div class="qth num" style="width:22px">#</div>
          <div class="qth" style="flex:1">${t("qot.product")}</div>
          <div class="qth num" style="width:34px">${t("qot.quantity")}</div>
          <div class="qth num" style="width:44px">${t("qot.unit")}</div>
          <div class="qth num" style="width:62px">${t("qot.unitPrice")}</div>
          <div class="qth num" style="width:74px">${t("qot.total")}</div>
        </div>
        ${rows || `<div class="quote-row"><div class="qcell" style="color:#888">${t("qot.noItems")}</div></div>`}
      </div>
    </div>

    <div class="section">
      <div class="total-section">
        <table class="total-table">
          <tbody>
            ${totals}
            ${tryInfoRows}
          </tbody>
        </table>
      </div>
    </div>

    ${renderCompanyFooter(data, lang, t)}

    <div class="privacy-note">
      <div class="privacy-title">${t("pdf.privacyNoteTitle")}</div>
      <div class="privacy-body">${t("pdf.privacyNoteBody")}</div>
    </div>
  </div>
</body>
</html>`;
}
