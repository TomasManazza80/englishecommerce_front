import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPackage,
  FiSearch,
  FiAlertTriangle,
  FiEdit2,
  FiTrash2,
  FiX,
  FiInfo,
  FiSave,
  FiLoader,
  FiPlus,
  FiCheck,
  FiCheckCircle,
  FiRefreshCcw,
  FiFileText,
  FiUploadCloud,
  FiCpu,
  FiEye,
  FiVolume2,
  FiMic,
  FiImage,
  FiChevronLeft,
  FiChevronRight
} from "react-icons/fi";
import Swal from "sweetalert2";
import ProductInfoModal from "../ProductInfoModal";
import PhotoshopColorPicker from "../../../components/admin/PhotoshopColorPicker";
import CategoryManager from "../../../components/admin/CategoryManager";
import CoverImageCropModal from "../../../components/admin/CoverImageCropModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3003";

// ── TIPOS DE MATERIAL (DOCENTES, ESTUDIANTES, LECTURA) ──
const MATERIAL_TYPES = [
  {
    id: "docentes",
    emoji: "👩‍🏫",
    title: "Para Docentes",
    badge: "Profesores & Metodología",
    pillClass: "bg-[#F3F2EE] text-neutral-700 border-[#ECECE6]",
    activeCard: "border-neutral-900 bg-[#FAF9F6] ring-2 ring-neutral-900/10"
  },
  {
    id: "estudiantes",
    emoji: "🎓",
    title: "Para Estudiantes",
    badge: "Alumnos & Práctica IA",
    pillClass: "bg-[#F3F2EE] text-neutral-700 border-[#ECECE6]",
    activeCard: "border-neutral-900 bg-[#FAF9F6] ring-2 ring-neutral-900/10"
  },
  {
    id: "lectura",
    emoji: "📖",
    title: "Material de Lectura",
    badge: "Lectura & Comprensión",
    pillClass: "bg-[#F3F2EE] text-neutral-700 border-[#ECECE6]",
    activeCard: "border-neutral-900 bg-[#FAF9F6] ring-2 ring-neutral-900/10"
  }
];

const ENGLISH_LEVELS = [
  { code: "A1", label: "A1 · Principiante (Beginner)", short: "A1 · Principiante" },
  { code: "A2", label: "A2 · Elemental (Elementary)", short: "A2 · Elemental" },
  { code: "A1 / A2", label: "A1 / A2 · Básico Inicial", short: "A1 / A2 · Básico" },
  { code: "B1", label: "B1 · Intermedio (Intermediate)", short: "B1 · Intermedio" },
  { code: "B2", label: "B2 · Intermedio Alto (Upper-Intermediate)", short: "B2 · Intermedio Alto" },
  { code: "B1 / B2", label: "B1 / B2 · Intermedio a Intermedio Alto", short: "B1 / B2 · Intermedio" },
  { code: "C1", label: "C1 · Avanzado (Advanced)", short: "C1 · Avanzado" },
  { code: "C2", label: "C2 · Dominio / Bilingüe (Proficiency)", short: "C2 · Dominio" },
  { code: "Todos los niveles", label: "Todos los niveles (A1 – C2)", short: "Todos los niveles" }
];

// ── ESCENARIOS BASE POR DEFECTO (FORMATO HTML) ──
const DEFAULT_HTML_SCENARIOS = [
  {
    num: "01",
    emoji: "✈️",
    title: "At the Airport",
    topics: ["check-in", "passport control", "delayed flights", "asking for directions"],
    questions: [
      {
        q: "Where are you travelling today? Tell me about your destination and why you chose it.",
        hint: "Use: 'I'm flying to... because...' / 'I've always wanted to visit... because...'",
        vocab: ["boarding pass", "check-in", "departure", "destination", "gate"]
      },
      {
        q: "How many bags are you checking in? Describe the check-in process at an airport.",
        hint: "Structure: how many bags → what you pack → any special items → the check-in process you follow.",
        vocab: ["luggage", "carry-on", "excess baggage", "weight limit", "conveyor belt"]
      },
      {
        q: "What would you do if your flight was delayed by 4 hours? How would you handle it?",
        hint: "Use: 'First, I would... then I'd...' / 'I think the most important thing is...' / 'I'd ask the airline to...'",
        vocab: ["delay", "compensation", "customer service", "voucher", "rebooking"]
      }
    ]
  },
  {
    num: "02",
    emoji: "🏨",
    title: "At the Hotel",
    topics: ["checking in", "requesting services", "solving problems"],
    questions: [
      {
        q: "You are at the hotel reception. Ask for a room with a view and explain your preferences.",
        hint: "Use polite requests: 'Could I possibly have...' / 'I was wondering if...' / 'I'd prefer a room that...'",
        vocab: ["reception", "reservation", "room upgrade", "sea view", "ground floor"]
      },
      {
        q: "There is a problem with your hotel room — the air conditioning isn't working and it's very noisy. Call reception and explain.",
        hint: "Structure: state the problem politely → explain how it affects you → ask for a solution.",
        vocab: ["complaint", "maintenance", "inconvenience", "switch rooms", "apologize"]
      },
      {
        q: "What makes a hotel stay truly great for you? Describe your ideal hotel experience.",
        hint: "Talk about: location, facilities, staff, breakfast, room comfort — use adjectives and examples.",
        vocab: ["amenities", "hospitality", "concierge", "buffet", "cozy"]
      }
    ]
  },
  {
    num: "03",
    emoji: "🍽️",
    title: "At a Restaurant",
    topics: ["ordering food", "dietary needs", "paying the bill"],
    questions: [
      {
        q: "You are at a restaurant abroad. Order a starter, a main course and a drink — and ask the waiter for a recommendation.",
        hint: "Use: 'To start, I'll have...' / 'For my main course, I'd like...' / 'What would you recommend?'",
        vocab: ["starter", "main course", "side dish", "house special", "beverage"]
      },
      {
        q: "You have a food allergy or dietary restriction. Explain this clearly to the waiter and ask about the ingredients.",
        hint: "Use: 'I'm allergic to...' / 'Does this dish contain...?' / 'Could the chef prepare it without...?'",
        vocab: ["allergy", "gluten-free", "dairy", "ingredients", "cross-contamination"]
      },
      {
        q: "The wrong dish arrives at your table, or the food is cold. How do you handle the situation politely?",
        hint: "Use polite phrases: 'Excuse me, I think there's been a mistake...' / 'I'm sorry to bother you, but...'",
        vocab: ["mix-up", "undercooked", "send back", "replacement", "on the house"]
      }
    ]
  }
];

// ── UTILIDAD: OPTIMIZACIÓN SEGURA DE IMÁGENES ──
const optimizeImage = (rawUrl, width = 800) => {
  const url =
    typeof rawUrl === "string"
      ? rawUrl
      : rawUrl?.url || rawUrl?.src || (Array.isArray(rawUrl) && typeof rawUrl[0] === "string" ? rawUrl[0] : "");
  if (!url || typeof url !== "string") return "";
  if (url.includes("ik.imagekit.io")) {
    return `${url}?tr=w-${width},f-webp,q-80`;
  } else if (url.includes("res.cloudinary.com")) {
    const parts = url.split("/upload/");
    if (parts.length === 2) {
      return `${parts[0]}/upload/w_${width},f_webp,q_auto/${parts[1]}`;
    }
  }
  return url;
};

// ── UTILIDAD: NORMALIZAR ESCENARIOS DEL CURSO ──
const normalizeCourseScenarios = (rawActivities) => {
  let list = rawActivities;
  if (typeof list === "string") {
    try {
      list = JSON.parse(list);
    } catch {
      list = [];
    }
  }
  if (!Array.isArray(list)) return [];

  // Filtramos objetos con formato escenario { title, questions }
  const validScenarios = list.filter(
    (item) => item && typeof item === "object" && (Array.isArray(item.questions) || item.title)
  );

  return validScenarios.map((sc, idx) => ({
    num: sc.num || String(idx + 1).padStart(2, "0"),
    emoji: sc.emoji || "🗣️",
    title: sc.title || `Scenario ${idx + 1}`,
    topics: Array.isArray(sc.topics)
      ? sc.topics
      : typeof sc.topics === "string"
        ? sc.topics.split(",").map((s) => s.trim()).filter(Boolean)
        : ["speaking practice", "fluency"],
    questions:
      Array.isArray(sc.questions) && sc.questions.length > 0
        ? sc.questions.map((qItem) => ({
          q: qItem?.q || "",
          hint: qItem?.hint || "Use complete sentences and clear pronunciation.",
          vocab: Array.isArray(qItem?.vocab)
            ? qItem.vocab
            : typeof qItem?.vocab === "string"
              ? qItem.vocab.split(",").map((s) => s.trim()).filter(Boolean)
              : ["vocabulary", "fluency"]
        }))
        : [
          {
            q: "Describe this scenario and your main ideas in English.",
            hint: "Use: 'In this situation, I would...' / 'For example...'",
            vocab: ["context", "response", "fluency"]
          }
        ]
  }));
};

// ── UTILIDAD: DETECTAR METADATOS DE ARCHIVOS (PPT, PDF, WORD) ──
const detectFileMetadata = (fileName = "", mimeType = "") => {
  const ext = String(fileName).split(".").pop().toLowerCase();
  if (["ppt", "pptx"].includes(ext) || String(mimeType).includes("presentation") || String(mimeType).includes("powerpoint")) {
    return {
      badge: "PPT",
      label: "PowerPoint",
      fileType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      colorClass: "bg-[#FFF1EB] text-[#F36B2B] border-[#FDE0D3]",
      iconBg: "bg-[#FFF1EB] text-[#F36B2B] border border-[#FDE0D3]"
    };
  }
  if (["doc", "docx"].includes(ext) || String(mimeType).includes("word") || String(mimeType).includes("msword")) {
    return {
      badge: "WORD",
      label: "Word",
      fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      colorClass: "bg-[#F3F2EE] text-neutral-700 border-[#ECECE6]",
      iconBg: "bg-[#F3F2EE] text-neutral-700 border border-[#ECECE6]"
    };
  }
  return {
    badge: "PDF",
    label: "PDF",
    fileType: "application/pdf",
    colorClass: "bg-red-50 text-red-700 border-red-200",
    iconBg: "bg-red-50 text-red-700 border border-red-200"
  };
};

// ── SUBIDA A IMAGEKIT CON FALLBACK LOCAL ──
const uploadFileToCloud = async (file, folder = "/products") => {
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
      formData.append("fileName", file.name);
      formData.append("folder", folder);

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
    console.warn("Fallback local file reader:", err.message);
  }

  try {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);
    const r = await fetch(`${API_URL}/api/auth/imagekit/upload`, { method: "POST", body: fd });
    if (r.ok) {
      const d = await r.json();
      if (d?.url) return d.url;
    }
  } catch (err) {
    console.warn("Backend upload falló:", err.message);
  }

  if (!String(file.type || "").startsWith("image/")) {
    throw new Error("No se pudo subir el archivo al servidor. Verifica la conexión con el backend.");
  }

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};

