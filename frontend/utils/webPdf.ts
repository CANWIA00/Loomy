import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

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
    doc.body.style.padding = `0 ${MARGIN_MM}mm`;

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
    const imgHmm = height * PX_TO_MM;
    const scale = Math.min(1, A4_HEIGHT_MM / imgHmm);

    pdf.addImage(dataUrl, "PNG", 0, 0, A4_WIDTH_MM * scale, imgHmm * scale);

    return pdf.output("blob");
  } finally {
    iframe.remove();
  }
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