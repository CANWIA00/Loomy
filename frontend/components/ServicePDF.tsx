import * as Print from 'expo-print';

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function checkbox(checked: boolean, label: string): string {
  return `
    <div class="checkbox-item">
      <span class="checkbox-box ${checked ? 'checked' : ''}"></span>
      <span class="checkbox-label">${label}</span>
    </div>
  `;
}

function renderCompanyContact(data: any, lang: "tr" | "en"): string {
  const tel = data.companyPhone || "0232 365 20 87";
  const gsm = data.companyGsm || "0 533 368 03 13";
  const lines: string[] = [];
  let phone = `Tel: ${escapeHtml(tel)}`;
  if (gsm) phone += ` &nbsp;&nbsp; Gsm: ${escapeHtml(gsm)}`;
  lines.push(`<div class="footer-text">${phone}</div>`);
  const extra: string[] = [];
  if (data.companyEmail) extra.push(`Email: ${escapeHtml(data.companyEmail)}`);
  if (data.companyFax) extra.push(`Fax: ${escapeHtml(data.companyFax)}`);
  if (data.companyWebsite) extra.push(`Web: ${escapeHtml(data.companyWebsite)}`);
  if (extra.length) lines.push(`<div class="footer-text">${extra.join(" &nbsp;&nbsp; ")}</div>`);
  if (data.companyTaxNumber) {
    lines.push(`<div class="footer-text">${lang === "tr" ? "Vergi No" : "Tax No"}: ${escapeHtml(data.companyTaxNumber)}</div>`);
  }
  return lines.join("\n");
}

function renderSignatureSvg(signature: any): string {
  if (!signature || !Array.isArray(signature)) return '';
  const strokes = signature.filter((p: any) => Array.isArray(p) && p.length > 0);
  if (!strokes.length) return '';
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let hasPoint = false;
  strokes.forEach((path: any[]) => {
    path.forEach((p: any) => {
      if (p && typeof p.x === 'number' && typeof p.y === 'number' && Number.isFinite(p.x) && Number.isFinite(p.y)) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
        hasPoint = true;
      }
    });
  });
  if (!hasPoint) return '';
  const w = (maxX - minX) || 1;
  const h = (maxY - minY) || 1;
  const pad = 10;
  const svgW = Math.ceil(w + pad * 2);
  const svgH = Math.ceil(h + pad * 2);
  const segs: Array<{ x1: number; y1: number; x2: number; y2: number; width: number }> = [];
  strokes.forEach((points: any[]) => {
    const pts = points.filter((p: any) => p && typeof p.x === 'number' && typeof p.y === 'number' && Number.isFinite(p.x) && Number.isFinite(p.y));
    if (pts.length < 2) return;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = { x: pts[i].x - minX + pad, y: pts[i].y - minY + pad };
      const b = { x: pts[i + 1].x - minX + pad, y: pts[i + 1].y - minY + pad };
      const d = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
      const width = Math.max(0.9, Math.min(2.6, 2.1 + 34 / d));
      segs.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, width });
    }
  });
  for (let i = 1; i < segs.length - 1; i++) {
    segs[i].width = (segs[i - 1].width + segs[i].width + segs[i + 1].width) / 3;
  }
  const paths = segs
    .map((s) => `<path d="M ${s.x1.toFixed(2)} ${s.y1.toFixed(2)} L ${s.x2.toFixed(2)} ${s.y2.toFixed(2)}" stroke="#222238" stroke-width="${s.width.toFixed(2)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">${paths}</svg>`;
}