// ══════════════════════════════════════════════════════════════════════════════
// MODAL DE VISTA PREVIA DEL ALUMNO (MISMO CONTENIDO DE PRODUCT DETAIL / VENTAS)
// ══════════════════════════════════════════════════════════════════════════════
const CourseInteractivePreviewModal = ({ isOpen, onClose, productData }) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeModule, setActiveModule] = useState(0);
  const [activeFaq, setActiveFaq] = useState(null);

  if (!isOpen || !productData) return null;

  const getPrice = () => {
    if (productData.precioAlPublico !== undefined && productData.precioAlPublico !== "" && !isNaN(Number(productData.precioAlPublico))) {
      return Number(productData.precioAlPublico);
    }
    const vPrice = productData.variantes?.[0]?.precioAlPublico;
    if (vPrice !== undefined && vPrice !== null && !isNaN(Number(vPrice)) && Number(vPrice) > 0) {
      return Number(vPrice);
    }
    if (productData.precioVenta && Number(productData.precioVenta) > 0) return Number(productData.precioVenta);
    if (productData.precio && Number(productData.precio) > 0) return Number(productData.precio);
    if (productData.precioInfoproducto && Number(productData.precioInfoproducto) > 0) return Number(productData.precioInfoproducto);
    return 0;
  };

  const coursePrice = getPrice();
  const originalPrice = coursePrice > 0 ? Math.round(coursePrice * 1.5) : 0;

  const getCourseImage = () => {
    if (!productData?.imagenes || productData.imagenes.length === 0) {
      return "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000";
    }
    const firstImg = productData.imagenes[0];
    if (typeof firstImg === "string") return firstImg;
    return firstImg?.url || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000";
  };

  const getAudioDemoText = () => {
    if (productData?.speakingActivities?.[0]?.questions?.[0]?.q) {
      return productData.speakingActivities[0].questions[0].q;
    }
    if (productData?.speakingActivities?.[0]?.prompt) {
      return productData.speakingActivities[0].prompt;
    }
    const nameLower = (productData?.nombre || "").toLowerCase();
    if (nameLower.includes("viaje") || nameLower.includes("turismo")) {
      return "Excuse me, could you please tell me which gate leaves for London Heathrow?";
    }
    if (nameLower.includes("negocio") || nameLower.includes("entrevista")) {
      return "Let's align on next quarter's key deliverables and performance indicators.";
    }
    if (nameLower.includes("ielts") || nameLower.includes("toefl")) {
      return "The chart illustrates a significant upward trend in renewable energy adoption.";
    }
    if (nameLower.includes("docente") || nameLower.includes("pedagog")) {
      return "Effective communicative language teaching engages students in authentic classroom tasks.";
    }
    return `Welcome to ${productData?.nombre || "EnglishBloom"}. Practice your spoken English with instant acoustic feedback.`;
  };

  const handlePlayAudioDemo = () => {
    if ("speechSynthesis" in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      } else {
        const textToSpeak = getAudioDemoText();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = "en-US";
        utterance.rate = 0.95;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        setIsPlayingAudio(true);
        window.speechSynthesis.speak(utterance);
      }
    } else {
      setIsPlayingAudio(!isPlayingAudio);
    }
  };

  const getDynamicSyllabus = () => {
    const list = [];

    if (Array.isArray(productData?.speakingActivities) && productData.speakingActivities.length > 0) {
      productData.speakingActivities.forEach((act, idx) => {
        const firstQ = act?.questions?.[0]?.q || act?.prompt;
        list.push({
          num: String(list.length + 1).padStart(2, "0"),
          title: act.title || `Práctica Conversacional ${idx + 1}`,
          duration: `Nivel ${act.level || productData.subcategoria || "General"} • Laboratorio Oral con IA`,
          content: firstQ || "Simulación oral interactiva con análisis fonético y retroalimentación inmediata.",
          tags: ["Speaking IA", act.level ? `Nivel ${act.level}` : "Conversación", "Análisis Fonético"]
        });
      });
    }

    if (Array.isArray(productData?.archivosInfoproducto) && productData.archivosInfoproducto.length > 0) {
      productData.archivosInfoproducto.forEach((file, idx) => {
        const fileName = file.name || file.nombre || `Material de Estudio ${idx + 1}`;
        const isVideo = file.fileType?.includes("video") || fileName.toLowerCase().endsWith(".mp4");
        const isAudio = file.fileType?.includes("audio") || fileName.toLowerCase().endsWith(".mp3");
        const isWord = /\.(docx?|rtf)$/i.test(fileName) || String(file.fileType || "").includes("word") || file.badge === "WORD";
        const isPpt = /\.(pptx?)$/i.test(fileName) || String(file.fileType || "").includes("presentation") || file.badge === "PPT";

        list.push({
          num: String(list.length + 1).padStart(2, "0"),
          title: fileName,
          duration: isVideo
            ? "Lección en Video HD (Solo Web)"
            : isAudio
              ? "Práctica de Listening Nativo (Solo Web)"
              : isWord
                ? "Documento Word Editable (Descargable)"
                : isPpt
                  ? "Presentación Interactiva (Solo Web)"
                  : "Guía PDF Digital de Estudio (Solo Web)",
          content: `Material oficial del curso '${productData?.nombre}'. Incluye vocabulario práctico, expresiones esenciales y ejercicios guiados.`,
          tags: [
            isVideo ? "Video HD" : isAudio ? "Audio Listening" : isWord ? "Word Descargable" : isPpt ? "PowerPoint" : "Documento PDF",
            "Material Oficial",
            isWord ? "Descarga Permitida" : "Protegido Solo Web 🔒"
          ]
        });
      });
    }

    const descLines = (productData?.descripcion || "")
      .split("\n")
      .map((l) => l.replace(/^[-•✅\s]+/, "").trim())
      .filter((l) => l.length > 10);

    if (list.length === 0 && descLines.length > 0) {
      descLines.forEach((line, idx) => {
        list.push({
          num: String(idx + 1).padStart(2, "0"),
          title: line,
          duration: `Módulo ${idx + 1} • Inmersión Práctica`,
          content: `Dominio intensivo de "${line.toLowerCase()}". Explicaciones paso a paso con vocabulario aplicado y evaluación en tiempo real.`,
          tags: ["Vocabulario Esencial", "Inmersión", "Casos Reales"]
        });
      });
    }

    return list.length > 0
      ? list
      : [
        {
          num: "01",
          title: "Fundamentos y Vocabulario Práctico",
          duration: "Módulo Principal • Clases y Simulaciones",
          content: productData?.descripcion || "Desarrollo de fluidez y expresión oral en situaciones de la vida real.",
          tags: ["Speaking", "Fluidez", "Pronunciación"]
        }
      ];
  };

  const syllabusModules = getDynamicSyllabus();

  const parseDescriptionBullets = () => {
    if (!productData?.descripcion) {
      return [
        "Desarrollo de fluidez conversacional en contextos reales",
        "Práctica guiada con tutor inteligente las 24 horas",
        "Corrección fonética y reducción de acento",
        "Material de estudio oficial y certificado"
      ];
    }
    const lines = productData.descripcion
      .split("\n")
      .map((l) => l.replace(/^[-•✅\s]+/, "").trim())
      .filter(Boolean);

    return lines.length > 0 ? lines : [productData.descripcion];
  };

  const descBullets = parseDescriptionBullets();

  const faqs = [
    {
      q: "¿Cómo funciona el feedback fonético de la IA?",
      a: "Nuestro motor analiza el espectro de tu voz comparándolo con hablantes nativos en tiempo real. Te indica si la lengua o los labios fallaron en la articulación del sonido exacto, desglosando la palabra en colores para que corrijas inmediatamente."
    },
    {
      q: "¿Cuánto tiempo necesito dedicar al día?",
      a: "El método está optimizado para personas con poco tiempo: 20 a 30 minutos al día son suficientes para generar memoria muscular y fluidez duradera."
    },
    {
      q: "¿El certificado es válido a nivel internacional?",
      a: "Sí. Al completar los módulos y aprobar la prueba final de conversación, recibes un certificado oficial alineado al Marco Común Europeo de Referencia (CEFR)."
    }
  ];

  return createPortal(
    <div className="fixed inset-0 z-[10050] bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-hidden font-sans">
      <div className="bg-background text-on-surface border border-white/10 rounded-3xl w-full max-w-7xl h-[94vh] flex flex-col overflow-hidden shadow-2xl relative">
        {/* Top Admin Preview Banner */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-surface-container-lowest/95 border-b border-white/10 shrink-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex items-center gap-1.5 bg-primary-container text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(124,58,237,0.4)]">
              <FiEye className="w-3.5 h-3.5" /> Vista Previa de Venta (Product Detail)
            </span>
            <span className="text-xs text-on-surface-variant hidden md:inline truncate">
              Así es exactamente como el alumno verá la página de compra de este curso
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if ("speechSynthesis" in window) window.speechSynthesis.cancel();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold border border-white/10 transition-colors"
          >
            <span>Cerrar Vista Previa</span>
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable ProductDetails Replica */}
        <div data-lenis-prevent className="flex-1 overflow-y-auto relative">
          {/* Subtle Ambient Glows */}
          <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-primary-container/15 rounded-full blur-[130px] pointer-events-none"></div>
          <div className="absolute top-[40%] right-10 w-[420px] h-[420px] bg-tertiary-container/15 rounded-full blur-[120px] pointer-events-none"></div>

          {/* Breadcrumbs */}
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 pt-6 pb-4">
            <nav className="flex items-center gap-2 text-on-surface-variant text-xs sm:text-sm flex-wrap">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">home</span> Inicio
              </span>
              <span className="text-outline">/</span>
              <span>Cursos</span>
              <span className="text-outline">/</span>
              <span className="text-on-surface-variant">{productData?.categoria || "Negocios & Fluidez"}</span>
              <span className="text-outline">/</span>
              <span className="text-primary font-semibold truncate max-w-xs">
                {productData?.nombre || "Curso sin título"}
              </span>
            </nav>
          </div>

          {/* HERO / ENROLLMENT SECTION (Asymmetric 7:5 Split) */}
          <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Left Column: Course Presentation & Core Value (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-5">
                {/* Category Pill Badge */}
                <div className="inline-flex items-center gap-2 bg-surface-container-high/80 px-4 py-1.5 rounded-full w-fit backdrop-blur-md border border-white/5">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                  <span className="text-xs uppercase tracking-widest text-secondary font-bold">
                    English Bloom Academy • {productData?.categoria || "Edición 2025"}
                  </span>
                </div>

                {/* Main Title */}
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight leading-[1.15]">
                  {productData?.nombre || "Curso sin título"}
                  <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-on-surface via-primary to-secondary">
                    con Inteligencia Artificial
                  </span>
                </h1>

                {/* Subtitle / Description */}
                <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
                  {productData?.descripcion?.split("\n")[0] ||
                    "Aprende a comunicarte con total seguridad en reuniones ejecutivas, entrevistas internacionales y presentaciones de alto impacto con feedback fonético en milisegundos."}
                </p>

                {/* KPI / Social Proof Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-container-low p-4 rounded-2xl border border-white/5">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1 text-tertiary">
                      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                      <span className="text-xl font-bold text-on-surface">4.9/5</span>
                    </div>
                    <span className="text-xs text-on-surface-variant">840+ valoraciones</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-on-surface truncate">
                      {productData?.subcategoria?.split("·")[0]?.trim() || "B1 → C1"}
                    </span>
                    <span className="text-xs text-on-surface-variant">Rango de Nivel</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-on-surface">12 Sem.</span>
                    <span className="text-xs text-on-surface-variant">Acceso vitalicio</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-on-surface">CEFR</span>
                    <span className="text-xs text-on-surface-variant">Certificado Oficial</span>
                  </div>
                </div>

                {/* Core Value Bullet Points */}
                <div className="flex flex-col gap-2.5 pt-2">
                  <span className="text-xs uppercase tracking-wider text-secondary font-bold">
                    Objetivos y Contenidos del Curso:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {descBullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-2.5 text-on-surface text-sm">
                        <div className="w-6 h-6 rounded-full bg-primary-container/40 flex items-center justify-center text-primary shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-[16px]">check</span>
                        </div>
                        <span className="leading-snug">{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audio Interactive Preview Bar */}
                <div className="bg-surface-container p-4 rounded-2xl flex items-center justify-between gap-4 flex-wrap mt-2 border border-white/5">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={handlePlayAudioDemo}
                      className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-[0_0_16px_rgba(124,58,237,0.5)] shrink-0"
                    >
                      <span className="material-symbols-outlined text-[22px]">
                        {isPlayingAudio ? "pause" : "play_arrow"}
                      </span>
                    </button>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-on-surface">Escucha una frase clave del curso</span>
                      <span className="text-xs text-on-surface-variant truncate max-w-md italic">
                        "{getAudioDemoText()}"
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 h-6 shrink-0">
                    <span className={`w-1 bg-secondary rounded-full ${isPlayingAudio ? "h-4 animate-pulse" : "h-2"}`}></span>
                    <span className={`w-1 bg-primary rounded-full ${isPlayingAudio ? "h-6 animate-pulse" : "h-4"}`}></span>
                    <span className={`w-1 bg-tertiary rounded-full ${isPlayingAudio ? "h-7 animate-pulse" : "h-5"}`}></span>
                    <span className={`w-1 bg-primary-fixed rounded-full ${isPlayingAudio ? "h-5 animate-pulse" : "h-3"}`}></span>
                    <span className={`w-1 bg-secondary rounded-full ${isPlayingAudio ? "h-3 animate-pulse" : "h-2"}`}></span>
                    <span className="text-xs font-bold text-tertiary ml-2">Modelo Acústico Activo</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Enrollment Card (5 cols) */}
              <div className="lg:col-span-5 relative w-full">
                <div className="bg-surface-container-low rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-white/10 flex flex-col gap-4 sm:gap-5">
                  {/* Media Preview Box */}
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden group bg-surface-container">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={getCourseImage()}
                      alt={productData?.nombre}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 via-transparent to-black/30"></div>

                    <button
                      type="button"
                      onClick={handlePlayAudioDemo}
                      className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-white/90 text-on-secondary flex items-center justify-center backdrop-blur-md shadow-xl hover:scale-110 active:scale-95 transition-transform"
                    >
                      <span className="material-symbols-outlined text-[32px] ml-1 text-[#490081]">
                        {isPlayingAudio ? "pause" : "play_arrow"}
                      </span>
                    </button>

                    <div className="absolute bottom-3 inset-x-3 bg-white text-surface-container-lowest p-2.5 rounded-full shadow-xl flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 pl-1 truncate">
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary-container shrink-0">
                          <span className="material-symbols-outlined text-[16px] text-primary-container">mic</span>
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="text-[12px] font-bold text-surface-container-lowest leading-tight truncate">
                            {productData?.nombre || "Curso Interactivo"}
                          </span>
                          <span className="text-[10px] text-primary-container font-semibold">
                            {productData?.archivosInfoproducto?.length || 1} material(es) incluidos
                          </span>
                        </div>
                      </div>
                      <span className="bg-surface-container-low text-primary text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 font-bold">
                        Tutor IA Activo
                      </span>
                    </div>
                  </div>

                  {/* Pricing & Promo Offer */}
                  <div className="flex items-baseline justify-between pt-1">
                    {coursePrice > 0 ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-on-surface">
                          ${coursePrice.toLocaleString("es-AR")}{" "}
                          <span className="text-sm font-semibold text-on-surface-variant">ARS</span>
                        </span>
                        {originalPrice > coursePrice && (
                          <span className="line-through text-outline text-base">
                            ${originalPrice.toLocaleString("es-AR")} ARS
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-extrabold text-secondary">
                          Acceso Gratuito
                        </span>
                      </div>
                    )}
                    {coursePrice > 0 ? (
                      <span className="bg-primary-container text-white text-xs uppercase px-3 py-1 rounded-full font-bold shadow-[0_0_12px_rgba(124,58,237,0.4)]">
                        Inscripción Inmediata
                      </span>
                    ) : (
                      <span className="bg-secondary-container text-on-secondary-container text-xs uppercase px-3 py-1 rounded-full font-bold">
                        Acceso Total
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-on-surface-variant -mt-2">
                    {coursePrice > 0
                      ? "Precio oficial de inscripción para acceso completo al curso y tutor de voz con IA."
                      : "Este programa está 100% bonificado con acceso total a los materiales y prácticas."}
                  </p>

                  {/* CTA Buttons */}
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        Swal.fire({
                          title: "Vista Previa del Botón de Compra",
                          text: `El alumno agregará "${productData?.nombre}" al carrito por $${coursePrice.toLocaleString("es-AR")} ARS.`,
                          icon: "info",
                          background: "#1e192b",
                          color: "#e8def9",
                          confirmButtonColor: "#7c3aed"
                        })
                      }
                      className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-primary-container to-inverse-primary text-white font-bold text-sm tracking-wide shadow-[0_0_24px_rgba(124,58,237,0.45)] hover:shadow-[0_0_32px_rgba(124,58,237,0.7)] transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[20px]">bolt</span>
                      {coursePrice > 0 ? `Inscribirme por $${coursePrice.toLocaleString("es-AR")} ARS` : "Inscribirme Gratis Ahora"}
                    </button>

                    <button
                      type="button"
                      className="w-full py-3 px-6 rounded-full bg-surface-container-high/80 text-on-surface font-semibold text-xs sm:text-sm text-center transition-all flex items-center justify-center gap-2 border border-white/5 cursor-default"
                    >
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                      Consultar por WhatsApp
                    </button>
                  </div>

                  {/* Trust & Guarantees */}
                  <div className="flex items-center justify-center gap-4 text-outline text-xs pt-1">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-secondary">verified_user</span>
                      <span>Garantía de Satisfacción</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-tertiary">all_inclusive</span>
                      <span>Acceso de por vida</span>
                    </div>
                  </div>

                  {/* Includes Quick List */}
                  <div className="bg-surface-container p-4 rounded-2xl flex flex-col gap-2 border border-white/5">
                    <span className="text-sm text-on-surface font-semibold">Este curso incluye:</span>
                    <ul className="flex flex-col gap-2 text-xs text-on-surface-variant">
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[16px]">menu_book</span>
                        <span>{productData?.archivosInfoproducto?.length || 1} material(es) oficial(es) de estudio</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-tertiary text-[16px]">record_voice_over</span>
                        <span>{productData?.speakingActivities?.length || 2} práctica(s) guiada(s) con IA</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-[16px]">psychology</span>
                        <span>Tutor IA para resolución de dudas y pronunciación</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#eaddff] text-[16px]">workspace_premium</span>
                        <span>Certificado oficial de finalización</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SYLLABUS / PLAN DE ESTUDIO (Expandable Accordion) */}
          <section className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-10 border-t border-white/5">
            <div className="flex flex-col gap-6 max-w-4xl">
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase text-secondary tracking-widest font-bold">
                  Curriculum Completo ({syllabusModules.length} Módulos / Materiales)
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-on-surface">
                  Plan de Estudio Paso a Paso
                </h2>
                <p className="text-sm sm:text-base text-on-surface-variant">
                  Contenido generado automáticamente a partir de los escenarios IA, archivos y beneficios que cargaste en este curso.
                </p>
              </div>

              <div className="flex flex-col gap-3 mt-2">
                {syllabusModules.map((mod, idx) => {
                  const isOpen = activeModule === idx;
                  return (
                    <div key={idx} className="bg-surface-container-low rounded-2xl overflow-hidden border border-white/5 transition-all">
                      <button
                        type="button"
                        onClick={() => setActiveModule(isOpen ? -1 : idx)}
                        className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-on-surface hover:bg-surface-container-high/40 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-extrabold text-secondary">{mod.num}</span>
                          <div>
                            <span className="block text-on-surface font-bold text-base sm:text-lg">{mod.title}</span>
                            <span className="text-xs text-on-surface-variant font-normal">{mod.duration}</span>
                          </div>
                        </div>
                        <span className={`material-symbols-outlined transition-transform duration-300 text-on-surface-variant ${isOpen ? "rotate-180 text-primary" : ""}`}>
                          expand_more
                        </span>
                      </button>

                      {isOpen && (
                        <div className="px-6 pb-5 pt-1 text-on-surface-variant text-sm flex flex-col gap-3 border-t border-white/5">
                          <p className="leading-relaxed">{mod.content}</p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {mod.tags.map((t, tIdx) => (
                              <span key={tIdx} className="bg-surface-container px-3 py-1 rounded-full text-xs text-on-surface font-medium border border-white/5">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* FAQ SECTION */}
          <section className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-10 border-t border-white/5 pb-16">
            <div className="max-w-4xl flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase text-secondary tracking-widest font-bold">
                  Dudas Habituales
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-on-surface">Preguntas Frecuentes</h2>
              </div>

              <div className="flex flex-col gap-3">
                {faqs.map((faq, idx) => {
                  const isOpen = activeFaq === idx;
                  return (
                    <div key={idx} className="bg-surface-container-low rounded-2xl overflow-hidden border border-white/5">
                      <button
                        type="button"
                        onClick={() => setActiveFaq(isOpen ? null : idx)}
                        className="w-full p-4 text-left flex items-center justify-between gap-4 font-semibold text-on-surface hover:bg-surface-container-high/40 transition-colors"
                      >
                        <span className="text-sm">{faq.q}</span>
                        <span className={`material-symbols-outlined transition-transform duration-300 text-on-surface-variant ${isOpen ? "rotate-180 text-primary" : ""}`}>
                          expand_more
                        </span>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 pt-1 text-on-surface-variant text-xs sm:text-sm leading-relaxed border-t border-white/5">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MODAL EDITOR COMPLETO DE CURSO (INTUITIVO, SIMPLE Y CON EDITOR DE PREGUNTAS)
// ══════════════════════════════════════════════════════════════════════════════
const FormularioEditarModal = ({
  producto,
  initialTab = 1,
  onClose,
  onSave,
  categorias,
  onRefreshCategories
}) => {
  const [step, setStep] = useState(initialTab);
  const [saving, setSaving] = useState(false);

  // Normalizamos escenarios iniciales (si no tiene, inicia vacío para que el admin cargue los suyos)
  const initialScenarios = useMemo(() => {
    const parsed = normalizeCourseScenarios(producto.speakingActivities);
    return parsed.length > 0 ? parsed : [];
  }, [producto]);

  // Normalizamos archivos iniciales
  const initialFiles = useMemo(() => {
    let raw = producto.archivosInfoproducto;
    if (typeof raw === "string") {
      try {
        raw = JSON.parse(raw);
      } catch {
        raw = [];
      }
    }
    if (!Array.isArray(raw)) return [];
    return raw.map((f, i) => {
      const name = f.name || f.nombre || `Documento_${i + 1}.pdf`;
      const meta = detectFileMetadata(name, f.fileType || f.tipo);
      return {
        ...f,
        name,
        nombre: name,
        url: f.url || "",
        fileType: f.fileType || meta.fileType,
        badge: f.badge || meta.badge,
        size: f.size || "Archivo cargado"
      };
    });
  }, [producto]);

  const initialPrice =
    producto.variantes?.[0]?.precioAlPublico !== undefined
      ? producto.variantes[0].precioAlPublico
      : producto.precioInfoproducto ?? producto.precioVenta ?? 0;

  const initialStock =
    producto.variantes?.[0]?.stock !== undefined
      ? producto.variantes[0].stock
      : producto.cantidad ?? producto.stock ?? 9999;

  const [editado, setEditado] = useState({
    ...producto,
    nombre: producto.nombre || "",
    marca: producto.marca || "Everything English",
    categoria: producto.categoria || "",
    subcategoria: producto.subcategoria || "B1 / B2 · Intermedio a Intermedio Alto",
    audience: producto.audience || "estudiantes",
    precioAlPublico: initialPrice,
    stock: initialStock,
    alerta: producto.alerta ?? 0,
    color: producto.color || producto.variantes?.[0]?.color || "#7C3AED",
    descripcion: producto.descripcion || "",
    imagenes: Array.isArray(producto.imagenes) ? producto.imagenes : [],
    archivosInfoproducto: initialFiles,
    speakingActivities: initialScenarios,
    esInfoproducto: true
  });

  // Inputs auxiliares Paso 1
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [benefitInput, setBenefitInput] = useState("");
  const [coverUrlInput, setCoverUrlInput] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverCropState, setCoverCropState] = useState({
    isOpen: false,
    imageSrc: "",
    fileName: "portada.jpg",
    isObjectUrl: false
  });
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Inputs auxiliares Paso 2 (Archivos PPT, PDF, Word)
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Inputs auxiliares Paso 3 (Editor de Escenarios y Preguntas IA)
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [generatingFromPdf, setGeneratingFromPdf] = useState(false);
  const [scenarioCountToGenerate, setScenarioCountToGenerate] = useState(5);
  const [lastPdfNameUsed, setLastPdfNameUsed] = useState("");
  const [showStudentPreview, setShowStudentPreview] = useState(false);

  const coverInputRef = useRef(null);
  const courseFilesInputRef = useRef(null);
  const pdfAiInputRef = useRef(null);

  const scenarios = Array.isArray(editado.speakingActivities) ? editado.speakingActivities : [];
  const currentScenario = scenarios[activeScenarioIdx] || scenarios[0] || null;
  const currentQuestion =
    currentScenario?.questions?.[activeQuestionIdx] || currentScenario?.questions?.[0] || null;

  const benefitsList = editado.descripcion
    ? editado.descripcion.split("\n").filter((l) => l.trim() !== "")
    : [];

  // ── MANEJADORES SECCIÓN 1: DATOS, BENEFICIOS Y PORTADA ──
  const handleAddCategory = async () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    try {
      const res = await axios.post(`${API_URL}/api/categories`, { nombre: trimmed });
      if (onRefreshCategories) await onRefreshCategories();
      setEditado((prev) => ({ ...prev, categoria: res.data?.categoryName || trimmed }));
      setNewCategoryInput("");
    } catch {
      setEditado((prev) => ({ ...prev, categoria: trimmed }));
      setNewCategoryInput("");
    }
  };

  const handleAddBenefit = () => {
    const val = benefitInput.trim();
    if (!val) return;
    setEditado((prev) => ({
      ...prev,
      descripcion: [...benefitsList, val].join("\n")
    }));
    setBenefitInput("");
  };

  const handleUpdateBenefitLine = (idx, newText) => {
    const updated = [...benefitsList];
    updated[idx] = newText;
    setEditado((prev) => ({
      ...prev,
      descripcion: updated.join("\n")
    }));
  };

  const handleRemoveBenefitLine = (idx) => {
    setEditado((prev) => ({
      ...prev,
      descripcion: benefitsList.filter((_, i) => i !== idx).join("\n")
    }));
  };

  const closeCoverCropModal = () => {
    if (coverCropState.isObjectUrl && coverCropState.imageSrc) {
      URL.revokeObjectURL(coverCropState.imageSrc);
    }
    setCoverCropState({
      isOpen: false,
      imageSrc: "",
      fileName: "portada.jpg",
      isObjectUrl: false
    });
  };

  const handleUploadCoverImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setCoverCropState({
      isOpen: true,
      imageSrc: objectUrl,
      fileName: file.name || "portada.jpg",
      isObjectUrl: true
    });
    e.target.value = null;
  };

  const handleConfirmCoverCrop = async (croppedFile) => {
    setUploadingCover(true);
    try {
      const url = await uploadFileToCloud(croppedFile, "/products/covers");
      setEditado((prev) => ({
        ...prev,
        imagenes: [url, ...(prev.imagenes || []).filter(Boolean).slice(1)].slice(0, 10)
      }));
      closeCoverCropModal();
    } catch (err) {
      Swal.fire({
        title: "Error al subir portada",
        text: err.message || "No se pudo procesar la imagen.",
        icon: "error",
        confirmButtonColor: "#0f172a"
      });
    } finally {
      setUploadingCover(false);
    }
  };

  // ── MANEJADORES SECCIÓN 2: ARCHIVOS DEL CURSO (PPT, PDF, WORD) ──
  const handleUploadCourseFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingFiles(true);
    try {
      const uploadedItems = await Promise.all(
        files.map(async (file) => {
          const meta = detectFileMetadata(file.name, file.type);
          const url = await uploadFileToCloud(file, "/products/materials");
          const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + " MB";

          let pdfBase64 = null;
          if (meta.badge === "PDF") {
            pdfBase64 = await new Promise((resolve) => {
              const r = new FileReader();
              r.onload = () => resolve(r.result.split(",")[1]);
              r.onerror = () => resolve(null);
              r.readAsDataURL(file);
            });
          }

          return {
            name: file.name,
            nombre: file.name,
            url,
            fileType: meta.fileType,
            badge: meta.badge,
            size: sizeMB,
            _pdfBase64: pdfBase64
          };
        })
      );

      setEditado((prev) => ({
        ...prev,
        archivosInfoproducto: [...(prev.archivosInfoproducto || []), ...uploadedItems]
      }));

      Swal.fire({
        title: "¡Archivos añadidos!",
        text: `Se agregaron ${uploadedItems.length} archivo(s) al curso.`,
        icon: "success",
        timer: 1800,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        title: "Error al subir archivos",
        text: err.message || "Intenta nuevamente.",
        icon: "error",
        confirmButtonColor: "#0f172a"
      });
    } finally {
      setUploadingFiles(false);
      e.target.value = null;
    }
  };

  const handleRemoveCourseFile = (idxToRemove) => {
    setEditado((prev) => ({
      ...prev,
      archivosInfoproducto: (prev.archivosInfoproducto || []).filter((_, i) => i !== idxToRemove)
    }));
  };

  // ── MANEJADORES SECCIÓN 3: ESCENARIOS Y PREGUNTAS IA (FORMATO HTML) ──
  const generateScenariosFromPdfPayload = async ({ pdfBase64, pdfUrl, fileName = "Documento.pdf" }) => {
    if (!pdfBase64 && !pdfUrl) return;
    setGeneratingFromPdf(true);
    setLastPdfNameUsed(fileName);

    try {
      const res = await axios.post(`${API_URL}/api/pronunciation/generate-from-pdf`, {
        pdfBase64,
        pdfUrl,
        fileName,
        scenarioCount: scenarioCountToGenerate,
        audience: editado.audience || "estudiantes"
      });

      const generatedScenarios =
        Array.isArray(res.data?.scenarios) && res.data.scenarios.length > 0
          ? res.data.scenarios
          : DEFAULT_HTML_SCENARIOS;

      setEditado((prev) => {
        const existing = Array.isArray(prev.speakingActivities) ? prev.speakingActivities : [];
        const merged = [...existing, ...generatedScenarios].map((sc, i) => ({
          ...sc,
          num: String(i + 1).padStart(2, "0")
        }));
        return {
          ...prev,
          speakingActivities: merged
        };
      });

      setActiveScenarioIdx(scenarios.length);
      setActiveQuestionIdx(0);
      setStep(3);

      Swal.fire({
        title: "¡Ejercicios IA Creados!",
        text: `Se generaron y añadieron ${generatedScenarios.length} escenarios interactivos desde "${fileName}".`,
        icon: "success",
        confirmButtonColor: "#0f172a"
      });
    } catch (err) {
      console.error("Error generating scenarios from PDF:", err);
      Swal.fire({
        title: "No se pudo conectar con la IA",
        text: "Verifica el archivo PDF o edita las preguntas manualmente abajo.",
        icon: "warning",
        confirmButtonColor: "#0f172a"
      });
    } finally {
      setGeneratingFromPdf(false);
    }
  };

  const handleGenerateAiActivitiesFromBackend = async () => {
    if (!editado.id) {
      Swal.fire({
        title: "Guarda el curso primero",
        text: "Primero guarda el curso para poder generar actividades con IA.",
        icon: "info",
        confirmButtonColor: "#7c3aed"
      });
      return;
    }
    setGeneratingFromPdf(true);
    Swal.fire({
      title: "Generando Actividades con IA...",
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 8px 0;">
          <p style="font-size: 14px; font-weight: 500; color: #6d28d9;">Analizando archivos y contenido del curso...</p>
          <p style="font-size: 12px; color: #64748b;">Creando escenarios interactivos con preguntas y vocabulario</p>
        </div>
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const res = await axios.post(`${API_URL}/products/${editado.id}/generate-ai-activities`, {
        count: scenarioCountToGenerate || 15
      });

      if (res.data?.success && Array.isArray(res.data?.scenarios)) {
        const newScenarios = res.data.scenarios;
        setEditado((prev) => ({
          ...prev,
          speakingActivities: newScenarios
        }));
        setActiveScenarioIdx(0);
        setActiveQuestionIdx(0);
        Swal.fire({
          title: "¡Actividades Creadas!",
          text: `Se generaron y actualizaron ${newScenarios.length} escenarios interactivos basados en el contenido.`,
          icon: "success",
          confirmButtonColor: "#7c3aed"
        });
      } else {
        throw new Error(res.data?.message || "Error al generar");
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: "Error al generar con IA",
        text: err.response?.data?.message || err.message || "No se pudo generar.",
        icon: "error",
        confirmButtonColor: "#7c3aed"
      });
    } finally {
      setGeneratingFromPdf(false);
    }
  };

  const handlePdfUploadForAiExercises = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const pdfBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      // Si no estaba entre los archivos del curso, también lo agregamos
      const exists = (editado.archivosInfoproducto || []).some(
        (f) => (f.name || f.nombre) === file.name
      );
      if (!exists) {
        const url = await uploadFileToCloud(file, "/products/materials");
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + " MB";
        setEditado((prev) => ({
          ...prev,
          archivosInfoproducto: [
            ...(prev.archivosInfoproducto || []),
            {
              name: file.name,
              nombre: file.name,
              url,
              fileType: "application/pdf",
              badge: "PDF",
              size: sizeMB,
              _pdfBase64: pdfBase64
            }
          ]
        }));
      }

      await generateScenariosFromPdfPayload({ pdfBase64, fileName: file.name });
    } catch {
      Swal.fire({
        title: "Error al leer el PDF",
        text: "Selecciona un archivo PDF válido.",
        icon: "error",
        confirmButtonColor: "#0f172a"
      });
    } finally {
      e.target.value = null;
    }
  };

  const handleAddScenario = () => {
    setEditado((prev) => {
      const list = Array.isArray(prev.speakingActivities) ? prev.speakingActivities : [];
      const nextNum = String(list.length + 1).padStart(2, "0");
      const newSc = {
        num: nextNum,
        emoji: "🗣️",
        title: "",
        topics: [],
        questions: []
      };
      const updated = [...list, newSc];
      setActiveScenarioIdx(updated.length - 1);
      setActiveQuestionIdx(0);
      return { ...prev, speakingActivities: updated };
    });
  };

  const handleDeleteScenario = (scIdx) => {
    setEditado((prev) => {
      const filtered = (prev.speakingActivities || [])
        .filter((_, i) => i !== scIdx)
        .map((sc, i) => ({ ...sc, num: String(i + 1).padStart(2, "0") }));
      return { ...prev, speakingActivities: filtered };
    });
    setActiveScenarioIdx((prevIdx) => {
      if (prevIdx > scIdx) return prevIdx - 1;
      if (prevIdx === scIdx) return Math.max(0, scIdx - 1);
      return prevIdx;
    });
    setActiveQuestionIdx(0);
  };

  const handleUpdateScenarioField = (scIdx, field, value) => {
    setEditado((prev) => {
      const list = [...(prev.speakingActivities || [])];
      if (!list[scIdx]) return prev;
      list[scIdx] = { ...list[scIdx], [field]: value };
      return { ...prev, speakingActivities: list };
    });
  };

  const handleAddQuestionToScenario = (scIdx) => {
    setEditado((prev) => {
      const list = [...(prev.speakingActivities || [])];
      if (!list[scIdx]) return prev;
      const questions = [...(list[scIdx].questions || [])];
      questions.push({
        q: "",
        hint: "",
        vocab: []
      });
      list[scIdx] = { ...list[scIdx], questions };
      setActiveQuestionIdx(questions.length - 1);
      return { ...prev, speakingActivities: list };
    });
  };

  const handleDeleteQuestionFromScenario = (scIdx, qIdx) => {
    setEditado((prev) => {
      const list = [...(prev.speakingActivities || [])];
      if (!list[scIdx]) return prev;
      const questions = (list[scIdx].questions || []).filter((_, i) => i !== qIdx);
      list[scIdx] = { ...list[scIdx], questions };
      return { ...prev, speakingActivities: list };
    });
    setActiveQuestionIdx((prevIdx) => {
      if (prevIdx > qIdx) return prevIdx - 1;
      if (prevIdx === qIdx) return Math.max(0, qIdx - 1);
      return prevIdx;
    });
  };

  const handleUpdateQuestionField = (scIdx, qIdx, field, value) => {
    setEditado((prev) => {
      const list = [...(prev.speakingActivities || [])];
      if (!list[scIdx]) return prev;
      const questions = [...(list[scIdx].questions || [])];
      if (!questions[qIdx]) return prev;
      questions[qIdx] = { ...questions[qIdx], [field]: value };
      list[scIdx] = { ...list[scIdx], questions };
      return { ...prev, speakingActivities: list };
    });
  };

  const speakText = (text) => {
    if (!("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.92;
    window.speechSynthesis.speak(u);
  };

  // ── GUARDAR TODOS LOS CAMBIOS DEL CURSO ──
  const handleSaveAllChanges = async () => {
    if (!editado.nombre.trim()) {
      setStep(1);
      Swal.fire({
        title: "Falta el nombre del curso",
        text: "Por favor ingresa un título para el curso.",
        icon: "warning",
        confirmButtonColor: "#0f172a"
      });
      return;
    }

    setSaving(true);
    try {
      const cleanFiles = (editado.archivosInfoproducto || []).map(({ _pdfBase64, ...rest }) => rest);
      const priceNum = Number(editado.precioAlPublico) || 0;
      const stockNum = Number(editado.stock) || 9999;

      const payload = {
        ...editado,
        precioInfoproducto: priceNum,
        precioVenta: priceNum,
        archivosInfoproducto: cleanFiles,
        speakingActivities: editado.speakingActivities || [],
        esInfoproducto: true,
        fechaActualizacionPrecio: new Date().toISOString().split("T")[0],
        variantes: [
          {
            color: editado.color || "#7C3AED",
            almacenamiento: "Digital",
            stock: stockNum,
            costoDeCompra: 0,
            precioAlPublico: priceNum,
            precioMayorista: priceNum,
            precioRevendedor: priceNum
          }
        ]
      };

      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#19191B]/60 backdrop-blur-sm p-2 sm:p-5 font-['Inter',sans-serif]"
    >
      <motion.div
        initial={{ scale: 0.98, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.98, y: 10 }}
        className="w-full max-w-6xl h-[94vh] bg-[#E8E6DF] rounded-2xl shadow-xl border border-[#D4D2C9] flex flex-col overflow-hidden"
      >
        {/* ── HEADER DEL MODAL DE EDICIÓN ── */}
        <div className="bg-white border-b border-[#ECECE6] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#19191B] text-white flex items-center justify-center shrink-0">
              <FiEdit2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-neutral-600 bg-[#F3F2EE] border border-[#ECECE6] px-2 py-0.5 rounded-xl">
                  Editor Completo de Curso
                </span>
                <span className="text-xs text-neutral-400 font-medium">ID #{editado.id}</span>
              </div>
              <h2 className="text-base font-medium text-neutral-800 truncate mt-0.5">
                {editado.nombre || "Curso sin título"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowStudentPreview(true)}
              className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 bg-white border border-[#E2E2DC] text-neutral-700 hover:bg-[#FAF9F6] transition-colors"
            >
              <FiEye className="w-4 h-4" /> Vista Previa Alumno
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-xl inline-flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-[#F3F2EE] transition-colors"
              title="Cerrar"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── NAVEGACIÓN DIRECTA EN 3 SECCIONES INTUITIVAS ── */}
        <div className="bg-white border-b border-[#ECECE6] px-6 py-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0">
          {[
            {
              num: 1,
              title: "1. Tipo de Material y Datos",
              sub: "Docentes / Estudiantes / Lectura, Precio y Portada"
            },
            {
              num: 2,
              title: `2. Archivos (${editado.archivosInfoproducto?.length || 0})`,
              sub: "PowerPoint (.pptx), PDF (.pdf) y Word (.docx)"
            },
            {
              num: 3,
              title: `3. Escenarios y Preguntas IA (${scenarios.length})`,
              sub: "Modificar preguntas, hints, vocabulario o generar con PDF"
            }
          ].map((item) => {
            const active = step === item.num;
            return (
              <button
                key={item.num}
                type="button"
                onClick={() => setStep(item.num)}
                className={`text-left px-4 py-2.5 rounded-2xl border transition-colors flex items-center gap-3 ${active
                    ? "bg-[#FAF9F6] border-neutral-900 shadow-xs"
                    : "bg-white border-[#ECECE6] hover:bg-[#FAF9F6]"
                  }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-medium text-xs shrink-0 ${active ? "bg-[#19191B] text-white" : "bg-[#F3F2EE] text-neutral-600"
                    }`}
                >
                  {item.num}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-neutral-900 truncate">{item.title}</div>
                  <div className="text-[11px] text-neutral-500 truncate">{item.sub}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── CUERPO SCROLLABLE DEL EDITOR ── */}
        <div data-lenis-prevent className="flex-1 overflow-y-auto p-6 bg-[#E8E6DF]">
          <AnimatePresence mode="wait">
            {/* ══════════════════════════════════════════════════════════════ */}
            {/* SECCIÓN 1: TIPO DE MATERIAL, DATOS, PORTADA Y BENEFICIOS      */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {step === 1 && (
              <motion.div
                key="edit-step-1"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-6"
              >
                {/* Selector de Tipo de Material */}
                <div className="bg-[#F6F5F0] rounded-2xl border border-[#D8D6CE] p-6 shadow-sm">
                  <label className="text-xs font-medium uppercase tracking-wider text-neutral-500 block mb-3">
                    Tipo de Material del Curso
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {MATERIAL_TYPES.map((mat) => {
                      const isSelected = editado.audience === mat.id;
                      return (
                        <button
                          key={mat.id}
                          type="button"
                          onClick={() => setEditado((prev) => ({ ...prev, audience: mat.id }))}
                          className={`text-left p-4 rounded-2xl border transition-colors flex items-center gap-3.5 ${isSelected
                              ? mat.activeCard
                              : "border-[#ECECE6] bg-white hover:bg-[#FAF9F6]"
                            }`}
                        >
                          <span className="text-2xl">{mat.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-neutral-900">{mat.title}</div>
                            <div className="text-xs text-neutral-500">{mat.badge}</div>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-xl bg-[#19191B] text-white flex items-center justify-center shrink-0">
                              <FiCheck className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Datos Principales y Portada */}
                <div className="bg-[#F6F5F0] rounded-2xl border border-[#D8D6CE] p-6 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 space-y-4">
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wider text-neutral-500 block mb-1.5">
                        Nombre o Título del Curso *
                      </label>
                      <input
                        type="text"
                        value={editado.nombre}
                        onChange={(e) => setEditado((prev) => ({ ...prev, nombre: e.target.value }))}
                        placeholder="Ej: 15 Speaking Scenarios — Travel & Daily Life"
                        className="w-full h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-medium uppercase tracking-wider text-neutral-500 block mb-1.5">
                          Precio ($ ARS)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editado.precioAlPublico}
                          onChange={(e) =>
                            setEditado((prev) => ({ ...prev, precioAlPublico: e.target.value }))
                          }
                          className="w-full h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium uppercase tracking-wider text-neutral-500 block mb-1.5">
                          Categoría
                        </label>
                        <select
                          value={editado.categoria}
                          onChange={(e) => setEditado((prev) => ({ ...prev, categoria: e.target.value }))}
                          className="w-full h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                        >
                          <option value="">Seleccionar categoría...</option>
                          {categorias.map((c) => (
                            <option key={c.categoryId || c.id} value={c.categoryName || c.nombre}>
                              {c.categoryName || c.nombre}
                            </option>
                          ))}
                        </select>
                        <CategoryManager
                          categorias={categorias}
                          onChanged={onRefreshCategories}
                          onRenamed={(oldName, newName) =>
                            setEditado((prev) => (prev.categoria === oldName ? { ...prev, categoria: newName } : prev))
                          }
                          onDeleted={(name) =>
                            setEditado((prev) => (prev.categoria === name ? { ...prev, categoria: "" } : prev))
                          }
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium uppercase tracking-wider text-neutral-500 block mb-1.5">
                          Nueva Categoría
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={newCategoryInput}
                            onChange={(e) => setNewCategoryInput(e.target.value)}
                            placeholder="Crear otra..."
                            className="w-full h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={handleAddCategory}
                            className="h-10 px-3 text-xs font-medium rounded-xl inline-flex items-center justify-center bg-[#19191B] text-white hover:bg-neutral-800 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Nivel de Inglés Requerido para Completar el Curso */}
                    <div className="bg-[#FAF9F6] border border-[#ECECE6] rounded-2xl p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                          Nivel de Inglés Necesario para el Curso (MCER / CEFR) *
                        </label>
                        <span className="px-2.5 py-0.5 rounded-xl bg-[#EDF9F0] text-[#29974D] border border-[#DCF3E3] text-xs font-medium">
                          {editado.subcategoria || "B1 / B2 · Intermedio a Intermedio Alto"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {ENGLISH_LEVELS.map((lvl) => {
                          const active =
                            editado.subcategoria === lvl.label || editado.subcategoria === lvl.code;
                          return (
                            <button
                              key={lvl.code}
                              type="button"
                              onClick={() =>
                                setEditado((prev) => ({ ...prev, subcategoria: lvl.label }))
                              }
                              className={`h-9 px-3 rounded-xl border text-left text-xs font-medium flex items-center justify-between gap-1 transition-colors ${active
                                  ? "bg-[#19191B] border-neutral-900 text-white"
                                  : "bg-white border-[#E2E2DC] text-neutral-700 hover:bg-[#F3F2EE]"
                                }`}
                            >
                              <span className="truncate">{lvl.short}</span>
                              {active && <FiCheck className="w-3.5 h-3.5 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                      <input
                        type="text"
                        value={editado.subcategoria || ""}
                        onChange={(e) =>
                          setEditado((prev) => ({ ...prev, subcategoria: e.target.value }))
                        }
                        placeholder="O escribe nivel personalizado (ej: B1 / B2 · British English)..."
                        className="w-full h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                      />
                    </div>

                    {/* Beneficios / Lo que incluye el curso (editable línea por línea) */}
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wider text-neutral-500 block mb-1.5">
                        Beneficios / Temario del Curso ({benefitsList.length})
                      </label>
                      <div data-lenis-prevent className="space-y-2 max-h-48 overflow-y-auto pr-1 mb-2.5">
                        {benefitsList.map((line, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 bg-[#FAF9F6] border border-[#ECECE6] px-3 py-1.5 rounded-xl focus-within:border-neutral-600 focus-within:bg-white"
                          >
                            <FiCheckCircle className="text-emerald-600 w-4 h-4 shrink-0" />
                            <input
                              type="text"
                              value={line}
                              onChange={(e) => handleUpdateBenefitLine(i, e.target.value)}
                              className="flex-1 text-xs text-neutral-700 bg-transparent outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveBenefitLine(i)}
                              className="h-8 w-8 rounded-xl inline-flex items-center justify-center text-neutral-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                              title="Eliminar línea"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {benefitsList.length === 0 && (
                          <div className="text-xs text-neutral-500 py-3 px-4 bg-[#FAF9F6] rounded-xl border border-dashed border-[#ECECE6]">
                            Sin ítems cargados. Agrega beneficios abajo.
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={benefitInput}
                          onChange={(e) => setBenefitInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddBenefit();
                            }
                          }}
                          placeholder="Ej: Incluye 15 escenarios de práctica oral con IA + Dossier PDF..."
                          className="flex-1 h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={handleAddBenefit}
                          className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 bg-[#19191B] text-white hover:bg-neutral-800 transition-colors"
                        >
                          Agregar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Portada y Color */}
                  <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wider text-neutral-500 block mb-1.5">
                        Imagen de Portada
                      </label>
                      <div className="border border-dashed border-[#E2E2DC] rounded-2xl p-4 flex flex-col items-center justify-center bg-[#FAF9F6] min-h-[210px] relative overflow-hidden">
                        {editado.imagenes?.[0] ? (
                          <div className="w-full flex flex-col items-center">
                            <img
                              src={optimizeImage(editado.imagenes[0], 500)}
                              alt="Portada"
                              className="w-full h-40 object-cover rounded-xl border border-[#ECECE6] mb-3"
                            />
                            <div className="flex flex-wrap justify-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setCoverCropState({
                                    isOpen: true,
                                    imageSrc: editado.imagenes[0],
                                    fileName: "portada.jpg",
                                    isObjectUrl: false
                                  })
                                }
                                className="h-9 px-3 text-xs font-medium rounded-xl bg-[#19191B] text-white hover:bg-neutral-800 transition-colors"
                              >
                                Ajustar encuadre
                              </button>
                              <button
                                type="button"
                                onClick={() => coverInputRef.current?.click()}
                                className="h-9 px-3 text-xs font-medium rounded-xl bg-white border border-[#E2E2DC] text-neutral-700 hover:bg-[#F3F2EE] transition-colors"
                              >
                                Cambiar imagen
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditado((prev) => ({
                                    ...prev,
                                    imagenes: (prev.imagenes || []).slice(1)
                                  }))
                                }
                                className="h-9 px-3 text-xs font-medium rounded-xl bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-colors"
                              >
                                Quitar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => coverInputRef.current?.click()}
                            className="cursor-pointer flex flex-col items-center text-center py-6"
                          >
                            {uploadingCover ? (
                              <FiRefreshCcw className="animate-spin text-neutral-700 w-5 h-5 mb-2" />
                            ) : (
                              <FiImage className="text-neutral-400 w-6 h-6 mb-2" />
                            )}
                            <span className="text-xs font-medium text-neutral-700">
                              {uploadingCover ? "Subiendo portada..." : "Haz clic para subir imagen de portada"}
                            </span>
                            <span className="text-xs text-neutral-500 mt-1">JPG, PNG o WEBP</span>
                          </div>
                        )}
                        <input
                          ref={coverInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleUploadCoverImage}
                          className="hidden"
                        />
                      </div>

                      <div className="flex gap-2 mt-2.5">
                        <input
                          type="url"
                          value={coverUrlInput}
                          onChange={(e) => setCoverUrlInput(e.target.value)}
                          placeholder="O pega URL directa de imagen..."
                          className="flex-1 h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (coverUrlInput.trim()) {
                              setEditado((prev) => ({
                                ...prev,
                                imagenes: [coverUrlInput.trim(), ...(prev.imagenes || [])]
                              }));
                              setCoverUrlInput("");
                            }
                          }}
                          className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center bg-white border border-[#E2E2DC] text-neutral-700 hover:bg-[#FAF9F6] transition-colors"
                        >
                          Usar URL
                        </button>
                      </div>
                    </div>

                    {/* Selector de Color */}
                    <div className="bg-[#ECEAE2] rounded-2xl p-3.5 border border-[#D8D6CE] flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium uppercase tracking-wider text-neutral-500 block">
                          Color de acento
                        </span>
                        <span className="text-xs font-mono font-medium text-neutral-800">{editado.color}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowColorPicker(true)}
                        className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 bg-white border border-[#E2E2DC] text-neutral-700 hover:bg-[#FAF9F6] transition-colors"
                      >
                        <span
                          className="w-4 h-4 rounded-sm border border-[#E2E2DC]"
                          style={{ backgroundColor: editado.color }}
                        />
                        Cambiar Color
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* SECCIÓN 2: ARCHIVOS DEL CURSO (POWERPOINT, PDF, WORD)         */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {step === 2 && (
              <motion.div
                key="edit-step-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-6"
              >
                <div className="bg-[#F6F5F0] rounded-2xl border border-[#D8D6CE] p-6 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                        Material Descargable del Curso
                      </span>
                      <h3 className="text-base font-medium text-neutral-800 mt-0.5">
                        Archivos PowerPoint, PDF y Word
                      </h3>
                      <p className="text-xs text-neutral-500">
                        Agrega o quita archivos descargables. También puedes usar cualquier PDF cargado para generar más ejercicios IA.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => courseFilesInputRef.current?.click()}
                      disabled={uploadingFiles}
                      className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 bg-[#19191B] hover:bg-neutral-800 text-white transition-colors shrink-0"
                    >
                      <FiUploadCloud className="w-4 h-4" />
                      {uploadingFiles ? "Subiendo..." : "Subir PowerPoint / PDF / Word"}
                    </button>
                    <input
                      ref={courseFilesInputRef}
                      type="file"
                      multiple
                      accept=".ppt,.pptx,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                      onChange={handleUploadCourseFiles}
                      className="hidden"
                    />
                  </div>

                  {/* Lista de Archivos */}
                  {(editado.archivosInfoproducto || []).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(editado.archivosInfoproducto || []).map((fileItem, idx) => {
                        const fileName = fileItem.name || fileItem.nombre || `Archivo_${idx + 1}`;
                        const meta = detectFileMetadata(fileName, fileItem.fileType || fileItem.tipo);
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-[#ECECE6] bg-[#FAF9F6] hover:bg-white transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-10 h-10 rounded-xl ${meta.iconBg} flex items-center justify-center font-medium text-xs shrink-0`}
                              >
                                {fileItem.badge || meta.badge}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-medium text-neutral-900 truncate" title={fileName}>
                                  {fileName}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                  <span>{meta.label}</span>
                                  {fileItem.url && (
                                    <a
                                      href={fileItem.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-neutral-900 font-medium hover:underline"
                                    >
                                      Abrir archivo ↗
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {(fileItem.badge === "PDF" || meta.badge === "PDF") && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    generateScenariosFromPdfPayload({
                                      pdfBase64: fileItem._pdfBase64,
                                      pdfUrl: fileItem.url,
                                      fileName
                                    })
                                  }
                                  disabled={generatingFromPdf}
                                  className="h-9 px-3 rounded-xl bg-white border border-[#E2E2DC] hover:bg-[#19191B] text-neutral-700 hover:text-white text-xs font-medium transition-colors inline-flex items-center gap-1.5"
                                >
                                  <FiCpu className="w-4 h-4" /> + Ejercicios IA
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveCourseFile(idx)}
                                className="h-8 w-8 rounded-xl inline-flex items-center justify-center text-neutral-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                                title="Eliminar archivo"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      onClick={() => courseFilesInputRef.current?.click()}
                      className="border border-dashed border-[#E2E2DC] hover:border-neutral-500 rounded-2xl p-10 text-center cursor-pointer bg-[#FAF9F6] transition-colors"
                    >
                      <FiUploadCloud className="w-6 h-6 mx-auto text-neutral-400 mb-2" />
                      <p className="text-xs font-medium text-neutral-700">
                        Este curso aún no tiene archivos descargables cargados
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        Haz clic aquí para subir presentaciones PowerPoint (.pptx), guías PDF (.pdf) o documentos Word (.docx)
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* SECCIÓN 3: EDITOR DE ESCENARIOS Y PREGUNTAS IA (HTML FORMAT)  */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {step === 3 && (
              <motion.div
                key="edit-step-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-5"
              >
                {/* Barra Superior: Generar desde PDF con IA */}
                <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#ECECE6] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-[#F3F2EE] border border-[#ECECE6] text-neutral-700 text-xs font-medium uppercase tracking-wider">
                      <FiCpu className="w-3.5 h-3.5" /> Generador & Editor de Ejercicios IA
                    </div>
                    <h3 className="text-base font-medium text-neutral-800">
                      Modificar Preguntas o Crear Nuevos Escenarios desde PDF
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Edita cualquier pregunta, pista gramatical (`hint`) o vocabulario abajo, o sube un PDF para que la IA agregue más escenarios.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <div className="bg-[#FAF9F6] border border-[#ECECE6] rounded-xl px-3 h-10 flex items-center gap-2">
                      <span className="text-xs uppercase tracking-wider text-neutral-500 font-medium">
                        Escenarios:
                      </span>
                      <select
                        value={scenarioCountToGenerate}
                        onChange={(e) => setScenarioCountToGenerate(Number(e.target.value))}
                        className="bg-white text-neutral-900 font-medium text-xs px-2 py-1 rounded border border-[#E2E2DC] outline-none"
                      >
                        <option value={3}>3 escenarios</option>
                        <option value={5}>5 escenarios</option>
                        <option value={8}>8 escenarios</option>
                        <option value={10}>10 escenarios</option>
                        <option value={15}>15 escenarios</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      disabled={generatingFromPdf}
                      onClick={handleGenerateAiActivitiesFromBackend}
                      className="h-10 px-4 text-xs font-semibold rounded-xl inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white shadow-xs transition-all disabled:opacity-60"
                      title="Generar 15 actividades automáticamente analizando los archivos del curso con IA"
                    >
                      {generatingFromPdf ? (
                        <>
                          <FiRefreshCcw className="animate-spin w-4 h-4 text-purple-200" /> Analizando con IA...
                        </>
                      ) : (
                        <>
                          <FiCpu className="w-4 h-4 text-purple-200" /> Generar con IA desde Archivos
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={generatingFromPdf}
                      onClick={() => pdfAiInputRef.current?.click()}
                      className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 bg-[#19191B] hover:bg-neutral-800 text-white transition-colors disabled:opacity-60"
                    >
                      {generatingFromPdf ? (
                        <>
                          <FiRefreshCcw className="animate-spin w-4 h-4" /> Analizando PDF...
                        </>
                      ) : (
                        <>
                          <FiFileText className="w-4 h-4" /> Subir Nuevo PDF
                        </>
                      )}
                    </button>
                    <input
                      ref={pdfAiInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={handlePdfUploadForAiExercises}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Editor Visual de Escenarios y Preguntas */}
                <div className="bg-[#F6F5F0] rounded-2xl border border-[#D8D6CE] p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-[#ECECE6]">
                    <div>
                      <h4 className="text-base font-medium text-neutral-800">
                        Escenarios y Preguntas del Curso ({scenarios.length} escenarios)
                      </h4>
                      <p className="text-xs text-neutral-500">
                        Selecciona un escenario a la izquierda para modificar su título, temas y cada una de sus preguntas.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleAddScenario}
                        className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 bg-white border border-[#E2E2DC] text-neutral-700 hover:bg-[#FAF9F6] transition-colors"
                      >
                        <FiPlus className="w-4 h-4" /> Nuevo Escenario
                      </button>
                    </div>
                  </div>

                  {scenarios.length > 0 && currentScenario ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Columna Izquierda: Lista de Escenarios */}
                      <div data-lenis-prevent className="lg:col-span-4 space-y-2 max-h-[480px] overflow-y-auto pr-1">
                        {scenarios.map((scItem, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setActiveScenarioIdx(idx);
                              setActiveQuestionIdx(0);
                            }}
                            className={`p-3 rounded-2xl border cursor-pointer transition-colors flex items-center justify-between gap-2 ${idx === activeScenarioIdx
                                ? "bg-[#19191B] text-white border-neutral-900"
                                : "bg-[#FAF9F6] hover:bg-[#F3F2EE] text-neutral-800 border-[#ECECE6]"
                              }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-xl ${idx === activeScenarioIdx
                                    ? "bg-white/15 text-white"
                                    : "bg-neutral-200 text-neutral-700"
                                  }`}
                              >
                                {scItem.num || String(idx + 1).padStart(2, "0")}
                              </span>
                              <span className="text-lg">{scItem.emoji || "🗣️"}</span>
                              <div className="min-w-0">
                                <div className="text-xs font-medium truncate">
                                  {scItem.title?.trim() || `Escenario ${scItem.num || String(idx + 1).padStart(2, "0")}`}
                                </div>
                                <div
                                  className={`text-xs truncate ${idx === activeScenarioIdx ? "text-neutral-300" : "text-neutral-500"
                                    }`}
                                >
                                  {scItem.questions?.length || 0} preguntas
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteScenario(idx);
                              }}
                              className={`h-8 w-8 rounded-xl inline-flex items-center justify-center transition-colors ${idx === activeScenarioIdx
                                  ? "text-neutral-300 hover:text-white hover:bg-white/10"
                                  : "text-neutral-400 hover:text-red-700 hover:bg-red-50"
                                }`}
                              title="Eliminar escenario"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Columna Derecha: Datos del Escenario y Editor de Preguntas */}
                      <div className="lg:col-span-8 bg-[#ECEAE2] rounded-2xl p-5 border border-[#D8D6CE] space-y-5">
                        {/* Encabezado del Escenario */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="sm:col-span-2">
                            <label className="text-xs font-medium uppercase tracking-wider text-neutral-500 block mb-1">
                              Emoji
                            </label>
                            <input
                              type="text"
                              value={currentScenario.emoji || "🗣️"}
                              onChange={(e) =>
                                handleUpdateScenarioField(activeScenarioIdx, "emoji", e.target.value)
                              }
                              className="w-full h-10 px-3 py-1.5 rounded-xl border border-[#E2E2DC] bg-white text-center text-base focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                            />
                          </div>
                          <div className="sm:col-span-5">
                            <label className="text-xs font-medium uppercase tracking-wider text-neutral-500 block mb-1">
                              Título del Escenario
                            </label>
                            <input
                              type="text"
                              value={currentScenario.title || ""}
                              placeholder="Ej: At the Airport, Job Interview..."
                              onChange={(e) =>
                                handleUpdateScenarioField(activeScenarioIdx, "title", e.target.value)
                              }
                              className="w-full h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                            />
                          </div>
                          <div className="sm:col-span-5">
                            <label className="text-xs font-medium uppercase tracking-wider text-neutral-500 block mb-1">
                              Temas / Topics (separados por coma)
                            </label>
                            <input
                              type="text"
                              placeholder="Ej: check-in, luggage, boarding..."
                              value={
                                Array.isArray(currentScenario.topics)
                                  ? currentScenario.topics.join(", ")
                                  : ""
                              }
                              onChange={(e) =>
                                handleUpdateScenarioField(
                                  activeScenarioIdx,
                                  "topics",
                                  e.target.value
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                                )
                              }
                              className="w-full h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                            />
                          </div>
                        </div>

                        {/* Pestañas de Preguntas del Escenario + Botón Agregar Pregunta */}
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <div className="flex flex-wrap items-center gap-2">
                              {(currentScenario.questions || []).map((_, qIdx) => (
                                <button
                                  key={qIdx}
                                  type="button"
                                  onClick={() => setActiveQuestionIdx(qIdx)}
                                  className={`h-9 px-3.5 rounded-xl text-xs font-medium transition-colors ${qIdx === activeQuestionIdx
                                      ? "bg-[#19191B] text-white"
                                      : "bg-white text-neutral-700 border border-[#E2E2DC] hover:bg-[#F3F2EE]"
                                    }`}
                                >
                                  Pregunta {qIdx + 1}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => handleAddQuestionToScenario(activeScenarioIdx)}
                                className="h-9 px-3 rounded-xl text-xs font-medium bg-white border border-[#E2E2DC] text-neutral-700 hover:bg-[#F3F2EE] transition-colors inline-flex items-center gap-1"
                              >
                                <FiPlus className="w-3.5 h-3.5" /> Agregar Pregunta
                              </button>
                            </div>

                            {currentQuestion && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteQuestionFromScenario(activeScenarioIdx, activeQuestionIdx)
                                }
                                className="text-xs font-medium text-red-700 hover:underline inline-flex items-center gap-1"
                              >
                                <FiTrash2 className="w-3.5 h-3.5" /> Eliminar esta pregunta
                              </button>
                            )}
                          </div>

                          {/* Campos de la Pregunta Activa */}
                          {currentQuestion ? (
                            <div className="bg-white rounded-2xl p-4 border border-[#ECECE6] space-y-4">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                                    Pregunta en Inglés (Question {activeQuestionIdx + 1})
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => speakText(currentQuestion.q)}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-neutral-700 hover:text-neutral-900"
                                  >
                                    <FiVolume2 className="w-3.5 h-3.5" /> Probar voz
                                  </button>
                                </div>
                                <textarea
                                  rows={2}
                                  value={currentQuestion.q || ""}
                                  placeholder="Escribe la pregunta en inglés que responderá el estudiante..."
                                  onChange={(e) =>
                                    handleUpdateQuestionField(
                                      activeScenarioIdx,
                                      activeQuestionIdx,
                                      "q",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 rounded-xl border border-[#E2E2DC] text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                                />
                              </div>

                              <div>
                                <label className="text-xs font-medium uppercase tracking-wider text-neutral-500 block mb-1">
                                  Sugerencia Gramatical / Hint para el Estudiante
                                </label>
                                <input
                                  type="text"
                                  value={currentQuestion.hint || ""}
                                  placeholder="Ej: Use 'I would like to...' / 'Could you please...?'"
                                  onChange={(e) =>
                                    handleUpdateQuestionField(
                                      activeScenarioIdx,
                                      activeQuestionIdx,
                                      "hint",
                                      e.target.value
                                    )
                                  }
                                  className="w-full h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                                />
                              </div>

                              <div>
                                <label className="text-xs font-medium uppercase tracking-wider text-neutral-500 block mb-1">
                                  Vocabulario Clave Sugerido (separado por comas)
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ej: boarding pass, gate, luggage..."
                                  value={
                                    Array.isArray(currentQuestion.vocab)
                                      ? currentQuestion.vocab.join(", ")
                                      : ""
                                  }
                                  onChange={(e) =>
                                    handleUpdateQuestionField(
                                      activeScenarioIdx,
                                      activeQuestionIdx,
                                      "vocab",
                                      e.target.value
                                        .split(",")
                                        .map((s) => s.trim())
                                        .filter(Boolean)
                                    )
                                  }
                                  className="w-full h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                                />
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {(currentQuestion.vocab || []).map((word, wIdx) => (
                                    <span
                                      key={wIdx}
                                      className="px-2.5 py-0.5 rounded-xl bg-[#F3F2EE] text-neutral-700 border border-[#ECECE6] text-xs font-medium"
                                    >
                                      {word}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-white rounded-2xl p-6 border border-dashed border-[#E2E2DC] text-center space-y-2.5">
                              <p className="text-xs font-medium text-neutral-700">
                                Este escenario aún no tiene preguntas.
                              </p>
                              <button
                                type="button"
                                onClick={() => handleAddQuestionToScenario(activeScenarioIdx)}
                                className="h-9 px-3.5 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-1.5 bg-[#19191B] hover:bg-neutral-800 text-white transition-colors"
                              >
                                <FiPlus className="w-3.5 h-3.5" /> Agregar Primera Pregunta
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#FAF9F6] rounded-2xl p-8 border border-dashed border-[#E2E2DC] text-center space-y-3">
                      <p className="text-sm font-medium text-neutral-800">
                        Aún no hay escenarios cargados en este curso
                      </p>
                      <p className="text-xs text-neutral-500 max-w-md mx-auto">
                        Crea un escenario manualmente para agregar tus propias preguntas o genera ejercicios desde un PDF arriba.
                      </p>
                      <button
                        type="button"
                        onClick={handleAddScenario}
                        className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 bg-[#19191B] hover:bg-neutral-800 text-white transition-colors"
                      >
                        <FiPlus className="w-4 h-4" /> Crear Primer Escenario
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── FOOTER SIEMPRE VISIBLE CON GUARDADO RÁPIDO ── */}
        <div className="bg-white border-t border-[#ECECE6] px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 bg-white border border-[#E2E2DC] text-neutral-700 hover:bg-[#FAF9F6] transition-colors"
              >
                <FiChevronLeft className="w-4 h-4" /> Sección Anterior
              </button>
            )}
            {step < 3 && (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 bg-white border border-[#E2E2DC] text-neutral-700 hover:bg-[#FAF9F6] transition-colors"
              >
                Siguiente Sección <FiChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 border border-[#E2E2DC] bg-white text-neutral-700 hover:bg-[#FAF9F6] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveAllChanges}
              className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 bg-[#19191B] hover:bg-neutral-800 text-white transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <FiRefreshCcw className="animate-spin w-4 h-4" /> Guardando...
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4" /> Guardar Cambios del Curso
                </>
              )}
            </button>
          </div>
        </div>

        {/* Selector Photoshop Color */}
        {showColorPicker && (
          <PhotoshopColorPicker
            isOpen={showColorPicker}
            initialColor={editado.color || "#7C3AED"}
            onSelect={(selectedHex) => setEditado((prev) => ({ ...prev, color: selectedHex }))}
            onClose={() => setShowColorPicker(false)}
          />
        )}

        {/* Modal de Vista Previa del Estudiante */}
        <CourseInteractivePreviewModal
          isOpen={showStudentPreview}
          onClose={() => setShowStudentPreview(false)}
          productData={editado}
        />

        {/* Modal de Ajuste/Recorte de Portada */}
        <CoverImageCropModal
          isOpen={coverCropState.isOpen}
          imageSrc={coverCropState.imageSrc}
          fileName={coverCropState.fileName}
          isUploading={uploadingCover}
          onClose={closeCoverCropModal}
          onConfirm={handleConfirmCoverCrop}
        />
      </motion.div>
    </motion.div>,
    document.body
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL: INVENTARIO Y GESTIÓN DE CURSOS CARGADOS
// ══════════════════════════════════════════════════════════════════════════════
const InventarioProductos = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("todos");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [levelFilter, setLevelFilter] = useState("todos");
  const [contentFilter, setContentFilter] = useState("todos");
  const [sortBy, setSortBy] = useState("audience");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [editModalState, setEditModalState] = useState({ product: null, initialTab: 1 });

  const obtenerProductos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/products`);
      const rawList = Array.isArray(response.data) ? response.data : [];
      const normalized = rawList.map((p) => {
        let imgs = p.imagenes;
        if (typeof imgs === "string") {
          try {
            imgs = JSON.parse(imgs);
          } catch {
            imgs = imgs ? [imgs] : [];
          }
        }
        if (!Array.isArray(imgs)) imgs = imgs ? [imgs] : [];
        imgs = imgs
          .map((img) => (typeof img === "string" ? img : img?.url || img?.src || ""))
          .filter(Boolean);
        return { ...p, imagenes: imgs };
      });
      setProductos(normalized);
      setError(null);
    } catch {
      setError("No se pudo conectar con el servidor de productos.");
    } finally {
      setLoading(false);
    }
  };

  const obtenerCategorias = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/categories`);
      if (Array.isArray(res.data)) setCategorias(res.data);
    } catch (err) {
      console.warn("Error al cargar categorías:", err);
    }
  };

  useEffect(() => {
    obtenerProductos();
    obtenerCategorias();
  }, []);

  const handleGuardarEdicion = async (datosActualizados) => {
    try {
      await axios.put(`${API_URL}/products/${datosActualizados.id}`, datosActualizados);
      setProductos((prev) =>
        prev.map((p) => (p.id === datosActualizados.id ? datosActualizados : p))
      );
      setEditModalState({ product: null, initialTab: 1 });
      Swal.fire({
        title: "¡Curso Actualizado!",
        text: "Todos los cambios de contenido, archivos y preguntas se guardaron correctamente.",
        icon: "success",
        confirmButtonColor: "#0f172a"
      });
    } catch (err) {
      Swal.fire({
        title: "Error al guardar",
        text: err.response?.data?.message || "No se pudieron guardar los cambios del curso.",
        icon: "error",
        confirmButtonColor: "#0f172a"
      });
    }
  };

  const handleEliminarProducto = async (id, nombre) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar este curso?",
      text: `Se eliminará "${nombre || "este curso"}" del catálogo.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(`${API_URL}/products/${id}`);
      setProductos((prev) => prev.filter((p) => p.id !== id));
      Swal.fire({
        title: "Curso eliminado",
        icon: "success",
        timer: 1600,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.response?.data?.message || err.response?.data?.error || "No se pudo eliminar el curso.",
        icon: "error",
        confirmButtonColor: "#0f172a"
      });
    }
  };

  const [generatingAiCourseId, setGeneratingAiCourseId] = useState(null);

  const handleGenerarActividadesIA = async (producto) => {
    const fileCount = Array.isArray(producto.archivosInfoproducto) ? producto.archivosInfoproducto.length : 0;
    const confirm = await Swal.fire({
      title: "Crear Actividades con IA",
      html: `
        <div style="text-align: left; font-size: 13px; line-height: 1.5; color: #475569;">
          <p>¿Deseas que la IA analice el temario y los archivos de <b>"${producto.nombre}"</b> ${fileCount > 0 ? `(${fileCount} archivo(s))` : ""} para generar automáticamente los <b>15 escenarios interactivos</b> de práctica?</p>
          <p style="margin-top: 8px; color: #64748b; font-size: 12px;">Se crearán preguntas guiadas con pistas gramaticales y vocabulario clave listos para los alumnos.</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "✨ Sí, Generar con IA",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#7c3aed",
      cancelButtonColor: "#64748b"
    });

    if (!confirm.isConfirmed) return;

    setGeneratingAiCourseId(producto.id);

    Swal.fire({
      title: "Generando Actividades...",
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 10px 0;">
          <p style="font-size: 14px; font-weight: 600; color: #6d28d9;">Analizando temario y archivos del curso con IA...</p>
          <p style="font-size: 12px; color: #64748b;">Diseñando los 15 escenarios interactivos con preguntas y vocabulario</p>
        </div>
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const res = await axios.post(`${API_URL}/products/${producto.id}/generate-ai-activities`, {
        count: 15
      });

      if (res.data?.success && Array.isArray(res.data?.scenarios)) {
        const newScenarios = res.data.scenarios;
        setProductos((prev) =>
          prev.map((p) =>
            p.id === producto.id ? { ...p, speakingActivities: newScenarios } : p
          )
        );

        const resultModal = await Swal.fire({
          title: "¡Actividades Creadas!",
          text: `Se crearon con éxito ${newScenarios.length} escenarios interactivos basados en el material del curso.`,
          icon: "success",
          showCancelButton: true,
          confirmButtonText: "👁️ Ver Vista Previa",
          cancelButtonText: "Cerrar",
          confirmButtonColor: "#7c3aed",
          cancelButtonColor: "#64748b"
        });

        if (resultModal.isConfirmed) {
          setPreviewProduct({ ...producto, speakingActivities: newScenarios });
        }
      } else {
        throw new Error(res.data?.message || "No se recibieron actividades válidas.");
      }
    } catch (err) {
      console.error("Error generando actividades:", err);
      Swal.fire({
        title: "Error al generar actividades",
        text: err.response?.data?.message || err.message || "No se pudo conectar con el motor de IA.",
        icon: "error",
        confirmButtonColor: "#7c3aed"
      });
    } finally {
      setGeneratingAiCourseId(null);
    }
  };

  const audienceCounts = useMemo(() => {
    const counts = { todos: productos.length, estudiantes: 0, docentes: 0, lectura: 0 };
    productos.forEach((p) => {
      const aud = p.audience || "estudiantes";
      if (counts[aud] !== undefined) counts[aud] += 1;
    });
    return counts;
  }, [productos]);

  const availableCategories = useMemo(() => {
    const set = new Set(
      categorias.map((c) => (typeof c === "string" ? c : c?.nombre || c?.name)).filter(Boolean)
    );
    productos.forEach((p) => {
      if (p.categoria) set.add(p.categoria);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [categorias, productos]);

  const productosFiltrados = useMemo(() => {
    const terms = busqueda
      .toLowerCase()
      .split(" ")
      .filter((t) => t.trim() !== "");

    const filtered = productos.filter((p) => {
      const aud = p.audience || "estudiantes";
      if (audienceFilter !== "todos" && aud !== audienceFilter) return false;
      if (categoryFilter !== "todas" && (p.categoria || "") !== categoryFilter) return false;
      if (levelFilter !== "todos") {
        const sub = (p.subcategoria || "").toLowerCase();
        if (!sub.includes(levelFilter.toLowerCase())) return false;
      }
      if (contentFilter !== "todos") {
        const hasScenarios = normalizeCourseScenarios(p.speakingActivities).length > 0;
        const hasFiles = Array.isArray(p.archivosInfoproducto) && p.archivosInfoproducto.length > 0;
        if (contentFilter === "con_ia" && !hasScenarios) return false;
        if (contentFilter === "sin_ia" && hasScenarios) return false;
        if (contentFilter === "sin_archivos" && hasFiles) return false;
      }
      if (terms.length === 0) return true;
      const text = [p.nombre, p.marca, p.categoria, p.subcategoria, p.audience]
        .join(" ")
        .toLowerCase();
      return terms.every((t) => text.includes(t));
    });

    const AUDIENCE_ORDER = { estudiantes: 0, docentes: 1, lectura: 2 };
    const getPrice = (p) => Number(p.variantes?.[0]?.precioAlPublico ?? p.precioVenta ?? 0);

    return [...filtered].sort((a, b) => {
      if (sortBy === "audience") {
        const orderA = AUDIENCE_ORDER[a.audience || "estudiantes"] ?? 99;
        const orderB = AUDIENCE_ORDER[b.audience || "estudiantes"] ?? 99;
        if (orderA !== orderB) return orderA - orderB;
        return (a.nombre || "").localeCompare(b.nombre || "");
      }
      if (sortBy === "name_asc") return (a.nombre || "").localeCompare(b.nombre || "");
      if (sortBy === "price_asc") return getPrice(a) - getPrice(b);
      if (sortBy === "price_desc") return getPrice(b) - getPrice(a);
      if (sortBy === "recent") return Number(b.id || 0) - Number(a.id || 0);
      return 0;
    });
  }, [productos, busqueda, audienceFilter, categoryFilter, levelFilter, contentFilter, sortBy]);

  const hasActiveFilters =
    audienceFilter !== "todos" ||
    categoryFilter !== "todas" ||
    levelFilter !== "todos" ||
    contentFilter !== "todos" ||
    sortBy !== "audience" ||
    busqueda.trim() !== "";

  const resetAllFilters = () => {
    setBusqueda("");
    setAudienceFilter("todos");
    setCategoryFilter("todas");
    setLevelFilter("todos");
    setContentFilter("todos");
    setSortBy("audience");
  };

  const groupedByAudience = useMemo(() => {
    if (audienceFilter !== "todos" || sortBy !== "audience") return null;
    const groups = [
      { id: "estudiantes", title: "Para Estudiantes", emoji: "🎓", items: [] },
      { id: "docentes", title: "Para Docentes", emoji: "👩‍🏫", items: [] },
      { id: "lectura", title: "Material de Lectura", emoji: "📖", items: [] }
    ];
    productosFiltrados.forEach((p) => {
      const aud = p.audience || "estudiantes";
      const target = groups.find((g) => g.id === aud) || groups[0];
      target.items.push(p);
    });
    return groups.filter((g) => g.items.length > 0);
  }, [productosFiltrados, audienceFilter, sortBy]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-[#FAF9F6] font-['Inter',sans-serif]">
        <FiLoader className="animate-spin text-neutral-600 w-5 h-5 mb-3" />
        <span className="font-medium text-xs text-neutral-500 tracking-wider uppercase">
          Cargando cursos y materiales...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-neutral-900 font-['Inter',sans-serif]">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* ── HEADER DEL MÓDULO ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
              Inventario de Cursos Cargados ({productosFiltrados.length})
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Modifica datos generales, archivos PowerPoint/PDF/Word o edita directamente las preguntas interactivas de cada curso.
            </p>
          </div>
        </div>

        {/* ── BARRA DE HERRAMIENTAS (FILTROS Y BÚSQUEDA) ── */}
        <div className="bg-white rounded-2xl border border-[#ECECE6] p-4 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "todos", label: "Todos", emoji: "📚", count: audienceCounts.todos },
                { id: "estudiantes", label: "Para Estudiantes", emoji: "🎓", count: audienceCounts.estudiantes },
                { id: "docentes", label: "Para Docentes", emoji: "👩‍🏫", count: audienceCounts.docentes },
                { id: "lectura", label: "Material de Lectura", emoji: "📖", count: audienceCounts.lectura }
              ].map((f) => {
                const active = audienceFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setAudienceFilter(f.id)}
                    className={`h-10 px-3.5 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 border transition-colors ${active
                        ? "bg-[#19191B] text-white border-neutral-900"
                        : "bg-white text-neutral-700 border-[#E2E2DC] hover:bg-[#FAF9F6]"
                      }`}
                  >
                    <span>{f.emoji}</span>
                    <span>{f.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-lg text-[10px] font-semibold ${
                        active ? "bg-white/20 text-white" : "bg-[#F3F2EE] text-neutral-600"
                      }`}
                    >
                      {f.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full lg:w-80">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por título, nivel o categoría..."
                className="w-full h-10 pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
              />
            </div>
          </div>

          {/* Filtros secundarios y ordenamiento */}
          <div className="pt-3 border-t border-[#ECECE6] flex flex-wrap items-center gap-2.5">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 px-3 text-xs rounded-xl border border-[#E2E2DC] bg-[#FAF9F6] text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400"
            >
              <option value="todas">Categoría: Todas</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="h-9 px-3 text-xs rounded-xl border border-[#E2E2DC] bg-[#FAF9F6] text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400"
            >
              <option value="todos">Nivel: Todos</option>
              {ENGLISH_LEVELS.map((lvl) => (
                <option key={lvl.code} value={lvl.code}>
                  {lvl.short}
                </option>
              ))}
            </select>

            <select
              value={contentFilter}
              onChange={(e) => setContentFilter(e.target.value)}
              className="h-9 px-3 text-xs rounded-xl border border-[#E2E2DC] bg-[#FAF9F6] text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400"
            >
              <option value="todos">Contenido: Todos</option>
              <option value="con_ia">Con escenarios IA</option>
              <option value="sin_ia">Sin escenarios IA</option>
              <option value="sin_archivos">Sin archivos adjuntos</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9 px-3 text-xs rounded-xl border border-[#E2E2DC] bg-[#FAF9F6] text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400"
            >
              <option value="audience">Orden: Por público dirigido</option>
              <option value="name_asc">Orden: Nombre (A–Z)</option>
              <option value="price_asc">Orden: Menor precio</option>
              <option value="price_desc">Orden: Mayor precio</option>
              <option value="recent">Orden: Más recientes</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="h-9 px-3 text-xs font-medium rounded-xl inline-flex items-center gap-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-[#F3F2EE] transition-colors ml-auto"
              >
                <FiX className="w-3.5 h-3.5" /> Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
            <FiAlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* ── LISTA DE CURSOS ── */}
        {(() => {
          const renderCourseCard = (producto) => {
            const precioPublico =
              producto.variantes?.[0]?.precioAlPublico ?? producto.precioVenta ?? 0;
            const matInfo =
              MATERIAL_TYPES.find((m) => m.id === producto.audience) || MATERIAL_TYPES[1];
            const filesCount = Array.isArray(producto.archivosInfoproducto)
              ? producto.archivosInfoproducto.length
              : 0;
            const scenariosList = normalizeCourseScenarios(producto.speakingActivities);
            const questionsCount = scenariosList.reduce(
              (acc, sc) => acc + (sc.questions?.length || 0),
              0
            );

            return (
              <div
                key={producto.id}
                className="bg-white rounded-2xl border border-[#ECECE6] p-5 shadow-xs hover:bg-[#F8F8F5] transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Info Principal */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-16 h-16 rounded-xl bg-[#F3F2EE] border border-[#ECECE6] overflow-hidden shrink-0 flex items-center justify-center">
                    {producto.imagenes?.length > 0 ? (
                      <img
                        src={optimizeImage(producto.imagenes[0], 240)}
                        alt={producto.nombre}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FiPackage className="text-neutral-400 w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-xs font-medium border ${matInfo.pillClass}`}
                      >
                        {matInfo.emoji} {matInfo.title}
                      </span>
                      {producto.categoria && (
                        <span className="text-xs font-medium text-neutral-700 bg-[#F3F2EE] border border-[#ECECE6] px-2.5 py-0.5 rounded-xl">
                          {producto.categoria}
                        </span>
                      )}
                      {producto.subcategoria && (
                        <span className="text-xs font-medium text-[#29974D] bg-[#EDF9F0] border border-[#DCF3E3] px-2.5 py-0.5 rounded-xl">
                          Nivel: {producto.subcategoria}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-medium text-neutral-800 truncate">
                      {producto.nombre}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-700">
                      <span className="text-neutral-900 font-semibold">
                        ${Number(precioPublico).toLocaleString("es-AR")}
                      </span>
                      <span className="text-neutral-300">•</span>
                      <span className="inline-flex items-center gap-1.5 text-neutral-600">
                        <FiFileText className="w-4 h-4 text-neutral-400" />
                        {filesCount} archivo(s) (PPT / PDF / Word)
                      </span>
                      <span className="text-neutral-300">•</span>
                      <span className="inline-flex items-center gap-1.5 text-neutral-700 font-medium">
                        <FiMic className="w-4 h-4 text-neutral-500" />
                        {scenariosList.length > 0
                          ? `${scenariosList.length} escenarios · ${questionsCount} preguntas IA`
                          : "15 escenarios base"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones Directas para Editar Cualquier Sección o Preguntas */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-[#ECECE6]">
                  <button
                    type="button"
                    disabled={generatingAiCourseId === producto.id}
                    onClick={() => handleGenerarActividadesIA(producto)}
                    className="h-10 px-4 text-xs font-semibold rounded-xl inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white shadow-xs hover:shadow transition-all disabled:opacity-60"
                    title="Crear automáticamente las 15 actividades de speaking analizando los archivos del curso con IA"
                  >
                    {generatingAiCourseId === producto.id ? (
                      <>
                        <FiRefreshCcw className="w-4 h-4 animate-spin text-purple-200" />
                        <span>Generando...</span>
                      </>
                    ) : (
                      <>
                        <FiCpu className="w-4 h-4 text-purple-200" />
                        <span>Crear Actividades con IA</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewProduct(producto)}
                    className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 bg-white border border-[#E2E2DC] text-neutral-700 hover:bg-[#FAF9F6] transition-colors"
                    title="Probar como estudiante"
                  >
                    <FiEye className="w-4 h-4" /> Vista Previa
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditModalState({ product: producto, initialTab: 3 })}
                    className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 bg-white border border-[#E2E2DC] text-neutral-700 hover:bg-[#FAF9F6] transition-colors"
                    title="Ir directo a modificar preguntas y escenarios IA"
                  >
                    <FiMic className="w-4 h-4" /> Editar Preguntas IA
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditModalState({ product: producto, initialTab: 1 })}
                    className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 bg-[#19191B] hover:bg-neutral-800 text-white transition-colors"
                  >
                    <FiEdit2 className="w-4 h-4" /> Editar Curso
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedProduct(producto)}
                    className="h-8 w-8 rounded-xl inline-flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-[#F3F2EE] transition-colors"
                    title="Ficha técnica"
                  >
                    <FiInfo className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEliminarProducto(producto.id, producto.nombre)}
                    className="h-8 w-8 rounded-xl inline-flex items-center justify-center text-neutral-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                    title="Eliminar curso"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          };

          if (productosFiltrados.length === 0) {
            return (
              <div className="bg-white rounded-2xl border border-[#ECECE6] p-12 text-center space-y-2 shadow-xs">
                <FiSearch className="w-5 h-5 mx-auto text-neutral-400" />
                <p className="text-xs font-medium text-neutral-700">
                  No se encontraron cursos con ese filtro
                </p>
                <p className="text-xs text-neutral-500">
                  Prueba cambiando el término de búsqueda o los filtros seleccionados.
                </p>
              </div>
            );
          }

          if (groupedByAudience) {
            return (
              <div className="space-y-6">
                {groupedByAudience.map((group) => (
                  <div key={group.id} className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h2 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
                        <span>{group.emoji}</span>
                        <span>{group.title}</span>
                        <span className="px-2 py-0.5 rounded-lg bg-[#ECEAE2] text-neutral-700 text-xs font-medium">
                          {group.items.length}
                        </span>
                      </h2>
                    </div>
                    <div className="space-y-3">{group.items.map(renderCourseCard)}</div>
                  </div>
                ))}
              </div>
            );
          }

          return <div className="space-y-3">{productosFiltrados.map(renderCourseCard)}</div>;
        })()}
      </div>

      {/* Modales */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductInfoModal
            productData={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        )}
        {editModalState.product && (
          <FormularioEditarModal
            producto={editModalState.product}
            initialTab={editModalState.initialTab}
            categorias={categorias}
            onRefreshCategories={obtenerCategorias}
            onClose={() => setEditModalState({ product: null, initialTab: 1 })}
            onSave={handleGuardarEdicion}
          />
        )}
      </AnimatePresence>

      <CourseInteractivePreviewModal
        isOpen={Boolean(previewProduct)}
        onClose={() => setPreviewProduct(null)}
        productData={previewProduct}
      />
    </div>
  );
};

export default InventarioProductos;
