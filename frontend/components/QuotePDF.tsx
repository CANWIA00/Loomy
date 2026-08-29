import type { QuotePdfData } from "./quotes/types";
import { formatMoney, round2, KDV_RATE } from "./quotes/types";

function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function generateQuotePDFHtml(
  data: QuotePdfData,
  t: (key: string, params?: Record<string, string>) => string,
  lang: "tr" | "en" = "tr"
): string {
  const lines = (data.lines || []).filter((l) => l && (l.name || l.details) && l.quantity > 0);
  const subTotal = round2(lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0));
  const kdv = round2(subTotal * KDV_RATE);
  const grandTotal = round2(subTotal + kdv);

  const rows = lines
    .map((l, i) => {
      const total = round2(l.quantity * l.unitPrice);
      return `
      <tr>
        <td class="num">${i + 1}</td>
        <td>
          <div class="prod-name">${escapeHtml(l.name)}</div>
          ${l.details ? `<div class="prod-details">${escapeHtml(l.details)}</div>` : ""}
        </td>
        <td class="num">${l.quantity}</td>
        <td class="num">${formatMoney(l.unitPrice)}</td>
        <td class="num">${formatMoney(total)}</td>
      </tr>`;
    })
    .join("");

  const totals = `
    <tr class="total-row">
      <td class="tot-label" colspan="4">${lang === "tr" ? "Ara Toplam" : "Subtotal"}</td>
      <td class="num tot-value">${formatMoney(subTotal)}</td>
    </tr>
    <tr class="total-row">
      <td class="tot-label" colspan="4">${lang === "tr" ? `KDV (%${Math.round(KDV_RATE * 100)})` : `VAT (${Math.round(KDV_RATE * 100)}%)`}</td>
      <td class="num tot-value">${formatMoney(kdv)}</td>
    </tr>
    <tr class="grand-row">
      <td class="tot-label" colspan="4">${lang === "tr" ? "Genel Toplam" : "Grand Total"}</td>
      <td class="num grand-value">${formatMoney(grandTotal)}</td>
    </tr>
  `;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    @page { margin: 12mm; size: A4; }
    html, body {
      margin: 0;
      padding: 0;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10px;
      color: #222238;
    }
    .content-wrapper {
      padding-bottom: 0;
      min-height: 270mm;
      display: flex;
      flex-direction: column;
    }
    .section-push {
      margin-top: auto;
    }
    .company-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #222238;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .company-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .company-logo {
      max-height: 48px;
      max-width: 140px;
      object-fit: contain;
    }
    .company-name {
      font-size: 16px;
      font-weight: bold;
    }
    .company-meta {
      font-size: 9px;
      color: #444;
      line-height: 1.4;
      margin-top: 2px;
    }
    .title-area {
      text-align: right;
    }
    .title {
      font-size: 18px;
      font-weight: bold;
      letter-spacing: 1px;
    }
    .title-date {
      font-size: 9px;
      color: #444;
      margin-top: 2px;
      text-align: right;
    }
    .section {
      margin-bottom: 8px;
    }
    .section-title {
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 1px solid #222238;
      padding-bottom: 2px;
      margin-bottom: 5px;
    }
    .two-column {
      display: flex;
      gap: 24px;
      margin-bottom: 8px;
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
      font-size: 10px;
      line-height: 1.45;
    }
    .label {
      font-weight: bold;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    .items-table th {
      text-align: left;
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 1.5px solid #222238;
      padding: 4px 6px;
    }
    .items-table td {
      border-bottom: 1px solid #ddd;
      padding: 5px 6px;
      vertical-align: top;
    }
    .items-table .num {
      text-align: right;
      white-space: nowrap;
    }
    .prod-name {
      font-weight: bold;
      font-size: 10px;
    }
    .prod-details {
      font-size: 9px;
      color: #666;
      margin-top: 1px;
    }
    .total-section {
      display: flex;
      justify-content: flex-end;
    }
    .total-table {
      border-collapse: collapse;
      min-width: 200px;
    }
    .total-table td {
      padding: 3px 6px;
    }
    .total-row .tot-label {
      font-weight: normal;
      text-align: right;
    }
    .total-row .tot-value {
      font-weight: bold;
    }
    .grand-row .tot-label {
      font-weight: bold;
      border-top: 1.5px solid #222238;
    }
    .grand-row .grand-value {
      font-weight: bold;
      font-size: 13px;
      border-top: 1.5px solid #222238;
      color: #222238;
    }
    .notes-content {
      font-size: 10px;
      white-space: pre-wrap;
      color: #333;
    }
    .signature-section {
      display: flex;
      gap: 36px;
      margin-top: 40px;
      padding-top: 2px;
    }
    .signature-box {
      flex: 1;
    }
    .signature-line {
      width: 100%;
      border-bottom: 1px solid #222238;
      margin-bottom: 4px;
    }
    .signature-label {
      font-size: 9px;
      color: #666;
      margin-bottom: 2px;
    }
    .signature-stamp {
      margin-top: 6px;
      text-align: left;
    }
    .signature-stamp img {
      width: 46mm;
      height: 16mm;
      object-fit: contain;
    }
    .footer {
      margin-top: 10px;
      border-top: 1px solid #ccc;
      padding-top: 4px;
      text-align: center;
    }
    .footer-text {
      font-size: 8px;
      color: #888;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="content-wrapper">
    <div class="company-header">
      <div class="company-left">
        ${data.companyLogo ? `<img class="company-logo" src="${data.companyLogo}" onerror="this.style.display='none'" />` : ""}
        <div class="company-name">${escapeHtml(data.companyName)}</div>
      </div>
      <div class="title-area">
        <div class="title">${lang === "tr" ? "TEKLİF" : "QUOTE"}</div>
        <div class="title-date">${t("qot.date")} ${escapeHtml(data.documentDate) || ""}</div>
        ${data.validUntil ? `<div class="title-date">${t("qot.validUntil")} ${escapeHtml(data.validUntil)}</div>` : ""}
      </div>
    </div>

    <div class="two-column">
      <div class="section">
        <div class="section-title">${t("qot.companyInfo")}</div>
        <div class="info-list">
          <div class="info-item"><span class="label">${t("qot.address")}</span> <span class="value">${escapeHtml(data.companyAddress) || ""}</span></div>
          <div class="info-item"><span class="label">${t("qot.companyPhone")}</span> <span class="value">${escapeHtml(data.companyPhone) || ""}</span></div>
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
      <div class="section-title">${t("qot.items")}</div>
      <table class="items-table">
        <thead>
          <tr>
            <th class="num" style="width:20px">#</th>
            <th>${t("qot.product")}</th>
            <th class="num" style="width:40px">${t("qot.quantity")}</th>
            <th class="num" style="width:70px">${t("qot.unitPrice")}</th>
            <th class="num" style="width:80px">${t("qot.total")}</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="5" style="color:#888">${t("qot.noItems")}</td></tr>`}
        </tbody>
      </table>
    </div>

    <div class="section section-push">
      <div class="total-section">
        <table class="total-table">
          <tbody>
            ${totals}
          </tbody>
        </table>
      </div>
    </div>

    ${data.notes ? `
    <div class="section">
      <div class="section-title">${t("qot.notes")}</div>
      <div class="notes-content">${escapeHtml(data.notes)}</div>
    </div>` : ""}

    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-label">${t("qot.approvedBy")}</div>
        <div class="signature-line"></div>
      </div>
      <div class="signature-box">
        <div class="signature-label">${t("qot.companyStampLabel")}</div>
        <div class="signature-line"></div>
        ${data.companyStamp ? `<div class="signature-stamp"><img src="${data.companyStamp}" onerror="this.style.display='none'" /></div>` : ""}
      </div>
    </div>

    <div class="footer">
      <div class="footer-text">${escapeHtml(data.companyName)}${data.companyPhone ? ` &nbsp; Tel: ${escapeHtml(data.companyPhone)}` : ""}</div>
    </div>
  </div>
</body>
</html>`;
}
