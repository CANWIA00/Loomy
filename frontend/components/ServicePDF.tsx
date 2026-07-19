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

const serviceList = [
  "Alarm", "Yangın", "CCTV", "AHM Bağlantısı",
  "Kablolama", "Montaj", "Devreye Alma Eğitimi", "Belge Kontrolü",
];

const technicalList = [
  "AHM Sinyal Kontrolü", "Eğitim ve Tatbikat", "DVR Kayıt Kontrolü",
  "Uzak Erişim", "Kayıt ve Yedekleme Eğitimi", "Kameralara Netlik ve Yön Ayarı",
  "Test sinyal Programlaması", "Akü Ömrü Kontrolü",
  "Kablosuz Dedektör Pil Kontrolü (TÜM)", "GPRS Bağlantısı",
];

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
    return `<path d="${d}" stroke="#1a1a1a" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" style="max-width:100%;max-height:40px;">${paths}</svg>`;
}

export function generateServicePDFHtml(data: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    @page { margin: 20px; size: A4; }
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      color: #1a1a1a;
      padding: 20px;
      box-sizing: border-box;
      position: relative;
      min-height: 100vh;
    }
    .content-wrapper {
      padding-bottom: 0;
    }
    .bottom-fixed {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
      padding: 0 20px 6px 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #1a1a1a;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .logo-area {
      min-width: 100px;
      display: flex;
      align-items: center;
    }
    .title {
      font-size: 20px;
      font-weight: bold;
      text-align: center;
      flex: 1;
    }
    .date-area {
      font-size: 12px;
      text-align: right;
      min-width: 100px;
    }
    .section {
      margin-bottom: 16px;
    }
    .section-title {
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 1px solid #1a1a1a;
      padding-bottom: 4px;
      margin-bottom: 10px;
    }
    .two-column {
      display: flex;
      gap: 20px;
      margin-bottom: 16px;
    }
    .two-column .section {
      flex: 1;
      margin-bottom: 0;
    }
    .info-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .info-item {
      font-size: 11px;
      line-height: 1.6;
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
      gap: 4px 16px;
    }
    .checkbox-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      line-height: 1.6;
    }
    .checkbox-box {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 1.5px solid #1a1a1a;
      border-radius: 2px;
      flex-shrink: 0;
      position: relative;
    }
    .checkbox-box.checked {
      background-color: #1a1a1a;
    }
    .checkbox-box.checked::after {
      content: '';
      position: absolute;
      left: 3px;
      top: 1px;
      width: 4px;
      height: 7px;
      border: solid white;
      border-width: 0 1.5px 1.5px 0;
      transform: rotate(45deg);
    }
    .checkbox-label {
      font-weight: normal;
    }
    .details-content {
      font-size: 11px;
      line-height: 1.6;
      white-space: pre-wrap;
    }
    .fee-content {
      font-size: 12px;
      font-weight: bold;
      line-height: 1.6;
    }
    .signature-section {
      display: flex;
      gap: 40px;
      margin: 0;
      padding: 4px 0 40px 0;
    }
    .signature-box {
      flex: 1;
      text-align: center;
    }
    .signature-line {
      border-bottom: 1px solid #1a1a1a;
      margin-bottom: 6px;
      margin-left: 20px;
      margin-right: 20px;
    }
    .signature-label {
      font-size: 10px;
      color: #666;
      margin-bottom: 4px;
    }
    .signature-name {
      font-size: 11px;
      font-weight: bold;
    }
    .footer {
      padding: 6px 20px 8px 20px;
      border-top: 1px solid #ccc;
      text-align: center;
    }
    .footer-text {
      font-size: 9px;
      color: #888;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="content-wrapper">
    <div class="header">
      <div class="logo-area">${data.companyLogo ? `<img src="${data.companyLogo}" style="max-height:40px;max-width:150px;object-fit:contain;" />` : ''}</div>
      <div class="title">SERVİS TESLİM FORMU</div>
      <div class="date-area">Tarih: ${escapeHtml(data.documentDate) || ''}</div>
    </div>

    <div class="two-column">
    <div class="section">
      <div class="section-title">MÜŞTERİ BİLGİLERİ</div>
      <div class="info-list">
        <div class="info-item"><span class="label">Müşteri Adı:</span> <span class="value">${escapeHtml(data.customerName) || ''}</span></div>
        <div class="info-item"><span class="label">Adres:</span> <span class="value">${escapeHtml(data.serviceAddress) || ''}</span></div>
        <div class="info-item"><span class="label">Telefon:</span> <span class="value">${escapeHtml(data.phone) || ''}</span></div>
        <div class="info-item"><span class="label">E-posta:</span> <span class="value">${escapeHtml(data.email) || ''}</span></div>
        <div class="info-item"><span class="label">Abone No:</span> <span class="value">${escapeHtml(data.subscriberNo) || ''}</span></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">SERVİS DETAYLARI</div>
      <div class="info-list">
        <div class="info-item"><span class="label">Sorumlu Personel:</span> <span class="value">${escapeHtml(data.technician) || ''}</span></div>
        <div class="info-item"><span class="label">Başlama Saati:</span> <span class="value">${escapeHtml(data.startTime) || ''}</span></div>
        <div class="info-item"><span class="label">Bitiş Saati:</span> <span class="value">${escapeHtml(data.endTime) || ''}</span></div>
        <div class="info-item"><span class="label">Telefon Numarası:</span> <span class="value">${escapeHtml(data.phone) || ''}</span></div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">SERVİS HİZMETLERİ</div>
    <div class="checkbox-grid">
      ${serviceList.map(h => checkbox(data.services?.includes(h) || false, h)).join('')}
    </div>
  </div>

  <div class="section">
    <div class="section-title">TEKNİK HİZMETLER</div>
    <div class="checkbox-grid">
      ${technicalList.map(t => checkbox(data.technical?.includes(t) || false, t)).join('')}
    </div>
  </div>

  <div class="section">
    <div class="section-title">DETAYLAR / NOTLAR</div>
    <div class="details-content">
      ${escapeHtml(data.details || '')}
    </div>
  </div>

  <div class="section">
    <div class="section-title">SERVİS BEDELİ</div>
    <div class="fee-content">
      ${data.fee && data.fee !== "0" && data.fee !== "0.00" ?
        `Servis Bedeli: ₺${escapeHtml(data.fee)} + KDV` :
        'Ücretsiz Servis'
      }
    </div>
  </div>

  <div class="bottom-fixed">
    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-label">Müşteri Adı & Soyadı / İmza</div>
        <div class="signature-name">${escapeHtml(data.customerName || '')}</div>
        ${data.signature ? `<div style="text-align:center;margin-bottom:4px;">${renderSignatureSvg(data.signature)}</div>` : ''}
      </div>
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-label">Teknisyen Adı & Soyadı / İmza</div>
        <div class="signature-name">${escapeHtml(data.technician || '')}</div>
        ${data.technicianSignature ? `<div style="text-align:center;margin-top:4px;">${renderSignatureSvg(data.technicianSignature)}</div>` : ''}
      </div>
    </div>

    <div class="footer">
      <div class="footer-text">1D GÜVENLİK VE İLETİŞİM SİSTEMLERİ TİCARET LTD. ŞTİ.</div>
      <div class="footer-text">Goncalar Mah. Ali Alp Böke Cad. No: 150 C Karşıyaka - İZMİR</div>
      <div class="footer-text">Tel: 0232 365 20 87 &nbsp;&nbsp; Gsm: 0 533 368 03 13</div>
    </div>
  </div>

</body>
</html>`;
}
