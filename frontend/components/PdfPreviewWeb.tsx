import { useEffect, useRef } from "react";

interface PdfPreviewWebProps {
  pdfZoom: number;
  html: string;
  onZoomChange?: (z: number) => void;
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

export default function PdfPreviewWeb({ pdfZoom, html, onZoomChange }: PdfPreviewWebProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinchRef = useRef<{ d: number; z: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const dist = (t: TouchList) => {
      if (t.length < 2) return 0;
      const dx = t[0].clientX - t[1].clientX;
      const dy = t[0].clientY - t[1].clientY;
      return Math.hypot(dx, dy);
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchRef.current = { d: dist(e.touches), z: pdfZoom };
        e.preventDefault();
      }
    };
    const onMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current && onZoomChange) {
        e.preventDefault();
        const d = dist(e.touches);
        if (pinchRef.current.d > 0) {
          const next = Math.min(400, Math.max(20, Math.round(pinchRef.current.z * (d / pinchRef.current.d))));
          onZoomChange(next);
        }
      }
    };
    const onEnd = () => {
      pinchRef.current = null;
    };

    el.addEventListener("touchstart", onStart, { passive: false });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, [pdfZoom, onZoomChange]);

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
        touchAction: "manipulation",
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
