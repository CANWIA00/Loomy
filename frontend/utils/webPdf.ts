import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const A4_WIDTH_PX = 794;
const A4_PAGE_HEIGHT_MM = 297;

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
    const height = Math.max(node.scrollHeight, A4_WIDTH_PX * (A4_PAGE_HEIGHT_MM / 210));

    const dataUrl = await toPng(node, {
      width,
      height,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const imgWidth = 210;
    const imgHeight = height * (imgWidth / width);

    let position = 0;
    pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight);
    let heightLeft = imgHeight - A4_PAGE_HEIGHT_MM;
    while (heightLeft > 2) {
      position -= A4_PAGE_HEIGHT_MM;
      pdf.addPage();
      pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= A4_PAGE_HEIGHT_MM;
    }

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
