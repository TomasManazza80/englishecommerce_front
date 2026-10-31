import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiCheck } from 'react-icons/fi';

// --- UTILIDADES MATEMÁTICAS DE CONVERSIÓN DE COLOR ---

/**
 * HSV to RGB conversion
 * h: [0, 360], s: [0, 100], v: [0, 100]
 * Returns { r: [0, 255], g: [0, 255], b: [0, 255] }
 */
export const hsvToRgb = (h, s, v) => {
  const sNorm = Math.max(0, Math.min(100, s)) / 100;
  const vNorm = Math.max(0, Math.min(100, v)) / 100;
  const c = vNorm * sNorm;
  const hNorm = ((h % 360) + 360) % 360;
  const x = c * (1 - Math.abs(((hNorm / 60) % 2) - 1));
  const m = vNorm - c;

  let r1 = 0, g1 = 0, b1 = 0;
  if (hNorm >= 0 && hNorm < 60) {
    r1 = c; g1 = x; b1 = 0;
  } else if (hNorm >= 60 && hNorm < 120) {
    r1 = x; g1 = c; b1 = 0;
  } else if (hNorm >= 120 && hNorm < 180) {
    r1 = 0; g1 = c; b1 = x;
  } else if (hNorm >= 180 && hNorm < 240) {
    r1 = 0; g1 = x; b1 = c;
  } else if (hNorm >= 240 && hNorm < 300) {
    r1 = x; g1 = 0; b1 = c;
  } else {
    r1 = c; g1 = 0; b1 = x;
  }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
};

/**
 * RGB to HSV conversion
 * r, g, b: [0, 255]
 * Returns { h: [0, 360], s: [0, 100], v: [0, 100] }
 */
export const rgbToHsv = (r, g, b) => {
  const rNorm = Math.max(0, Math.min(255, r)) / 255;
  const gNorm = Math.max(0, Math.min(255, g)) / 255;
  const bNorm = Math.max(0, Math.min(255, b)) / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rNorm) {
      h = 60 * (((gNorm - bNorm) / delta) % 6);
    } else if (max === gNorm) {
      h = 60 * ((bNorm - rNorm) / delta + 2);
    } else {
      h = 60 * ((rNorm - gNorm) / delta + 4);
    }
  }
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : (delta / max) * 100;
  const v = max * 100;

  return {
    h: Math.round(h),
    s: Math.round(s),
    v: Math.round(v),
  };
};

/**
 * RGB to 6-character Hex string (e.g. "808080")
 */
