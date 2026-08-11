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

function renderSignatureSvg(signature: any): string {
  if (!signature || !Array.isArray(signature) || signature.length === 0) return '';
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  signature.forEach((path: any[]) => {
    path.forEach((p: any) => {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    });
  });
  const w = maxX - minX || 1;
  const h = maxY - minY || 1;
  const pad = 10;
  const svgW = w + pad * 2;
  const svgH = h + pad * 2;
  const paths = signature.map((points: any[]) => {
    const d = points.map((p: any, i: number) =>
      i === 0 ? `M ${p.x - minX + pad} ${p.y - minY + pad}` : `L ${p.x - minX + pad} ${p.y - minY + pad}`
    ).join(' ');
    return `<path d="${d}" stroke="#222238" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" style="max-width:100%;max-height:40px;">${paths}</svg>`;
}

export function generateServicePDFHtml(data: any, t: (key: string, params?: Record<string, string>) => string): string {
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
    .signature-section {
      display: flex;
      gap: 36px;
      margin-top: 30px;
      padding-top: 2px;
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
      color: #888;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="content-wrapper">
    <div class="header">
      <div class="logo-area">${data.companyLogo ? `<img src="${data.companyLogo}" onerror="this.style.display='none'" style="max-height:40px;max-width:150px;object-fit:contain;" />` : ''}</div>
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
        <div class="info-item"><span class="label">${t("pdf.phoneNumber")}</span> <span class="value">${escapeHtml(data.phone) || ''}</span></div>
      </div>
    </div>
  </div>

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

  <div class="section">
    <div class="section-title">${t("pdf.detailsNotes")}</div>
    <div class="details-content">
      ${escapeHtml(data.details || '')}
    </div>
  </div>

  <div class="section section-push">
    <div class="section-title">${t("pdf.serviceFee")}</div>
    <div class="fee-content">
      ${data.fee && data.fee !== "0" && data.fee !== "0.00" ?
        t("pdf.serviceFeeLine", { amount: `₺${escapeHtml(data.fee)}` }) :
        t("pdf.freeService")
      }
    </div>
  </div>

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
    <div class="footer-text">${t("pdf.companyNameLabel")}</div>
    <div class="footer-text">${t("pdf.companyAddressLabel")}</div>
    <div class="footer-text">Tel: 0232 365 20 87 &nbsp;&nbsp; Gsm: 0 533 368 03 13</div>
  </div>

</body>
</html>`;
}
