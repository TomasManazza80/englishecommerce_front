import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Add } from "../../store/redux/cart/CartAction";
import Swal from "sweetalert2";
import EditableText from "../../components/EditableText/EditableText.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3003";

// High-fidelity fallback catalog courses precisely matching design specification
const FALLBACK_COURSES = [
  {
    id: "c1",
    nombre: "Master en Fluidez & Conversación Profesional con IA",
    categoria: "Negocios & Finanzas",
    subcategoria: "Entrevistas & Tech",
    audience: "professionals",
    audienceLabel: "Profesionales",
    level: "b2",
    levelLabel: "B1 → C1",
    aiBadge: "Tutor IA 24/7",
    hasAiTutor: true,
    hasCefrCert: true,
    hasVoiceSim: true,
    rating: 4.9,
    reviewsCount: 840,
    duration: "12 Semanas",
    lessonsCount: "48 Lecciones",
    descripcion:
      "Aprende a comunicarte con total seguridad en reuniones de alto impacto, presentaciones y negociación internacional.",
    tags: ["Speech Recognition", "Pitching", "Meetings"],
    precioVenta: 149,
    originalPrice: 299,
    discountBadge: "50% OFF",
    imagenes: [
      {
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDhld1VP3EfS1rg21_E5rd8mkOtKFuIt7vzBbFBthPtEQ7tJxPLje01HMrbXgaWcCbi_ep_uZNke_QMjzQawDIKIp_UDmXGXwtHUXBXPj6v7afP-k-y9g3Nsv63FWBlrcx0e-rr9N4ZEmxQgkesbAuca2jROB4EGJlVG1jFWwSS5CvErX5e9FSELSqCeA3KrwEB9KTAsr9AMiw5Fsb3Nz7CpypeCyoAxtE8JJJL_lhZ8kuso7Ml6P7Kvg"
      }
    ]
  },
  {
    id: "c2",
    nombre: "Metodologías de Enseñanza con IA para Docentes de Inglés",
    categoria: "Metodología & Docencia",
    subcategoria: "TESOL",
    audience: "teachers",
    audienceLabel: "TESOL IA",
    level: "c1",
    levelLabel: "C1 • Docentes",
    aiBadge: "Tutor IA",
    hasAiTutor: true,
    hasCefrCert: true,
    hasVoiceSim: true,
    rating: 5.0,
    reviewsCount: 310,
    duration: "8 Semanas",
    lessonsCount: "32 Lecciones",
    descripcion:
      "Estrategias pedagógicas modernas para diseñar clases interactivas, corregir fonética con prompts de voz y evaluar alumnos.",
    tags: ["Lesson Planning", "Prompt Pedagogy", "Acoustic Grading"],
    precioVenta: 189,
    originalPrice: null,
    discountBadge: "CEFR Verificable",
    imagenes: [
      {
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuC8WzEJg7A2iwVp7uYrbuDl78Qp8n1SMAZjGlEDUYw9w2JOiZi2yoMwGgeVLN6PwxVfSRPDB8KP2AIWRl4rGY0oEQ6P-ueINI4mSJhWrv23uw5veU4TvSrJgA_A_X-75ca_nKrWhCKylx69J1KnVx7wwIR3FILebqPCXkX-iaZUe4w86VytdUMB0kMD3MmHUDqVqXQ8pRGFO6EWXgGGO5C3HhhX5krTBREGn8jcJ9wquC5lX75vryZx5Q"
      }
    ]
  },
  {
    id: "c3",
    nombre: "Inglés Inmersivo para Viajes, Aduanas y Turismo Global",
    categoria: "Viajes & Migración",
    subcategoria: "Conversación",
    audience: "students",
    audienceLabel: "Viajeros",
    level: "b1",
    levelLabel: "A2 → B2",
    aiBadge: "Tutor IA",
    hasAiTutor: true,
    hasCefrCert: false,
    hasVoiceSim: true,
    rating: 4.8,
    reviewsCount: 1250,
    duration: "6 Semanas",
    lessonsCount: "28 Lecciones",
    descripcion:
      "Supera aduanas, aeropuertos, reservas hoteleras y situaciones imprevistas con diálogos guiados y roleplays en tiempo real.",
    tags: ["Airport English", "Emergency English", "Cultural Codes"],
    precioVenta: 99,
    originalPrice: null,
    discountBadge: "Acceso ilimitado",
    imagenes: [
      {
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDvy75NsWfb-QeG03spf2ikG9CvFFBOYuCzar9BsjNOq_dS5LyNTftwPvAGgI_GyIZpeCBu0J-wkwFY-aiwQIr2Stlqvs1Mct-L0pt3nxMgOoQyhuW3mBqddGJNrAbP3dILUpoji5ipfIiXGRFcAg4gjQhrUqWr_ewlp4TCLfvMsVg1H2PlYLwK09dixuNwz8kzA3AcJWXN5UzDp4xnXTBMurVDE6GZNUpbYFm2tHot4rVy5H91lx23UA"
      }
    ]
  },
  {
    id: "c4",
    nombre: "English for Tech Interviews & Silicon Valley Networking",
    categoria: "Entrevistas & Tech",
    subcategoria: "Negocios & Finanzas",
    audience: "professionals",
    audienceLabel: "Tech & Devs",
    level: "c1",
    levelLabel: "B2 → C2",
    aiBadge: "Simulador STAR",
    hasAiTutor: true,
    hasCefrCert: true,
    hasVoiceSim: true,
    rating: 4.95,
    reviewsCount: 560,
    duration: "8 Semanas",
    lessonsCount: "40 Lecciones",
    descripcion:
      "Domina el método STAR, negociaciones de equity y preguntas conductuales para empresas tecnológicas globales.",
    tags: ["System Design Talks", "STAR Method", "Salary Negotiation"],
    precioVenta: 169,
    originalPrice: null,
    discountBadge: "Rolplay con CTO IA",
    imagenes: [
      {
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuB380gAqNAAW3kDwK3SUlXfJQGFtgjUMdi_-qgFqbl320fipjDW4aQ3y3jKkVwQuTNFOOFRsLE0s0o1dM9wfaQBAw9-LD9QxrWKrFXWxKgkTFptBlL1B2eEHPNxom7rgfq1zH0g7F-Zw2Zq_TISo1T7w12hdLWlvcdK7h3Z81yaqfb_Tt2R9wMobTt2dnN_ownlLb3mcnSyrN8FSqopGRgezh7oDNO598Sna0mHLP9YuSJ50Ur6DVU9gQ"
      }
    ]
  },
  {
    id: "c5",
    nombre: "Fundamentos de Pronunciación & Primera Conversación",
    categoria: "Conversación Cotidiana",
    subcategoria: "Reducción de Acento",
    audience: "students",
    audienceLabel: "Estudiantes",
    level: "a1",
    levelLabel: "A1 → A2",
    aiBadge: "Bases Fonética",
    hasAiTutor: true,
    hasCefrCert: false,
    hasVoiceSim: true,
    rating: 4.85,
    reviewsCount: 920,
    duration: "10 Semanas",
    lessonsCount: "30 Lecciones",
    descripcion:
      "Pierde el miedo escénico al hablar en inglés desde el primer día con modelado fonético suave y feedback paciente sin juzgar.",
    tags: ["IPA Básico", "Daily Small Talk", "Listening Ear"],
    precioVenta: 79,
    originalPrice: null,
    discountBadge: "Garantía 14 días",
    imagenes: [
      {
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDzHTbkSr7ABbLr-oRueGtNCxPyiyCkmSQIb479smi71AyA8gjNRL3Hfhb_uU4n2TRJWjc2DApyU0oNPYjyQqyRbq9gC6O-rUHcKjV6ySMsTmCPdYWK8nBtk95xC93VB-A7cPiSkUVz6q1q1sEGy56tG878en3JN8X2cnd28RqHZDHtaqChIv5it9ZRYgJEoaKg51lllO2Ruf_p3C9jygFgtlV2sU6XAIxUcCtbndiULkVSiPFy13nbBw"
      }
    ]
  },
  {
    id: "c6",
    nombre: "Especialización en Reducción de Acento & Fonología Aplicada",
    categoria: "Reducción de Acento",
    subcategoria: "Metodología & Docencia",
    audience: "teachers",
    audienceLabel: "Docentes & Coaches",
    level: "c2",
    levelLabel: "B2 → C2",
    aiBadge: "Lab Acústico",
    hasAiTutor: true,
    hasCefrCert: true,
    hasVoiceSim: true,
    rating: 4.9,
    reviewsCount: 430,
    duration: "10 Semanas",
    lessonsCount: "45 Lecciones",
    descripcion:
      "Formación avanzada en formantes vocálicos, entonación británica/americana y técnicas articulatorias con espectrogramas.",
    tags: ["Schwa Mastery", "Intonation Curves", "Connected Speech"],
    precioVenta: 210,
    originalPrice: null,
    discountBadge: "Acreditado TESOL",
    imagenes: [
      {
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuA4p68mFEblNlq_HpzLIbVUNmKsamBruvQWiCgIDd3FnVfi54mZduGxJh2xq79F3n6xIUjmiyr1LK6vDBxG5eqyUV9oqclpmbIN2ZlON4Zof3M3kKQrEuQgrShgNuso2-FdxHKsYHuu7DyO8uoIj57AAkyOXW7CW10Uuo9UH4MYkF0KuZ9-Kyy1PEftmk6I2bf6umwSX0rjit14d7tmGh3BpRTQSk06dS8rpT4LeDo91ZQSDQuYndrMLg"
      }
    ]
  }
];

