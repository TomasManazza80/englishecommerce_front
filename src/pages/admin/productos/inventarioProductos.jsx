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
// MODAL DE VISTA PREVIA INTERACTIVA (MISMO FORMATO HTML SCENARIOS)
// ══════════════════════════════════════════════════════════════════════════════
const CourseInteractivePreviewModal = ({ isOpen, onClose, productData }) => {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);

  if (!isOpen || !productData) return null;

  const scenarios =
    normalizeCourseScenarios(productData.speakingActivities).length > 0
      ? normalizeCourseScenarios(productData.speakingActivities)
      : DEFAULT_HTML_SCENARIOS;

  const sc = scenarios[currentScenario] || scenarios[0];
  const q = sc?.questions?.[currentQ] || sc?.questions?.[0] || { q: "", hint: "", vocab: [] };
  const files = Array.isArray(productData.archivosInfoproducto) ? productData.archivosInfoproducto : [];

  const speakPreview = (text) => {
    if (!("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.92;
    window.speechSynthesis.speak(u);
  };

  return createPortal(
    <div className="fixed inset-0 z-[10050] bg-[#19191B]/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 overflow-y-auto font-['Inter',sans-serif]">
      <div className="bg-white text-neutral-900 border border-[#ECECE6] rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden shadow-xs">
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#ECECE6]">
          <div className="flex items-center gap-3">
            <span className="bg-[#19191B] text-white text-xs font-medium px-2.5 py-0.5 rounded-xl uppercase tracking-wider">
              Vista Previa del Estudiante
            </span>
            <h3 className="text-base font-medium text-neutral-800 truncate">
              {productData.nombre || "Curso Interactivo"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-xl inline-flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-[#F3F2EE] transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        <div data-lenis-prevent className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12">
          {/* Sidebar de Escenarios */}
          <div data-lenis-prevent className="lg:col-span-4 bg-[#FAF9F6] border-r border-[#ECECE6] p-4 space-y-2 overflow-y-auto max-h-[75vh]">
            <div className="text-xs font-medium uppercase tracking-wider text-neutral-500 px-2 pb-2">
              {scenarios.length} Scenarios · {scenarios.length * 3} Questions
            </div>
            {scenarios.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCurrentScenario(idx);
                  setCurrentQ(0);
                }}
                className={`w-full text-left p-3 rounded-2xl border transition-colors flex items-center gap-3 ${
                  idx === currentScenario
                    ? "bg-[#19191B] text-white border-neutral-900"
                    : "bg-white text-neutral-700 border-[#ECECE6] hover:bg-[#F3F2EE]"
                }`}
              >
                <span
                  className={`text-xs font-medium w-6 ${
                    idx === currentScenario ? "text-neutral-300" : "text-neutral-500"
                  }`}
                >
                  {item.num || idx + 1}
                </span>
                <span className="text-lg">{item.emoji || "💬"}</span>
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-xs font-medium truncate ${
                      idx === currentScenario ? "text-white" : "text-neutral-900"
                    }`}
                  >
                    {item.title}
                  </div>
                  <div
                    className={`text-xs truncate ${
                      idx === currentScenario ? "text-neutral-300" : "text-neutral-500"
                    }`}
                  >
                    {Array.isArray(item.topics) ? item.topics.join(" · ") : ""}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Panel Principal */}
          <div data-lenis-prevent className="lg:col-span-8 p-6 space-y-5 overflow-y-auto max-h-[75vh] bg-white">
            {files.length > 0 && (
              <div className="bg-[#FAF9F6] border border-[#ECECE6] rounded-2xl p-4">
                <div className="text-xs font-medium uppercase tracking-wider text-neutral-500 mb-2.5">
                  Material Descargable del Curso ({files.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {files.map((f, i) => {
                    const meta = detectFileMetadata(f.name || f.nombre, f.fileType || f.tipo);
                    return (
                      <a
                        key={i}
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#ECECE6] text-xs text-neutral-700 hover:bg-[#F3F2EE] transition-colors"
                      >
                        <span className="px-1.5 py-0.5 rounded bg-[#F3F2EE] text-neutral-700 border border-[#ECECE6] font-medium text-[10px]">
                          {f.badge || meta.badge}
                        </span>
                        <span className="truncate max-w-[180px]">{f.name || f.nombre || `Archivo ${i + 1}`}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {sc && (
              <div className="bg-white border border-[#ECECE6] rounded-2xl overflow-hidden shadow-xs">
                <div className="p-5 bg-[#FAF9F6] border-b border-[#ECECE6]">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{sc.emoji}</span>
                    <div>
                      <div className="text-xs text-neutral-500 uppercase tracking-wider font-medium">
                        Scenario {sc.num} of {scenarios.length}
                      </div>
                      <h4 className="text-base font-medium text-neutral-800">{sc.title}</h4>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(sc.topics || []).map((t, ti) => (
                      <span
                        key={ti}
                        className="text-xs px-2.5 py-0.5 rounded-xl bg-white text-neutral-700 border border-[#ECECE6]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    {(sc.questions || []).map((_, qi) => (
                      <button
                        key={qi}
                        type="button"
                        onClick={() => setCurrentQ(qi)}
                        className={`w-8 h-8 rounded-xl text-xs font-medium border transition-colors ${
                          qi === currentQ
                            ? "bg-[#19191B] border-neutral-900 text-white"
                            : "bg-white border-[#ECECE6] text-neutral-700 hover:bg-[#F3F2EE]"
                        }`}
                      >
                        {qi + 1}
                      </button>
                    ))}
                    <span className="text-xs text-neutral-500 ml-auto">
                      Question {currentQ + 1} of {sc.questions?.length || 1}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3 bg-[#FAF9F6] p-4 rounded-2xl border border-[#ECECE6]">
                    <p className="text-xs font-medium text-neutral-900 leading-relaxed">{q.q}</p>
                    <button
                      type="button"
                      onClick={() => speakPreview(q.q)}
                      className="h-8 w-8 rounded-xl bg-white border border-[#ECECE6] text-neutral-600 hover:bg-[#19191B] hover:text-white inline-flex items-center justify-center shrink-0 transition-colors"
                      title="Listen question"
                    >
                      <FiVolume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs text-neutral-700 bg-[#FAF9F6] p-3.5 rounded-2xl border border-[#ECECE6]">
                    <span className="font-medium text-neutral-500 block mb-0.5 uppercase text-xs tracking-wider">
                      Speaking Hint
                    </span>
                    {q.hint}
                  </div>

                  <div>
                    <span className="text-xs uppercase tracking-wider text-neutral-500 font-medium block mb-2">
                      Key vocabulary to include
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(q.vocab || []).map((v, vi) => (
                        <span
                          key={vi}
                          className="text-xs px-2.5 py-1 rounded-xl bg-[#F3F2EE] text-neutral-700 border border-[#ECECE6]"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
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

  // Normalizamos escenarios iniciales (si no tiene en formato HTML, cargamos plantilla editable)
  const initialScenarios = useMemo(() => {
    const parsed = normalizeCourseScenarios(producto.speakingActivities);
    return parsed.length > 0 ? parsed : DEFAULT_HTML_SCENARIOS;
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

  const handleUploadCoverImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadFileToCloud(file, "/products/covers");
      setEditado((prev) => ({
        ...prev,
        imagenes: [url, ...(prev.imagenes || []).filter(Boolean)].slice(0, 10)
      }));
    } catch (err) {
      Swal.fire({
        title: "Error al subir portada",
        text: err.message || "No se pudo procesar la imagen.",
        icon: "error",
        confirmButtonColor: "#0f172a"
      });
    } finally {
      setUploadingCover(false);
      e.target.value = null;
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
        title: `Nuevo Escenario ${nextNum}`,
        topics: ["speaking", "vocabulary", "fluency"],
        questions: [
          {
            q: "Describe this situation and explain how you would respond.",
            hint: "Use: 'First, I would...' / 'In my opinion...'",
            vocab: ["context", "phrase", "fluency", "detail"]
          },
          {
            q: "Ask two polite questions related to this topic.",
            hint: "Use: 'Could you please tell me...?' / 'Would it be possible to...?'",
            vocab: ["polite", "request", "information", "clarify"]
          },
          {
            q: "How would you solve an unexpected problem in this scenario?",
            hint: "Structure: explain the issue → propose a solution → thank the listener.",
            vocab: ["solution", "alternative", "resolve", "outcome"]
          }
        ]
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
      setActiveScenarioIdx(Math.max(0, scIdx - 1));
      setActiveQuestionIdx(0);
      return { ...prev, speakingActivities: filtered };
    });
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
        q: "New speaking question for the student...",
        hint: "Use: 'I think that...' / 'For instance...'",
        vocab: ["keyword 1", "keyword 2", "keyword 3"]
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
      if (questions.length === 0) {
        questions.push({
          q: "Describe your thoughts on this topic.",
          hint: "Speak clearly and use full sentences.",
          vocab: ["topic", "example"]
        });
      }
      list[scIdx] = { ...list[scIdx], questions };
      setActiveQuestionIdx(Math.max(0, qIdx - 1));
      return { ...prev, speakingActivities: list };
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
        className="w-full max-w-6xl h-[94vh] bg-[#FAF9F6] rounded-2xl shadow-xs border border-[#ECECE6] flex flex-col overflow-hidden"
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
                className={`text-left px-4 py-2.5 rounded-2xl border transition-colors flex items-center gap-3 ${
                  active
                    ? "bg-[#FAF9F6] border-neutral-900 shadow-xs"
                    : "bg-white border-[#ECECE6] hover:bg-[#FAF9F6]"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-medium text-xs shrink-0 ${
                    active ? "bg-[#19191B] text-white" : "bg-[#F3F2EE] text-neutral-600"
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
        <div data-lenis-prevent className="flex-1 overflow-y-auto p-6">
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
                <div className="bg-white rounded-2xl border border-[#ECECE6] p-6 shadow-xs">
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
                          className={`text-left p-4 rounded-2xl border transition-colors flex items-center gap-3.5 ${
                            isSelected
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
                <div className="bg-white rounded-2xl border border-[#ECECE6] p-6 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-6">
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
                              className={`h-9 px-3 rounded-xl border text-left text-xs font-medium flex items-center justify-between gap-1 transition-colors ${
                                active
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
                            <div className="flex gap-2">
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
                    <div className="bg-[#FAF9F6] rounded-2xl p-3.5 border border-[#ECECE6] flex items-center justify-between">
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
                <div className="bg-white rounded-2xl border border-[#ECECE6] p-6 shadow-xs space-y-5">
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
                <div className="bg-white rounded-2xl border border-[#ECECE6] p-6 shadow-xs">
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
                            className={`p-3 rounded-2xl border cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                              idx === activeScenarioIdx
                                ? "bg-[#19191B] text-white border-neutral-900"
                                : "bg-[#FAF9F6] hover:bg-[#F3F2EE] text-neutral-800 border-[#ECECE6]"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-xl ${
                                  idx === activeScenarioIdx
                                    ? "bg-white/15 text-white"
                                    : "bg-neutral-200 text-neutral-700"
                                }`}
                              >
                                {scItem.num || String(idx + 1).padStart(2, "0")}
                              </span>
                              <span className="text-lg">{scItem.emoji || "🗣️"}</span>
                              <div className="min-w-0">
                                <div className="text-xs font-medium truncate">{scItem.title}</div>
                                <div
                                  className={`text-xs truncate ${
                                    idx === activeScenarioIdx ? "text-neutral-300" : "text-neutral-500"
                                  }`}
                                >
                                  {scItem.questions?.length || 0} preguntas
                                </div>
                              </div>
                            </div>
                            {scenarios.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteScenario(idx);
                                }}
                                className={`h-8 w-8 rounded-xl inline-flex items-center justify-center transition-colors ${
                                  idx === activeScenarioIdx
                                    ? "text-neutral-300 hover:text-white hover:bg-white/10"
                                    : "text-neutral-400 hover:text-red-700 hover:bg-red-50"
                                }`}
                                title="Eliminar escenario"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Columna Derecha: Datos del Escenario y Editor de Preguntas */}
                      <div className="lg:col-span-8 bg-[#FAF9F6] rounded-2xl p-5 border border-[#ECECE6] space-y-5">
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
                              onChange={(e) =>
                                handleUpdateScenarioField(activeScenarioIdx, "title", e.target.value)
                              }
                              className="w-full h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                            />
                          </div>
                          <div className="sm:col-span-5">
                            <label className="text-xs font-medium uppercase tracking-wider text-neutral-500 block mb-1">
                              Temas / Topics (separados por coma)
                            </label>
                            <input
                              type="text"
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
                                  className={`h-9 px-3.5 rounded-xl text-xs font-medium transition-colors ${
                                    qIdx === activeQuestionIdx
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

                            {(currentScenario.questions?.length || 0) > 1 && (
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
                          {currentQuestion && (
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
                                  onChange={(e) =>
                                    handleUpdateQuestionField(
                                      activeScenarioIdx,
                                      activeQuestionIdx,
                                      "q",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 rounded-xl border border-[#E2E2DC] text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                                />
                              </div>

                              <div>
                                <label className="text-xs font-medium uppercase tracking-wider text-neutral-500 block mb-1">
                                  Sugerencia Gramatical / Hint para el Estudiante
                                </label>
                                <input
                                  type="text"
                                  value={currentQuestion.hint || ""}
                                  onChange={(e) =>
                                    handleUpdateQuestionField(
                                      activeScenarioIdx,
                                      activeQuestionIdx,
                                      "hint",
                                      e.target.value
                                    )
                                  }
                                  className="w-full h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                                />
                              </div>

                              <div>
                                <label className="text-xs font-medium uppercase tracking-wider text-neutral-500 block mb-1">
                                  Vocabulario Clave Sugerido (separado por comas)
                                </label>
                                <input
                                  type="text"
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
                                  className="w-full h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
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
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}
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
    } catch {
      Swal.fire({
        title: "Error",
        text: "No se pudo eliminar el curso.",
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

  const productosFiltrados = useMemo(() => {
    const terms = busqueda
      .toLowerCase()
      .split(" ")
      .filter((t) => t.trim() !== "");

    return productos.filter((p) => {
      const matchesAudience =
        audienceFilter === "todos" || (p.audience || "estudiantes") === audienceFilter;
      if (!matchesAudience) return false;
      if (terms.length === 0) return true;
      const text = [p.nombre, p.marca, p.categoria, p.audience].join(" ").toLowerCase();
      return terms.every((t) => text.includes(t));
    });
  }, [productos, busqueda, audienceFilter]);

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
        <div className="bg-white rounded-2xl border border-[#ECECE6] p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "todos", label: "Todos los Materiales", emoji: "📚" },
              { id: "docentes", label: "Para Docentes", emoji: "👩‍🏫" },
              { id: "estudiantes", label: "Para Estudiantes", emoji: "🎓" },
              { id: "lectura", label: "Material de Lectura", emoji: "📖" }
            ].map((f) => {
              const active = audienceFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setAudienceFilter(f.id)}
                  className={`h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 border transition-colors ${
                    active
                      ? "bg-[#19191B] text-white border-neutral-900"
                      : "bg-white text-neutral-700 border-[#E2E2DC] hover:bg-[#FAF9F6]"
                  }`}
                >
                  <span>{f.emoji}</span>
                  <span>{f.label}</span>
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
              placeholder="Buscar por título o categoría..."
              className="w-full h-10 pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
            <FiAlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* ── LISTA DE CURSOS ── */}
        <div className="space-y-3">
          {productosFiltrados.map((producto) => {
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
          })}

          {productosFiltrados.length === 0 && (
            <div className="bg-white rounded-2xl border border-[#ECECE6] p-12 text-center space-y-2 shadow-xs">
              <FiSearch className="w-5 h-5 mx-auto text-neutral-400" />
              <p className="text-xs font-medium text-neutral-700">
                No se encontraron cursos con ese filtro
              </p>
              <p className="text-xs text-neutral-500">
                Prueba cambiando el término de búsqueda o el tipo de material seleccionado.
              </p>
            </div>
          )}
        </div>
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