export const rgbToHex = (r, g, b) => {
  const toHex = (n) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, '0').toUpperCase();
  };
  return `${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Hex string to RGB
 */
export const hexToRgb = (hex) => {
  if (!hex) return null;
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) return null;
  const num = parseInt(clean, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
};

// Paleta de muestras rápidas frecuentes
const PRESET_SWATCHES = [
  '#000000', '#FFFFFF', '#808080', '#E11C2A', '#FF453A',
  '#FF9F0A', '#FFD60A', '#30D158', '#64D2FF', '#0071E3',
  '#5E5CE6', '#BF5AF2', '#FF375F', '#594F63', '#BEBDB8'
];

/**
 * Componente PhotoshopColorPicker
 * Réplica fiel al selector de color de Adobe Photoshop con:
 * - Área 2D de Saturación y Brillo (Value)
 * - Barra vertical de arcoíris de Tono (Hue) con punteros laterales
 * - Comparación Visual Nuevo vs Actual
 * - Controles RGB (R, G, B de 0 a 255)
 * - Controles HSV (H: 0-360°, S: 0-100%, V: 0-100%)
 * - Campo Hexadecimal Web
 * - Muestras rápidas recomendadas
 */
const PhotoshopColorPicker = ({
  isOpen,
  onClose,
  initialColor = '#808080',
  onSelect,
  title = 'Selector de color (Photoshop)'
}) => {
  // Estado de color
  const [hsv, setHsv] = useState({ h: 0, s: 0, v: 50 });
  const [rgb, setRgb] = useState({ r: 128, g: 128, b: 128 });
  const [hexInput, setHexInput] = useState('808080');
  const [originalHex, setOriginalHex] = useState('808080');
  const [activeChannel, setActiveChannel] = useState('H'); // Photoshop radio button indicator

  // Refs de elementos interactivos
  const satValRef = useRef(null);
  const hueRef = useRef(null);
  const isDraggingSatVal = useRef(false);
  const isDraggingHue = useRef(false);

  // Inicializar estado cuando se abre o cambia el color inicial
  useEffect(() => {
    if (isOpen) {
      let initialClean = (initialColor || '').replace('#', '').trim();
      let parsedRgb = hexToRgb(initialClean);
      if (!parsedRgb) {
        parsedRgb = { r: 128, g: 128, b: 128 };
        initialClean = '808080';
      }
      const parsedHsv = rgbToHsv(parsedRgb.r, parsedRgb.g, parsedRgb.b);
      setRgb(parsedRgb);
      setHsv(parsedHsv);
      setHexInput(initialClean.toUpperCase());
      setOriginalHex(initialClean.toUpperCase());
    }
  }, [isOpen, initialColor]);

  // Actualizador central de color desde HSV
  const updateFromHsv = useCallback((newHsv) => {
    const clampedHsv = {
      h: Math.max(0, Math.min(360, Math.round(newHsv.h))),
      s: Math.max(0, Math.min(100, Math.round(newHsv.s))),
      v: Math.max(0, Math.min(100, Math.round(newHsv.v))),
    };
    const newRgb = hsvToRgb(clampedHsv.h, clampedHsv.s, clampedHsv.v);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);

    setHsv(clampedHsv);
    setRgb(newRgb);
    setHexInput(newHex);
  }, []);

  // Actualizador central desde RGB
  const updateFromRgb = useCallback((newRgb) => {
    const clampedRgb = {
      r: Math.max(0, Math.min(255, Math.round(newRgb.r))),
      g: Math.max(0, Math.min(255, Math.round(newRgb.g))),
      b: Math.max(0, Math.min(255, Math.round(newRgb.b))),
    };
    const newHsv = rgbToHsv(clampedRgb.r, clampedRgb.g, clampedRgb.b);
    const newHex = rgbToHex(clampedRgb.r, clampedRgb.g, clampedRgb.b);

    setRgb(clampedRgb);
    setHsv(newHsv);
    setHexInput(newHex);
  }, []);

  // Actualizador desde Hex
  const updateFromHex = useCallback((hexValue) => {
    setHexInput(hexValue);
    const parsedRgb = hexToRgb(hexValue);
    if (parsedRgb) {
      const newHsv = rgbToHsv(parsedRgb.r, parsedRgb.g, parsedRgb.b);
      setRgb(parsedRgb);
      setHsv(newHsv);
    }
  }, []);

  // --- MANEJO DE ARRASTRE DE SATURACIÓN Y BRILLO (2D SQUARE) ---
  const handleSatValPointer = useCallback((e) => {
    if (!satValRef.current) return;
    const rect = satValRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

    const s = Math.round((x / rect.width) * 100);
    const v = Math.round((1 - y / rect.height) * 100);

    updateFromHsv({ h: hsv.h, s, v });
  }, [hsv.h, updateFromHsv]);

  const onSatValMouseDown = (e) => {
    isDraggingSatVal.current = true;
    handleSatValPointer(e);
  };

  // --- MANEJO DE ARRASTRE DE TONO / HUE (BARRA VERTICAL) ---
  const handleHuePointer = useCallback((e) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    // En Photoshop el rojo superior es 360°, hacia abajo va disminuyendo hacia 0°
    const h = Math.round(360 * (1 - y / rect.height));

    updateFromHsv({ h, s: hsv.s, v: hsv.v });
  }, [hsv.s, hsv.v, updateFromHsv]);

  const onHueMouseDown = (e) => {
    isDraggingHue.current = true;
    handleHuePointer(e);
  };

  // Listeners globales para arrastre fluido incluso si sale del elemento
  useEffect(() => {
    const onMouseMove = (e) => {
      if (isDraggingSatVal.current) {
        handleSatValPointer(e);
      } else if (isDraggingHue.current) {
        handleHuePointer(e);
      }
    };

    const onMouseUp = () => {
      isDraggingSatVal.current = false;
      isDraggingHue.current = false;
    };

    if (isOpen) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onMouseMove);
      window.addEventListener('touchend', onMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onMouseMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, [isOpen, handleSatValPointer, handleHuePointer]);

  // Manejo de Aceptar
  const handleConfirm = () => {
    const finalHex = `#${hexInput.replace('#', '').toUpperCase()}`;
    if (onSelect) onSelect(finalHex);
    if (onClose) onClose();
  };

  // Manejo de Cancelar
  const handleCancel = () => {
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  // Cálculos visuales para los punteros
  const huePercent = ((360 - hsv.h) / 360) * 100;
  const currentHexCode = `#${rgbToHex(rgb.r, rgb.g, rgb.b)}`;
  const originalHexCode = `#${originalHex}`;

  return createPortal(
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none animate-fadeIn">
      <div
        className="w-full max-w-[560px] bg-[#262626] border border-[#3e3e3e] rounded-lg shadow-2xl text-white font-sans overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* BARRA SUPERIOR (HEADER) */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#1f1f1f] border-b border-[#383838]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: currentHexCode }} />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200">
              {title}
            </h3>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
            title="Cerrar"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* CUERPO PRINCIPAL DEL COLOR PICKER */}
        <div className="p-5 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row gap-5 items-start justify-between">
            {/* 1. ÁREA 2D DE SATURACIÓN Y VALOR (BRILLO) */}
            <div
              ref={satValRef}
              onMouseDown={onSatValMouseDown}
              onTouchStart={onSatValMouseDown}
              className="relative w-[240px] h-[240px] sm:w-[256px] sm:h-[256px] rounded border border-black cursor-crosshair flex-shrink-0 shadow-inner overflow-hidden"
              style={{
                backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
              }}
            >
              {/* Degradado horizontal blanco a transparente */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to right, #ffffff, rgba(255, 255, 255, 0))',
                }}
              />
              {/* Degradado vertical transparente a negro */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to top, #000000, rgba(0, 0, 0, 0))',
                }}
              />
              {/* Retícula / Círculo puntero de selección */}
              <div
                className="absolute w-4 h-4 rounded-full border-2 border-white shadow-[0_0_2px_1px_rgba(0,0,0,0.8)] pointer-events-none -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${hsv.s}%`,
                  top: `${100 - hsv.v}%`,
                }}
              />
            </div>

            {/* 2. BARRA VERTICAL DE TONO (HUE RAINBOW) */}
            <div className="relative flex items-center h-[240px] sm:h-[256px] select-none flex-shrink-0">
              <div
                ref={hueRef}
                onMouseDown={onHueMouseDown}
                onTouchStart={onHueMouseDown}
                className="w-7 h-full rounded-sm border border-black cursor-pointer shadow-inner relative"
                style={{
                  background:
                    'linear-gradient(to bottom, #ff0000 0%, #ff00ff 17%, #0000ff 33%, #00ffff 50%, #00ff00 67%, #ffff00 83%, #ff0000 100%)',
                }}
              />
              {/* Punteros de triángulo a ambos lados del deslizador */}
              <div
                className="absolute -left-2 -right-2 pointer-events-none flex justify-between items-center -translate-y-1/2"
                style={{ top: `${Math.max(0, Math.min(100, huePercent))}%` }}
              >
                {/* Triángulo izquierdo apuntando a la derecha */}
                <div
                  className="w-0 h-0 border-y-[5px] border-y-transparent border-l-[6px] border-l-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
                />
                {/* Triángulo derecho apuntando a la izquierda */}
                <div
                  className="w-0 h-0 border-y-[5px] border-y-transparent border-r-[6px] border-r-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
                />
              </div>
            </div>

            {/* 3. COLUMNA DERECHA: MUESTRA, INPUTS HSV, RGB, HEX Y BOTONES */}
            <div className="flex flex-col gap-4 flex-1 min-w-[170px] w-full">
              {/* Comparación Nuevo vs Actual */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col border border-black rounded overflow-hidden w-20 h-16 shadow-inner flex-shrink-0">
                  <div
                    className="flex-1 cursor-default relative group"
                    style={{ backgroundColor: currentHexCode }}
                    title="Nuevo color seleccionado"
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white/50 opacity-0 group-hover:opacity-100 uppercase tracking-tighter">
                      Nuevo
                    </span>
                  </div>
                  <div
                    onClick={() => updateFromHex(originalHex)}
                    className="flex-1 cursor-pointer relative group border-t border-black/40"
                    style={{ backgroundColor: originalHexCode }}
                    title="Clic para restaurar color original"
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white/50 opacity-0 group-hover:opacity-100 uppercase tracking-tighter">
                      Actual
                    </span>
                  </div>
                </div>

                {/* Botones de acción OK / Cancelar estilo Photoshop */}
                <div className="flex flex-col gap-1.5 flex-1">
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="w-full bg-[#3a3a3a] hover:bg-[#4a4a4a] active:bg-[#2f2f2f] border border-[#555] text-white text-xs font-bold py-1.5 px-3 rounded shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <FiCheck size={14} className="text-green-400" /> OK
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="w-full bg-[#333333] hover:bg-[#3d3d3d] active:bg-[#282828] border border-[#444] text-gray-300 hover:text-white text-xs font-medium py-1.5 px-3 rounded shadow-sm transition-all flex items-center justify-center"
                  >
                    Cancelar
                  </button>
                </div>
              </div>

              {/* GRUPOS DE INPUTS NUMÉRICOS: HSV & RGB */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-[#202020] p-3 rounded border border-[#333]">
                {/* BLOQUE HSV */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    HSV
                  </span>
                  
                  {/* H */}
                  <div className="flex items-center justify-between gap-1">
                    <label className="flex items-center gap-1 text-gray-300 font-bold cursor-pointer">
                      <input
                        type="radio"
                        name="activeChannel"
                        checked={activeChannel === 'H'}
                        onChange={() => setActiveChannel('H')}
                        className="accent-blue-500 w-3 h-3"
                      />
                      H:
                    </label>
                    <div className="flex items-center gap-0.5">
                      <input
                        type="number"
                        min="0"
                        max="360"
                        value={hsv.h}
                        onChange={(e) => updateFromHsv({ ...hsv, h: Number(e.target.value) || 0 })}
                        className="w-12 bg-white text-black font-mono font-bold text-xs px-1.5 py-0.5 rounded border border-gray-400 text-right outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-[10px] text-gray-400">°</span>
                    </div>
                  </div>

                  {/* S */}
                  <div className="flex items-center justify-between gap-1">
                    <label className="flex items-center gap-1 text-gray-300 font-bold cursor-pointer">
                      <input
                        type="radio"
                        name="activeChannel"
                        checked={activeChannel === 'S'}
                        onChange={() => setActiveChannel('S')}
                        className="accent-blue-500 w-3 h-3"
                      />
                      S:
                    </label>
                    <div className="flex items-center gap-0.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={hsv.s}
                        onChange={(e) => updateFromHsv({ ...hsv, s: Number(e.target.value) || 0 })}
                        className="w-12 bg-white text-black font-mono font-bold text-xs px-1.5 py-0.5 rounded border border-gray-400 text-right outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-[10px] text-gray-400">%</span>
                    </div>
                  </div>

                  {/* V */}
                  <div className="flex items-center justify-between gap-1">
                    <label className="flex items-center gap-1 text-gray-300 font-bold cursor-pointer">
                      <input
                        type="radio"
                        name="activeChannel"
                        checked={activeChannel === 'V'}
                        onChange={() => setActiveChannel('V')}
                        className="accent-blue-500 w-3 h-3"
                      />
                      V:
                    </label>
                    <div className="flex items-center gap-0.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={hsv.v}
                        onChange={(e) => updateFromHsv({ ...hsv, v: Number(e.target.value) || 0 })}
                        className="w-12 bg-white text-black font-mono font-bold text-xs px-1.5 py-0.5 rounded border border-gray-400 text-right outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-[10px] text-gray-400">%</span>
                    </div>
                  </div>
                </div>

                {/* BLOQUE RGB */}
                <div className="space-y-1.5 border-l border-[#333] pl-3">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    RGB
                  </span>

                  {/* R */}
                  <div className="flex items-center justify-between gap-1">
                    <label className="flex items-center gap-1 text-gray-300 font-bold cursor-pointer">
                      <input
                        type="radio"
                        name="activeChannel"
                        checked={activeChannel === 'R'}
                        onChange={() => setActiveChannel('R')}
                        className="accent-blue-500 w-3 h-3"
                      />
                      R:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={rgb.r}
                      onChange={(e) => updateFromRgb({ ...rgb, r: Number(e.target.value) || 0 })}
                      className="w-12 bg-white text-black font-mono font-bold text-xs px-1.5 py-0.5 rounded border border-gray-400 text-right outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* G */}
                  <div className="flex items-center justify-between gap-1">
                    <label className="flex items-center gap-1 text-gray-300 font-bold cursor-pointer">
                      <input
                        type="radio"
                        name="activeChannel"
                        checked={activeChannel === 'G'}
                        onChange={() => setActiveChannel('G')}
                        className="accent-blue-500 w-3 h-3"
                      />
                      G:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={rgb.g}
                      onChange={(e) => updateFromRgb({ ...rgb, g: Number(e.target.value) || 0 })}
                      className="w-12 bg-white text-black font-mono font-bold text-xs px-1.5 py-0.5 rounded border border-gray-400 text-right outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* B */}
                  <div className="flex items-center justify-between gap-1">
                    <label className="flex items-center gap-1 text-gray-300 font-bold cursor-pointer">
                      <input
                        type="radio"
                        name="activeChannel"
                        checked={activeChannel === 'B'}
                        onChange={() => setActiveChannel('B')}
                        className="accent-blue-500 w-3 h-3"
                      />
                      B:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={rgb.b}
                      onChange={(e) => updateFromRgb({ ...rgb, b: Number(e.target.value) || 0 })}
                      className="w-12 bg-white text-black font-mono font-bold text-xs px-1.5 py-0.5 rounded border border-gray-400 text-right outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* BLOQUE HEX / WEB */}
              <div className="bg-[#202020] p-3 rounded border border-[#333] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
                    Hex / Web
                  </span>
                  <span className="text-[9px] text-gray-500">Formato sRGB</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 font-mono font-bold text-xs">#</span>
                  <input
                    type="text"
                    maxLength={6}
                    value={hexInput}
                    onChange={(e) => updateFromHex(e.target.value)}
                    placeholder="808080"
                    className="w-20 bg-white text-black font-mono font-bold text-xs uppercase px-2 py-1 rounded border border-gray-400 text-left outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PALETA RÁPIDA DE COLORES PREDEFINIDOS / FRECUENTES */}
          <div className="pt-3 border-t border-[#383838]">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
              Muestras Rápidas:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {PRESET_SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => updateFromHex(swatch.replace('#', ''))}
                  className="w-6 h-6 rounded border border-black/80 hover:scale-110 active:scale-95 transition-transform relative group shadow-sm"
                  style={{ backgroundColor: swatch }}
                  title={swatch}
                >
                  {currentHexCode.toUpperCase() === swatch.toUpperCase() && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white mx-auto shadow-sm" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PhotoshopColorPicker;
