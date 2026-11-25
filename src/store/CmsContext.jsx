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

// Genera una clave determinística para cada imagen editable de sección
const buildStableImageKey = (pathname, originalSrc, altText) => {
  const cleanPath = (pathname || "home").replace(/[^a-zA-Z0-9]/g, "_") || "home";
  const cleanAlt = String(altText || "img")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/gi, "")
    .slice(0, 28);
  let hash = 0;
  const full = `IMG:${pathname}:${originalSrc}:${altText}`;
  for (let i = 0; i < full.length; i++) {
    hash = (hash << 5) - hash + full.charCodeAt(i);
    hash |= 0;
  }
  return `img_${cleanPath}_${cleanAlt}_${Math.abs(hash)}`;
};

const isEditableSectionImageNode = (img) => {
  if (!img || img.tagName !== "IMG") return false;
  if (img.closest("[data-cms-locked='true']")) return false;
  if (img.closest("nav")) return false;
  if (img.closest("[data-cms-ui='true']")) return false;
  return true;
};

const parseImageConfig = (rawVal, fallbackSrc = "") => {
  if (!rawVal) {
    return { src: fallbackSrc, fit: "cover", posX: 50, posY: 50, scale: 100 };
  }
  if (typeof rawVal === "string") {
    try {
      const parsed = JSON.parse(rawVal);
      if (parsed && typeof parsed === "object") {
        return {
          src: parsed.src || fallbackSrc,
          fit: parsed.fit || "cover",
          posX: parsed.posX !== undefined ? Number(parsed.posX) : 50,
          posY: parsed.posY !== undefined ? Number(parsed.posY) : 50,
          scale: parsed.scale !== undefined ? Number(parsed.scale) : 100
        };
      }
    } catch {
      return { src: rawVal, fit: "cover", posX: 50, posY: 50, scale: 100 };
    }
  }
  return { src: fallbackSrc, fit: "cover", posX: 50, posY: 50, scale: 100 };
};

const applyImageConfigToDom = (img, cfg) => {
  if (!img || !cfg) return;
  if (cfg.src && img.getAttribute("src") !== cfg.src) {
    img.setAttribute("src", cfg.src);
  }
  img.style.objectFit = cfg.fit || "cover";
  img.style.objectPosition = `${cfg.posX ?? 50}% ${cfg.posY ?? 50}%`;
  const sc = Number(cfg.scale ?? 100) / 100;
  img.style.transformOrigin = `${cfg.posX ?? 50}% ${cfg.posY ?? 50}%`;
  img.style.transform = sc !== 1 ? `scale(${sc})` : "";
};

const compressImageFileToDataUrl = (file, maxDim = 1600, quality = 0.86) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const image = new Image();
      image.onload = () => {
        let { width, height } = image;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/webp", quality));
      };
      image.onerror = () => resolve(ev.target.result);
      image.src = ev.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

const uploadCmsImageFile = async (file) => {
  try {
    const authRes = await fetch(`${API_URL}/api/auth/imagekit`);
    if (authRes.ok) {
      const authData = await authRes.json();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("publicKey", import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY);
      formData.append("signature", authData.signature);
      formData.append("expire", authData.expire);
      formData.append("token", authData.token);
      formData.append("fileName", `cms_${Date.now()}_${file.name}`);
      formData.append("folder", "/cms-content");

      const uploadRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        body: formData
      });
      if (uploadRes.ok) {
        const data = await uploadRes.json();
        if (data?.url) return data.url;
      }
    }
  } catch (err) {
    console.warn("ImageKit direct upload fallback:", err.message);
  }

  try {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "/cms-content");
    const r = await fetch(`${API_URL}/api/auth/imagekit/upload`, { method: "POST", body: fd });
    if (r.ok) {
      const d = await r.json();
      if (d?.url) return d.url;
    }
  } catch (err) {
    console.warn("Backend ImageKit upload fallback:", err.message);
  }

  return await compressImageFileToDataUrl(file);
};

