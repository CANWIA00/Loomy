import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const A4_WIDTH_PX = 794;
const A4_HEIGHT_MM = 297;
const PX_TO_MM = 210 / A4_WIDTH_PX;
const CONTENT_MM = A4_HEIGHT_MM - 12 - 12; // 297 - üst padding - alt padding
const FOOTER_FREE_MM = 20;

async function htmlToPdfBlob(html: string): Promise<Blob> {
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0;visibility:hidden;pointer-events:none;";
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument;
    if (!doc) throw new Error("iframe document unavailable");
    doc.open();
    doc.write(html);
    doc.close();

    doc.body.style.margin = "0";
    doc.body.style.padding = "12mm";

    const node = doc.body;
    const width = A4_WIDTH_PX;
    const height = Math.max(node.scrollHeight, A4_WIDTH_PX * (A4_HEIGHT_MM / 210));

    const dataUrl = await toPng(node, {
      width,
      height,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });

    const pageStarts = computePageStarts(node);

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const imgH = height * PX_TO_MM;

    pageStarts.forEach((start, index) => {
      if (index > 0) pdf.addPage();
      pdf.addImage(dataUrl, "PNG", 0, -start, 210, imgH);
    });

    return pdf.output("blob");
  } finally {
    iframe.remove();
  }
}

function computePageStarts(node: HTMLElement): number[] {
  const starts: number[] = [0];
  const nodeTop = node.getBoundingClientRect().top;
  const trs = Array.from(node.querySelectorAll(".items-table .quote-row"));

  if (!trs.length) return starts;

  const rowBottoms: number[] = trs.map(
    (tr) => (tr.getBoundingClientRect().bottom - nodeTop) * PX_TO_MM
  );

  const firstRowTopMm = (trs[0].getBoundingClientRect().top - nodeTop) * PX_TO_MM;
  let pageStart = firstRowTopMm;
  let pageLimit = A4_HEIGHT_MM - FOOTER_FREE_MM; // ilk sayfa: alt pay bırak
  let prevBottom = firstRowTopMm;

  for (const bottom of rowBottoms) {
    if (bottom > pageLimit) {
      if (prevBottom > pageStart) starts.push(prevBottom);
      pageStart = prevBottom;
      pageLimit = pageStart + CONTENT_MM;
    }
    prevBottom = bottom;
  }

  return starts;
}

async function shareWebPdfFile(html: string, fileName: string): Promise<void> {
  const blob = await htmlToPdfBlob(html);
  const file = new File([blob], `${fileName}.pdf`, { type: "application/pdf" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title: fileName });
    return;
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${fileName}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function shareWebPdf(html: string, fileName: string): Promise<void> {
  await shareWebPdfFile(html, fileName);
}

async function downloadWebPdfFile(html: string, fileName: string): Promise<void> {
  const blob = await htmlToPdfBlob(html);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${fileName}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function downloadWebPdf(html: string, fileName: string): Promise<void> {
  await downloadWebPdfFile(html, fileName);
}