import React, { createContext, useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

const CmsContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3003";

// Genera una clave determinística a partir del texto original y la ruta
const buildStableTextKey = (pathname, tagName, originalText) => {
  const cleanPath = (pathname || "home").replace(/[^a-zA-Z0-9]/g, "_") || "home";
  const cleanText = String(originalText || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_áéíóúñ]/gi, "")
    .slice(0, 42);
  let hash = 0;
  const full = `${tagName}:${originalText}`;
  for (let i = 0; i < full.length; i++) {
    hash = (hash << 5) - hash + full.charCodeAt(i);
    hash |= 0;
  }
  return `sec_${cleanPath}_${tagName.toLowerCase()}_${cleanText}_${Math.abs(hash)}`;
};

// Verifica si un elemento contiene únicamente texto editable (sin sub-bloques complejos ni íconos puros)
const isEditableSectionTextNode = (el) => {
  if (!el || !el.tagName) return false;
  if (el.dataset?.cmsEditable === "true") return false; // Ya manejado por <EditableText>
  if (el.closest("[data-cms-locked='true']")) return false; // Productos excluidos por regla #3
  if (el.closest("nav")) return false; // Barra de navegación excluida
  if (el.closest("script, style, svg, video, canvas, input, textarea, select")) return false;

  const classList = el.className && typeof el.className === "string" ? el.className : "";
  if (
    classList.includes("material-symbols") ||
    classList.includes("fa-solid") ||
    classList.includes("fa-brands") ||
    classList.includes("fa-regular")
  ) {
    return false;
  }

  // Si tiene elementos hijos que son bloques u otros contenedores de texto, editamos los hijos más específicos
  const childElements = Array.from(el.children || []);
  const hasBlockChildren = childElements.some((child) =>
    ["DIV", "SECTION", "ARTICLE", "UL", "OL", "LI", "H1", "H2", "H3", "H4", "H5", "H6", "P", "BUTTON", "A"].includes(
      child.tagName
    )
  );
  if (hasBlockChildren) return false;

  // Debe tener al menos un nodo de texto directo con letras/números
  const directText = Array.from(el.childNodes)
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent.trim())
    .join(" ")
    .trim();

  return directText.length >= 2;
};

