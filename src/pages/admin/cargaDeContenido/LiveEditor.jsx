import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FiEdit3,
  FiRefreshCw,
  FiExternalLink,
  FiCheckCircle,
  FiLock,
  FiMonitor,
  FiTablet,
  FiSmartphone,
  FiHome,
  FiBookOpen,
  FiMic,
  FiInfo,
  FiMail
} from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3003";

const SITE_SECTIONS = [
  { id: "home", label: "Inicio (Home)", path: "/", icon: FiHome },
  { id: "products", label: "Cabecera de Cursos", path: "/products", icon: FiBookOpen },
  { id: "pronunciation", label: "Práctica Speaking", path: "/pronunciation", icon: FiMic },
  { id: "about", label: "Sobre Nosotros", path: "/about", icon: FiInfo },
  { id: "contact", label: "Contacto", path: "/contact", icon: FiMail }
];

const VIEWPORTS = [
  { id: "desktop", label: "Escritorio", width: "100%", icon: FiMonitor },
  { id: "tablet", label: "Tablet", width: "820px", icon: FiTablet },
  { id: "mobile", label: "Móvil", width: "412px", icon: FiSmartphone }
];

const LiveEditor = () => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [activePage, setActivePage] = useState(SITE_SECTIONS[0]);
  const [viewport, setViewport] = useState("desktop");
  const [statusBanner, setStatusBanner] = useState({
    type: "ready",
    text: "Toca directamente encima de cualquier texto de la página para escribir y modificarlo."
  });
  const [savedCount, setSavedCount] = useState(0);

  const iframeRef = useRef(null);

  useEffect(() => {
    const handleIframeMessage = async (event) => {
      if (!event.data || typeof event.data !== "object") return;

      // Compatibilidad con <EditableText> directo
      if (event.data.type === "UPDATE_TEXT") {
        const { key, value, section } = event.data.payload || {};
        if (!key) return;
        try {
          setStatusBanner({
            type: "saving",
            text: "Guardando cambios en la sección..."
          });
          await axios.put(`${API_URL}/api/cms/texts`, { key, value, section });
          setSavedCount((c) => c + 1);
          setStatusBanner({
            type: "saved",
            text: "¡Texto actualizado y publicado automáticamente!"
          });
        } catch (error) {
          console.error("Error saving text:", error);
          setStatusBanner({
            type: "error",
            text: "No se pudo guardar el cambio. Revisa tu conexión."
          });
        }
      }

      // Notificación de foco en texto editable
      if (event.data.type === "CMS_EDITING_ACTIVE") {
        const preview = event.data.payload?.preview;
        setStatusBanner({
          type: "editing",
          text: preview
            ? `Editando en vivo: "${preview}..." — Haz clic fuera o presiona Esc para guardar.`
            : "Editando texto en vivo — Haz clic fuera o presiona Esc para guardar."
        });
      }

      // Confirmación de guardado desde CmsContext
      if (event.data.type === "CMS_TEXT_SAVED") {
        if (event.data.payload?.status === "success") {
          setSavedCount((c) => c + 1);
          setStatusBanner({
            type: "saved",
            text: "¡Cambio guardado automáticamente en la web!"
          });
        } else {
          setStatusBanner({
            type: "error",
            text: "Error al guardar el texto modificado."
          });
        }
      }

      // Aviso cuando el admin hace clic sobre un producto bloqueado
      if (event.data.type === "CMS_PRODUCT_LOCKED") {
        setStatusBanner({
          type: "locked",
          text:
            event.data.payload?.message ||
            "Los productos están protegidos en el Live View. Edítalos desde el módulo de Cursos."
        });
      }
    };

    window.addEventListener("message", handleIframeMessage);
    return () => window.removeEventListener("message", handleIframeMessage);
  }, []);

  const syncEditModeInIframe = () => {
    setIframeLoaded(true);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "TOGGLE_EDIT_MODE",
          payload: true
        },
        "*"
      );
    }
  };

  const handleSelectSection = (sectionItem) => {
    setIframeLoaded(false);
    setActivePage(sectionItem);
  };

  const handleReloadIframe = () => {
    if (!iframeRef.current) return;
    setIframeLoaded(false);
    iframeRef.current.src = `${window.location.protocol}//${window.location.host}${activePage.path}?editMode=true&t=${Date.now()}`;
  };

  const currentViewportObj = VIEWPORTS.find((v) => v.id === viewport) || VIEWPORTS[0];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#222222] font-['Inter',sans-serif]">
      {/* ── 1. HEADER DEL MÓDULO ── */}
      <div className="p-6 pb-2 border-b border-[#EAEAE6]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[11px] font-medium text-neutral-400">
                Diseño y Contenido Web / Live Editor
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-[#EDF9F0] text-[#29974D] border-[#DCF3E3]">
                Edición Directa Activa
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-[#FFF1EB] text-[#F36B2B] border-[#FDE0D3] inline-flex items-center gap-1">
                <FiLock className="w-3 h-3" /> Productos Protegidos
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
              Editor Visual de Textos en Vivo
            </h1>
            <p className="text-[11px] text-neutral-400 mt-1">
              Haz clic encima de cualquier título, párrafo o botón para escribir sobre él. Se excluyen las tarjetas de productos.
            </p>
          </div>

          {/* Controles de Dispositivo y Acciones */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="inline-flex bg-[#F2F2EE] p-1 rounded-xl text-[11px] font-medium text-neutral-600 border border-[#E9E9E4]">
              {VIEWPORTS.map((vp) => {
                const Icon = vp.icon;
                const isSelected = viewport === vp.id;
                return (
                  <button
                    key={vp.id}
                    type="button"
                    onClick={() => setViewport(vp.id)}
                    className={`inline-flex items-center gap-1.5 ${
                      isSelected
                        ? "px-2.5 py-1 bg-white text-neutral-900 rounded-lg shadow-2xs font-semibold"
                        : "px-2.5 py-1 hover:text-neutral-900 transition-colors"
                    }`}
                    title={vp.label}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{vp.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleReloadIframe}
              className="inline-flex items-center gap-2 bg-white hover:bg-[#F3F2EE] text-neutral-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#DEDEDA] shadow-2xs transition-colors"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${!iframeLoaded ? "animate-spin" : ""}`} />
              <span>Recargar Vista</span>
            </button>

            <a
              href={activePage.path}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-[#19191B] hover:bg-neutral-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm transition-colors"
            >
              <span>Ver Sitio Publicado</span>
              <FiExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Sub-tabs de Secciones */}
        <div className="flex items-center gap-6 mt-6 border-b border-[#EBEBE6] text-xs overflow-x-auto">
          {SITE_SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const active = activePage.id === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => handleSelectSection(sec)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  active
                    ? "pb-3 text-neutral-900 font-semibold border-b-2 border-neutral-900"
                    : "pb-3 text-neutral-400 hover:text-neutral-700"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. SECCIÓN DE CONTENIDO Y LIENZO ── */}
      <div className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-neutral-900">
            Vista Interactiva · {activePage.label}
          </h2>

          {/* Píldora de Estado en Vivo */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full border inline-flex items-center gap-1.5 ${
                statusBanner.type === "saved"
                  ? "bg-[#EDF9F0] text-[#29974D] border-[#DCF3E3]"
                  : statusBanner.type === "editing"
                  ? "bg-[#EEF5FF] text-[#2F80ED] border-[#DEEBFE]"
                  : statusBanner.type === "locked"
                  ? "bg-[#FFF1EB] text-[#F36B2B] border-[#FDE0D3]"
                  : statusBanner.type === "error"
                  ? "bg-[#FFF1EB] text-[#F36B2B] border-[#FDE0D3]"
                  : "bg-[#F3F2EE] text-neutral-600 border-[#E2E2DC]"
              }`}
            >
              {statusBanner.type === "saved" && <FiCheckCircle className="w-3.5 h-3.5 shrink-0" />}
              {statusBanner.type === "editing" && <FiEdit3 className="w-3.5 h-3.5 shrink-0" />}
              {statusBanner.type === "locked" && <FiLock className="w-3.5 h-3.5 shrink-0" />}
              <span>{statusBanner.text}</span>
            </div>

            {savedCount > 0 && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-[#EDF9F0] text-[#29974D] border-[#DCF3E3] shrink-0">
                {savedCount} cambio(s) guardado(s)
              </span>
            )}
          </div>
        </div>

        {/* Lienzo del Live View (Iframe Interactivo) */}
        <div className="w-full bg-white border border-[#ECECE6] rounded-2xl p-4 shadow-xs relative overflow-hidden flex items-center justify-center">
          {!iframeLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FAF9F6]/90 backdrop-blur-xs z-20">
              <div className="w-7 h-7 border-2 border-[#19191B] border-t-transparent rounded-full animate-spin mb-2.5"></div>
              <p className="text-xs font-bold text-neutral-900">Cargando vista interactiva...</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Activando edición directa sobre los textos de {activePage.label}
              </p>
            </div>
          )}

          <div
            style={{ width: currentViewportObj.width }}
            className="h-[calc(100vh-260px)] min-h-[580px] max-w-[1500px] bg-white rounded-xl overflow-hidden border border-[#E4E4DF] transition-all duration-200"
          >
            <iframe
              ref={iframeRef}
              title="Live Website Content Editor"
              src={`${window.location.protocol}//${window.location.host}${activePage.path}?editMode=true`}
              className="w-full h-full border-none bg-white"
              onLoad={syncEditModeInIframe}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveEditor;