// Verifica si un elemento contiene únicamente texto editable (sin sub-bloques complejos ni íconos puros)
const isEditableSectionTextNode = (el) => {
  if (!el || !el.tagName) return false;
  if (el.dataset?.cmsEditable === "true") return false; // Ya manejado por <EditableText>
  if (el.closest("[data-cms-locked='true']")) return false; // Productos excluidos por regla #3
  if (el.closest("[data-cms-ui='true']")) return false; // UI del propio editor excluida
  if (el.closest("[data-cms-typewriter-key]")) return false; // Frases con efecto de escritura tienen su propio modal
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
  const [imageEditorState, setImageEditorState] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [typewriterEditorState, setTypewriterEditorState] = useState(null);

  const activeImageKeyRef = useRef(null);
  const activeImageElRef = useRef(null);
  const dragStartRef = useRef(null);
  const fileInputRef = useRef(null);

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

      // Hidratar y vincular imágenes de las secciones (excepto productos y navbar)
      const images = document.querySelectorAll("img");
      images.forEach((img) => {
        if (!isEditableSectionImageNode(img)) return;

        if (!img.dataset.cmsImgKey) {
          const origSrc = img.getAttribute("src") || img.src || "";
          if (!origSrc) return;
          img.dataset.cmsOriginalSrc = origSrc;
          img.dataset.cmsImgKey = buildStableImageKey(pathname, origSrc, img.getAttribute("alt") || "");
        }

        const imgKey = img.dataset.cmsImgKey;
        const savedImgVal = textsRef.current[imgKey];

        if (activeImageKeyRef.current !== imgKey) {
          if (savedImgVal !== undefined) {
            const cfg = parseImageConfig(savedImgVal, img.dataset.cmsOriginalSrc);
            applyImageConfigToDom(img, cfg);
          }
        }

        if (editModeRef.current) {
          img.classList.add("cms-live-editable-image");
          img.setAttribute("title", "Haz clic para cambiar o ajustar esta foto");
        } else {
          img.classList.remove("cms-live-editable-image", "cms-live-editing-image-focus");
          if (img.getAttribute("title") === "Haz clic para cambiar o ajustar esta foto") {
            img.removeAttribute("title");
          }
        }
      });

      // Marcar nodos con efecto de escritura (typewriter) en modo edición
      const typewriterNodes = document.querySelectorAll("[data-cms-typewriter-key]");
      typewriterNodes.forEach((twNode) => {
        // Asegurar que ningún hijo interno tenga contenteditable residual
        twNode.querySelectorAll("[contenteditable]").forEach((child) => {
          child.removeAttribute("contenteditable");
          child.classList.remove("cms-live-editable-node", "cms-live-editing-focus");
          delete child.dataset.cmsAutoKey;
        });
        if (editModeRef.current) {
          twNode.classList.add("cms-live-editable-typewriter");
          twNode.setAttribute("title", "Haz clic para editar el listado de palabras con efecto de escritura");
        } else {
          twNode.classList.remove("cms-live-editable-typewriter");
          if (
            twNode.getAttribute("title") ===
            "Haz clic para editar el listado de palabras con efecto de escritura"
          ) {
            twNode.removeAttribute("title");
          }
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
        .cms-live-editable-image {
          cursor: pointer !important;
          transition: outline 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
          outline: 2px dashed rgba(52, 211, 153, 0.65) !important;
          outline-offset: -3px !important;
        }
        .cms-live-editable-image:hover {
          outline: 3px dashed #10b981 !important;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.25) !important;
        }
        .cms-live-editing-image-focus {
          outline: 3px solid #10b981 !important;
          box-shadow: 0 0 0 5px rgba(16, 185, 129, 0.35) !important;
        }
        .cms-live-editable-typewriter {
          cursor: pointer !important;
          border-radius: 8px;
          padding: 0 4px;
          transition: outline 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
          outline: 2px dashed rgba(192, 132, 252, 0.75) !important;
          outline-offset: 3px;
        }
        .cms-live-editable-typewriter:hover {
          outline: 2px solid #d8b4fe !important;
          background-color: rgba(124, 58, 237, 0.22) !important;
          box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.25) !important;
        }
        .cms-locked-products-zone {
          position: relative;
        }
      `;
      document.head.appendChild(styleTag);
    }

    const openImageEditorForElement = (imgEl) => {
      if (!imgEl || !imgEl.dataset?.cmsImgKey) return;
      const key = imgEl.dataset.cmsImgKey;
      const origSrc = imgEl.dataset.cmsOriginalSrc || imgEl.getAttribute("src") || "";
      const savedRaw = textsRef.current[key];
      const currentCfg = parseImageConfig(savedRaw, origSrc);

      if (activeImageElRef.current && activeImageElRef.current !== imgEl) {
        activeImageElRef.current.classList.remove("cms-live-editing-image-focus");
      }

      activeImageKeyRef.current = key;
      activeImageElRef.current = imgEl;
      imgEl.classList.add("cms-live-editing-image-focus");

      setImageEditorState({
        key,
        originalSrc: origSrc,
        initialConfig: { ...currentCfg },
        src: currentCfg.src || origSrc,
        fit: currentCfg.fit || "cover",
        posX: currentCfg.posX ?? 50,
        posY: currentCfg.posY ?? 50,
        scale: currentCfg.scale ?? 100,
        alt: imgEl.getAttribute("alt") || "Imagen de la sección"
      });

      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: "CMS_EDITING_ACTIVE",
            payload: {
              key,
              preview: `Foto: ${imgEl.getAttribute("alt") || "Sección"}`
            }
          },
          "*"
        );
      }
    };

    const handleGlobalClickCapture = (e) => {
      if (!editModeRef.current) return;

      // Ignorar clics dentro del propio modal de edición de imagen
      if (e.target.closest("[data-cms-ui='true']")) {
        return;
      }

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

      // Si toca directamente una imagen editable (o una capa decorativa sobre una imagen sin texto)
      let clickedImg = e.target.closest("img[data-cms-img-key]");
      if (
        !clickedImg &&
        !e.target.closest("[data-cms-auto-key], [data-cms-editable='true'], a, button, input, textarea, select")
      ) {
        const siblingOrChildImg = e.target.parentElement?.querySelector(":scope > img[data-cms-img-key]");
        if (siblingOrChildImg) {
          clickedImg = siblingOrChildImg;
        }
      }

      if (clickedImg) {
        e.preventDefault();
        e.stopPropagation();
        openImageEditorForElement(clickedImg);
        return;
      }

      // Si toca un nodo con efecto de escritura (typewriter), abrimos el modal con el listado de palabras/frases
      const clickedTypewriter = e.target.closest("[data-cms-typewriter-key]");
      if (clickedTypewriter) {
        e.preventDefault();
        e.stopPropagation();
        const twKey = clickedTypewriter.dataset.cmsTypewriterKey;
        let defaultPhrases = [
          "Habla con Fluidez",
          "Domina el Speaking",
          "Practica con IA 24/7",
          "Alcanza tus Metas"
        ];
        try {
          const parsedDef = JSON.parse(clickedTypewriter.dataset.cmsTypewriterDefault || "[]");
          if (Array.isArray(parsedDef) && parsedDef.length > 0) {
            defaultPhrases = parsedDef;
          }
        } catch {
          // keep fallback
        }

        let currentPhrases = [...defaultPhrases];
        const savedRaw = textsRef.current[twKey];
        if (savedRaw) {
          try {
            const parsedSaved = JSON.parse(savedRaw);
            if (Array.isArray(parsedSaved) && parsedSaved.length > 0) {
              currentPhrases = parsedSaved.map((s) => String(s || ""));
            }
          } catch {
            const split = String(savedRaw)
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean);
            if (split.length > 0) currentPhrases = split;
          }
        }

        setTypewriterEditorState({
          key: twKey,
          phrases: currentPhrases,
          defaultPhrases
        });

        if (window.parent && window.parent !== window) {
          window.parent.postMessage(
            {
              type: "CMS_EDITING_ACTIVE",
              payload: {
                key: twKey,
                preview: `Efecto de escritura (${currentPhrases.length} frases)`
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

  const updateImageEditorField = (partial) => {
    setImageEditorState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      if (activeImageElRef.current) {
        applyImageConfigToDom(activeImageElRef.current, next);
      }
      return next;
    });
  };

  const handleImageFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    setUploadingImage(true);
    try {
      const uploadedUrl = await uploadCmsImageFile(file);
      if (uploadedUrl) {
        updateImageEditorField({ src: uploadedUrl });
      }
    } catch (err) {
      console.error("Error uploading CMS image:", err);
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSaveImageConfig = async () => {
    if (!imageEditorState) return;
    const payloadObj = {
      src: imageEditorState.src,
      fit: imageEditorState.fit,
      posX: Math.round(Number(imageEditorState.posX ?? 50)),
      posY: Math.round(Number(imageEditorState.posY ?? 50)),
      scale: Math.round(Number(imageEditorState.scale ?? 100))
    };
    const serialized = JSON.stringify(payloadObj);
    const key = imageEditorState.key;

    if (activeImageElRef.current) {
      applyImageConfigToDom(activeImageElRef.current, payloadObj);
      activeImageElRef.current.classList.remove("cms-live-editing-image-focus");
    }

    activeImageKeyRef.current = null;
    activeImageElRef.current = null;
    setImageEditorState(null);

    await saveTextToBackend(key, serialized, "LIVE_IMAGE");
  };

  const handleResetImageOriginal = async () => {
    if (!imageEditorState) return;
    const origCfg = {
      src: imageEditorState.originalSrc,
      fit: "cover",
      posX: 50,
      posY: 50,
      scale: 100
    };
    updateImageEditorField(origCfg);
  };

  const handleCancelImageEditor = () => {
    if (imageEditorState && activeImageElRef.current) {
      applyImageConfigToDom(activeImageElRef.current, imageEditorState.initialConfig);
      activeImageElRef.current.classList.remove("cms-live-editing-image-focus");
    }
    activeImageKeyRef.current = null;
    activeImageElRef.current = null;
    setImageEditorState(null);
  };

  const handlePreviewPointerDown = (e) => {
    if (!imageEditorState) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const initPosX = Number(imageEditorState.posX ?? 50);
    const initPosY = Number(imageEditorState.posY ?? 50);
    dragStartRef.current = { startX, startY, initPosX, initPosY };

    const onMove = (moveEv) => {
      if (!dragStartRef.current) return;
      const dx = moveEv.clientX - dragStartRef.current.startX;
      const dy = moveEv.clientY - dragStartRef.current.startY;
      const nextX = Math.max(0, Math.min(100, Math.round(dragStartRef.current.initPosX - dx * 0.4)));
      const nextY = Math.max(0, Math.min(100, Math.round(dragStartRef.current.initPosY - dy * 0.4)));
      updateImageEditorField({ posX: nextX, posY: nextY });
    };

    const onUp = () => {
      dragStartRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const handleSaveTypewriterPhrases = async () => {
    if (!typewriterEditorState) return;
    const cleaned = (typewriterEditorState.phrases || [])
      .map((s) => String(s || "").trim())
      .filter(Boolean);
    const finalPhrases =
      cleaned.length > 0 ? cleaned : typewriterEditorState.defaultPhrases;
    const key = typewriterEditorState.key;
    setTypewriterEditorState(null);
    await saveTextToBackend(key, JSON.stringify(finalPhrases), "LIVE_TYPEWRITER");
  };

  return (
    <CmsContext.Provider value={{ texts, editMode, updateTextLocal, saveTextToBackend }}>
      {children}
      {editMode && typewriterEditorState && (
        <div
          data-cms-ui="true"
          className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto font-sans"
          onClick={() => setTypewriterEditorState(null)}
        >
          <div
            data-cms-ui="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[calc(100vh-24px)] overflow-y-auto bg-[#181326] text-white border border-white/15 rounded-2xl shadow-2xl p-4 space-y-3 select-none my-auto"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 block leading-tight">
                  Efecto de Escritura Animado
                </span>
                <h3 className="text-sm font-bold text-white">
                  Listado de palabras / frases que se escriben
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTypewriterEditorState(null)}
                className="w-7 h-7 shrink-0 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-bold text-white/80 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-white/70 leading-relaxed">
              Estas frases se muestran una por una con el efecto de máquina de escribir. Puedes editarlas, agregar nuevas o quitar las que no quieras.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {typewriterEditorState.phrases.map((phrase, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={phrase}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTypewriterEditorState((prev) => {
                        if (!prev) return prev;
                        const next = [...prev.phrases];
                        next[idx] = val;
                        return { ...prev, phrases: next };
                      });
                    }}
                    placeholder={`Frase #${idx + 1}...`}
                    className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder:text-white/35 focus:outline-none focus:border-purple-400"
                  />
                  {typewriterEditorState.phrases.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setTypewriterEditorState((prev) => {
                          if (!prev) return prev;
                          return {
                            ...prev,
                            phrases: prev.phrases.filter((_, i) => i !== idx)
                          };
                        })
                      }
                      title="Eliminar frase"
                      className="w-8 h-8 rounded-xl bg-red-500/15 hover:bg-red-500/30 border border-red-500/25 text-red-300 text-xs font-bold flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setTypewriterEditorState((prev) =>
                  prev ? { ...prev, phrases: [...prev.phrases, ""] } : prev
                )
              }
              className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-dashed border-purple-400/40 text-purple-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>+ Agregar otra palabra / frase</span>
            </button>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() =>
                  setTypewriterEditorState((prev) =>
                    prev ? { ...prev, phrases: [...prev.defaultPhrases] } : prev
                  )
                }
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-white/80 transition-colors cursor-pointer"
              >
                Restaurar originales
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTypewriterEditorState(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveTypewriterPhrases}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg transition-colors cursor-pointer"
                >
                  Guardar Frases
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {editMode && imageEditorState && (
        <div
          data-cms-ui="true"
          className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto font-sans"
          onClick={handleCancelImageEditor}
        >
          <div
            data-cms-ui="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[calc(100vh-24px)] overflow-y-auto bg-[#181326] text-white border border-white/15 rounded-2xl shadow-2xl p-4 space-y-2.5 select-none my-auto"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block leading-tight">
                  Editor Visual de Imagen
                </span>
                <h3 className="text-xs font-bold text-white truncate">
                  {imageEditorState.alt}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCancelImageEditor}
                className="w-7 h-7 shrink-0 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-bold text-white/80 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Vista Previa Interactiva (Arrastrar para encuadrar) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-white/70">
                <span>Vista previa (arrastra la foto para moverla)</span>
                <span className="font-mono text-[10px] text-emerald-300">
                  X:{imageEditorState.posX}% · Y:{imageEditorState.posY}% · {imageEditorState.scale}%
                </span>
              </div>
              <div
                onPointerDown={handlePreviewPointerDown}
                className="relative w-full h-32 rounded-xl overflow-hidden bg-black/50 border border-white/15 cursor-grab active:cursor-grabbing"
              >
                <img
                  data-cms-ui="true"
                  src={imageEditorState.src}
                  alt="Preview"
                  draggable={false}
                  style={{
                    objectFit: imageEditorState.fit || "cover",
                    objectPosition: `${imageEditorState.posX}% ${imageEditorState.posY}%`,
                    transformOrigin: `${imageEditorState.posX}% ${imageEditorState.posY}%`,
                    transform:
                      Number(imageEditorState.scale) !== 100
                        ? `scale(${Number(imageEditorState.scale) / 100})`
                        : undefined
                  }}
                  className="w-full h-full pointer-events-none select-none"
                />
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-semibold text-white">Procesando imagen...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Subir Archivo desde Dispositivo o Pegar URL */}
            <div className="space-y-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileSelect}
                className="hidden"
              />
              <button
                type="button"
                disabled={uploadingImage}
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
              >
                <span>📷 Cargar otra foto desde mi dispositivo</span>
              </button>

              <input
                type="text"
                value={imageEditorState.src.startsWith("data:") ? "" : imageEditorState.src}
                onChange={(e) => updateImageEditorField({ src: e.target.value })}
                placeholder="O pega aquí la URL directa de una imagen..."
                className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-purple-400"
              />
            </div>

            {/* Controles de Ajuste: Modo, Zoom y Posición X / Y */}
            <div className="space-y-2 pt-1.5 border-t border-white/10">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-white/80 font-medium">Modo de ajuste:</span>
                <div className="inline-flex rounded-lg bg-white/5 p-0.5 border border-white/10 text-[11px]">
                  {[
                    { id: "cover", label: "Cubrir" },
                    { id: "contain", label: "Contener" },
                    { id: "fill", label: "Estirar" }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => updateImageEditorField({ fit: m.id })}
                      className={`px-2.5 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                        imageEditorState.fit === m.id
                          ? "bg-purple-600 text-white"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/75">Zoom / Tamaño</span>
                  <span className="font-mono text-purple-300">{imageEditorState.scale}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={imageEditorState.scale}
                  onChange={(e) => updateImageEditorField({ scale: Number(e.target.value) })}
                  className="w-full accent-purple-500 cursor-pointer h-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/75">Posición Horizontal (X)</span>
                    <span className="font-mono text-purple-300">{imageEditorState.posX}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={imageEditorState.posX}
                    onChange={(e) => updateImageEditorField({ posX: Number(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer h-1.5"
                  />
                </div>

                <div className="space-y-0.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/75">Posición Vertical (Y)</span>
                    <span className="font-mono text-purple-300">{imageEditorState.posY}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={imageEditorState.posY}
                    onChange={(e) => updateImageEditorField({ posY: Number(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer h-1.5"
                  />
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleResetImageOriginal}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-white/80 transition-colors cursor-pointer"
              >
                Restaurar original
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelImageEditor}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={uploadingImage}
                  onClick={handleSaveImageConfig}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg transition-colors cursor-pointer"
                >
                  Guardar Foto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CmsContext.Provider>
  );
};

export default CmsContext;