const SPECIALIZATIONS_LIST = [
  "Negocios & Finanzas",
  "Entrevistas & Tech",
  "Viajes & Migración",
  "Metodología & Docencia",
  "IELTS, TOEFL & Cambridge",
  "Reducción de Acento",
  "Conversación Cotidiana"
];

const CEFR_LEVELS = [
  { key: "a1", label: "A1", subtitle: "Principiante" },
  { key: "a2", label: "A2", subtitle: "Elemental" },
  { key: "b1", label: "B1", subtitle: "Intermedio" },
  { key: "b2", label: "B2", subtitle: "Intermedio Alto" },
  { key: "c1", label: "C1", subtitle: "Avanzado" },
  { key: "c2", label: "C2", subtitle: "Maestría" }
];

const AUDIENCES = [
  { key: "all", label: "Todos los perfiles", icon: "" },
  { key: "students", label: "Para Estudiantes", icon: "🎓" },
  { key: "teachers", label: "Para Docentes", icon: "👩‍🏫" },
  { key: "lectura", label: "Material de Lectura", icon: "📖" },
  { key: "professionals", label: "Profesionales Tech/Corp", icon: "💼" }
];

const SUGGESTIONS = [
  "Inglés para Negocios",
  "Entrevistas IT",
  "Metodología TESOL",
  "Reducción de Acento",
  "Viajes y Turismo"
];

const optimizeImage = (url) => {
  if (!url || typeof url !== "string") return url;
  if (url.includes("imagekit.io")) return `${url}?tr=w-800,f-webp,q-85`;
  if (url.includes("cloudinary.com")) return url.replace("/upload/", "/upload/w_800,f_webp,q_auto/");
  return url;
};

