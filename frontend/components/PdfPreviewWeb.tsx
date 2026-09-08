import { useRef } from "react";

interface PdfPreviewWebProps {
  pdfZoom: number;
  html: string;
}

function dragToScroll(
  container: HTMLDivElement,
  startX: number,
  startY: number
) {
  const startLeft = container.scrollLeft;
  const startTop = container.scrollTop;
  let raf = 0;

  const onMove = (e: MouseEvent) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      container.scrollLeft = startLeft - (e.clientX - startX);
      container.scrollTop = startTop - (e.clientY - startY);
    });
  };

  const onUp = () => {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    container.style.cursor = "grab";
    container.classList.remove("dragging");
  };

  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
}

export default function PdfPreviewWeb({ pdfZoom, html }: PdfPreviewWebProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const container = containerRef.current;
    if (!container) return;
    container.style.cursor = "grabbing";
    container.classList.add("dragging");
    if (container.classList.contains("dragging")) {
      container.style.userSelect = "none";
    }
    dragToScroll(container, e.clientX, e.clientY);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      className="pdf-preview-container"
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#e5e5e5",
        overflow: "auto",
        display: "block",
        cursor: "grab",
        touchAction: "pan-x pan-y",
        WebkitOverflowScrolling: "touch",
      } as any}
    >
      <div
        style={{
          width: 794 * (pdfZoom / 100),
          minHeight: 1123 * (pdfZoom / 100),
          margin: "0 auto",
        } as any}
      >
        <div
          style={{
            width: "210mm",
            minHeight: "297mm",
            backgroundColor: "white",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            padding: "15mm",
            borderRadius: 4,
            transform: `scale(${pdfZoom / 100})`,
            transformOrigin: "top left",
            flexShrink: 0,
          } as any}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      <style>{`
        .pdf-preview-container {
          -webkit-user-select: none;
          user-select: none;
        }
        .pdf-preview-container.dragging {
          scroll-behavior: auto;
          -webkit-user-select: none;
          user-select: none;
        }
        .pdf-preview-container::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }
        .pdf-preview-container::-webkit-scrollbar-thumb {
          background: #c0c0c0;
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
}
