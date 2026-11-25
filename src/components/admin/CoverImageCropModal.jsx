import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { FiX, FiZoomIn, FiZoomOut, FiMove, FiMaximize2, FiCheck, FiRefreshCcw } from "react-icons/fi";
import Swal from "sweetalert2";

const OUTPUT_WIDTH = 1280;
const OUTPUT_HEIGHT = 720;

export default function CoverImageCropModal({
  isOpen,
  imageSrc,
  fileName = "cover.jpg",
  onClose,
  onConfirm,
  isUploading = false
}) {
  const viewportRef = useRef(null);
  const imgRef = useRef(null);

  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    if (!isOpen) return;
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setNaturalSize({ width: 0, height: 0 });
  }, [isOpen, imageSrc]);

  useEffect(() => {
    if (!isOpen || !viewportRef.current) return;
    const el = viewportRef.current;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setViewportSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isOpen]);

  const baseScale =
    viewportSize.width > 0 && naturalSize.width > 0
      ? Math.max(viewportSize.width / naturalSize.width, viewportSize.height / naturalSize.height)
      : 1;

  const totalScale = baseScale * zoom;
  const displayWidth = naturalSize.width * totalScale;
  const displayHeight = naturalSize.height * totalScale;

  const clampOffset = useCallback(
    (x, y, targetZoom = zoom) => {
      if (!viewportSize.width || !naturalSize.width) return { x: 0, y: 0 };
      const scale = baseScale * targetZoom;
      const w = naturalSize.width * scale;
      const h = naturalSize.height * scale;
      const maxX = Math.abs(w - viewportSize.width) / 2;
      const maxY = Math.abs(h - viewportSize.height) / 2;
      return {
        x: Math.min(maxX, Math.max(-maxX, x)),
        y: Math.min(maxY, Math.max(-maxY, y))
      };
    },
    [baseScale, naturalSize, viewportSize, zoom]
  );

  const containZoom =
    viewportSize.width > 0 && naturalSize.width > 0 && baseScale > 0
      ? Math.min(
          1,
          Math.min(viewportSize.width / naturalSize.width, viewportSize.height / naturalSize.height) /
            baseScale
        )
      : 1;

  const minZoom = Math.min(0.35, Number(containZoom.toFixed(2)));

  const handleZoomChange = (newZoom) => {
    const clampedZoom = Math.min(3, Math.max(minZoom, Number(newZoom)));
    setZoom(clampedZoom);
    setOffset((prev) => clampOffset(prev.x, prev.y, clampedZoom));
  };

  const handlePointerDown = (e) => {
    if (isUploading || !naturalSize.width) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      offsetX: offset.x,
      offsetY: offset.y
    };
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;
    setOffset(clampOffset(dragStartRef.current.offsetX + dx, dragStartRef.current.offsetY + dy));
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore if already released
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.12 : -0.12;
    handleZoomChange((zoom + delta).toFixed(2));
  };

  const handleReset = () => {
    setOffset({ x: 0, y: 0 });
  };

  const handleFitAll = () => {
    setZoom(Number(containZoom.toFixed(2)));
    setOffset({ x: 0, y: 0 });
  };

  const handleFillFrame = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleApply = async () => {
    const img = imgRef.current;
    if (!img || !naturalSize.width || !viewportSize.width) return;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_WIDTH;
      canvas.height = OUTPUT_HEIGHT;
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#19191B";
      ctx.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

      const imgLeft = viewportSize.width / 2 + offset.x - displayWidth / 2;
      const imgTop = viewportSize.height / 2 + offset.y - displayHeight / 2;
      const outRatio = OUTPUT_WIDTH / viewportSize.width;

      ctx.drawImage(
        img,
        imgLeft * outRatio,
        imgTop * outRatio,
        displayWidth * outRatio,
        displayHeight * outRatio
      );

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("No se pudo generar la imagen recortada."))),
          "image/jpeg",
          0.92
        );
      });

      const baseName = fileName.replace(/\.[^/.]+$/, "") || "portada";
      const croppedFile = new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
      await onConfirm(croppedFile);
    } catch (err) {
      Swal.fire({
        title: "No se pudo procesar la imagen",
        text: err?.message?.includes("tainted") || err?.name === "SecurityError"
          ? "Esta URL externa bloquea la edición por seguridad (CORS). Descarga la imagen y súbela desde tu equipo para recortarla."
          : err.message || "Intenta subir la imagen nuevamente.",
        icon: "warning",
        confirmButtonColor: "#19191B"
      });
    }
  };

  if (!isOpen || !imageSrc) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#19191B]/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-[#ECECE6] shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#ECECE6] flex items-center justify-between bg-[#FAF9F6]">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Ajustar imagen de portada</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Arrastra para centrar la foto y usa el zoom para encuadrarla.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-[#ECECE6] transition-colors disabled:opacity-50"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport 16:9 */}
        <div className="p-5 space-y-4">
          <div
            ref={viewportRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-[#19191B] border border-[#E2E2DC] select-none touch-none ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Ajustar portada"
              crossOrigin="anonymous"
              draggable={false}
              onLoad={(e) => {
                setNaturalSize({
                  width: e.currentTarget.naturalWidth,
                  height: e.currentTarget.naturalHeight
                });
              }}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: naturalSize.width ? `${displayWidth}px` : "100%",
                height: naturalSize.height ? `${displayHeight}px` : "100%",
                maxWidth: "none",
                maxHeight: "none",
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`
              }}
            />

            {/* Regla de tercios sutil al arrastrar */}
            <div
              className={`pointer-events-none absolute inset-0 transition-opacity duration-150 ${
                isDragging ? "opacity-100" : "opacity-35"
              }`}
            >
              <div className="absolute inset-x-0 top-1/3 border-t border-white/30" />
              <div className="absolute inset-x-0 top-2/3 border-t border-white/30" />
              <div className="absolute inset-y-0 left-1/3 border-l border-white/30" />
              <div className="absolute inset-y-0 left-2/3 border-l border-white/30" />
            </div>

            <div className="pointer-events-none absolute bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/55 text-white text-[11px] font-medium flex items-center gap-1.5 backdrop-blur-xs">
              <FiMove className="w-3 h-3" />
              Arrastra para mover
            </div>
          </div>

          {/* Controles de Zoom y Centrado */}
          <div className="space-y-2.5 bg-[#FAF9F6] px-3.5 py-3 rounded-xl border border-[#ECECE6]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleZoomChange((zoom - 0.15).toFixed(2))}
                disabled={zoom <= minZoom || isUploading}
                className="p-1.5 rounded-lg text-neutral-600 hover:bg-white hover:text-neutral-900 disabled:opacity-40 transition-colors"
                title="Alejar"
              >
                <FiZoomOut className="w-4 h-4" />
              </button>

              <input
                type="range"
                min={minZoom}
                max="3"
                step="0.02"
                value={zoom}
                onChange={(e) => handleZoomChange(e.target.value)}
                disabled={isUploading}
                className="flex-1 accent-[#19191B] cursor-pointer"
              />

              <button
                type="button"
                onClick={() => handleZoomChange((zoom + 0.15).toFixed(2))}
                disabled={zoom >= 3 || isUploading}
                className="p-1.5 rounded-lg text-neutral-600 hover:bg-white hover:text-neutral-900 disabled:opacity-40 transition-colors"
                title="Acercar"
              >
                <FiZoomIn className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono text-neutral-500 w-11 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleFitAll}
                disabled={isUploading}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E2E2DC] text-xs font-medium text-neutral-700 hover:bg-[#F3F2EE] transition-colors"
              >
                Ver completa
              </button>
              <button
                type="button"
                onClick={handleFillFrame}
                disabled={isUploading}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E2E2DC] text-xs font-medium text-neutral-700 hover:bg-[#F3F2EE] transition-colors"
              >
                Llenar marco
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isUploading}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E2E2DC] text-xs font-medium text-neutral-700 hover:bg-[#F3F2EE] inline-flex items-center gap-1.5 transition-colors"
                title="Centrar posición"
              >
                <FiMaximize2 className="w-3 h-3" />
                Centrar
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#ECECE6] bg-[#FAF9F6] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="h-10 px-4 text-xs font-medium rounded-xl bg-white border border-[#E2E2DC] text-neutral-700 hover:bg-[#F3F2EE] transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={isUploading || !naturalSize.width}
            className="h-10 px-4 text-xs font-medium rounded-xl bg-[#19191B] hover:bg-neutral-800 text-white inline-flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <FiRefreshCcw className="w-3.5 h-3.5 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <FiCheck className="w-3.5 h-3.5" />
                Aplicar y guardar
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