export default function Products() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Data states
  const [apiProducts, setApiProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedAudience, setSelectedAudience] = useState("all");
  const [selectedCefr, setSelectedCefr] = useState("");
  const [selectedSpecs, setSelectedSpecs] = useState([]);
  const [filterAiTutor, setFilterAiTutor] = useState(false);
  const [filterCefrCert, setFilterCefrCert] = useState(false);
  const [filterVoiceSim, setFilterVoiceSim] = useState(false);
  const [sortOption, setSortOption] = useState("populares");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Likes in localStorage
  const [likedProducts, setLikedProducts] = useState([]);
  const searchInputRef = useRef(null);

  useEffect(() => {
    try {
      const savedLikes = JSON.parse(localStorage.getItem("ai_liked_products")) || [];
      setLikedProducts(savedLikes);
    } catch {
      setLikedProducts([]);
    }
  }, []);

  // Sync category & audience param from URL if present
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setSelectedSpecs([categoryParam]);
    }
    const audienceParam = searchParams.get("audience");
    if (audienceParam) {
      setSelectedAudience(audienceParam);
    }
  }, [searchParams]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 280);
    return () => clearTimeout(timer);
  }, [search]);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch backend products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/products?page=1&limit=50`);
      const data = res.data?.products || res.data || [];
      if (Array.isArray(data) && data.length > 0) {
        setApiProducts(data);
      } else {
        setApiProducts(FALLBACK_COURSES);
      }
    } catch (err) {
      console.warn("Could not load products from API, rendering fallback catalog:", err);
      setApiProducts(FALLBACK_COURSES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Normalizer: merge backend data with design catalog metadata
  const allCourses = useMemo(() => {
    if (!apiProducts || apiProducts.length === 0) return FALLBACK_COURSES;

    return apiProducts.map((p, idx) => {
      const fallback = FALLBACK_COURSES[idx % FALLBACK_COURSES.length];
      const stockVariant =
        p.variantes?.find((v) => Number(v.stock) > 0) || (p.variantes?.length > 0 ? p.variantes[0] : null);
      const price = stockVariant?.precioAlPublico || p.precioVenta || fallback.precioVenta || 149;
      const cover =
        p.imagenes?.[0]?.url ||
        p.imagenes?.[0] ||
        p.image ||
        fallback.imagenes[0].url;

      const subLevelStr = String(p.subcategoria || p.level || "").toLowerCase();
      let level = (p.level || fallback.level || "b2").toLowerCase();
      if (subLevelStr.includes("a1")) level = "a1";
      else if (subLevelStr.includes("a2")) level = "a2";
      else if (subLevelStr.includes("b1")) level = "b1";
      else if (subLevelStr.includes("b2")) level = "b2";
      else if (subLevelStr.includes("c1")) level = "c1";
      else if (subLevelStr.includes("c2")) level = "c2";

      const customLevelLabel = p.subcategoria || p.levelLabel || fallback.levelLabel;
      const rawAudience = (p.audience || "").toLowerCase();
      let audience = (fallback.audience || "students").toLowerCase();
      let audienceLabel = fallback.audienceLabel || "Estudiantes";

      if (rawAudience === "docentes" || rawAudience === "teachers" || rawAudience.includes("docente")) {
        audience = "teachers";
        audienceLabel = "Docentes";
      } else if (rawAudience === "estudiantes" || rawAudience === "students" || rawAudience.includes("estudiante")) {
        audience = "students";
        audienceLabel = "Estudiantes";
      } else if (rawAudience === "lectura" || rawAudience === "reading" || rawAudience.includes("lectura")) {
        audience = "lectura";
        audienceLabel = "Material de Lectura";
      } else if (rawAudience === "profesionales" || rawAudience === "professionals" || rawAudience.includes("profesional")) {
        audience = "professionals";
        audienceLabel = "Profesionales";
      } else if (p.audience) {
        audience = rawAudience;
        audienceLabel = p.audienceLabel || (rawAudience === "teachers" ? "Docentes" : "Estudiantes");
      }

      return {
        ...fallback,
        ...p,
        id: p.id || fallback.id || `c-${idx}`,
        nombre: p.nombre || fallback.nombre,
        descripcion: p.descripcion || fallback.descripcion,
        categoria: p.categoria || fallback.categoria,
        precioVenta: price,
        coverImage: cover,
        level: level,
        audience: audience,
        rating: p.rating || fallback.rating || 4.9,
        reviewsCount: p.reviewsCount || fallback.reviewsCount || 450,
        duration: p.duration || fallback.duration || "8 Semanas",
        lessonsCount: p.lessonsCount || fallback.lessonsCount || "36 Lecciones",
        tags: p.tags && p.tags.length > 0 ? p.tags : fallback.tags,
        levelLabel: customLevelLabel,
        audienceLabel: p.audienceLabel || fallback.audienceLabel,
        aiBadge: p.aiBadge || fallback.aiBadge,
        hasAiTutor: p.hasAiTutor !== undefined ? p.hasAiTutor : fallback.hasAiTutor,
        hasCefrCert: p.hasCefrCert !== undefined ? p.hasCefrCert : fallback.hasCefrCert,
        hasVoiceSim: p.hasVoiceSim !== undefined ? p.hasVoiceSim : fallback.hasVoiceSim,
        discountBadge: p.discountBadge || fallback.discountBadge || "50% OFF"
      };
    });
  }, [apiProducts]);

  // Filter and sort logic
  const filteredCourses = useMemo(() => {
    let result = [...allCourses];

    // Search filter
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.nombre?.toLowerCase().includes(q) ||
          c.descripcion?.toLowerCase().includes(q) ||
          c.categoria?.toLowerCase().includes(q) ||
          c.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Audience filter
    if (selectedAudience !== "all") {
      result = result.filter((c) => {
        const ca = (c.audience || "").toLowerCase();
        if (selectedAudience === "students") return ca === "students" || ca === "estudiantes";
        if (selectedAudience === "teachers") return ca === "teachers" || ca === "docentes";
        if (selectedAudience === "lectura") return ca === "lectura" || ca === "reading";
        if (selectedAudience === "professionals") return ca === "professionals" || ca === "profesionales";
        return ca === selectedAudience.toLowerCase();
      });
    }

    // CEFR Level filter
    if (selectedCefr) {
      result = result.filter(
        (c) =>
          (c.level || "").toLowerCase() === selectedCefr.toLowerCase() ||
          (c.levelLabel || "").toLowerCase().includes(selectedCefr.toLowerCase())
      );
    }

    // Specializations filter
    if (selectedSpecs.length > 0) {
      result = result.filter((c) => {
        const cat = (c.categoria || "").toLowerCase();
        const sub = (c.subcategoria || "").toLowerCase();
        return selectedSpecs.some(
          (spec) =>
            cat.includes(spec.toLowerCase()) ||
            sub.includes(spec.toLowerCase()) ||
            c.tags?.some((t) => t.toLowerCase().includes(spec.toLowerCase()))
        );
      });
    }

    // AI switches
    if (filterAiTutor) {
      result = result.filter((c) => c.hasAiTutor);
    }
    if (filterCefrCert) {
      result = result.filter((c) => c.hasCefrCert);
    }
    if (filterVoiceSim) {
      result = result.filter((c) => c.hasVoiceSim);
    }

    // Sorting
    if (sortOption === "populares") {
      result.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
    } else if (sortOption === "valorados") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortOption === "nivel-asc") {
      const order = { a1: 1, a2: 2, b1: 3, b2: 4, c1: 5, c2: 6 };
      result.sort((a, b) => (order[a.level] || 99) - (order[b.level] || 99));
    } else if (sortOption === "precio-asc") {
      result.sort((a, b) => a.precioVenta - b.precioVenta);
    } else if (sortOption === "precio-desc") {
      result.sort((a, b) => b.precioVenta - a.precioVenta);
    } else if (sortOption === "novedades") {
      result.reverse();
    }

    return result;
  }, [
    allCourses,
    debouncedSearch,
    selectedAudience,
    selectedCefr,
    selectedSpecs,
    filterAiTutor,
    filterCefrCert,
    filterVoiceSim,
    sortOption
  ]);

  const dynamicSpecs = useMemo(() => {
    const fromCourses = allCourses
      .map((c) => c.categoria)
      .filter((cat) => cat && typeof cat === "string" && cat.trim() !== "");
    return Array.from(new Set([...SPECIALIZATIONS_LIST, ...fromCourses]));
  }, [allCourses]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / itemsPerPage));
  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCourses.slice(start, start + itemsPerPage);
  }, [filteredCourses, currentPage]);

  // Handle Like
  const handleToggleLike = async (e, courseId) => {
    e.preventDefault();
    e.stopPropagation();

    const isLiked = likedProducts.includes(courseId);
    const updated = isLiked
      ? likedProducts.filter((id) => id !== courseId)
      : [...likedProducts, courseId];

    setLikedProducts(updated);
    try {
      localStorage.setItem("ai_liked_products", JSON.stringify(updated));
      await axios.patch(`${API_URL}/products/${courseId}/like`, { isIncrement: !isLiked });
    } catch {
      // Keep UI state intact
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedAudience("all");
    setSelectedCefr("");
    setSelectedSpecs([]);
    setFilterAiTutor(false);
    setFilterCefrCert(false);
    setFilterVoiceSim(false);
    setSortOption("populares");
    setCurrentPage(1);
  };

  // Handle Quick Audio Demo
  const handlePlayAudioDemo = (course) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        `Welcome to ${course.nombre}. Practice your English pronunciation and acoustic accuracy with our instant AI coach.`
      );
      utterance.lang = "en-US";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }

    Swal.fire({
      title: "Audio Demo Activado",
      html: `
        <div class="text-left text-sm text-[#ccc3d8] space-y-2 mt-2">
          <p class="font-bold text-white">${course.nombre}</p>
          <p>Escuchando pronunciación de muestra con acento nativo y retroalimentación fonética sintética.</p>
          <div class="p-3 rounded-xl bg-[#221d2f] border border-white/10 text-xs font-mono text-[#7bd0ff]">
            "Welcome to ${course.nombre}. Practice your spoken English with instant acoustic feedback."
          </div>
        </div>
      `,
      icon: "info",
      background: "#1e192b",
      color: "#e8def9",
      confirmButtonColor: "#7c3aed",
      confirmButtonText: "Entendido",
      showCancelButton: true,
      cancelButtonText: "Ver Programa Completo",
      cancelButtonColor: "#373246"
    }).then((res) => {
      if (res.isDismissed && res.dismiss === Swal.DismissReason.cancel) {
        navigate(`/product/${course.id}`);
      }
    });
  };

  // Quick Enroll / Add to Cart
  const handleQuickEnroll = (course) => {
    dispatch(
      Add({
        ...course,
        image: course.coverImage,
        precioVenta: course.precioVenta
      })
    );

    Swal.fire({
      title: "¡Inscripción agregada!",
      text: `${course.nombre} ha sido agregado a tu carrito.`,
      icon: "success",
      background: "#1e192b",
      color: "#e8def9",
      confirmButtonColor: "#7c3aed",
      confirmButtonText: "Ir al Carrito",
      showCancelButton: true,
      cancelButtonText: "Seguir explorando",
      cancelButtonColor: "#373246"
    }).then((res) => {
      if (res.isConfirmed) {
        navigate("/cart");
      }
    });
  };

  // Format Price
  const formatPrice = (p) => `$${Number(p || 0).toLocaleString("en-US")}`;

  return (
    <div className="min-h-screen bg-background font-sans text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container relative overflow-x-hidden pt-24 sm:pt-36 pb-20 sm:pb-24">
      {/* Glows decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-24 left-1/3 w-[680px] h-[380px] bg-bloom-800/45 rounded-full blur-[120px] blob-wander-a"></div>
        <div className="absolute top-[420px] -right-24 w-[520px] h-[520px] bg-primary-container/30 rounded-full blur-[120px] blob-wander-b"></div>
        <div className="absolute top-[980px] -left-24 w-[560px] h-[560px] bg-bloom-700/35 rounded-full blur-[130px] blob-wander-c"></div>
        <div className="absolute top-[260px] left-16 w-[420px] h-[360px] bg-bloom-900/60 rounded-full blur-[100px] blob-wander-d"></div>
      </div>

      {/* ======================================================== */}
      {/* 1. ENCABEZADO HERO DEL CATÁLOGO */}
      {/* ======================================================== */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-2 pb-8 sm:pb-10 w-full flex flex-col items-center text-center">
        {/* Badge superior de píldora */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-surface-container-high/70 backdrop-blur-md shadow-sm mb-4 sm:mb-5 border border-white/5"
        >
          <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse shadow-[0_0_8px_rgba(123,208,255,0.8)]"></span>
          <span className="text-[10px] sm:text-[11px] font-bold tracking-widest text-primary uppercase">
            <EditableText textKey="products_badge" defaultText="CATÁLOGO OFICIAL • ENGLISH BLOOM ACADEMY" section="PRODUCTS" />
          </span>
        </motion.div>

        {/* Título Impactante */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-extrabold text-on-surface max-w-4xl tracking-tight leading-[1.18] sm:leading-[1.12] mb-3 sm:mb-4"
        >
          Domina el Inglés con{" "}
          <span className="bg-gradient-to-r from-primary via-primary-fixed to-tertiary bg-clip-text text-transparent">
            Programas Certificados
          </span>{" "}
          &amp; Práctica con Tutor IA
        </motion.h1>

        {/* Subtítulo explicativo */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-base md:text-lg text-on-surface-variant max-w-2xl mb-8 leading-relaxed"
        >
          <EditableText
            textKey="products_subtitle"
            defaultText="Cursos inmersivos diseñados para estudiantes universitarios, profesionales y docentes. Selecciona tu nivel y entrena tu fluidez 24/7."
            section="PRODUCTS"
          />
        </motion.p>

        {/* Barra de Búsqueda Prominente */}
        <div className="w-full max-w-3xl relative mb-4">
          <div className="relative flex items-center bg-surface-container-low rounded-full shadow-[0_0_28px_rgba(124,58,237,0.22)] focus-within:shadow-[0_0_36px_rgba(139,92,246,0.45)] border border-white/5 transition-all duration-300">
            <span className="material-symbols-outlined text-primary text-[24px] pl-5 pr-3 select-none">
              search
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por habilidad, examen (IELTS, TOEFL), tema o palabra clave..."
              className="w-full py-4 bg-transparent text-sm sm:text-base text-on-surface placeholder:text-outline focus:outline-none pr-28"
            />
            <div className="absolute right-3 flex items-center gap-1.5">
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  title="Borrar texto"
                  className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-full hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant bg-surface-container-high rounded-full select-none shadow-inner border border-white/5">
                <span className="text-[9px]">Ctrl</span>+<span>K</span>
              </kbd>
            </div>
          </div>
        </div>

        {/* Píldoras de búsqueda rápida */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 max-w-3xl">
          <span className="text-xs text-on-surface-variant mr-1 font-medium">Sugerencias:</span>
          {SUGGESTIONS.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => setSearch(sug)}
              className="text-xs px-3.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary border border-white/5 transition-all"
            >
              {sug}
            </button>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. BARRA DE CONTROL DE VISTAS Y RESUMEN */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 w-full pb-6">
        <div className="bg-surface-container-low/90 backdrop-blur-md rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm border border-white/5">
          {/* Contador y Filtros Activos */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 pr-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-xs sm:text-sm text-on-surface font-bold">
                Mostrando{" "}
                <span className="text-primary font-extrabold">{filteredCourses.length}</span>{" "}
                cursos disponibles
              </span>
            </div>

            <div className="hidden sm:block h-4 w-[1px] bg-outline-variant/40"></div>

            {/* Píldoras activas removibles */}
            <div className="flex flex-wrap items-center gap-2">
              {selectedCefr && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface text-xs border border-white/5">
                  <span>
                    Nivel: <strong className="text-secondary uppercase">{selectedCefr}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedCefr("")}
                    className="hover:text-error text-on-surface-variant transition-colors flex items-center"
                  >
                    <span className="material-symbols-outlined text-[15px]">close</span>
                  </button>
                </div>
              )}

              {selectedAudience !== "all" && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface text-xs border border-white/5">
                  <span>
                    Audiencia:{" "}
                    <strong className="text-secondary capitalize">
                      {AUDIENCES.find((a) => a.key === selectedAudience)?.label || selectedAudience}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedAudience("all")}
                    className="hover:text-error text-on-surface-variant transition-colors flex items-center"
                  >
                    <span className="material-symbols-outlined text-[15px]">close</span>
                  </button>
                </div>
              )}

              {filterAiTutor && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container/30 text-on-primary-container text-xs shadow-[0_0_10px_rgba(124,58,237,0.3)] border border-primary/20">
                  <span className="material-symbols-outlined text-[14px] text-tertiary">smart_toy</span>
                  <span>Con Tutor IA</span>
                  <button
                    type="button"
                    onClick={() => setFilterAiTutor(false)}
                    className="hover:text-error text-on-surface-variant transition-colors flex items-center"
                  >
                    <span className="material-symbols-outlined text-[15px]">close</span>
                  </button>
                </div>
              )}

              {/* Botón Filtros en Mobile (Opcional - Sidebar visible al lado izquierdo) */}
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className="hidden inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-container text-white text-xs font-bold"
              >
                <span className="material-symbols-outlined text-[16px]">tune</span>
                <span>Filtros ({selectedSpecs.length + (selectedCefr ? 1 : 0)})</span>
              </button>
            </div>
          </div>

          {/* Selector de Ordenación y Toggle de Vista */}
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="sortSelect" className="text-xs text-on-surface-variant hidden lg:inline font-semibold">
                Ordenar:
              </label>
              <div className="relative">
                <select
                  id="sortSelect"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="appearance-none bg-surface-container text-on-surface text-xs font-semibold rounded-full pl-4 pr-9 py-2 cursor-pointer focus:outline-none focus:bg-surface-container-high transition-colors border border-white/5"
                >
                  <option value="populares">Más populares</option>
                  <option value="valorados">Mejor valorados</option>
                  <option value="nivel-asc">Nivel: Menor a Mayor</option>
                  <option value="precio-asc">Precio: Menor a Mayor</option>
                  <option value="precio-desc">Precio: Mayor a Menor</option>
                  <option value="novedades">Novedades</option>
                </select>
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            <div className="h-5 w-[1px] bg-outline-variant/40"></div>

            {/* Toggle Grid / Lista */}
            <div className="flex items-center bg-surface-container rounded-full p-1 border border-white/5">
              <button
                type="button"
                id="viewGridBtn"
                onClick={() => setViewMode("grid")}
                title="Vista Cuadrícula"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  viewMode === "grid"
                    ? "bg-primary-container text-on-primary-container shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
              </button>
              <button
                type="button"
                id="viewListBtn"
                onClick={() => setViewMode("list")}
                title="Vista Lista"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  viewMode === "list"
                    ? "bg-primary-container text-on-primary-container shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">view_list</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. DISPOSICIÓN A DOS COLUMNAS (SIDEBAR + GRID DE CURSOS) */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-12 w-full pb-16">
        <div className="w-full grid grid-cols-12 gap-2 sm:gap-4 lg:gap-8 items-start">
          {/* ================= A. SIDEBAR IZQUIERDO DE FILTROS ================= */}
          <aside className="col-span-3 w-full bg-surface-container-low rounded-xl sm:rounded-2xl p-2 sm:p-4 lg:p-6 shadow-sm border border-white/5 sticky top-20 sm:top-28 flex flex-col gap-2.5 sm:gap-4 lg:gap-6">
            {/* Cabecera del filtro */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-1.5 sm:pb-3 border-b border-white/5 gap-1">
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="material-symbols-outlined text-primary text-[16px] sm:text-[20px]">tune</span>
                <h2 className="text-xs sm:text-base font-bold text-on-surface">Filtros</h2>
              </div>
              <button
                type="button"
                id="resetFiltersBtn"
                onClick={handleResetFilters}
                className="text-[10.5px] sm:text-xs font-semibold text-secondary hover:text-primary transition-colors cursor-pointer"
              >
                Limpiar todo
              </button>
            </div>

            {/* FILTRO 1: Dirigido a (Audiencia) */}
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-bold tracking-wider text-outline uppercase">
                1. Audiencia Objetivo
              </span>
              <div className="flex flex-col gap-1.5" id="audienceGroup">
                {AUDIENCES.map((aud) => {
                  const count =
                    aud.key === "all"
                      ? allCourses.length
                      : allCourses.filter((c) => {
                          const ca = (c.audience || "").toLowerCase();
                          if (aud.key === "students") return ca === "students" || ca === "estudiantes";
                          if (aud.key === "teachers") return ca === "teachers" || ca === "docentes";
                          if (aud.key === "lectura") return ca === "lectura" || ca === "reading";
                          if (aud.key === "professionals") return ca === "professionals" || ca === "profesionales";
                          return ca === aud.key;
                        }).length;
                  const isSelected = selectedAudience === aud.key;

                  return (
                    <label
                      key={aud.key}
                      onClick={() => {
                        setSelectedAudience(aud.key);
                        setCurrentPage(1);
                      }}
                      className={`flex items-center justify-between p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-surface-container-high text-on-surface font-semibold"
                          : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                        <input
                          type="radio"
                          name="audience"
                          value={aud.key}
                          checked={isSelected}
                          onChange={() => {}}
                          className="accent-primary-container w-3.5 h-3.5 sm:w-4 sm:h-4 cursor-pointer shrink-0"
                        />
                        <span className="text-[10.5px] sm:text-sm truncate">
                          {aud.icon ? `${aud.icon} ` : ""}
                          {aud.label}
                        </span>
                      </div>
                      <span className="text-[9.5px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-surface text-on-surface-variant border border-white/5 shrink-0 ml-1">
                        {count}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="h-[1px] w-full bg-surface-container-highest"></div>

            {/* FILTRO 2: Nivel CEFR */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider text-outline uppercase">
                  2. Nivel CEFR
                </span>
                <span className="text-[11px] text-tertiary font-semibold">Estándar Europeo</span>
              </div>
              <div className="grid grid-cols-2 gap-2" id="cefrPillsGroup">
                {CEFR_LEVELS.map((lvl) => {
                  const isActive = selectedCefr === lvl.key;
                  return (
                    <button
                      key={lvl.key}
                      type="button"
                      onClick={() => {
                        setSelectedCefr((prev) => (prev === lvl.key ? "" : lvl.key));
                        setCurrentPage(1);
                      }}
                      className={`text-left p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl transition-all flex flex-col ${
                        isActive
                          ? "bg-primary-container text-on-primary-container shadow-[0_0_16px_rgba(124,58,237,0.4)]"
                          : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs sm:text-sm font-bold text-on-surface">{lvl.label}</span>
                        {isActive && (
                          <span className="material-symbols-outlined text-[12px] sm:text-[14px]">check_circle</span>
                        )}
                      </div>
                      <span
                        className={`text-[8px] sm:text-[11px] hidden sm:inline ${
                          isActive ? "text-on-primary-container/80" : "text-outline"
                        }`}
                      >
                        {lvl.subtitle}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Test Rápido link brillante */}
              <button
                type="button"
                onClick={() => navigate("/pronunciation")}
                className="mt-1 flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-secondary-container/40 to-primary-container/30 hover:to-primary-container/60 transition-all text-on-surface shadow-sm border border-white/5"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px]">psychology</span>
                  <span className="text-xs font-semibold">Test con IA (5 min)</span>
                </div>
                <span className="material-symbols-outlined text-secondary text-[18px]">
                  arrow_forward
                </span>
              </button>
            </div>

            <div className="h-[1px] w-full bg-surface-container-highest"></div>

            {/* FILTRO 3: Temáticas & Especializaciones */}
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-bold tracking-wider text-outline uppercase">
                3. Especializaciones
              </span>
              <div className="flex flex-col gap-2">
                {dynamicSpecs.map((spec) => {
                  const isChecked = selectedSpecs.includes(spec);
                  const count = allCourses.filter(
                    (c) =>
                      c.categoria?.toLowerCase().includes(spec.toLowerCase()) ||
                      c.subcategoria?.toLowerCase().includes(spec.toLowerCase()) ||
                      c.tags?.some((t) => t.toLowerCase().includes(spec.toLowerCase()))
                  ).length;

                  return (
                    <label
                      key={spec}
                      className="flex items-center justify-between text-[10.5px] sm:text-xs text-on-surface-variant hover:text-on-surface cursor-pointer select-none py-0.5 sm:py-1"
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setSelectedSpecs((prev) =>
                              prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
                            );
                            setCurrentPage(1);
                          }}
                          className="accent-primary-container rounded w-3.5 h-3.5 sm:w-4 sm:h-4 bg-surface-container cursor-pointer shrink-0"
                        />
                        <span className="truncate">{spec}</span>
                      </div>
                      <span className="text-[9.5px] sm:text-[11px] text-outline ml-1 shrink-0">({count})</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="h-[1px] w-full bg-surface-container-highest"></div>

            {/* FILTRO 4: Modalidad y Características IA */}
            <div className="flex flex-col gap-3.5">
              <span className="text-[11px] font-bold tracking-wider text-outline uppercase">
                4. Módulos &amp; Tecnología IA
              </span>

              {/* Switch 1: Tutor IA 24/7 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">graphic_eq</span>
                  <span className="text-xs text-on-surface font-medium">Tutor IA 24/7</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterAiTutor}
                    onChange={(e) => {
                      setFilterAiTutor(e.target.checked);
                      setCurrentPage(1);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-on-primary-container after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container shadow-inner"></div>
                </label>
              </div>

              {/* Switch 2: Certificado CEFR */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-[18px]">verified</span>
                  <span className="text-xs text-on-surface font-medium">Certificado CEFR</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterCefrCert}
                    onChange={(e) => {
                      setFilterCefrCert(e.target.checked);
                      setCurrentPage(1);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-on-primary-container after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container shadow-inner"></div>
                </label>
              </div>

              {/* Switch 3: Simulaciones de Voz */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[18px]">
                    record_voice_over
                  </span>
                  <span className="text-xs text-on-surface font-medium">Simulaciones de Voz</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterVoiceSim}
                    onChange={(e) => {
                      setFilterVoiceSim(e.target.checked);
                      setCurrentPage(1);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-on-surface-variant after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container shadow-inner"></div>
                </label>
              </div>
            </div>
          </aside>

          {/* ================= B. ÁREA PRINCIPAL: GRID DE TARJETAS DE CURSOS ================= */}
          <main className="col-span-9 w-full flex flex-col gap-3 sm:gap-6">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 lg:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-52 sm:h-72 md:h-96 rounded-xl sm:rounded-2xl bg-surface-container-low border border-white/5 animate-pulse"
                  ></div>
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="py-20 text-center bg-surface-container-low rounded-2xl border border-white/5 p-8 shadow-sm">
                <div className="text-5xl mb-4">📚</div>
                <h3 className="text-lg font-bold text-on-surface mb-2">
                  No se encontraron cursos para esta búsqueda
                </h3>
                <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">
                  Intenta cambiar los filtros seleccionados, borrar la palabra clave o restablecer las opciones.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-6 py-2.5 rounded-full bg-primary-container text-white text-xs font-bold shadow-md hover:bg-primary transition-all"
                >
                  Restablecer Filtros
                </button>
              </div>
            ) : (
              <div
                id="courseCardsGrid"
                data-cms-locked="true"
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 lg:gap-6"
                    : "flex flex-col gap-5"
                }
              >
                <AnimatePresence>
                  {paginatedCourses.map((course, idx) => {
                    const isLiked = likedProducts.includes(course.id);
                    return (
                      <motion.article
                        key={course.id || idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, delay: idx * 0.05 }}
                        onClick={() => navigate(`/product/${course.id}`)}
                        className={`group cursor-pointer bg-surface-container-low hover:bg-surface-container rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-[0_12px_36px_rgba(124,58,237,0.22)] border border-white/5 hover:border-primary/30 transition-all duration-300 flex ${
                          viewMode === "grid" ? "flex-col w-full h-full" : "flex-col md:flex-row w-full"
                        }`}
                      >
                        {/* Media Container con Badges Flotantes */}
                        <div
                          className={`relative overflow-hidden bg-surface-container-high ${
                            viewMode === "grid" ? "h-32 sm:h-36 md:h-48 w-full" : "h-52 md:w-72 shrink-0"
                          }`}
                        >
                          <img
                            src={optimizeImage(course.coverImage)}
                            alt={course.nombre}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/20 to-transparent"></div>

                          {/* Badges Superiores Flotantes */}
                          <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 flex flex-wrap gap-1 z-10">
                            <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary-container text-[9.5px] sm:text-[10px] tracking-wide font-bold shadow-md">
                              {course.levelLabel || "B1 → C1"}
                            </span>
                            <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-surface/80 backdrop-blur-md text-on-surface text-[10px] font-semibold border border-white/10">
                              {course.audienceLabel || "Profesionales"}
                            </span>
                          </div>

                          <div className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 flex items-center gap-1 z-10">
                            {course.hasAiTutor && (
                              <span className="hidden sm:flex px-2 py-0.5 rounded-full bg-tertiary-container/90 text-on-tertiary-container backdrop-blur-md text-[10px] font-bold items-center gap-1 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
                                {course.aiBadge || "Tutor IA 24/7"}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => handleToggleLike(e, course.id)}
                              className={`p-1 sm:p-1.5 rounded-full backdrop-blur-md transition-colors ${
                                isLiked
                                  ? "bg-primary-container text-white"
                                  : "bg-surface/80 text-on-surface-variant hover:text-primary"
                              }`}
                              title={isLiked ? "Quitar de favoritos" : "Guardar en favoritos"}
                            >
                              <span
                                className="material-symbols-outlined text-[14px] sm:text-[15px]"
                                style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}
                              >
                                favorite
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Contenido del Card */}
                        <div className="p-2.5 sm:p-3 md:p-5 flex flex-col flex-1 justify-between gap-2 sm:gap-3 md:gap-4">
                          <div className="flex flex-col gap-1.5 sm:gap-2">
                            {/* Métricas & Rating */}
                            <div className="flex items-center justify-between text-xs text-on-surface-variant">
                              <div className="flex items-center gap-1 sm:gap-1 text-primary">
                                <span
                                  className="material-symbols-outlined text-[14px] sm:text-[16px]"
                                  style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                  star
                                </span>
                                <span className="font-bold text-[11px] sm:text-xs text-on-surface">{course.rating || 4.9}</span>
                                <span className="text-outline text-[8px] sm:text-[11px] hidden sm:inline">
                                  ({course.reviewsCount || 450})
                                </span>
                              </div>
                              <div className="hidden sm:flex items-center gap-2 text-[11px] text-outline font-medium">
                                <span>{course.duration || "8 Semanas"}</span>
                                <span>•</span>
                                <span>{course.lessonsCount || "36 Lecciones"}</span>
                              </div>
                            </div>

                            {/* Título */}
                            <Link
                              to={`/product/${course.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="block group-hover:text-primary"
                            >
                              <h3 className="text-xs sm:text-xs md:text-base font-bold text-on-surface group-hover:text-primary transition-colors leading-snug line-clamp-2 min-h-[2.75em]">
                                {course.nombre}
                              </h3>
                            </Link>

                            {/* Descripción */}
                            <p className="text-base sm:text-lg text-on-surface-variant font-medium line-clamp-3 leading-relaxed min-h-[4.875em]">
                              {course.descripcion}
                            </p>

                            {/* Tags de Habilidades */}
                            <div className="hidden md:flex flex-nowrap gap-1.5 pt-1 h-7 overflow-hidden">
                              {course.tags &&
                                course.tags.slice(0, 3).map((tag, tIdx) => (
                                  <span
                                    key={tIdx}
                                    className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant text-[10px] font-semibold border border-white/5 whitespace-nowrap shrink-0"
                                  >
                                    {tag}
                                  </span>
                                ))}
                            </div>
                          </div>

                          {/* Footer de Precios y Acciones */}
                          <div className="pt-2 sm:pt-3 border-t border-white/5 flex flex-col gap-2 sm:gap-3">
                            <div className="flex items-baseline justify-between">
                              <div>
                                <span className="text-sm sm:text-base md:text-xl font-extrabold text-on-surface tracking-tight">
                                  {formatPrice(course.precioVenta)}{" "}
                                  <span className="text-[10px] sm:text-[11px] font-normal text-outline">USD</span>
                                </span>
                                {course.originalPrice && (
                                  <span className="hidden sm:inline text-xs text-outline line-through ml-1.5">
                                    ${course.originalPrice} USD
                                  </span>
                                )}
                              </div>
                              {course.discountBadge && (
                                <span className="hidden sm:inline px-2 py-0.5 rounded bg-secondary-container/40 text-on-secondary-container text-[11px] font-bold">
                                  {course.discountBadge}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlayAudioDemo(course);
                                }}
                                className="w-full py-1.5 sm:py-2.5 px-1.5 sm:px-3 rounded-lg sm:rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface text-[10.5px] sm:text-xs font-semibold transition-all text-center flex items-center justify-center gap-1 sm:gap-1.5 border border-white/5 truncate"
                              >
                                <span className="material-symbols-outlined text-[13px] sm:text-[15px] text-tertiary">
                                  volume_up
                                </span>
                                <span>Demo</span>
                              </button>
                              <Link
                                to={`/product/${course.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full py-1.5 sm:py-2.5 px-1.5 sm:px-3 rounded-lg sm:rounded-full bg-primary-container hover:bg-primary-container/90 text-on-primary-container text-[10.5px] sm:text-xs font-bold shadow-[0_0_16px_rgba(124,58,237,0.4)] transition-all text-center flex items-center justify-center gap-1 sm:gap-1 truncate"
                              >
                                <span className="hidden sm:inline">Ver Detalle</span>
                                <span className="sm:hidden">Ver</span>
                                <span className="material-symbols-outlined text-[12px] sm:text-[14px]">
                                  arrow_forward
                                </span>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {/* 4. Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high text-on-surface-variant disabled:opacity-40 transition-colors border border-white/5"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>

                {[...Array(totalPages)].map((_, i) => {
                  const pNum = i + 1;
                  const isActive = currentPage === pNum;
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all border border-white/5 ${
                        isActive
                          ? "bg-primary-container text-on-primary-container shadow-[0_0_14px_rgba(124,58,237,0.5)]"
                          : "bg-surface-container hover:bg-surface-container-high text-on-surface"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high text-on-surface-variant disabled:opacity-40 transition-colors border border-white/5"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>
            )}
          </main>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. BANNER INFERIOR: CTA ORIENTACIÓN PERSONALIZADA */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 w-full pb-10">
        <div className="relative rounded-3xl bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-low p-8 md:p-12 overflow-hidden shadow-xl border border-white/5">
          {/* Decoración luminosa */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary-container/20 rounded-full blur-[90px] pointer-events-none"></div>
          <div className="absolute -left-16 -top-16 w-64 h-64 bg-tertiary-container/15 rounded-full blur-[80px] pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Textos e Icono */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 max-w-3xl">
              <div className="w-16 h-16 rounded-2xl bg-primary-container/30 flex items-center justify-center text-primary shrink-0 shadow-[0_0_24px_rgba(124,58,237,0.35)] border border-primary/20">
                <span className="material-symbols-outlined text-[36px]">psychology</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 self-center sm:self-start">
                  <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                  <span className="text-[11px] font-bold tracking-widest text-secondary uppercase">
                    Diagnóstico Adaptativo con IA
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl text-on-surface font-extrabold leading-tight">
                  ¿No estás seguro de cuál es tu nivel exacto?
                </h3>
                <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl leading-relaxed">
                  Realiza nuestro test diagnóstico con Tutor IA en 3 minutos. Evaluaremos tu comprensión
                  auditiva, riqueza léxica y fluidez para recomendarte una ruta de estudio personalizada.
                </p>
              </div>
            </div>

            {/* Botón CTA */}
            <div className="shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate("/pronunciation")}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-primary-container to-secondary-container hover:from-primary-container/90 hover:to-secondary-container/90 text-on-primary-container text-sm sm:text-base font-bold shadow-[0_0_30px_rgba(124,58,237,0.45)] hover:shadow-[0_0_40px_rgba(124,58,237,0.65)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
              >
                <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
                <span>Iniciar Test de Diagnóstico Gratuito</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}