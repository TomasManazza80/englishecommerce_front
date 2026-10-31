import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import Swal from "sweetalert2";
import {
  FiPlus,
  FiCheck,
  FiCheckCircle,
  FiRefreshCcw,
  FiImage,
  FiTrash2,
  FiEye,
  FiX,
  FiFileText,
  FiMic,
  FiChevronRight,
  FiChevronLeft,
  FiUploadCloud,
  FiCpu,
  FiBookOpen,
  FiUsers,
  FiAward,
  FiEdit3,
  FiVolume2
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import CategoryManager from "../../../components/admin/CategoryManager";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3003";
const getTodayDate = () => new Date().toISOString().split("T")[0];

// ── TIPOS DE MATERIAL (PASO 1 OBLIGATORIO) ──
const MATERIAL_TYPES = [
  {
    id: "docentes",
    emoji: "👩‍🏫",
    title: "Para Docentes",
    badge: "Profesores & Metodología",
    description:
      "Planificaciones de clase, presentaciones PowerPoint, guías didácticas en Word/PDF y dinámicas pedagógicas listas para el aula."
  },
  {
    id: "estudiantes",
    emoji: "🎓",
    title: "Para Estudiantes",
    badge: "Alumnos & Práctica IA",
    description:
      "Cursos prácticos con escenarios interactivos de Speaking con IA, vocabulario clave, grabador de voz y material descargable."
  },
  {
    id: "lectura",
    emoji: "📖",
    title: "Material de Lectura",
    badge: "Lectura & Comprensión",
    description:
      "Libros digitales, dossiers PDF/Word, artículos de lectura comprensiva y ejercicios de reflexión y vocabulario en contexto."
  }
];

// ── PLANTILLA DE ESCENARIOS POR DEFECTO (MISMO FORMATO DEL HTML) ──
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
        q: "The air conditioning in your hotel room isn't working. Role-play complaining politely to reception.",
        hint: "Structure: greet politely → explain the problem calmly → ask for a solution → thank them.",
        vocab: ["complain", "maintenance", "inconvenience", "resolve", "alternative room"]
      },
      {
        q: "How would you ask for a late check-out and negotiate an extra fee? What would you say?",
        hint: "Use: 'I was hoping to...' / 'Would it be possible to...' / 'I understand there may be an extra charge...'",
        vocab: ["check-out", "late fee", "extend", "availability", "concierge"]
      }
    ]
  },
  {
    num: "03",
    emoji: "🍽️",
    title: "In a Restaurant",
    topics: ["ordering food", "making complaints", "recommendations"],
    questions: [
      {
        q: "You are in a restaurant. Order a full meal — starter, main course and dessert. Ask the waiter questions.",
        hint: "Use: 'What do you recommend?' / 'I'll have the...' / 'Could you tell me what's in the...?'",
        vocab: ["starter", "main course", "dessert", "dietary requirement", "allergen"]
      },
      {
        q: "Your food arrived cold and the order was wrong. How would you complain politely to the waiter?",
        hint: "Be polite but firm: 'I'm sorry, but...' / 'I think there might have been a mistake...' / 'Would it be possible to...'",
        vocab: ["complaint", "refund", "replace", "undercooked", "disappointed"]
      },
      {
        q: "Describe your favourite restaurant and recommend it to a friend. What makes it special?",
        hint: "Structure: name + location → atmosphere → best dishes → why you love it → recommendation.",
        vocab: ["atmosphere", "cuisine", "portion", "flavour", "authentic"]
      }
    ]
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

const initialProductState = {
  audience: "",
  nombre: "",
  marca: "EnglishBloom Academy",
  categoria: "",
  subcategoria: "B1 / B2 · Intermedio a Intermedio Alto",
  precioInfoproducto: "",
  descripcion: "",
  imagenes: [],
  esInfoproducto: true,
  archivosInfoproducto: [],
  speakingActivities: [],
  fechaActualizacionPrecio: getTodayDate(),
  ultimaFechaCargoStock: getTodayDate(),
  color: "#0f172a"
};

const detectFileMetadata = (fileName = "", mime = "") => {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (["ppt", "pptx"].includes(ext) || mime.includes("presentation") || mime.includes("powerpoint")) {
    return {
      badge: "POWERPOINT",
      badgeColor: "bg-[#FFF1EB] text-[#F36B2B] border-[#FDE0D3]",
      icon: "📊",
      fileType: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    };
  }
  if (["doc", "docx"].includes(ext) || mime.includes("word")) {
    return {
      badge: "WORD",
      badgeColor: "bg-[#F3F2EE] text-neutral-700 border-[#ECECE6]",
      icon: "📝",
      fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    };
  }
  if (ext === "pdf" || mime.includes("pdf")) {
    return {
      badge: "PDF",
      badgeColor: "bg-red-50 text-red-700 border-red-200",
      icon: "📄",
      fileType: "application/pdf"
    };
  }
  if (["mp4", "webm", "mov"].includes(ext) || mime.includes("video")) {
    return {
      badge: "VIDEO",
      badgeColor: "bg-[#F3F2EE] text-neutral-700 border-[#ECECE6]",
      icon: "🎬",
      fileType: "video/mp4"
    };
  }
  if (["mp3", "wav", "ogg"].includes(ext) || mime.includes("audio")) {
    return {
      badge: "AUDIO",
      badgeColor: "bg-[#EDF9F0] text-[#29974D] border-[#DCF3E3]",
      icon: "🎧",
      fileType: "audio/mp3"
    };
  }
  return {
    badge: ext ? ext.toUpperCase() : "ARCHIVO",
    badgeColor: "bg-[#F3F2EE] text-neutral-700 border-[#ECECE6]",
    icon: "📁",
    fileType: mime || "application/octet-stream"
  };
};

const uploadFileToCloud = async (file, folder = "/products/materials") => {
  try {
    const authRes = await fetch(`${API_URL}/api/auth/imagekit`);
    if (authRes.ok && import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY) {
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
        return data.url;
      }
    }
  } catch (err) {
    console.warn("ImageKit upload fallback local URL:", err);
  }

  if (file.size <= 3 * 1024 * 1024) {
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(URL.createObjectURL(file));
      reader.readAsDataURL(file);
    });
  }
  return URL.createObjectURL(file);
};

