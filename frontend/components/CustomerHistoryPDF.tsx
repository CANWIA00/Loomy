import { formatMoney } from "./quotes/types";

export interface HistoryService {
  tarih: string;
  service: string;
  teknisyen: string;
  fee: string;
}

export interface HistoryQuote {
  tarih: string;
  customer: string;
  total: number;
  validUntil?: string;
}

export interface HistoryPayment {
  tarih: string;
  serviceType: string;
  amount: number;
  paid: boolean;
}

export interface CustomerHistoryPdfData {
  companyName: string;
  companyLogo: string | null;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerSubscriberNo?: string;
  documentDate: string;
  services: HistoryService[];
  quotes: HistoryQuote[];
  payments: HistoryPayment[];
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function generateCustomerHistoryPDFHtml(
  data: CustomerHistoryPdfData,
  t: (key: string, params?: Record<string, string>) => string,
  lang: "tr" | "en" = "tr"
): string {
  const serviceRows = (data.services || [])
    .map(
      (s, i) => `
      <tr>
        <td class="num">${i + 1}</td>
        <td>${escapeHtml(s.tarih)}</td>
        <td>${escapeHtml(s.service)}</td>
        <td>${escapeHtml(s.teknisyen)}</td>
        <td class="num">${escapeHtml(s.fee)}</td>
      </tr>`
    )
    .join("");

  const serviceTotal = (data.services || []).reduce((sum, s) => sum + (parseFloat(s.fee) || 0), 0);

  const quoteRows = (data.quotes || [])
    .map(
      (q, i) => `
      <tr>
        <td class="num">${i + 1}</td>
        <td>${escapeHtml(q.tarih)}</td>
        <td>${escapeHtml(q.customer)}</td>
        <td>${escapeHtml(q.validUntil || "")}</td>
        <td class="num">₺ ${formatMoney(q.total)}</td>
      </tr>`
    )
    .join("");

  const quoteTotal = (data.quotes || []).reduce((sum, q) => sum + (q.total || 0), 0);

  const paymentRows = (data.payments || [])
    .map(
      (p, i) => `
      <tr>
        <td class="num">${i + 1}</td>
        <td>${escapeHtml(p.tarih)}</td>
        <td>${escapeHtml(p.serviceType)}</td>
        <td class="num">₺ ${formatMoney(p.amount)}</td>
        <td class="num"><span class="status ${p.paid ? "status-paid" : "status-pending"}">${p.paid ? t("cst.paid") : t("cst.pending")}</span></td>
      </tr>`
    )
    .join("");

  const paidTotal = (data.payments || []).filter((p) => p.paid).reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingTotal = (data.payments || []).filter((p) => !p.paid).reduce((sum, p) => sum + (p.amount || 0), 0);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    @page { margin: 12mm; size: A4; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10px;
      color: #222238;
    }
    .company-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      border-bottom: 2px solid #222238;
      padding-bottom: 8px;
      margin-bottom: 12px;
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
    .header-title { flex: 1; text-align: center; }
    .title { font-size: 18px; font-weight: bold; letter-spacing: 0.5px; }
    .title-sub { font-size: 12px; font-weight: bold; letter-spacing: 1px; margin-top: 2px; }
    .title-area { flex: 1; text-align: right; }
    .title-date { font-size: 9px; color: #444; margin-top: 2px; text-align: right; }
    .section { margin-bottom: 10px; }
    .section-title {
      font-size: 10px; font-weight: bold; text-transform: uppercase;
      border-bottom: 1px solid #222238; padding-bottom: 2px; margin-bottom: 5px;
    }
    .info-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 2px 24px;
      margin-bottom: 4px;
    }
    .info-item { font-size: 10px; line-height: 1.5; }
    .label { font-weight: bold; }
    .items-table {
      width: 100%; border-collapse: collapse; margin-bottom: 4px;
    }
    .items-table th {
      text-align: left; font-size: 9px; font-weight: bold; text-transform: uppercase;
      border-bottom: 1.5px solid #222238; padding: 4px 6px;
    }
    .items-table td {
      border-bottom: 1px solid #ddd; padding: 5px 6px; vertical-align: top;
    }
    .items-table .num { text-align: right; white-space: nowrap; }
    .total-line {
      display: flex; justify-content: flex-end; font-size: 10px; margin-top: 2px;
    }
    .total-line .tot {
      font-weight: bold;
    }
    .status {
      font-size: 9px; font-weight: bold; padding: 1px 6px; border-radius: 8px;
    }
    .status-paid { background: #dcfce7; color: #15803d; }
    .status-pending { background: #fef3c7; color: #b45309; }
    .empty { color: #888; }
  </style>
</head>
<body>
  <div class="company-header">
    <div class="company-left">
      ${data.companyLogo ? `<img class="company-logo" src="${data.companyLogo}" onerror="this.style.display='none'" />` : ""}
    </div>
    <div class="header-title">
      <div class="title">${escapeHtml(data.companyName)}</div>
      <div class="title-sub">${lang === "tr" ? "Müşteri Geçmişi" : "Customer History"}</div>
    </div>
    <div class="title-area">
      <div class="title-date">${t("cst.detail")}</div>
      <div class="title-date">${t("cst.recordDate")}: ${escapeHtml(data.documentDate)}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">${t("cst.customerInfo")}</div>
    <div class="info-grid">
      <div class="info-item"><span class="label">${t("cst.companyName")}:</span> ${escapeHtml(data.customerName)}</div>
      ${data.customerPhone ? `<div class="info-item"><span class="label">${t("cst.phone")}:</span> ${escapeHtml(data.customerPhone)}</div>` : ""}
      ${data.customerAddress ? `<div class="info-item"><span class="label">${t("cst.address")}:</span> ${escapeHtml(data.customerAddress)}</div>` : ""}
      ${data.customerSubscriberNo ? `<div class="info-item"><span class="label">${t("cst.subscriberNo")}:</span> ${escapeHtml(data.customerSubscriberNo)}</div>` : ""}
    </div>
  </div>

  <div class="section">
    <div class="section-title">${t("cst.serviceReports")} (${(data.services || []).length})</div>
    <table class="items-table">
      <thead>
        <tr>
          <th class="num" style="width:20px">#</th>
          <th>${t("cst.recordDate")}</th>
          <th>${t("cst.serviceType")}</th>
          <th>${t("cst.technician")}</th>
          <th class="num" style="width:80px">${t("cst.fee")}</th>
        </tr>
      </thead>
      <tbody>
        ${serviceRows || `<tr><td colspan="5"><span class="empty">${t("cst.noServiceReports")}</span></td></tr>`}
      </tbody>
    </table>
    ${(data.services || []).length ? `<div class="total-line"><span>${t("cst.quoteTotal")}: </span>&nbsp;<span class="tot">₺ ${formatMoney(serviceTotal)}</span></div>` : ""}
  </div>

  <div class="section">
    <div class="section-title">${t("cst.quotes")} (${(data.quotes || []).length})</div>
    <table class="items-table">
      <thead>
        <tr>
          <th class="num" style="width:20px">#</th>
          <th>${t("cst.recordDate")}</th>
          <th>${t("cst.companyName")}</th>
          <th>${t("cst.validUntil")}</th>
          <th class="num" style="width:90px">${t("cst.quoteTotal")}</th>
        </tr>
      </thead>
      <tbody>
        ${quoteRows || `<tr><td colspan="5"><span class="empty">${t("cst.noQuoteRecords")}</span></td></tr>`}
      </tbody>
    </table>
    ${(data.quotes || []).length ? `<div class="total-line"><span>${t("cst.quoteTotal")}: </span>&nbsp;<span class="tot">₺ ${formatMoney(quoteTotal)}</span></div>` : ""}
  </div>

  <div class="section">
    <div class="section-title">${t("cst.payments")} (${(data.payments || []).length})</div>
    <table class="items-table">
      <thead>
        <tr>
          <th class="num" style="width:20px">#</th>
          <th>${t("cst.recordDate")}</th>
          <th>${t("cst.serviceType")}</th>
          <th class="num" style="width:90px">${t("cst.amount")}</th>
          <th class="num" style="width:80px">${t("cst.status")}</th>
        </tr>
      </thead>
      <tbody>
        ${paymentRows || `<tr><td colspan="5"><span class="empty">${t("cst.noPayments")}</span></td></tr>`}
      </tbody>
    </table>
    ${(data.payments || []).length ? `
      <div class="total-line"><span>${t("cst.paid")}: </span>&nbsp;<span class="tot" style="color:#15803d">₺ ${formatMoney(paidTotal)}</span></div>
      <div class="total-line"><span>${t("cst.pending")}: </span>&nbsp;<span class="tot" style="color:#b45309">₺ ${formatMoney(pendingTotal)}</span></div>
      ` : ""}
  </div>
</body>
</html>`;
}
