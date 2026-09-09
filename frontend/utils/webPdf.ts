import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { toSafeFileName } from "./fileName";

const A4_WIDTH_PX = 794;
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PX_TO_MM = A4_WIDTH_MM / A4_WIDTH_PX;
const MARGIN_MM = 12;

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
    doc.body.style.padding = "0";

    await new Promise<void>((resolve) => {
      if (doc.readyState === "complete") resolve();
      else iframe.addEventListener("load", () => resolve(), { once: true });
    });

    const images = Array.from(doc.images || []);
    if (images.length) {
      await Promise.all(
        images.map((img) => (img.decode ? img.decode().catch(() => undefined) : Promise.resolve()))
      );
    }

    const node = doc.body;
    const width = A4_WIDTH_PX;
    const height = Math.max(node.scrollHeight, A4_WIDTH_PX * (A4_HEIGHT_MM / A4_WIDTH_MM));

    const dataUrl = await toPng(node, {
      width,
      height,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const imgWmm = width * PX_TO_MM;
    const imgHmm = height * PX_TO_MM;
    const availW = A4_WIDTH_MM - MARGIN_MM * 2;
    const availH = A4_HEIGHT_MM - MARGIN_MM * 2;
    const scale = Math.min(availW / imgWmm, availH / imgHmm);
    const w = imgWmm * scale;
    const h = imgHmm * scale;
    const x = (A4_WIDTH_MM - w) / 2;
    const y = (A4_HEIGHT_MM - h) / 2;

    pdf.addImage(dataUrl, "PNG", x, y, w, h);

    return pdf.output("blob");
  } finally {
    iframe.remove();
  }
}

async function shareWebPdfFile(html: string, fileName: string): Promise<void> {
  const blob = await htmlToPdfBlob(html);
  const safeName = toSafeFileName(fileName) || "document";
  const file = new File([blob], `${safeName}.pdf`, { type: "application/pdf" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title: safeName });
    return;
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${safeName}.pdf`;
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
  const safeName = toSafeFileName(fileName) || "document";
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${safeName}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function downloadWebPdf(html: string, fileName: string): Promise<void> {
  await downloadWebPdfFile(html, fileName);
}