// ── MODAL DE VISTA PREVIA DEL CURSO Y ESCENARIOS INTERACTIVOS ──
const CourseInteractivePreviewModal = ({ producto, onClose }) => {
  const scenarios =
    Array.isArray(producto.speakingActivities) && producto.speakingActivities.length > 0
      ? producto.speakingActivities
      : DEFAULT_HTML_SCENARIOS;

  const [currentSc, setCurrentSc] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(true);

  const sc = scenarios[currentSc] || scenarios[0];
  const q = sc?.questions?.[currentQ] || sc?.questions?.[0] || { q: "", hint: "", vocab: [] };

  const speakPreview = (text) => {
    if ("speechSynthesis" in window && text) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-GB";
      window.speechSynthesis.speak(u);
    }
  };

  const matInfo = MATERIAL_TYPES.find((m) => m.id === producto.audience) || MATERIAL_TYPES[1];

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-[#19191B]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-['Inter',sans-serif]">
      <div className="bg-white text-neutral-900 border border-[#ECECE6] rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-xs overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-[#ECECE6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">{matInfo.emoji}</span>
            <div>
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider block">
                Vista Previa del Estudiante · {matInfo.title}
              </span>
              <h3 className="text-base font-medium text-neutral-800">
                {producto.nombre || "Curso sin título"}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-xl inline-flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-[#F3F2EE] transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#FAF9F6]">
          {/* Left: Archivos Cargados (PPT, PDF, Word) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-4 border border-[#ECECE6] shadow-xs">
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider block mb-3">
                Archivos Almacenados ({producto.archivosInfoproducto?.length || 0})
              </span>
              {producto.archivosInfoproducto?.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {producto.archivosInfoproducto.map((f, idx) => {
                    const meta = detectFileMetadata(f.name, f.fileType);
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#FAF9F6] border border-[#ECECE6] flex items-center gap-3"
                      >
                        <span className="text-lg">{meta.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-neutral-800 truncate">{f.name}</p>
                          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-xl border mt-1 ${meta.badgeColor}`}>
                            {meta.badge}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-neutral-500">Sin archivos adjuntos aún.</p>
              )}
            </div>
          </div>

          {/* Right: Vista Interactiva de los Escenarios IA */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-6 text-center border border-[#ECECE6] shadow-xs">
              <p className="text-xs uppercase tracking-wider text-neutral-500 font-medium mb-1">
                {producto.subcategoria || "B1 / B2 · British English"}
              </p>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
                {scenarios.length} Speaking Scenarios
              </p>
              <h2 className="text-xl font-semibold text-neutral-900 tracking-tight mb-1">
                {producto.nombre || "Travel & Daily Life"}
              </h2>
              <p className="text-xs text-neutral-500">Choose a scenario · Record · Get full AI feedback</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#ECECE6] shadow-xs overflow-hidden">
              <div className="px-4 py-3 bg-[#FAF9F6] border-b border-[#ECECE6] flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Choose your scenario
                </span>
                <button
                  type="button"
                  onClick={() => setPickerOpen(!pickerOpen)}
                  className="text-xs text-neutral-700 font-medium hover:text-neutral-900"
                >
                  {pickerOpen ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              {pickerOpen && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 p-3">
                  {scenarios.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCurrentSc(idx);
                        setCurrentQ(0);
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-colors ${
                        idx === currentSc
                          ? "bg-[#19191B] border-neutral-900 text-white"
                          : "bg-white border-[#ECECE6] text-neutral-700 hover:bg-[#FAF9F6]"
                      }`}
                    >
                      <span className="text-base block">{item.emoji}</span>
                      <span className="text-xs font-medium block">{item.num}</span>
                      <span className="text-xs opacity-80 line-clamp-1">
                        {item.title?.split(" ").slice(0, 2).join(" ")}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {sc && (
              <div className="bg-white rounded-2xl border border-[#ECECE6] shadow-xs overflow-hidden">
                <div className="p-5 bg-[#FAF9F6] border-b border-[#ECECE6] text-center flex flex-col items-center gap-1.5">
                  <span className="text-3xl">{sc.emoji}</span>
                  <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Scenario {sc.num}
                  </span>
                  <h4 className="text-base font-medium text-neutral-800">{sc.title}</h4>
                  <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                    {(sc.topics || []).map((t, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-0.5 rounded-xl bg-white border border-[#ECECE6] text-neutral-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    {(sc.questions || []).map((_, qi) => (
                      <button
                        key={qi}
                        type="button"
                        onClick={() => setCurrentQ(qi)}
                        className={`h-8 w-8 rounded-xl text-xs font-medium border transition-colors ${
                          qi === currentQ
                            ? "bg-[#19191B] border-neutral-900 text-white"
                            : "bg-white border-[#E2E2DC] text-neutral-700 hover:bg-[#FAF9F6]"
                        }`}
                      >
                        {qi + 1}
                      </button>
                    ))}
                    <span className="text-xs text-neutral-500 ml-auto">
                      Q {currentQ + 1} / {sc.questions?.length || 3}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3 bg-[#FAF9F6] p-3.5 rounded-xl border border-[#ECECE6]">
                    <p className="text-xs font-medium text-neutral-800 leading-relaxed">{q.q}</p>
                    <button
                      type="button"
                      onClick={() => speakPreview(q.q)}
                      className="h-8 w-8 rounded-xl inline-flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 shrink-0 transition-colors"
                    >
                      <FiVolume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs text-neutral-700 bg-[#FAF9F6] p-3 rounded-xl border border-[#ECECE6]">
                    {q.hint}
                  </div>

                  <div>
                    <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider block mb-1.5">
                      Key vocabulary
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

// ── COMPONENTE PRINCIPAL DE CARGA DE CURSOS ──
export default function CargaDeProductos() {
  const [step, setStep] = useState(1);
  const [nuevoProducto, setNuevoProducto] = useState(initialProductState);
  const [categorias, setCategorias] = useState([]);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [benefitInput, setBenefitInput] = useState("");
  const [coverUrlInput, setCoverUrlInput] = useState("");

  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [generatingFromPdf, setGeneratingFromPdf] = useState(false);
  const [scenarioCountToGenerate, setScenarioCountToGenerate] = useState(5);
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [lastPdfNameUsed, setLastPdfNameUsed] = useState("");

  const [savingCourse, setSavingCourse] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const pdfAiInputRef = useRef(null);
  const courseFilesInputRef = useRef(null);
  const coverFileInputRef = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/categories`);
      if (Array.isArray(res.data)) setCategorias(res.data);
    } catch (err) {
      console.warn("Could not load categories:", err);
    }
  };

  const handleSelectMaterialType = (typeId) => {
    setNuevoProducto((prev) => ({
      ...prev,
      audience: typeId,
      categoria:
        prev.categoria ||
        (typeId === "docentes"
          ? "Especialización Docente"
          : typeId === "lectura"
          ? "Comprensión Lectora & Club de Lectura"
          : "Speaking & Fluidez con IA")
    }));
  };

  const handleAddCategory = async () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    try {
      const res = await axios.post(`${API_URL}/api/categories`, { nombre: trimmed });
      await fetchCategories();
      setNuevoProducto((prev) => ({ ...prev, categoria: res.data.categoryName || trimmed }));
      setNewCategoryInput("");
    } catch (error) {
      setNuevoProducto((prev) => ({ ...prev, categoria: trimmed }));
      setNewCategoryInput("");
    }
  };

  const handleAddBenefit = () => {
    const val = benefitInput.trim();
    if (!val) return;
    setNuevoProducto((prev) => {
      const lines = prev.descripcion
        ? prev.descripcion.split("\n").filter((l) => l.trim() !== "")
        : [];
      return { ...prev, descripcion: [...lines, val].join("\n") };
    });
    setBenefitInput("");
  };

  const handleRemoveBenefit = (idxToRemove) => {
    setNuevoProducto((prev) => {
      const lines = prev.descripcion
        ? prev.descripcion.split("\n").filter((l) => l.trim() !== "")
        : [];
      return {
        ...prev,
        descripcion: lines.filter((_, i) => i !== idxToRemove).join("\n")
      };
    });
  };

  const handleUploadCoverImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadFileToCloud(file, "/products/covers");
      setNuevoProducto((prev) => ({ ...prev, imagenes: [url] }));
    } catch (err) {
      Swal.fire({
        title: "Error al cargar portada",
        text: err.message,
        icon: "error",
        confirmButtonColor: "#0f172a"
      });
    } finally {
      setUploadingCover(false);
      e.target.value = null;
    }
  };

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
            url,
            fileType: meta.fileType,
            badge: meta.badge,
            size: sizeMB,
            _pdfBase64: pdfBase64
          };
        })
      );

      setNuevoProducto((prev) => ({
        ...prev,
        archivosInfoproducto: [...prev.archivosInfoproducto, ...uploadedItems]
      }));

      Swal.fire({
        title: "¡Archivos agregados al curso!",
        text: `Se cargaron ${uploadedItems.length} archivo(s) (PowerPoint / PDF / Word) correctamente.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        title: "Error al subir archivos",
        text: err.message || "Revisa tu conexión e intenta nuevamente.",
        icon: "error",
        confirmButtonColor: "#0f172a"
      });
    } finally {
      setUploadingFiles(false);
      e.target.value = null;
    }
  };

  const generateScenariosFromPdfBase64 = async (pdfBase64, fileName = "Documento.pdf") => {
    if (!pdfBase64) return;
    setGeneratingFromPdf(true);
    setLastPdfNameUsed(fileName);

    try {
      const res = await axios.post(`${API_URL}/api/pronunciation/generate-from-pdf`, {
        pdfBase64,
        fileName,
        scenarioCount: scenarioCountToGenerate,
        audience: nuevoProducto.audience || "estudiantes"
      });

      const generatedScenarios =
        Array.isArray(res.data?.scenarios) && res.data.scenarios.length > 0
          ? res.data.scenarios
          : DEFAULT_HTML_SCENARIOS;

      setNuevoProducto((prev) => {
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

      setActiveScenarioIdx(0);
      setActiveQuestionIdx(0);
      setStep(3);

      Swal.fire({
        title: "¡Ejercicios IA generados desde el PDF!",
        text: `Se crearon ${generatedScenarios.length} escenarios interactivos con el formato de práctica oral.`,
        icon: "success",
        confirmButtonColor: "#0f172a"
      });
    } catch (error) {
      console.error("Error generating scenarios from PDF:", error);
      setNuevoProducto((prev) => ({
        ...prev,
        speakingActivities:
          prev.speakingActivities?.length > 0 ? prev.speakingActivities : DEFAULT_HTML_SCENARIOS
      }));
      Swal.fire({
        title: "Escenarios base cargados",
        text: "Se cargaron los escenarios en formato interactivo listos para personalizar.",
        icon: "info",
        confirmButtonColor: "#0f172a"
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

      const alreadyInFiles = nuevoProducto.archivosInfoproducto.some((f) => f.name === file.name);
      if (!alreadyInFiles) {
        const url = await uploadFileToCloud(file, "/products/materials");
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + " MB";
        setNuevoProducto((prev) => ({
          ...prev,
          archivosInfoproducto: [
            ...prev.archivosInfoproducto,
            {
              name: file.name,
              url,
              fileType: "application/pdf",
              badge: "PDF",
              size: sizeMB,
              _pdfBase64: pdfBase64
            }
          ]
        }));
      }

      await generateScenariosFromPdfBase64(pdfBase64, file.name);
    } catch (err) {
      Swal.fire({
        title: "Error al leer el PDF",
        text: "Por favor selecciona un archivo PDF válido.",
        icon: "error",
        confirmButtonColor: "#0f172a"
      });
    } finally {
      e.target.value = null;
    }
  };

  const handleAddEmptyScenario = () => {
    setNuevoProducto((prev) => {
      const current = Array.isArray(prev.speakingActivities) ? prev.speakingActivities : [];
      const nextNum = String(current.length + 1).padStart(2, "0");
      const newSc = {
        num: nextNum,
        emoji: "🗣️",
        title: `New Scenario ${nextNum}`,
        topics: ["speaking", "vocabulary", "fluency"],
        questions: [
          {
            q: "Describe this situation and how you would communicate effectively.",
            hint: "Use: 'First, I would...' / 'In my opinion...'",
            vocab: ["phrase", "context", "fluency", "response", "detail"]
          },
          {
            q: "Role-play asking two polite questions in this context.",
            hint: "Use: 'Could you please tell me...?' / 'I was wondering if...'",
            vocab: ["request", "polite", "information", "confirm", "option"]
          },
          {
            q: "How would you solve an unexpected problem in this scenario?",
            hint: "Structure: explain the issue → propose a solution → thank the listener.",
            vocab: ["solution", "alternative", "assist", "resolve", "outcome"]
          }
        ]
      };
      const updated = [...current, newSc];
      setActiveScenarioIdx(updated.length - 1);
      setActiveQuestionIdx(0);
      return { ...prev, speakingActivities: updated };
    });
  };

  const handleLoadDefault15Scenarios = () => {
    setNuevoProducto((prev) => ({
      ...prev,
      speakingActivities: DEFAULT_HTML_SCENARIOS
    }));
    setActiveScenarioIdx(0);
    setActiveQuestionIdx(0);
  };

  const handleUpdateScenarioField = (scIdx, field, value) => {
    setNuevoProducto((prev) => {
      const list = [...(prev.speakingActivities || [])];
      if (!list[scIdx]) return prev;
      list[scIdx] = { ...list[scIdx], [field]: value };
      return { ...prev, speakingActivities: list };
    });
  };

  const handleUpdateQuestionField = (scIdx, qIdx, field, value) => {
    setNuevoProducto((prev) => {
      const list = [...(prev.speakingActivities || [])];
      if (!list[scIdx]) return prev;
      const questions = [...(list[scIdx].questions || [])];
      if (!questions[qIdx]) return prev;
      questions[qIdx] = { ...questions[qIdx], [field]: value };
      list[scIdx] = { ...list[scIdx], questions };
      return { ...prev, speakingActivities: list };
    });
  };

  const handleDeleteScenario = (scIdx) => {
    setNuevoProducto((prev) => {
      const filtered = (prev.speakingActivities || [])
        .filter((_, idx) => idx !== scIdx)
        .map((sc, idx) => ({ ...sc, num: String(idx + 1).padStart(2, "0") }));
      setActiveScenarioIdx(Math.max(0, scIdx - 1));
      setActiveQuestionIdx(0);
      return { ...prev, speakingActivities: filtered };
    });
  };

  const handleSaveCourse = async () => {
    if (!nuevoProducto.audience) {
      setStep(1);
      Swal.fire({
        title: "Selecciona el tipo de material",
        text: "Primero indica si el material es para Docentes, Estudiantes o Lectura.",
        icon: "warning",
        confirmButtonColor: "#0f172a"
      });
      return;
    }

    if (!nuevoProducto.nombre.trim()) {
      setStep(1);
      Swal.fire({
        title: "Falta el nombre del curso",
        text: "Escribe un título para identificar este curso o material.",
        icon: "warning",
        confirmButtonColor: "#0f172a"
      });
      return;
    }

    setSavingCourse(true);
    try {
      const cleanFiles = (nuevoProducto.archivosInfoproducto || []).map(({ _pdfBase64, ...rest }) => rest);
      const scenariosToSave =
        Array.isArray(nuevoProducto.speakingActivities) && nuevoProducto.speakingActivities.length > 0
          ? nuevoProducto.speakingActivities
          : DEFAULT_HTML_SCENARIOS;

      const priceNum = Number(nuevoProducto.precioInfoproducto) || 0;

      const payload = {
        ...nuevoProducto,
        precioInfoproducto: priceNum,
        archivosInfoproducto: cleanFiles,
        speakingActivities: scenariosToSave,
        origenDeVenta: "admin",
        esInfoproducto: true,
        alerta: 0,
        variantes: [
          {
            color: nuevoProducto.color || "#0f172a",
            almacenamiento: "Digital",
            stock: 9999,
            costoDeCompra: 0,
            precioAlPublico: priceNum,
            precioMayorista: priceNum,
            precioRevendedor: priceNum
          }
        ]
      };

      const response = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "No se pudo guardar el curso.");
      }

      const matLabel =
        MATERIAL_TYPES.find((m) => m.id === nuevoProducto.audience)?.title || "Estudiantes";

      Swal.fire({
        title: "¡Curso Creado con Éxito!",
        html: `El curso <b>"${nuevoProducto.nombre}"</b> (${matLabel}) se guardó con <b>${cleanFiles.length} archivo(s)</b> y <b>${scenariosToSave.length} escenarios interactivos de IA</b>.`,
        icon: "success",
        confirmButtonColor: "#0f172a"
      });

      setNuevoProducto(initialProductState);
      setLastPdfNameUsed("");
      setStep(1);
    } catch (error) {
      Swal.fire({
        title: "Error al guardar",
        text: error.message || "Error de conexión con el servidor.",
        icon: "error",
        confirmButtonColor: "#0f172a"
      });
    } finally {
      setSavingCourse(false);
    }
  };

  const currentMaterialType = MATERIAL_TYPES.find((m) => m.id === nuevoProducto.audience);
  const currentScenarios = nuevoProducto.speakingActivities || [];
  const selectedScenario = currentScenarios[activeScenarioIdx] || null;
  const selectedQuestion =
    selectedScenario?.questions?.[activeQuestionIdx] || selectedScenario?.questions?.[0] || null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-['Inter',sans-serif] text-neutral-900">
      {showPreviewModal && (
        <CourseInteractivePreviewModal
          producto={nuevoProducto}
          onClose={() => setShowPreviewModal(false)}
        />
      )}

      {/* ── HEADER DEL MÓDULO ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            Configurador de Cursos
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Selecciona el tipo de material, sube archivos (PowerPoint, PDF, Word) y genera ejercicios interactivos con IA.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 bg-white hover:bg-[#FAF9F6] text-neutral-700 border border-[#E2E2DC] transition-colors"
          >
            <FiEye className="w-4 h-4 text-neutral-500" />
            <span>Vista Previa</span>
          </button>

          <button
            type="button"
            onClick={handleSaveCourse}
            disabled={savingCourse}
            className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 bg-[#19191B] hover:bg-neutral-800 text-white transition-colors disabled:opacity-50"
          >
            <FiCheck className="w-4 h-4" />
            <span>{savingCourse ? "Guardando..." : "Publicar Curso"}</span>
          </button>
        </div>
      </div>

      {/* ── BARRA DE 3 PASOS NAVEGABLES ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            num: 1,
            title: "1. Tipo de Material y Datos",
            sub: currentMaterialType
              ? `${currentMaterialType.emoji} ${currentMaterialType.title}`
              : "Docentes, Estudiantes o Lectura"
          },
          {
            num: 2,
            title: "2. Archivos (PPT, PDF, Word)",
            sub: `${nuevoProducto.archivosInfoproducto.length} archivo(s) cargado(s)`
          },
          {
            num: 3,
            title: "3. Ejercicios IA desde PDF",
            sub: `${currentScenarios.length} escenario(s) interactivo(s)`
          }
        ].map((item) => {
          const isActive = step === item.num;
          const isDone =
            (item.num === 1 && nuevoProducto.audience && nuevoProducto.nombre) ||
            (item.num === 2 && nuevoProducto.archivosInfoproducto.length > 0) ||
            (item.num === 3 && currentScenarios.length > 0);

          return (
            <button
              key={item.num}
              type="button"
              onClick={() => setStep(item.num)}
              className={`p-4 rounded-2xl border text-left transition-colors flex items-center gap-3 shadow-xs ${
                isActive
                  ? "bg-[#19191B] border-neutral-900 text-white"
                  : isDone
                  ? "bg-white border-[#DCF3E3] text-neutral-900 hover:bg-[#FAF9F6]"
                  : "bg-white border-[#ECECE6] text-neutral-700 hover:bg-[#FAF9F6]"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-semibold text-xs shrink-0 ${
                  isActive
                    ? "bg-white/15 text-white"
                    : isDone
                    ? "bg-[#EDF9F0] text-[#29974D] border border-[#DCF3E3]"
                    : "bg-[#F3F2EE] text-neutral-600"
                }`}
              >
                {isDone && !isActive ? <FiCheck className="w-4 h-4" /> : item.num}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{item.title}</p>
                <p
                  className={`text-xs truncate mt-0.5 ${
                    isActive ? "text-neutral-300" : "text-neutral-500"
                  }`}
                >
                  {item.sub}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* PASO 1: TIPO DE MATERIAL + DATOS BÁSICOS                            */}
      {/* =================================================================== */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-6"
          >
            {/* 1.1 CONSULTA DE TIPO DE MATERIAL */}
            <div className="bg-white rounded-2xl p-6 border border-[#ECECE6] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-medium text-neutral-800">
                    ¿Qué tipo de material vas a cargar primero?
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Selecciona el enfoque del curso para adaptar el visor y el generador de ejercicios con IA.
                  </p>
                </div>
                {currentMaterialType && (
                  <span className="px-3 py-1 rounded-xl bg-[#EDF9F0] text-[#29974D] border border-[#DCF3E3] text-xs font-medium self-start sm:self-center">
                    Seleccionado: {currentMaterialType.emoji} {currentMaterialType.title}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {MATERIAL_TYPES.map((type) => {
                  const isSelected = nuevoProducto.audience === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleSelectMaterialType(type.id)}
                      className={`p-5 rounded-2xl border text-left transition-colors flex flex-col justify-between h-full ${
                        isSelected
                          ? "border-neutral-900 bg-[#FAF9F6]"
                          : "border-[#ECECE6] bg-white hover:bg-[#F8F8F5]"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-[#F3F2EE] border border-[#ECECE6] flex items-center justify-center text-xl">
                          {type.emoji}
                        </div>
                        <div
                          className={`w-5 h-5 rounded-xl border flex items-center justify-center ${
                            isSelected
                              ? "bg-[#19191B] border-neutral-900 text-white"
                              : "border-[#E2E2DC] bg-white"
                          }`}
                        >
                          {isSelected && <FiCheck className="w-3.5 h-3.5" />}
                        </div>
                      </div>

                      <div>
                        <span className="inline-block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
                          {type.badge}
                        </span>
                        <h3 className="text-base font-medium text-neutral-800 mb-1">{type.title}</h3>
                        <p className="text-xs text-neutral-500 leading-relaxed">{type.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 1.2 INFORMACIÓN ESENCIAL DEL CURSO */}
            <div className="bg-white rounded-2xl p-6 border border-[#ECECE6] shadow-xs space-y-6">
              <h2 className="text-base font-medium text-neutral-800 flex items-center gap-2">
                <FiFileText className="w-5 h-5 text-neutral-500" />
                <span>Información Básica del Curso</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Nombre y Precio */}
                <div className="md:col-span-8">
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider block mb-1.5">
                    Nombre del Curso o Material *
                  </label>
                  <input
                    type="text"
                    value={nuevoProducto.nombre}
                    onChange={(e) =>
                      setNuevoProducto((p) => ({ ...p, nombre: e.target.value }))
                    }
                    placeholder="Ej: 15 Speaking Scenarios for Travel & Daily Life"
                    className="w-full h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                  />
                </div>

                <div className="md:col-span-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Precio de Venta ($) *
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setNuevoProducto((p) => ({ ...p, precioInfoproducto: "0" }))
                      }
                      className="text-xs font-medium text-neutral-700 hover:underline"
                    >
                      Poner Gratis ($0)
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={nuevoProducto.precioInfoproducto}
                    onChange={(e) =>
                      setNuevoProducto((p) => ({ ...p, precioInfoproducto: e.target.value }))
                    }
                    placeholder="Ej: 149"
                    className="w-full h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                  />
                </div>

                {/* Categoría */}
                <div className="md:col-span-6">
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider block mb-1.5">
                    Categoría del Curso
                  </label>
                  <select
                    value={nuevoProducto.categoria}
                    onChange={(e) =>
                      setNuevoProducto((p) => ({ ...p, categoria: e.target.value }))
                    }
                    className="w-full h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                  >
                    <option value="">Seleccionar categoría...</option>
                    <option value="B1 / B2 · British English">B1 / B2 · British English</option>
                    <option value="Viajeros & Turismo">Viajeros &amp; Turismo</option>
                    <option value="Fluidez & Conversación">Fluidez &amp; Conversación</option>
                    <option value="Especialización Docente">Especialización Docente</option>
                    <option value="Comprensión Lectora">Comprensión Lectora</option>
                    {categorias.map((c) => (
                      <option key={c.categoryId} value={c.categoryName}>
                        {c.categoryName}
                      </option>
                    ))}
                  </select>
                  <CategoryManager
                    categorias={categorias}
                    onChanged={fetchCategories}
                    onRenamed={(oldName, newName) =>
                      setNuevoProducto((p) => (p.categoria === oldName ? { ...p, categoria: newName } : p))
                    }
                    onDeleted={(name) =>
                      setNuevoProducto((p) => (p.categoria === name ? { ...p, categoria: "" } : p))
                    }
                  />
                </div>

                <div className="md:col-span-6">
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider block mb-1.5">
                    O Crear Nueva Categoría Rápida
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      placeholder="Ej: Business English"
                      className="flex-1 h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 bg-[#19191B] hover:bg-neutral-800 text-white transition-colors"
                    >
                      <FiPlus className="w-4 h-4" /> Crear
                    </button>
                  </div>
                </div>

                {/* NIVEL DE INGLÉS REQUERIDO */}
                <div className="md:col-span-12 bg-[#FAF9F6] border border-[#ECECE6] rounded-2xl p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                        <FiAward className="w-4 h-4 text-neutral-500" />
                        Nivel de Inglés Necesario para Completar el Curso (MCER / CEFR) *
                      </label>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Selecciona el nivel de inglés recomendado para este curso.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-[#EDF9F0] text-[#29974D] border border-[#DCF3E3] text-xs font-medium self-start sm:self-center shrink-0">
                      Nivel: {nuevoProducto.subcategoria || "B1 / B2 · Intermedio a Intermedio Alto"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {ENGLISH_LEVELS.map((lvl) => {
                      const isSelected =
                        nuevoProducto.subcategoria === lvl.label ||
                        nuevoProducto.subcategoria === lvl.code;
                      return (
                        <button
                          key={lvl.code}
                          type="button"
                          onClick={() =>
                            setNuevoProducto((p) => ({ ...p, subcategoria: lvl.label }))
                          }
                          className={`h-9 px-3 rounded-xl border text-left transition-colors flex items-center justify-between gap-1.5 text-xs font-medium ${
                            isSelected
                              ? "bg-[#19191B] border-neutral-900 text-white"
                              : "bg-white border-[#E2E2DC] text-neutral-700 hover:bg-[#F3F2EE]"
                          }`}
                        >
                          <span className="truncate">{lvl.short}</span>
                          {isSelected && <FiCheck className="w-4 h-4 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                    <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider shrink-0">
                      O nivel personalizado:
                    </span>
                    <input
                      type="text"
                      value={nuevoProducto.subcategoria || ""}
                      onChange={(e) =>
                        setNuevoProducto((p) => ({ ...p, subcategoria: e.target.value }))
                      }
                      placeholder="Ej: B1 / B2 · British English, A2+ Pre-Intermediate..."
                      className="flex-1 h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Beneficios / Resumen del Curso */}
                <div className="md:col-span-7">
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider block mb-1.5">
                    ¿Qué incluye o qué aprenderán en este curso? (Puntos clave)
                  </label>
                  <div className="flex gap-2 mb-3">
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
                      placeholder="Escribe un beneficio y presiona Enter..."
                      className="flex-1 h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleAddBenefit}
                      className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 bg-[#19191B] hover:bg-neutral-800 text-white transition-colors"
                    >
                      <FiPlus className="w-4 h-4" /> Añadir
                    </button>
                  </div>

                  <div className="space-y-2 max-h-44 overflow-y-auto">
                    {nuevoProducto.descripcion
                      ? nuevoProducto.descripcion
                          .split("\n")
                          .filter(Boolean)
                          .map((line, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-2 bg-[#FAF9F6] px-3 py-2 rounded-xl border border-[#ECECE6] text-xs text-neutral-700"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span className="truncate">{line}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveBenefit(idx)}
                                className="h-8 w-8 rounded-xl inline-flex items-center justify-center text-neutral-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                      : (
                        <p className="text-xs text-neutral-500 py-4 text-center bg-[#FAF9F6] rounded-xl border border-dashed border-[#E2E2DC]">
                          Agrega puntos descriptivos sobre el contenido del curso.
                        </p>
                      )}
                  </div>
                </div>

                {/* Portada del Curso */}
                <div className="md:col-span-5">
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider block mb-1.5">
                    Imagen de Portada
                  </label>
                  <div
                    onClick={() => coverFileInputRef.current?.click()}
                    className="h-40 rounded-2xl border border-dashed border-[#E2E2DC] hover:border-neutral-500 bg-[#FAF9F6] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden transition-colors"
                  >
                    <input
                      ref={coverFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUploadCoverImage}
                      className="hidden"
                    />
                    {nuevoProducto.imagenes?.[0] ? (
                      <>
                        <img
                          src={nuevoProducto.imagenes[0]}
                          alt="Portada"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-[#19191B]/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="px-3 py-1.5 rounded-xl bg-white text-neutral-900 font-medium text-xs">
                            Cambiar Portada
                          </span>
                        </div>
                      </>
                    ) : uploadingCover ? (
                      <div className="flex flex-col items-center text-neutral-700">
                        <FiRefreshCcw className="w-5 h-5 animate-spin mb-2" />
                        <span className="text-xs font-medium">Subiendo imagen...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-neutral-500 p-4 text-center">
                        <FiImage className="w-5 h-5 mb-1.5 text-neutral-400" />
                        <span className="text-xs font-medium text-neutral-700">
                          Clic para subir imagen de portada
                        </span>
                        <span className="text-xs text-neutral-400">JPG, PNG o WEBP</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={coverUrlInput}
                      onChange={(e) => setCoverUrlInput(e.target.value)}
                      placeholder="O pega URL de imagen..."
                      className="flex-1 h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (coverUrlInput.trim()) {
                          setNuevoProducto((p) => ({ ...p, imagenes: [coverUrlInput.trim()] }));
                          setCoverUrlInput("");
                        }
                      }}
                      className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 bg-white hover:bg-[#FAF9F6] text-neutral-700 border border-[#E2E2DC] transition-colors"
                    >
                      Usar URL
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* =================================================================== */}
        {/* PASO 2: ALMACENAR POWERPOINT, PDF Y ARCHIVOS WORD EN EL CURSO       */}
        {/* =================================================================== */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl p-6 border border-[#ECECE6] shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-medium text-neutral-800">
                    Archivos del Curso: PowerPoint, PDF y Word
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Sube presentaciones PowerPoint (.ppt, .pptx), guías en PDF (.pdf) y documentos Word (.doc, .docx).
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-xl bg-[#FFF1EB] border border-[#FDE0D3] text-[#F36B2B] text-xs font-medium">
                    📊 PowerPoint
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                    📄 PDF
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-[#F3F2EE] border border-[#ECECE6] text-neutral-700 text-xs font-medium">
                    📝 Word
                  </span>
                </div>
              </div>

              {/* Zona de Subida */}
              <div
                onClick={() => !uploadingFiles && courseFilesInputRef.current?.click()}
                className="border border-dashed border-[#E2E2DC] hover:border-neutral-500 rounded-2xl p-8 text-center cursor-pointer bg-[#FAF9F6] transition-colors"
              >
                <input
                  ref={courseFilesInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.mp4,.mp3,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  onChange={handleUploadCourseFiles}
                  className="hidden"
                />

                {uploadingFiles ? (
                  <div className="flex flex-col items-center justify-center py-4">
                    <FiRefreshCcw className="w-5 h-5 text-neutral-700 animate-spin mb-2" />
                    <p className="text-xs font-medium text-neutral-900">
                      Almacenando archivos en el curso...
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#ECECE6] text-neutral-700 flex items-center justify-center mb-3 shadow-xs">
                      <FiUploadCloud className="w-5 h-5" />
                    </div>
                    <p className="text-base font-medium text-neutral-800 mb-1">
                      Haz clic para seleccionar tus archivos PowerPoint, PDF o Word
                    </p>
                    <p className="text-xs text-neutral-500 max-w-md">
                      Puedes seleccionar varios archivos a la vez (.PPT, .PPTX, .PDF, .DOC, .DOCX, .MP4, .MP3).
                    </p>
                  </div>
                )}
              </div>

              {/* Lista de Archivos Almacenados */}
              <div className="space-y-3">
                <span className="text-xs font-medium uppercase tracking-wider text-neutral-500 block">
                  Archivos Guardados en este Curso ({nuevoProducto.archivosInfoproducto.length})
                </span>

                {nuevoProducto.archivosInfoproducto.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-[#ECECE6] text-center text-xs text-neutral-500">
                    Aún no has cargado archivos. Sube un PowerPoint, PDF o Word arriba.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {nuevoProducto.archivosInfoproducto.map((archivo, idx) => {
                      const meta = detectFileMetadata(archivo.name, archivo.fileType);
                      const isPdf = meta.badge === "PDF";

                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-white border border-[#ECECE6] shadow-xs flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] border border-[#ECECE6] flex items-center justify-center text-lg shrink-0">
                              {meta.icon}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-neutral-900 truncate">
                                {archivo.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`text-xs font-medium px-2 py-0.5 rounded-xl border ${meta.badgeColor}`}
                                >
                                  {meta.badge}
                                </span>
                                {archivo.size && (
                                  <span className="text-xs text-neutral-500">
                                    {archivo.size}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isPdf && archivo._pdfBase64 && (
                              <button
                                type="button"
                                onClick={() =>
                                  generateScenariosFromPdfBase64(archivo._pdfBase64, archivo.name)
                                }
                                disabled={generatingFromPdf}
                                className="h-9 px-3 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-1.5 bg-[#19191B] hover:bg-neutral-800 text-white transition-colors"
                                title="Generar ejercicios IA desde este PDF"
                              >
                                <FiCpu className="w-4 h-4" />
                                <span>Crear Ejercicios IA</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                setNuevoProducto((prev) => ({
                                  ...prev,
                                  archivosInfoproducto: prev.archivosInfoproducto.filter(
                                    (_, i) => i !== idx
                                  )
                                }))
                              }
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
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* =================================================================== */}
        {/* PASO 3: GENERAR EJERCICIOS CON IA DESDE UN PDF                      */}
        {/* =================================================================== */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-6"
          >
            {/* 3.1 GENERADOR IA MEDIANTE PDF */}
            <div className="bg-white rounded-2xl p-6 border border-[#ECECE6] shadow-xs space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="max-w-2xl">
                  <h2 className="text-base font-medium text-neutral-800 flex items-center gap-2">
                    <FiCpu className="w-5 h-5 text-neutral-500" />
                    <span>Crea los Ejercicios Interactivos mediante un PDF</span>
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1">
                    Sube un PDF con el contenido de la unidad. La IA extraerá vocabulario clave y creará automáticamente escenarios de práctica con 3 preguntas cada uno.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                  <select
                    value={scenarioCountToGenerate}
                    onChange={(e) => setScenarioCountToGenerate(Number(e.target.value))}
                    className="h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                  >
                    <option value={3}>3 Escenarios (9 preguntas)</option>
                    <option value={5}>5 Escenarios (15 preguntas)</option>
                    <option value={10}>10 Escenarios (30 preguntas)</option>
                    <option value={15}>15 Escenarios (45 preguntas)</option>
                  </select>

                  <input
                    ref={pdfAiInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handlePdfUploadForAiExercises}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => pdfAiInputRef.current?.click()}
                    disabled={generatingFromPdf}
                    className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 bg-[#19191B] hover:bg-neutral-800 text-white transition-colors disabled:opacity-50"
                  >
                    {generatingFromPdf ? (
                      <>
                        <FiRefreshCcw className="w-4 h-4 animate-spin" />
                        <span>Analizando PDF...</span>
                      </>
                    ) : (
                      <>
                        <FiUploadCloud className="w-4 h-4" />
                        <span>Subir PDF y Generar Ejercicios IA</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {nuevoProducto.archivosInfoproducto.some((f) => f._pdfBase64) && (
                <div className="pt-4 border-t border-[#ECECE6] flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    O genera desde un PDF cargado en el Paso 2:
                  </span>
                  {nuevoProducto.archivosInfoproducto
                    .filter((f) => f._pdfBase64)
                    .map((pdfFile, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        disabled={generatingFromPdf}
                        onClick={() =>
                          generateScenariosFromPdfBase64(pdfFile._pdfBase64, pdfFile.name)
                        }
                        className="h-9 px-3 rounded-xl bg-[#F3F2EE] hover:bg-neutral-200 text-xs font-medium text-neutral-700 inline-flex items-center gap-2 border border-[#ECECE6] transition-colors"
                      >
                        <span>📄 {pdfFile.name}</span>
                        <span className="text-xs bg-[#19191B] text-white px-2 py-0.5 rounded-xl">
                          Generar IA
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* 3.2 EDITOR VISUAL E INTERACTIVO DE LOS ESCENARIOS */}
            <div className="bg-white rounded-2xl p-6 border border-[#ECECE6] shadow-xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-medium text-neutral-800 flex items-center gap-2">
                    <span>Escenarios Interactivos del Curso ({currentScenarios.length})</span>
                    {lastPdfNameUsed && (
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-xl bg-[#EDF9F0] text-[#29974D] border border-[#DCF3E3]">
                        Generado de: {lastPdfNameUsed}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Estos ejercicios se mostrarán al estudiante con selector de escenarios, grabación de voz y feedback IA.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {currentScenarios.length === 0 && (
                    <button
                      type="button"
                      onClick={handleLoadDefault15Scenarios}
                      className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 bg-white hover:bg-[#FAF9F6] text-neutral-700 border border-[#E2E2DC] transition-colors"
                    >
                      Cargar Plantilla Ejemplo (3 Escenarios)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAddEmptyScenario}
                    className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 bg-[#19191B] hover:bg-neutral-800 text-white transition-colors"
                  >
                    <FiPlus className="w-4 h-4" /> Añadir Escenario Manual
                  </button>
                </div>
              </div>

              {currentScenarios.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#FAF9F6] border border-dashed border-[#E2E2DC] text-center">
                  <p className="text-base font-medium text-neutral-800 mb-1">
                    Sube un PDF arriba para que la IA cree los escenarios automáticamente
                  </p>
                  <p className="text-xs text-neutral-500">
                    O haz clic en &ldquo;Cargar Plantilla Ejemplo&rdquo; / &ldquo;Añadir Escenario Manual&rdquo; para empezar.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Selector de Escenarios */}
                  <div className="lg:col-span-5 bg-[#FAF9F6] rounded-2xl p-4 border border-[#ECECE6]">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#ECECE6]">
                      <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Escenarios ({currentScenarios.length})
                      </span>
                      <span className="text-xs text-neutral-400">Clic para editar</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {currentScenarios.map((sc, idx) => {
                        const isSelected = idx === activeScenarioIdx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setActiveScenarioIdx(idx);
                              setActiveQuestionIdx(0);
                            }}
                            className={`p-2.5 rounded-xl border text-center transition-colors flex flex-col items-center gap-0.5 ${
                              isSelected
                                ? "bg-[#19191B] border-neutral-900 text-white"
                                : "bg-white border-[#ECECE6] text-neutral-700 hover:bg-[#F3F2EE]"
                            }`}
                          >
                            <span className="text-lg">{sc.emoji}</span>
                            <span className="text-xs font-medium">{sc.num}</span>
                            <span className="text-xs opacity-80 line-clamp-1">
                              {sc.title}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Editor del Escenario Seleccionado */}
                  {selectedScenario && (
                    <div className="lg:col-span-7 bg-[#FAF9F6] rounded-2xl p-5 border border-[#ECECE6] space-y-4">
                      <div className="flex items-center justify-between border-b border-[#ECECE6] pb-4 gap-3">
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="text"
                            value={selectedScenario.emoji}
                            onChange={(e) =>
                              handleUpdateScenarioField(activeScenarioIdx, "emoji", e.target.value)
                            }
                            className="w-12 h-10 text-center text-lg bg-white border border-[#E2E2DC] rounded-xl focus:outline-none focus:border-neutral-400"
                            title="Emoji del escenario"
                          />
                          <div className="flex-1">
                            <span className="text-xs font-medium uppercase tracking-wider text-neutral-500 block mb-1">
                              Scenario {selectedScenario.num}
                            </span>
                            <input
                              type="text"
                              value={selectedScenario.title}
                              onChange={(e) =>
                                handleUpdateScenarioField(
                                  activeScenarioIdx,
                                  "title",
                                  e.target.value
                                )
                              }
                              className="w-full h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteScenario(activeScenarioIdx)}
                          className="h-8 w-8 rounded-xl inline-flex items-center justify-center text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                          title="Eliminar este escenario"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Tópicos del Banner */}
                      <div>
                        <label className="text-xs font-medium uppercase tracking-wider text-neutral-500 block mb-1.5">
                          Tópicos del Escenario (separados por coma)
                        </label>
                        <input
                          type="text"
                          value={(selectedScenario.topics || []).join(", ")}
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

                      {/* Navegador de las 3 Preguntas (Q1, Q2, Q3) */}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider mr-1">
                          Pregunta:
                        </span>
                        {(selectedScenario.questions || []).map((_, qIdx) => (
                          <button
                            key={qIdx}
                            type="button"
                            onClick={() => setActiveQuestionIdx(qIdx)}
                            className={`h-8 w-8 rounded-xl font-medium text-xs border transition-colors ${
                              qIdx === activeQuestionIdx
                                ? "bg-[#19191B] border-neutral-900 text-white"
                                : "bg-white border-[#E2E2DC] text-neutral-700 hover:bg-[#F3F2EE]"
                            }`}
                          >
                            {qIdx + 1}
                          </button>
                        ))}
                      </div>

                      {/* Campos de la Pregunta Activa */}
                      {selectedQuestion && (
                        <div className="bg-white rounded-2xl p-4 border border-[#ECECE6] space-y-4">
                          <div>
                            <label className="text-xs font-medium uppercase tracking-wider text-neutral-500 block mb-1.5">
                              Pregunta / Consigna Oral (Q{activeQuestionIdx + 1})
                            </label>
                            <textarea
                              rows={2}
                              value={selectedQuestion.q}
                              onChange={(e) =>
                                handleUpdateQuestionField(
                                  activeScenarioIdx,
                                  activeQuestionIdx,
                                  "q",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-medium uppercase tracking-wider text-neutral-500 block mb-1.5">
                              Hint / Estructura Sugerida
                            </label>
                            <input
                              type="text"
                              value={selectedQuestion.hint}
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
                            <label className="text-xs font-medium uppercase tracking-wider text-neutral-500 block mb-1.5">
                              Key Vocabulary (separado por comas)
                            </label>
                            <input
                              type="text"
                              value={(selectedQuestion.vocab || []).join(", ")}
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
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FOOTER DE NAVEGACIÓN ENTRE PASOS ── */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#ECECE6] shadow-xs">
        <div>
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 bg-white hover:bg-[#FAF9F6] text-neutral-700 border border-[#E2E2DC] transition-colors"
            >
              <FiChevronLeft className="w-4 h-4" /> Paso Anterior
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !nuevoProducto.audience) {
                  Swal.fire({
                    title: "Elige el tipo de material primero",
                    text: "Selecciona si el material es Para Docentes, Para Estudiantes o Material de Lectura.",
                    icon: "info",
                    confirmButtonColor: "#0f172a"
                  });
                  return;
                }
                setStep((s) => s + 1);
              }}
              className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 bg-[#19191B] hover:bg-neutral-800 text-white transition-colors"
            >
              <span>Siguiente Paso</span>
              <FiChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveCourse}
              disabled={savingCourse}
              className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 bg-[#19191B] hover:bg-neutral-800 text-white transition-colors disabled:opacity-50"
            >
              <FiCheck className="w-4 h-4" />
              <span>{savingCourse ? "Publicando Curso..." : "Guardar y Publicar Curso Completo"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