export const CmsProvider = ({ children }) => {
  const [texts, setTexts] = useState({});
  const [editMode, setEditMode] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("editMode") === "true";
  });

  const textsRef = useRef(texts);
  textsRef.current = texts;

  const editModeRef = useRef(editMode);
  editModeRef.current = editMode;

  const fetchTexts = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/cms/texts`);
      if (res.data && typeof res.data === "object") {
        setTexts(res.data);
      }
    } catch (error) {
      console.error("Error fetching CMS texts:", error);
    }
  }, []);

  useEffect(() => {
    fetchTexts();
  }, [fetchTexts]);

  const updateTextLocal = useCallback((key, value) => {
    setTexts((prev) => ({ ...prev, [key]: value }));
  }, []);

  const saveTextToBackend = useCallback(async (key, value, section = "WEB_SECTION") => {
    if (!key) return;
    setTexts((prev) => ({ ...prev, [key]: value }));

    try {
      await axios.put(`${API_URL}/api/cms/texts`, {
        key,
        value,
        section
      });

      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: "CMS_TEXT_SAVED",
            payload: { key, value, section, status: "success" }
          },
          "*"
        );
      }
    } catch (error) {
      console.error("Error saving CMS text:", error);
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: "CMS_TEXT_SAVED",
            payload: { key, value, section, status: "error" }
          },
          "*"
        );
      }
    }
  }, []);

  // Escuchar mensajes del LiveEditor padre (cambio de modo o navegación)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("editMode") === "true") {
      setEditMode(true);
    }

    const handleMessage = (event) => {
      if (event.data?.type === "TOGGLE_EDIT_MODE") {
        setEditMode(Boolean(event.data.payload));
      } else if (event.data?.type === "REFRESH_CMS_TEXTS") {
        fetchTexts();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [fetchTexts]);

  // Motor Automático de Edición en Vivo sobre el DOM para todas las secciones (excepto productos)
  useEffect(() => {
    const selector = "h1, h2, h3, h4, h5, h6, p, span, a, button, li, blockquote, label";

    const hydrateAndBindSectionTexts = () => {
      const candidates = document.querySelectorAll(selector);
      const pathname = window.location.pathname;

      candidates.forEach((el) => {
        if (!isEditableSectionTextNode(el)) return;

        // Asignar clave estable la primera vez que se descubre el nodo
        if (!el.dataset.cmsAutoKey) {
          const initialClean = (el.innerText || el.textContent || "").trim();
          if (!initialClean) return;
          el.dataset.cmsAutoKey = buildStableTextKey(pathname, el.tagName, initialClean);
        }

        const key = el.dataset.cmsAutoKey;
        const savedVal = textsRef.current[key];

        // Aplicar texto guardado si existe y el usuario no está escribiendo encima en este instante
        if (savedVal !== undefined && document.activeElement !== el) {
          if (el.innerHTML !== savedVal) {
            el.innerHTML = savedVal;
          }
        }

        // Configurar interactividad si estamos en editMode
        if (editModeRef.current) {
          el.setAttribute("contenteditable", "true");
          el.setAttribute("spellcheck", "false");
          el.classList.add("cms-live-editable-node");
        } else if (el.getAttribute("contenteditable") === "true" && !el.dataset.cmsEditable) {
          el.removeAttribute("contenteditable");
          el.classList.remove("cms-live-editable-node", "cms-live-editing-focus");
        }
      });

      // Marcar visualmente los contenedores de productos bloqueados en modo edición
      const lockedContainers = document.querySelectorAll("[data-cms-locked='true']");
      lockedContainers.forEach((container) => {
        if (editModeRef.current) {
          container.classList.add("cms-locked-products-zone");
        } else {
          container.classList.remove("cms-locked-products-zone");
        }
      });
    };

    hydrateAndBindSectionTexts();
    const timer = setTimeout(hydrateAndBindSectionTexts, 500);
    const observer = new MutationObserver(() => {
      hydrateAndBindSectionTexts();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [texts, editMode]);

  // Manejadores globales de clic, foco, escritura y guardado cuando editMode === true
  useEffect(() => {
    if (!editMode) return;

    // Inyectar hoja de estilo para resaltado elegante en el Live View
    const styleId = "cms-live-editor-inline-styles";
    if (!document.getElementById(styleId)) {
      const styleTag = document.createElement("style");
      styleTag.id = styleId;
      styleTag.innerHTML = `
        .cms-live-editable-node {
          cursor: text !important;
          border-radius: 6px;
          transition: outline 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
          outline: 1px dashed rgba(168, 85, 247, 0.45);
          outline-offset: 3px;
        }
        .cms-live-editable-node:hover {
          outline: 2px dashed #c084fc !important;
          background-color: rgba(124, 58, 237, 0.14) !important;
        }
        .cms-live-editable-node:focus,
        .cms-live-editing-focus {
          outline: 2px solid #d2bbff !important;
          background-color: rgba(124, 58, 237, 0.22) !important;
          box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.25) !important;
        }
        .cms-locked-products-zone {
          position: relative;
        }
      `;
      document.head.appendChild(styleTag);
    }

    const handleGlobalClickCapture = (e) => {
      if (!editModeRef.current) return;

      // Si toca dentro de una zona de productos bloqueada, bloqueamos navegación y avisamos al editor
      const lockedZone = e.target.closest("[data-cms-locked='true']");
      if (lockedZone) {
        e.preventDefault();
        e.stopPropagation();
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(
            {
              type: "CMS_PRODUCT_LOCKED",
              payload: {
                message: "Los productos y cursos no son editables aquí. Modifícalos desde el Inventario de Cursos."
              }
            },
            "*"
          );
        }
        return;
      }

      // Si toca un nodo editable (o un enlace/botón con texto editable), evitamos que navegue y enfocamos el texto
      const editableNode = e.target.closest("[data-cms-auto-key], [data-cms-editable='true']");
      if (editableNode) {
        const parentLinkOrBtn = e.target.closest("a, button");
        if (parentLinkOrBtn) {
          e.preventDefault();
        }
        if (document.activeElement !== editableNode) {
          editableNode.focus();
        }
      }
    };

    const handleGlobalFocusIn = (e) => {
      const el = e.target;
      if (!el?.dataset?.cmsAutoKey) return;
      el.classList.add("cms-live-editing-focus");
      el.dataset.cmsBeforeEdit = el.innerHTML;
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: "CMS_EDITING_ACTIVE",
            payload: {
              key: el.dataset.cmsAutoKey,
              preview: (el.innerText || "").slice(0, 50)
            }
          },
          "*"
        );
      }
    };

    const handleGlobalFocusOut = (e) => {
      const el = e.target;
      if (!el?.dataset?.cmsAutoKey) return;
      el.classList.remove("cms-live-editing-focus");
      const key = el.dataset.cmsAutoKey;
      const newValue = (el.innerHTML || "").trim();
      const prevValue = el.dataset.cmsBeforeEdit;

      if (newValue && newValue !== prevValue) {
        saveTextToBackend(key, newValue, "LIVE_SECTION");
      }
    };

    const handleGlobalKeyDown = (e) => {
      const el = e.target;
      if (!el?.dataset?.cmsAutoKey) return;
      if (e.key === "Escape") {
        el.blur();
      }
    };

    document.addEventListener("click", handleGlobalClickCapture, true);
    document.addEventListener("focusin", handleGlobalFocusIn);
    document.addEventListener("focusout", handleGlobalFocusOut);
    document.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      document.removeEventListener("click", handleGlobalClickCapture, true);
      document.removeEventListener("focusin", handleGlobalFocusIn);
      document.removeEventListener("focusout", handleGlobalFocusOut);
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [editMode, saveTextToBackend]);

  return (
    <CmsContext.Provider value={{ texts, editMode, updateTextLocal, saveTextToBackend }}>
      {children}
    </CmsContext.Provider>
  );
};

export default CmsContext;