export function generateServicePDFHtml(data: any, t: (key: string, params?: Record<string, string>) => string, lang: "tr" | "en" = "tr"): string {
  const serviceList = [
    t("svc.list.alarm"), t("svc.list.fire"), t("svc.list.cctv"), t("svc.list.ahm"),
    t("svc.list.wiring"), t("svc.list.assembly"), t("svc.list.commissioning"), t("svc.list.docCheck"),
  ];

  const technicalList = [
    t("svc.tech.ahmSignal"), t("svc.tech.drill"), t("svc.tech.dovr"),
    t("svc.tech.remote"), t("svc.tech.backup"), t("svc.tech.cameraClarity"),
    t("svc.tech.signalTest"), t("svc.tech.battery"),
    t("svc.tech.wirelessPil"), t("svc.tech.gprs"),
  ];

  const renderChipSections = (): string => {
    const cfg = data.templateConfig;
    const groups = cfg && Array.isArray(cfg.chipGroups) && cfg.chipGroups.length ? cfg.chipGroups : null;

    if (groups) {
      return groups
        .filter((g: any) => g.enabled !== false)
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
        .map((g: any) => {
          const title = (lang === "tr" ? g.labelTr : g.labelEn) || g.labelTr || g.labelEn || "";
          const inputType = g.inputType || "multi";

          if (inputType === "text") {
            const items = (g.options || [])
              .map((o: any) => {
                const label = (lang === "tr" ? o.labelTr : o.labelEn) || o.labelTr || o.labelEn || "";
                const value = (data.customValues || {})[o.key] || "";
                if (!value) return "";
                return `<div class="info-item"><span class="label">${escapeHtml(label)}</span> <span class="value">${escapeHtml(value)}</span></div>`;
              })
              .filter(Boolean)
              .join("");
            if (!items) return "";
            return `<div class="section"><div class="section-title">${escapeHtml(title)}</div><div class="info-list">${items}</div></div>`;
          }

          const values =
            g.key === "services"
              ? data.services || []
              : g.key === "technical"
                ? data.technical || []
                : (data.customChips || {})[g.key] || [];
          const items = (g.options || [])
            .map((o: any) => {
              const label = (lang === "tr" ? o.labelTr : o.labelEn) || o.labelTr || o.labelEn || "";
              const checked = values.includes(o.labelTr) || values.includes(o.labelEn);
              return checkbox(checked, escapeHtml(label));
            })
            .join("");
          return `<div class="section"><div class="section-title">${escapeHtml(title)}</div><div class="checkbox-grid">${items}</div></div>`;
        })
        .join("");
    }

    return `
  <div class="section">
    <div class="section-title">${t("pdf.serviceServices")}</div>
    <div class="checkbox-grid">
      ${serviceList.map(h => checkbox(data.services?.includes(h) || false, h)).join('')}
    </div>
  </div>

  <div class="section">
    <div class="section-title">${t("pdf.technicalServices")}</div>
    <div class="checkbox-grid">
      ${technicalList.map(h => checkbox(data.technical?.includes(h) || false, h)).join('')}
    </div>
  </div>
`;
  };

  const fieldsConfig: any[] = data.templateConfig && Array.isArray(data.templateConfig.fields) && data.templateConfig.fields.length
    ? data.templateConfig.fields
    : null;

  const fieldActive = (key: string): boolean => {
    if (!fieldsConfig) return true;
    const f = fieldsConfig.find((x: any) => x.key === key);
    if (!f) return false;
    return f.required === true || f.enabled !== false;
  };

  const renderCustomFields = (): string => {
    if (!fieldsConfig) return "";
    const customFields = fieldsConfig.filter((f: any) => String(f.key || "").startsWith("custom_") && (f.required === true || f.enabled !== false));
    if (!customFields.length) return "";
    const items = customFields
      .map((f: any) => {
        const label = (lang === "tr" ? f.labelTr : f.labelEn) || f.labelTr || f.labelEn || "";
        const value = (data.customValues || {})[f.key] || "";
        if (!value) return "";
        return `<div class="info-item"><span class="label">${escapeHtml(label)}</span> <span class="value">${escapeHtml(value)}</span></div>`;
      })
      .filter(Boolean)
      .join("");
    if (!items) return "";
    return `<div class="section"><div class="section-title">${t("pdf.additionalInfo")}</div><div class="info-list">${items}</div></div>`;
  };

  const ccySym = (c?: string) => (c === "USD" ? "$" : c === "EUR" ? "€" : c === "GBP" ? "£" : "₺");

  const tryRates = data.tryRates || null;
  const toTry = (amount: number, currency?: string): number | null => {
    if (!amount || !currency || currency === "TRY") return amount;
    if (!tryRates || !tryRates.rates[currency]) return null;
    return amount * tryRates.rates[currency];
  };
  const fmtMoney = (n: number) => n.toFixed(2);
  const fmtCell = (amount: number, currency?: string) => {
    if (!amount) return "-";
    const main = `${fmtMoney(amount)} ${ccySym(currency)}`;
    const t = toTry(amount, currency);
    return t != null && currency && currency !== "TRY" ? `${main} <span class="conv">(₺ ${fmtMoney(t)})</span>` : main;
  };

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
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #222238;
      padding-bottom: 6px;
      margin-bottom: 12px;
    }
    .logo-area {
      min-width: 90px;
      display: flex;
      align-items: center;
    }
    .title {
      font-size: 17px;
      font-weight: bold;
      text-align: center;
      flex: 1;
    }
    .date-area {
      font-size: 10px;
      text-align: right;
      min-width: 90px;
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
    .value {
      font-weight: normal;
    }
    .checkbox-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1px 14px;
    }
    .checkbox-item {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 10px;
      line-height: 1.45;
    }
    .checkbox-box {
      display: inline-block;
      width: 10px;
      height: 10px;
      border: 1.5px solid #222238;
      border-radius: 2px;
      flex-shrink: 0;
      position: relative;
    }
    .checkbox-box.checked {
      background-color: #222238;
    }
    .checkbox-box.checked::after {
      content: '';
      position: absolute;
      left: 3px;
      top: 1px;
      width: 3px;
      height: 6px;
      border: solid white;
      border-width: 0 1.5px 1.5px 0;
      transform: rotate(45deg);
    }
    .checkbox-label {
      font-weight: normal;
    }
    .details-content {
      font-size: 10px;
      line-height: 1.45;
      white-space: pre-wrap;
    }
    .fee-content {
      font-size: 11px;
      font-weight: bold;
      line-height: 1.5;
    }
    .fee-line {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px dotted #c7c7d4;
      padding: 2px 0;
      font-weight: normal;
    }
    .fee-line.fee-total {
      font-weight: bold;
      border-bottom: none;
      padding-top: 6px;
    }
    .signature-section {
      display: flex;
      gap: 36px;
      margin-top: 30px;
      padding-top: 2px;
      page-break-inside: avoid;
    }
    .signature-box {
      flex: 1;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
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
    .signature-name {
      font-size: 10px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .signature-svg {
      text-align: center;
      margin-top: 2px;
    }
    .signature-svg svg {
      max-width: 100%;
      max-height: 42px;
      height: auto;
      width: auto;
    }
    .signature-stamp {
      margin-top: 6px;
      text-align: center;
    }
    .footer {
      margin-top: 10px;
      border-top: 1px solid #ccc;
      padding-top: 4px;
      text-align: center;
    }
    .footer-text {
      font-size: 8px;
      color: #999;
      line-height: 1.4;
    }
    .privacy-note {
      margin-top: 6px;
      text-align: center;
      opacity: 0.55;
      page-break-inside: avoid;
    }
    .privacy-title {
      font-size: 7px;
      font-weight: bold;
      color: #888;
    }
    .privacy-body {
      font-size: 7px;
      color: #888;
      line-height: 1.35;
      margin-top: 1px;
    }
    .used-products-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8px;
      margin-top: 4px;
    }
    .used-products-table th,
    .used-products-table td {
      border: 1px solid #222238;
      padding: 2px 4px;
      text-align: left;
    }
    .used-products-table th {
      background: #f2f2f2;
      font-weight: bold;
      font-size: 7px;
      text-transform: uppercase;
    }
    .used-products-table .num {
      text-align: right;
    }
    .used-products-table .conv {
      display: block;
      font-size: 6.5px;
      color: #666;
      font-weight: normal;
      white-space: nowrap;
    }
    .total-block {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      margin-top: 2px;
      padding-top: 4px;
      border-top: 1px solid #222238;
    }
    .total-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 14px;
      padding: 1px 4px 1px 10px;
      font-size: 8.5px;
    }
    .total-row .total-label {
      font-weight: normal;
    }
    .total-row .total-amount {
      font-weight: bold;
      text-align: right;
      white-space: nowrap;
    }
    .total-row.row-grand {
      border-top: 1px solid #222238;
      margin-top: 2px;
      padding-top: 3px;
    }
  </style>
</head>
<body>
  <div id="scale-wrapper">
  <div class="content-wrapper">
    <div class="header">
      <div class="logo-area">${data.companyLogo ? `<img src="${data.companyLogo}" onerror="this.style.display='none'" style="display:block;max-height:42px;max-width:150px;object-fit:contain;" />` : ''}</div>
      <div class="title">${t("pdf.title")}</div>
      <div class="date-area">${t("pdf.date")} ${escapeHtml(data.documentDate) || ''}</div>
    </div>

    <div class="two-column">
    <div class="section">
      <div class="section-title">${t("pdf.customerInfo")}</div>
      <div class="info-list">
        <div class="info-item"><span class="label">${t("pdf.customerName")}</span> <span class="value">${escapeHtml(data.customerName) || ''}</span></div>
        <div class="info-item"><span class="label">${t("pdf.address")}</span> <span class="value">${escapeHtml(data.serviceAddress) || ''}</span></div>
        <div class="info-item"><span class="label">${t("pdf.phone")}</span> <span class="value">${escapeHtml(data.phone) || ''}</span></div>
        <div class="info-item"><span class="label">${t("pdf.email")}</span> <span class="value">${escapeHtml(data.email) || ''}</span></div>
        <div class="info-item"><span class="label">${t("pdf.subscriberNo")}</span> <span class="value">${escapeHtml(data.subscriberNo) || ''}</span></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">${t("pdf.serviceDetails")}</div>
      <div class="info-list">
        <div class="info-item"><span class="label">${t("pdf.responsiblePersonnel")}</span> <span class="value">${escapeHtml(data.technician) || ''}</span></div>
        <div class="info-item"><span class="label">${t("pdf.startTime")}</span> <span class="value">${escapeHtml(data.startTime) || ''}</span></div>
        <div class="info-item"><span class="label">${t("pdf.endTime")}</span> <span class="value">${escapeHtml(data.endTime) || ''}</span></div>
        <div class="info-item"><span class="label">${t("pdf.phoneNumber")}</span> <span class="value">${escapeHtml(data.technicianPhone) || ''}</span></div>
      </div>
    </div>
  </div>

  ${renderChipSections()}

  ${renderCustomFields()}

  ${Array.isArray(data.usedProducts) && data.usedProducts.length > 0 ? `
  <div class="section">
    <div class="section-title">${t("pdf.usedProducts")}</div>
    <table class="used-products-table">
      <thead>
        <tr>
          <th>#</th>
          <th>${t("pdf.usedProduct")}</th>
          <th class="num">${t("pdf.usedQty")}</th>
          <th>${t("pdf.usedUnit")}</th>
          <th class="num">${t("pdf.usedUnitPrice")}</th>
          <th class="num">${t("pdf.usedAmount")}</th>
        </tr>
      </thead>
      <tbody>
        ${data.usedProducts.map((p: any, i: number) => {
          const qty = Number(p.quantity) || 0;
          const price = Number(p.unitPrice) || 0;
          const amount = qty * price;
          return `<tr>
            <td>${i + 1}</td>
            <td>${escapeHtml(p.name)}</td>
            <td class="num">${qty}</td>
            <td>${escapeHtml(p.unit || "")}</td>
            <td class="num">${fmtCell(price, p.currency)}</td>
            <td class="num">${fmtCell(amount, p.currency)}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>` : ''}

  ${data.productsMode === true ? (() => {
    const kdvRate = Math.max(0, Number(data.kdvRate) || 0);
    const labor = Number(data.labor) || 0;
    const laborCur = data.laborCurrency || "TRY";
    let productTotalTry = 0;
    (data.usedProducts || []).forEach((p: any) => {
      const t = toTry((Number(p.quantity) || 0) * (Number(p.unitPrice) || 0), p.currency || "TRY");
      if (t != null) productTotalTry += t;
    });
    const laborTry = labor > 0 ? toTry(labor, laborCur) : 0;
    const hasLabor = labor > 0 && laborTry != null;
    if (productTotalTry <= 0 && !hasLabor) return '';
    const laborVal = hasLabor ? (laborTry as number) : 0;
    const subTotal = productTotalTry + laborVal;
    const kdvAmt = subTotal * kdvRate / 100;
    const grandTotal = subTotal + kdvAmt;
    const row = (label: string, value: string, grandRow = false) =>
      `<div class="total-row${grandRow ? " row-grand" : ""}"><span class="total-label">${label}</span><span class="total-amount">${value}</span></div>`;
    const rows = [
      ...(productTotalTry > 0 ? [row(t("pdf.productsTotal"), `${fmtMoney(productTotalTry)} ${ccySym("TRY")}`)] : []),
      ...(hasLabor ? [row(t("pdf.labor"), `${fmtMoney(laborVal)} ${ccySym("TRY")}`)] : []),
      row(t("pdf.subtotal"), `${fmtMoney(subTotal)} ${ccySym("TRY")}`),
      ...(kdvRate > 0 ? [row(`${t("pdf.vat")} %${kdvRate}`, `${fmtMoney(kdvAmt)} ${ccySym("TRY")}`)] : []),
      row(t("pdf.grandTotal"), `${fmtMoney(grandTotal)} ${ccySym("TRY")}`, true),
    ];
    return `<div class="section">
      <div class="section-title">${t("pdf.serviceFee")}</div>
      <div class="total-block">${rows.join('')}</div>
    </div>`;
  })() : ''}

  ${fieldActive("details") ? `
  <div class="section">
    <div class="section-title">${t("pdf.detailsNotes")}</div>
    <div class="details-content">
      ${escapeHtml(data.details || '')}
    </div>
  </div>` : ''}

  ${(() => {
    if (data.productsMode === true) return '';
    const fee = Number(data.fee) || 0;
    const feeCur = data.feeCurrency || "TRY";
    if (fee <= 0) return '';
    return `<div class="section section-push">
      <div class="section-title">${t("pdf.serviceFee")}</div>
      <div class="fee-content">
        <div class="fee-line fee-total"><span>${t("pdf.grandTotal")} ${ccySym(feeCur)}</span><span>${fee.toFixed(2)}</span></div>
      </div>
    </div>`;
  })()}

  <div class="signature-section">
    <div class="signature-box">
      <div class="signature-label">${t("pdf.customerSignatureLabel")}</div>
      <div class="signature-line"></div>
      <div class="signature-name">${escapeHtml(data.customerName || '')}</div>
      ${data.signature ? `<div class="signature-svg">${renderSignatureSvg(data.signature)}</div>` : ''}
    </div>
    <div class="signature-box">
      <div class="signature-label">${t("pdf.technicianSignatureLabel")}</div>
      <div class="signature-line"></div>
      <div class="signature-name">${escapeHtml(data.technician || '')}</div>
      ${data.technicianSignature ? `<div class="signature-svg">${renderSignatureSvg(data.technicianSignature)}</div>` : ''}
      ${data.companyStamp ? `<div class="signature-stamp"><img src="${data.companyStamp}" onerror="this.style.display='none'" style="width:46mm;height:16mm;object-fit:contain;" /></div>` : ''}
    </div>
  </div>

  <div class="footer">
    <div class="footer-text">${escapeHtml(data.companyName || t("pdf.companyNameLabel"))}</div>
    <div class="footer-text">${escapeHtml(data.companyAddress || t("pdf.companyAddressLabel"))}</div>
    ${renderCompanyContact(data, lang)}
  </div>

  <div class="privacy-note">
    <div class="privacy-title">${t("pdf.privacyNoteTitle")}</div>
    <div class="privacy-body">${t("pdf.privacyNoteBody")}</div>
  </div>

</div>
  </div>
  <script>
  (function() {
    function tryScale() {
      var el = document.getElementById('scale-wrapper');
      if (!el) return;
      var a4H = 273 * 3.78;
      var h = el.getBoundingClientRect().height || el.scrollHeight || el.offsetHeight;
      if (h > a4H) {
        var ratio = (a4H / h).toFixed(6);
        el.style.transform = 'scale(' + ratio + ')';
        el.style.transformOrigin = 'top left';
        el.style.height = (h * ratio).toFixed(2) + 'px';
        el.style.width = (100 / ratio) + '%';
      }
    }
    if (document.readyState === 'complete') setTimeout(tryScale, 150);
    else window.addEventListener('load', function() { setTimeout(tryScale, 150); });
  })();
  </script>
</body>
</html>`;
}
