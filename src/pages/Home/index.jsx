import React, { useState, useEffect, useRef, useMemo, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../../components/Footer/Footer.jsx";
import { motion, AnimatePresence } from "framer-motion";
import heroVideo from "../../images/fondo.mp4";
import { useTypewriter } from "../../hooks/useTypewriter.js";
import CmsContext from "../../store/CmsContext.jsx";

const HERO_TYPEWRITER_PHRASES = [
  "Habla con Fluidez",
  "Domina el Speaking",
  "Practica con IA 24/7",
  "Alcanza tus Metas",
];

const HERO_TYPEWRITER_CONFIG = {
  typingSpeed: 80,
  deletingSpeed: 50,
  pauseTime: 1500,
};

// Componente aislado para que el efecto máquina de escribir no re-renderice toda la página Home en cada letra
const HeroTypewriterText = React.memo(({ phrases }) => {
  const typedHeroText = useTypewriter(phrases, HERO_TYPEWRITER_CONFIG);
  return (
    <span
      data-cms-typewriter-key="home_hero_typewriter_phrases"
      data-cms-typewriter-default={JSON.stringify(HERO_TYPEWRITER_PHRASES)}
      className="inline-block min-h-[1.2em] align-bottom"
    >
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-bloom-300 via-bloom-200 to-white">
        {typedHeroText}
      </span>
      <span
        aria-hidden="true"
        className="inline-block ml-0.5 font-normal text-bloom-300 animate-pulse"
      >
        |
      </span>
    </span>
  );
});

// Columnas por breakpoint de cada grilla (deben coincidir con las clases basis-[...])
const STUDENT_GRID_COLS = { base: 2, sm: 2, lg: 4 };
const TEACHER_GRID_COLS = { base: 2, sm: 3, lg: 5 };
const READING_GRID_COLS = { base: 2, sm: 2, lg: 4 };

const DEFAULT_HIGHLIGHTS = ["Acceso inmediato", "Aprendé a tu ritmo", "Desde cualquier dispositivo"];

const useBreakpoint = () => {
  const getBp = () => {
    if (typeof window === "undefined") return "lg";
    if (window.innerWidth >= 1024) return "lg";
    if (window.innerWidth >= 640) return "sm";
    return "base";
  };
  const [bp, setBp] = useState(getBp);
  useEffect(() => {
    const onResize = () => setBp(getBp());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return bp;
};

// La card queda sola en la última fila → ocupa todo el ancho
const isLoneCard = (index, length, cols) => index === length - 1 && length % cols === 1;

const FeaturedPackCard = ({
  image,
  title,
  description,
  badge,
  metricLeft,
  metricLeftIcon,
  metricRight,
  highlights = [],
  link,
}) => {
  const navigate = useNavigate();
  return (
    <article
      onClick={() => link && navigate(link)}
      className="group cursor-pointer w-full basis-full bg-white hover:bg-slate-50/95 rounded-xl sm:rounded-2xl overflow-hidden p-3 sm:p-4 md:p-5 flex flex-col sm:flex-row gap-3 sm:gap-6 items-stretch transition-all duration-300 hover:-translate-y-1 shadow-lg hover:ring-2 hover:ring-bloom-300"
    >
      <div className="relative -mx-3 -mt-3 sm:m-0 sm:-ml-4 sm:-my-4 md:-ml-5 md:-my-5 sm:w-2/5 lg:w-1/3 h-40 sm:h-auto sm:min-h-[240px] overflow-hidden bg-slate-100 shrink-0">
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {badge}
      </div>

      <div className="flex-1 min-w-0 flex flex-col items-center justify-center text-center gap-2 sm:gap-3 py-1 sm:py-2">
        <h4 className="text-sm sm:text-lg md:text-xl font-extrabold text-slate-900 group-hover:text-bloom-700 transition-colors leading-snug">
          {title}
        </h4>
        <p className="text-[11px] sm:text-sm text-slate-600 leading-relaxed max-w-2xl whitespace-pre-line line-clamp-4">
          {description}
        </p>

        {highlights.length > 0 && (
          <ul className="flex flex-wrap justify-center gap-1.5 sm:gap-2 max-w-2xl">
            {highlights.map((h) => (
              <li
                key={h}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-bloom-50 text-bloom-700 text-[10px] sm:text-xs font-semibold border border-bloom-100"
              >
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                {h}
              </li>
            ))}
          </ul>
        )}

        {(metricLeft || metricRight) && (
          <div className="flex items-center justify-center gap-4 sm:gap-8 text-[10px] sm:text-xs pt-2 border-t border-slate-100 w-full max-w-md">
            {metricLeft && (
              <span className="flex items-center gap-1 text-slate-600">
                <span className="material-symbols-outlined text-[15px] text-bloom-600">{metricLeftIcon}</span>
                {metricLeft}
              </span>
            )}
            {metricRight && <span className="text-slate-900 font-bold">{metricRight}</span>}
          </div>
        )}

        <Link
          to={link}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:w-auto sm:min-w-[240px] py-2 sm:py-2.5 px-6 rounded-full bg-primary-container hover:bg-primary text-on-primary-container shadow-[0_0_20px_rgba(124,58,237,0.4)] text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1.5 hover:shadow-[0_0_18px_rgba(124,58,237,0.4)] transition-all"
        >
          <span>VER PACK</span>
          <span className="material-symbols-outlined text-[12px] sm:text-[16px] group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </Link>
      </div>
    </article>
  );
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3003";

const fallbackCourses = [
  // Cursos para Estudiantes
  {
    id: 12,
    title: "INGLÉS CONVERSACIONAL - FLUIDEZ RÁPIDA",
    audience: "estudiantes",
    badge: "Estudiantes & Fluidez",
    priceText: "Inscripción Abierta",
    description: "Método de inmersión total con situaciones de la vida real, reconocimiento de voz y más de 200 diálogos interactivos guiados para ganar confianza.",
    tags: ["Conversacional", "Role-play", "Fluidez Diaria"],
    instructor: "Camila Morales",
    duration: "5 Semanas",
    rating: "4.9",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800",
    link: "/product/12"
  },
  {
    id: 13,
    title: "PREPARACIÓN IELTS / TOEFL INTENSIVO",
    audience: "estudiantes",
    badge: "Exámenes Oficiales",
    priceText: "Inscripción Abierta",
    description: "Preparación estratégica para certificaciones internacionales. Práctica intensiva de Speaking, Listening, Reading y Writing con retroalimentación instantánea.",
    tags: ["IELTS", "TOEFL", "Certificación Universitaria"],
    instructor: "Arjun Mehta",
    duration: "8 Semanas",
    rating: "4.9",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800",
    link: "/product/13"
  },
  {
    id: 14,
    title: "INGLÉS PARA VIAJES Y TURISMO",
    audience: "estudiantes",
    badge: "Viajeros & Turismo",
    priceText: "Inscripción Abierta",
    description: "Vocabulario clave para viajar con seguridad: interacción en aeropuertos, reservas de hotel, situaciones imprevistas y restaurantes.",
    tags: ["Viajes", "Aeropuertos & Hoteles", "Turismo"],
    instructor: "Terrence Ward",
    duration: "4 Semanas",
    rating: "4.8",
    image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800",
    link: "/product/14"
  },

  // Cursos para Profesionales y Docentes
  {
    id: 15,
    title: "INGLÉS PARA NEGOCIOS Y ENTREVISTAS",
    audience: "profesionales",
    badge: "Profesionales & Corporate",
    priceText: "Cupos Limitados",
    description: "Vocabulario corporativo, preparación para entrevistas laborales en inglés, redacción de correos ejecutivos y dinámicas de presentaciones de negocios.",
    tags: ["Business English", "Entrevistas", "Presentaciones"],
    instructor: "David Miller",
    duration: "6 Semanas",
    rating: "5.0",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800",
    link: "/product/15"
  },
  {
    id: 16,
    title: "ENGLISH TEACHING & PEDAGOGÍA: PARA DOCENTES",
    audience: "profesionales",
    badge: "Especialización Docente",
    priceText: "Cupos Limitados",
    description: "Programa de actualización y perfeccionamiento docente: metodologías activas de enseñanza en inglés, fonética aplicada en el aula y herramientas de IA.",
    tags: ["Pedagogía Moderna", "Fonética Docente", "IA en Educación"],
    instructor: "Arjun Mehta",
    duration: "8 Semanas",
    rating: "5.0",
    image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800",
    link: "/product/16"
  },
  {
    id: 17,
    title: "ADVANCED CORPORATE COMMUNICATION & LEADERSHIP",
    audience: "profesionales",
    badge: "Liderazgo & Oratoria",
    priceText: "Inscripción Abierta",
    description: "Oratoria de alto impacto, comunicación estratégica para reuniones de directorio, persuasión ejecutiva y liderazgo en equipos multiculturales.",
    tags: ["Oratoria Ejecutiva", "Liderazgo", "Negociación"],
    instructor: "David Miller",
    duration: "6 Semanas",
    rating: "4.9",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800",
    link: "/product/17"
  },

  // Curso General (Apto para ambos)
  {
    id: 18,
    title: "CURSO VIP: MASTERCLASS DE INGLÉS COMPLETO",
    audience: "both",
    badge: "Programa Integral VIP",
    priceText: "Inscripción Abierta",
    description: "Domina la pronunciación, fluidez conversacional y gramática avanzada de principio a fin con soporte de inteligencia artificial las 24 horas.",
    tags: ["Speaking AI", "Pronunciación", "Gramática VIP"],
    instructor: "Camila Morales",
    duration: "10 Semanas",
    rating: "5.0",
    image: "https://images.unsplash.com/photo-1543269664-56d93c216ecc?w=800",
    link: "/product/18"
  }
];

const STUDENT_PACKS = [
  {
    id: "s1",
    title: "Practice English with Artificial Intelligence",
    description: "Conversá, recibí correcciones acústicas de pronunciación en tiempo real y mejorá tu fluidez diaria.",
    badge: "Tutor IA 24/7",
    badgeIcon: "smart_toy",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuALcQtxshsNY0076w8Ih8d6m1HFRrqU_QxpXHkh3OLxQJtAlmc7R-NgLItDZF3UCosqm0qjvyOu8HFN9rP9cxMUsAub6qbb9TcCFUmyRKwnwuJm1UxjPDxaGl2OhmO2MBrMSX5IsRqi_Gdrx0Jupq-Vd_B23J9ayUGqAqjJeHwRFEecgea7lkNdh6IHUx6Oy7QAwRuQyJHrSVQ4sty6cOA3wrEZySY2AQrIfgEcG-RUwxSi-9CVd7SVxA",
    metricLeft: "Voz y Chat",
    metricLeftIcon: "mic",
    metricRight: "99% Precisión",
    link: "/product/12"
  },
  {
    id: "s2",
    title: "Preparación para exámenes internacionales",
    description: "Modelos oficiales, simulacros cronometrados, estrategias y práctica interactiva para rendir con éxito.",
    badge: "Certificación",
    badgeIcon: "verified",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD1VbrHnKu37ALqnxHP7PghbrxbeMmOylSvUCoBMIoFBEXBT5EXw93FTKLosn7mQAMVC9GTMdco45VXMyp2oCGD3yVPLTSGfuJw4zRkUtnvChqg0rZI7_hbZRozmMVhi7KduP5MfBDuaUnGHnJXDDakTVAV1RX6EQnbSUdKoT5RK1PyxNsqRfZRxJVX7cKvmZNR2_Iz6lKVgY--56KeD1NHWWHiauj2XpHsVIMcFt8jKP8pY96zTZ7p4w",
    metricLeft: "IELTS • C1 • TOEFL",
    metricLeftIcon: "assignment",
    metricRight: "+12 Módulos",
    link: "/product/13"
  },
  {
    id: "s3",
    title: "Vocabulary Maps (todos los niveles)",
    description: "45 mapas mentales de vocabulario organizados temáticamente por campos semánticos y niveles de fluidez.",
    badge: "Recurso Visual",
    badgeIcon: "hub",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDmd-wf5TpE6c19roYwu-i6CHvg-ZloFfhmiDt4ISdfYnCtcgz2NNCquAKmarjYwnxAEZzQLIc4yYL7zZDlK7d-3Qbvz2zPW79of6WDpq_XZVeeKzPwtVI1ZzWfHIfHhUzQzBE5FHKS6Tq9R2Im1qo1IeLsBE9ohkbvn_Ha2vUizckOpVsUt62HvpcCDpq9Lnv4mhDz1zR58nxSaSpJXmPuMLWq0JynEpKhddNcfGpgBjVg48S9lO7bPQ",
    metricLeft: "45 Mapas",
    metricLeftIcon: "psychology",
    metricRight: "Flashcards Anki",
    link: "/product/14"
  },
  {
    id: "s4",
    title: "Grammar Maps (todos los niveles)",
    description: "46 mapas de gramática con explicaciones claras, tablas comparativas y ejercicios prácticos de aplicación real.",
    badge: "Interactivos",
    badgeIcon: "schema",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDrTnf6-08jY-SW_t3xgNqczyNJJdNW4fEKNw0sV8vD6HMES9hLasmlpJa1oNfIy2dR4Ssxm-u-8KOd88_ZkXqL-aYinKxhpsOVwEu9XxTryThntC2RW7lm6nDUHll7CahEOStedHBtFLfQZvdNjJa3NqXhqF7aTs4UsOafwcJGu-TyrPjx0fweCcDOeSVQ8G4R6fbhqf544hCBcfmY9rxYvBxrVlW4ywRdwjGWI9TSuD37ls1TcZMAPQ",
    metricLeft: "46 Guías",
    metricLeftIcon: "menu_book",
    metricRight: "PDF + Quizzes",
    link: "/product/15"
  }
];

const TEACHER_PACKS = [
  {
    id: "t1",
    title: "Jobs and Interviews",
    description: "Roleplays dinámicos, preguntas de entrevista real y vocabulario profesional para sesiones corporativas.",
    levelBadge: "B1 - C1",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAQGexTE_xKkw10iCvlP1Zc6EAycl1e6KQN5aJtNPI3GmQ7fV8yzWA8Da5kFvJ2uig3D6E8yAFYQmr_GzmbkwGeUfWXEeOBMa73gvori4SuaCsYk3OKES0JRBGeCGAhpWq_SNUaW8nZXpX6b0e1gbKfnG0p_DUWHB6CYzBG849Blf4b_IhTweMOsGfkY7yZCSE7CxrXvNmopAzk_4W0hhsIoyfO7b1KsUwnLuBFpW0E3ZNi2Eei5y97fA",
    link: "/product/15"
  },
  {
    id: "t2",
    title: "Environment & Our Planet",
    description: "Debates actuales sobre ecología, vocabulario especializado y hojas de actividades globales listas para debatir.",
    levelBadge: "A2 - B2",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAmCoVbRY1go5Vmb2g_iqqCxb0XPyZuH5CIVoLf017oH-Nniy0HF1a2YhFLazrKjCm9gYXmwIEzjCjCB6uRw2RLBUhOI9kXKUgj0IEos96UjbSme_kui5q1JRkn3cfVAZKX3Riy7Fo9LyHCZTpsshyX4WM2MJrOckSCb0Wf_ArSlmAgiaRRIJHPG5mz7JyN_aJ4wgDL-u2XvLcBuRnFP8lhxo6UrDE-expuYhxoyTk0TyOHbIMQWDl84w",
    link: "/product/14"
  },
  {
    id: "t3",
    title: "Speaking Scenarios",
    description: "15 situaciones de la vida real con disparadores de discusión guiados y soporte de rúbricas automáticas.",
    levelBadge: "15 Scenarios",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAxDcnLclI88y6Y2hBIXxadblAnSLOOT5lpELQQQ9xD7mfX6D1-fDe2sa_WNi9jt6DcbKR3p5f3A5KVlBefp1o2_VBNyxzt-otaD-oxYNILPyu0Hy5AWv51_43vIsnibyGyc9bdK62ePIAargojDE2g-pWK_gtyN4JZapPU231T9RSOoxirp9BYJJwxBv2eeDsfEWsZ6XcGnL2iM5NoEde2jXwvpuBxwpHYUXkRhp_EDFezQ__HGl57GA",
    link: "/product/12"
  },
  {
    id: "t4",
    title: "Grammar Maps (Docentes)",
    description: "46 mapas de gramática adaptados con notas del profesor, secuencias didácticas y respuestas explicadas.",
    levelBadge: "A1 to C1",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBtBhHB7wE-LQxPAKZGlu3IEuBgwia37NF0T4K_9fu0yAYRsscdUqB7aWwI9AQ4SlSETRQ_5LxhedE3KInsiyJFnNUqs3OJ7VTFUU33UCx8R1CoAsGPkDIsKUQnxNaTOYiFhVQVluUpMJ8KTNTBpf-Nw7XoM1Ag4X9ppb9u-q_kBJCpTyZI8aVu01MXgzU8e1uB7RAj4oEoX0mAEOlO3_K1e1Y6SdFvKNtAr-XJHY6ZV7xuhGfje-vddQ",
    link: "/product/16"
  },
  {
    id: "t5",
    title: "Vocabulary Maps (Aulas)",
    description: "45 mapas de vocabulario en alta definición diseñados especialmente para proyectar en pizarra interactiva o imprimir.",
    levelBadge: "A1 to C1",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDlwBRyK8_NDr3tJQLPB_vVeuHOvWeZRvdxnY7Vk-yCXwzlmRUKsbDP6rr-pPp_wuAOqIOWyny4Ejgt8C66hq-qemi3kQKGxZsP8CuUZc90GthpRN_qcVabJptPxSDgYajrOcy_tPLtyPvh0xYGIVww8OQRZ92OlQAuzakwHuTGbynAWcr67jvjZ9uw701cN8clRtAUovmbnoT_ho1KI-AfkVfZRA72lE1oXEaQaYeWSKhePkM4s2HY1g",
    link: "/product/16"
  }
];

const READING_PACKS = [
  {
    id: "r1",
    title: "THE LAST LETTER",
    description: "Una historia de amor, secretos de familia y una carta olvidada que lo cambia todo. Perfecta para adquirir fluidez narrativa.",
    isFree: true,
    levelBadge: "A2 - B1",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDp56S1Qi0icu9M8mhiL3mldSBschgVQuRFP38m3vjUxiq9RmNqmrffUqvqSFRxyVcPOHbqJacMMxjvlU3Wq14vRp6eZDko-XjxI1BhTItlAE_BRpZlW4QgQ1nrbKe8tykOEqrdrcpvg4OBqpp5C8HlJQryIY8HlsqvHGHdqAhBUNbWcemzr1j3IGA93vFNZ-UYpGMf8OYJFu_NXmb21VDzxUrBpOVnvHiIbDpDBu4ShM9AH-M6IM-FCg",
    audioTime: "28 mins",
    link: "/mis-cursos"
  },
  {
    id: "r2",
    title: "THE CROWN",
    description: "Ambición, intriga política, poder y traición en un relato apasionante que te atrapará desde la primera página.",
    isFree: true,
    levelBadge: "B1 - B2",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB3ZTXPPKxvoPluhu8k7LiLq4xbraRXTlqYzn8ZwSI_8hkT0ziL600IZSgBwkPIUabsZqtQ0HtvSGdzp7__NUqwry78CEI6O6Cqul5gSImPT8Relr1G4effY7kmHNX-8QhC5I6mgBIzb9llodsdOnNY3RtOgiWX36pDXlEGIV-K64Ve9i5gK_ftcnC3FAs1S6VTxCG-Y3kQ3jrmDR_NVNR7x0We-raW4ucQDqTD8qLiFdlC4P3TdOm94Q",
    audioTime: "42 mins",
    link: "/mis-cursos"
  },
  {
    id: "r3",
    title: "THE VANISHING CROWN",
    description: "Un enigma inexplicable en la realeza británica, un detective obstinado y pistas escondidas en cada diálogo.",
    isFree: true,
    levelBadge: "B2 - C1",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB3VUYw-GScRSrvP-Ch8ayFtq2iJ5-vDjR1moitGeFjCZwHFM5vAzG8btwpB5SM30USwvHpnxGaNq9Q5bSTHolnxxnyQrSwMcvR0pETznlfQLYGKDi_AYUbJd97NJUATDFHENKiSNmX-nunSN-WQ_RHel3rSypp121zqG-nzOpJlgB-OPuSJdB5pJLvxI3VojulSgK86CwU68vMznh_j0SzNAODg8ELt7LCupg_IiFm3U0z4nyV-GM0iA",
    audioTime: "35 mins",
    link: "/mis-cursos"
  },
  {
    id: "r4",
    title: "THE MYSTERY OF THE SILENT CLOCK",
    description: "A British Detective Story. Apasionante investigación ambientada en el Londres de 1888 con vocabulario de época contextualizado.",
    isFree: true,
    levelBadge: "B1 - B2",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC8JQdOpuddalI_gBRPZYnYKUsx-4ZYfH5HiM0b3FzUesvRm5uKGrvc_6JWGKqwh-OKE1Z57Bp_z8Ky71QNrN6T2O7hcxa4apjAT4YIIE6juMsUPFkfd87RePg_b6Hz1nxafrPd1A1Sh_a5-ty9-WS_Kc3smWGmOwKuT4Tlwczgu1Nn555XflRK8jZi6HmHX1RU1SyrHDAIi04Z9dAlrBrORN4cQvimZH4INiq1QD6WzeFOVhXlSHjWSw",
    audioTime: "50 mins",
    link: "/mis-cursos"
  }
];

const CATEGORY_PILLS = [
  { key: "all", label: "Todos los Destacados", targetId: null },
  { key: "estudiantes", label: "Para Estudiantes", targetId: "para-estudiantes" },
  { key: "docentes", label: "Para Docentes", targetId: "para-docentes" },
  { key: "reading", label: "Reading for Pleasure & Historias", targetId: "reading-for-pleasure" },
  { key: "examenes", label: "Preparación Exámenes", targetId: "para-estudiantes" }
];

const HOME = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAudience, setSelectedAudience] = useState("all");
  const [activeCategoryTab, setActiveCategoryTab] = useState("all");
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const cmsCtx = useContext(CmsContext);
  const heroTypewriterPhrases = useMemo(() => {
    const raw = cmsCtx?.texts?.home_hero_typewriter_phrases;
    if (!raw) return HERO_TYPEWRITER_PHRASES;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.map((s) => String(s || "").trim()).filter(Boolean);
        if (cleaned.length > 0) return cleaned;
      }
    } catch {
      const split = String(raw)
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      if (split.length > 0) return split;
    }
    return HERO_TYPEWRITER_PHRASES;
  }, [cmsCtx?.texts?.home_hero_typewriter_phrases]);
  const breakpoint = useBreakpoint();
  const studentCols = STUDENT_GRID_COLS[breakpoint];
  const teacherCols = TEACHER_GRID_COLS[breakpoint];
  const readingCols = READING_GRID_COLS[breakpoint];

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch((err) => {
        console.warn("Video autoplay postponed or prevented:", err);
      });
    }
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        if (Array.isArray(data)) {
          const valid = data.filter((p) => p.nombre && !p.nombre.toLowerCase().includes("impresora"));
          const infoproductos = valid.filter((p) => p.esInfoproducto);
          setCourses(infoproductos.length > 0 ? infoproductos : valid);
        }
      } catch (error) {
        console.error("Error al obtener cursos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const getCourseImage = (c, fallbackIndex = 0) => {
    let img = "";
    if (Array.isArray(c?.imagenes) && c.imagenes.length > 0) {
      const first = c.imagenes[0];
      img = typeof first === "string" ? first : (first?.url || first?.src || "");
    } else if (typeof c?.imagenes === "string" && c.imagenes.trim()) {
      try {
        const parsed = JSON.parse(c.imagenes);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const first = parsed[0];
          img = typeof first === "string" ? first : (first?.url || first?.src || "");
        }
      } catch {
        if (c.imagenes.startsWith("http")) img = c.imagenes;
      }
    }

    if (img && typeof img === "string" && img.trim() && !img.includes("undefined") && !img.includes("[object")) {
      return img;
    }

    const fallbacks = [
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800",
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800",
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800",
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800",
      "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800",
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800"
    ];
    return fallbacks[fallbackIndex % fallbacks.length];
  };

  const mapCourseToStudentPack = (c, index) => {
    const activitiesCount = Array.isArray(c.speakingActivities) ? c.speakingActivities.length : 0;
    const filesCount = Array.isArray(c.archivosInfoproducto) ? c.archivosInfoproducto.length : 0;
    const desc = c.descripcion
      ? c.descripcion.split("\n")[0]
      : "Recursos prácticos, interactivos y motivadores con tutor IA para aprender y mejorar tu fluidez a tu ritmo.";

    const price = c.precioVenta ?? c.variantes?.[0]?.precioAlPublico ?? c.precio;
    const priceFormatted = price !== undefined && Number(price) > 0
      ? `${Number(price).toLocaleString("es-AR")}`
      : "Acceso Inmediato";

    return {
      id: c.id,
      title: c.nombre,
      description: desc,
      badge: c.categoria || "Tutor IA 24/7",
      badgeIcon: activitiesCount > 0 ? "smart_toy" : "school",
      image: getCourseImage(c, index),
      metricLeft: activitiesCount > 0
        ? `${activitiesCount} Escenarios IA`
        : (filesCount > 0 ? `${filesCount} Archivos` : "Voz y Chat"),
      metricLeftIcon: activitiesCount > 0 ? "mic" : "assignment",
      metricRight: priceFormatted,
      fullDescription: c.descripcion || desc,
      highlights: [
        c.categoria,
        c.subcategoria,
        activitiesCount > 0 ? `${activitiesCount} actividades de speaking con IA` : null,
        filesCount > 0 ? `${filesCount} archivos descargables` : null,
      ].filter(Boolean),
      link: `/product/${c.id}`
    };
  };

  const mapCourseToTeacherPack = (c, index) => {
    const activitiesCount = Array.isArray(c.speakingActivities) ? c.speakingActivities.length : 0;
    const desc = c.descripcion
      ? c.descripcion.split("\n")[0]
      : "Materiales listos para usar en el aula o clases online que ahorran horas de preparación y potencian tus clases.";

    return {
      id: c.id,
      title: c.nombre,
      description: desc,
      levelBadge: c.subcategoria || (activitiesCount > 0 ? `${activitiesCount} Scenarios` : "Teacher Ready"),
      image: getCourseImage(c, index + 3),
      fullDescription: c.descripcion || desc,
      highlights: [
        c.categoria,
        activitiesCount > 0 ? `${activitiesCount} escenarios listos para el aula` : null,
      ].filter(Boolean),
      link: `/product/${c.id}`
    };
  };

  const mapCourseToReadingPack = (c, index) => {
    const activitiesCount = Array.isArray(c.speakingActivities) ? c.speakingActivities.length : 0;
    const desc = c.descripcion
      ? c.descripcion.split("\n")[0]
      : "Historias fascinantes para disfrutar de la lectura en inglés, enriquecer tu vocabulario natural y sumergirte en nuevos mundos.";

    const price = c.precioVenta ?? c.variantes?.[0]?.precioAlPublico ?? c.precio;
    const isFree = Number(price) === 0;

    return {
      id: c.id,
      title: c.nombre,
      description: desc,
      isFree,
      category: c.categoria || "Reading for Pleasure",
      levelBadge: c.subcategoria || "A2 - B2",
      image: getCourseImage(c, index + 4),
      audioTime: activitiesCount > 0 ? `${activitiesCount * 3} mins` : "Audio nativo",
      fullDescription: c.descripcion || desc,
      highlights: [c.categoria, "Audio nativo", "Glosario incluido"].filter(Boolean),
      link: `/product/${c.id}`
    };
  };

  const { studentPacksToDisplay, teacherPacksToDisplay, readingPacksToDisplay } = useMemo(() => {
    if (!courses || courses.length === 0) {
      return {
        studentPacksToDisplay: STUDENT_PACKS,
        teacherPacksToDisplay: TEACHER_PACKS,
        readingPacksToDisplay: READING_PACKS
      };
    }

    const readingList = [];
    const teacherList = [];
    const studentList = [];

    courses.forEach((c) => {
      const catLower = (c.categoria || "").toLowerCase();
      const audLower = (c.audience || "").toLowerCase();
      const nameLower = (c.nombre || "").toLowerCase();
      const descLower = (c.descripcion || "").toLowerCase();
      const combined = `${catLower} ${audLower} ${nameLower} ${descLower}`;

      // 1. Reading for Pleasure (categoría o audiencia de lectura)
      if (
        audLower === "lectura" ||
        catLower.includes("reading") ||
        catLower.includes("lectura") ||
        combined.includes("reading for pleasure") ||
        nameLower.includes("reading") ||
        nameLower.includes("audiobook") ||
        nameLower.includes("historia")
      ) {
        readingList.push(c);
        return;
      }

      // 2. Para Docentes (audiencia docentes o categoría docente/profesional)
      if (
        audLower === "docentes" ||
        audLower === "teachers" ||
        audLower === "profesionales" ||
        catLower.includes("docente") ||
        catLower.includes("profesor") ||
        catLower.includes("especialización docente") ||
        nameLower.includes("docente") ||
        nameLower.includes("teaching") ||
        nameLower.includes("negocios") ||
        nameLower.includes("corporate") ||
        nameLower.includes("entrevistas")
      ) {
        teacherList.push(c);
        return;
      }

      // 3. Para Estudiantes (por defecto o explícito)
      studentList.push(c);
    });

    return {
      studentPacksToDisplay: studentList.length > 0
        ? studentList.map(mapCourseToStudentPack)
        : STUDENT_PACKS,
      teacherPacksToDisplay: teacherList.length > 0
        ? teacherList.map(mapCourseToTeacherPack)
        : TEACHER_PACKS,
      readingPacksToDisplay: readingList.length > 0
        ? readingList.map(mapCourseToReadingPack)
        : READING_PACKS
    };
  }, [courses]);

  const determineAudience = (c) => {
    if (c.audience) {
      const aud = c.audience.toLowerCase();
      if (aud === "docentes" || aud === "teachers" || aud.includes("docente") || aud.includes("prof")) {
        return "profesionales";
      }
      if (aud === "estudiantes" || aud === "students" || aud.includes("estudiante")) {
        return "estudiantes";
      }
    }

    const text = (
      (c.nombre || "") + " " +
      (c.descripcion || "") + " " +
      (c.categoria || "")
    ).toLowerCase();

    const isProf = text.includes("negocio") ||
      text.includes("entrevista") ||
      text.includes("docente") ||
      text.includes("profesor") ||
      text.includes("enseñanza") ||
      text.includes("pedagog") ||
      text.includes("business") ||
      text.includes("corporate") ||
      text.includes("leadership") ||
      text.includes("profesional");

    const isStudent = text.includes("viaje") ||
      text.includes("turismo") ||
      text.includes("ielts") ||
      text.includes("toefl") ||
      text.includes("conversacional") ||
      text.includes("estudiante");

    if (isProf && !isStudent) return "profesionales";
    if (isStudent && !isProf) return "estudiantes";
    if (isProf) return "profesionales";
    if (text.includes("vip") || text.includes("masterclass")) return "both";
    return "estudiantes";
  };

  // Formatear cursos de la API o usar lista enriquecida de fallback
  const displayCourses = courses.length > 0
    ? courses.map((c, index) => {
      const imageUrl = c.imagenes && c.imagenes.length > 0
        ? (typeof c.imagenes[0] === 'string' ? c.imagenes[0] : (c.imagenes[0].url || ''))
        : fallbackCourses[index % fallbackCourses.length].image;

      const tags = (c.speakingActivities && c.speakingActivities.length > 0)
        ? c.speakingActivities.slice(0, 3).map((a) => a.title)
        : ["Speaking AI", "Conversacional", "Certificación"];

      const description = c.descripcion
        ? c.descripcion.split('\n')[0]
        : "Programa integral con práctica de voz en tiempo real y retroalimentación inteligente.";

      const priceText = c.precio
        ? `$${c.precio}`
        : (c.variantes?.[0]?.precioAlPublico ? `$${c.variantes[0].precioAlPublico}` : "Acceso Ilimitado");

      const instructors = ["Arjun Mehta", "David Miller", "Camila Morales", "Terrence Ward"];
      const instructor = instructors[index % instructors.length];
      const durations = ["8 Semanas", "6 Semanas", "5 Semanas", "10 Semanas"];
      const duration = durations[index % durations.length];
      const audience = determineAudience(c);

      return {
        id: c.id,
        title: c.nombre,
        audience,
        badge: c.categoria || (audience === 'profesionales' ? "Docentes & Profesionales" : "Estudiantes"),
        priceText,
        description,
        tags,
        instructor,
        duration,
        rating: "4.9",
        image: imageUrl,
        link: `/product/${c.id}`
      };
    })
    : fallbackCourses;

  // Filtrado reactivo según la pestaña seleccionada
  const filteredCourses = displayCourses.filter((course) => {
    if (selectedAudience === "all") return true;
    return course.audience === selectedAudience || course.audience === "both";
  });

  return (
    <div className="w-full min-h-screen bg-[#0c061a] text-white selection:bg-bloom-200 selection:text-bloom-900 font-sans">
      <main className="w-full bg-[#0c061a]">

        {/* BEGIN: HeroSection with Background Video and Rich Gradient */}
        <section className="relative z-10 w-full overflow-hidden isolate bg-[#0c061a] rounded-b-3xl sm:rounded-b-[2.5rem] pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24" data-purpose="hero-section">
          {/* Background Video with Gradient Overlay Filters */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              src={heroVideo || "/fondo.mp4"}
              className="w-full h-full object-cover object-center scale-105"
            >
              <source src="/fondo.mp4" type="video/mp4" />
              <source src={heroVideo} type="video/mp4" />
            </video>
            {/* Gradient Overlay Layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#090414]/90 via-[#1b0d38]/70 to-[#5b21b6]/45"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#090414]/85 via-[#130829]/45 to-transparent"></div>
          </div>

          <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 xl:px-16 relative z-10">
            <div className="grid grid-cols-12 gap-3 sm:gap-8 lg:gap-12 items-center">
              {/* Left Hero Content */}
              <motion.div
                className="col-span-7 sm:col-span-7 lg:col-span-7 space-y-3 sm:space-y-5 lg:space-y-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-white/10 border border-white/15 text-bloom-200 text-[10px] sm:text-xs font-semibold tracking-wide uppercase backdrop-blur-md">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-bloom-400 animate-pulse"></span>
                  English Bloom Academy • Cursos &amp; IA
                </div>

                <h1 className="text-xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-[64px] font-extrabold tracking-tight text-white leading-tight sm:leading-[1.08]">
                  <span>Aprende Inglés <br className="sm:hidden" />Real &amp;</span> <br className="hidden sm:inline" />
                  <HeroTypewriterText phrases={heroTypewriterPhrases} />
                </h1>

                <p className="text-slate-200 text-[11px] sm:text-base lg:text-lg leading-snug sm:leading-relaxed max-w-2xl font-normal">
                  Cursos prácticos y programas certificados para estudiantes, profesionales y docentes. Practica conversación 24/7 con nuestro tutor inteligente, perfecciona tu pronunciación y alcanza tus metas internacionales.
                </p>

                <div className="pt-1 sm:pt-2 flex flex-row items-center gap-2 sm:gap-4">
                  <a
                    className="inline-flex justify-center items-center px-3.5 sm:px-8 py-2 sm:py-3.5 rounded-full text-[10.5px] sm:text-sm font-semibold tracking-wide text-white bg-bloom-600 hover:bg-bloom-700 shadow-pill transition-all transform hover:-translate-y-0.5 text-center whitespace-nowrap"
                    href="#cursos"
                  >
                    Explorar Cursos
                  </a>
                  <a
                    className="inline-flex justify-center items-center px-3 sm:px-6 py-2 sm:py-3.5 rounded-full text-[10.5px] sm:text-sm font-semibold tracking-wide text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md shadow-soft transition-all text-center whitespace-nowrap"
                    href="#metodologia"
                  >
                    Ver Metodología &amp; IA
                  </a>
                </div>

                {/* Quick Metrics Trust Row */}
                <div className="pt-2.5 sm:pt-6 border-t border-white/15 grid grid-cols-3 gap-2 sm:gap-6 max-w-xl text-left">
                  <div>
                    <p className="text-base sm:text-2xl font-bold text-white">96%</p>
                    <p className="text-[9px] sm:text-xs text-slate-300 font-medium leading-tight">Aprobación de exámenes</p>
                  </div>
                  <div>
                    <p className="text-base sm:text-2xl font-bold text-white">4.9/5</p>
                    <p className="text-[9px] sm:text-xs text-slate-300 font-medium leading-tight">Valoración de alumnos</p>
                  </div>
                  <div>
                    <p className="text-base sm:text-2xl font-bold text-white">+1,500</p>
                    <p className="text-[9px] sm:text-xs text-slate-300 font-medium leading-tight">Estudiantes y Docentes</p>
                  </div>
                </div>
              </motion.div>

              {/* Right Hero Image (Borderless Editorial Container) */}
              <motion.div
                className="col-span-5 sm:col-span-5 lg:col-span-5 relative flex justify-end"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
              >
                <div className="relative w-full max-w-lg lg:max-w-xl ml-auto overflow-hidden rounded-2xl sm:rounded-[2rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.65)] group">
                  <img
                    alt="Estudiante practicando inglés conversacional con tablet"
                    className="w-full h-52 sm:h-80 md:h-[440px] lg:h-[500px] object-cover object-center transform group-hover:scale-[1.03] transition-transform duration-700"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD42ldVbsncNQW9kjxvsIb4Y92sOOMG7hp5T7s5Fyd2fUXEEMLWKsd0SmJKMwdXaEueG5mQb46_rDS1bsaLwTwVUZS58k52PlS290hUcFSms9-b2tgNn1pgPpji0FpDbnOlXKYT19CtD7yZjL34kU0e7rs9FyFMAplgimRxUrnzPosVGlstmX-sZZgWaiF2CEf0Df_IXZuSd0EF5-kgVpV758YgN5Lr5MHClPIBL9rhtC_ch68BSlUJDw"
                  />
                  {/* Subtle seamless bottom vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090414]/65 via-transparent to-transparent pointer-events-none"></div>

                  {/* Floating Pill Indicator */}
                  <div className="absolute bottom-2.5 sm:bottom-6 left-2 sm:left-6 right-2 sm:right-6 bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl p-2 sm:p-4 shadow-xl flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
                      <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-bloom-100 text-bloom-700 flex items-center justify-center font-bold shrink-0">
                        <i className="fa-solid fa-microphone-lines text-[10px] sm:text-sm"></i>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[9px] sm:text-xs font-bold text-bloom-dark leading-tight truncate">Speaking &amp; Feedback Fonético</h4>
                        <p className="text-[8px] sm:text-[11px] text-emerald-600 font-semibold leading-tight truncate">+98% Precisión en tiempo real</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center text-[8px] sm:text-[11px] font-bold text-bloom-700 bg-bloom-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shrink-0 whitespace-nowrap">
                      Tutor IA Activo
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
        {/* END: HeroSection */}

        {/* BEGIN: NUESTRAS CATEGORÍAS (Modulo Categorizado por Tipo de Usuario) */}
        <div className="w-full bg-[#0c061a] text-white -mt-6 sm:-mt-8 pt-16 sm:pt-20 pb-24 relative z-0 overflow-hidden" id="categorias">
          {/* Destello de luz emergiendo detrás del Hero */}
          <div className="absolute top-0 inset-x-0 h-28 sm:h-36 bg-gradient-to-b from-white/30 via-white/10 to-transparent pointer-events-none z-0"></div>
          {/* Ambient decorative glows */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute -top-24 left-1/3 w-[680px] h-[380px] bg-bloom-800/45 rounded-full blur-[120px] blob-wander-a"></div>
            <div className="absolute top-[520px] -right-24 w-[520px] h-[520px] bg-primary-container/30 rounded-full blur-[120px] blob-wander-b"></div>
            <div className="absolute top-[1150px] -left-24 w-[560px] h-[560px] bg-bloom-700/35 rounded-full blur-[130px] blob-wander-c"></div>
            <div className="absolute top-[280px] left-16 w-[420px] h-[360px] bg-bloom-900/60 rounded-full blur-[100px] blob-wander-d"></div>
          </div>

          {/* Section Header Block */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-6 sm:pt-8 pb-8 sm:pb-10 text-center relative z-10">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-high shadow-sm mb-4 border border-white/5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-[11px] font-bold text-secondary tracking-widest uppercase">
                EXPLORE, LEARN AND GROW • ENGLISH BLOOM AI
              </span>
            </div>

            {/* Main Headline with radiant gradient */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
              NUESTRAS{" "}
              <span className="bg-gradient-to-r from-bloom-300 via-primary to-secondary bg-clip-text text-transparent">
                CATEGORÍAS
              </span>
            </h2>

            {/* Subtitle description */}
            <p className="max-w-3xl mx-auto text-base sm:text-base md:text-lg text-on-surface-variant leading-relaxed mb-6 font-normal">
              Explorá nuestros packs y programas más importantes, diseñados por especialistas pedagógicos y potenciados con IA adaptativa para transformar tu fluidez o enriquecer tus clases.
            </p>

            {/* Category Filter Pills Navigation */}
            <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto -mx-4 px-4 py-3 sm:mx-0 sm:px-0 sm:pb-0 sm:pt-2 scrollbar-none snap-x snap-mandatory sm:snap-none sm:flex-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {CATEGORY_PILLS.map((pill) => {
                const isActive = activeCategoryTab === pill.key;
                return (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => {
                      setActiveCategoryTab(pill.key);
                      if (pill.targetId) {
                        const el = document.getElementById(pill.targetId);
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth", block: "start" });
                        }
                      }
                    }}
                    className={`shrink-0 whitespace-nowrap snap-start sm:shrink sm:whitespace-normal px-4 py-2 sm:py-1.5 rounded-full text-sm sm:text-xs font-semibold transition-all border border-white/5 ${isActive
                        ? "bg-primary-container text-on-primary-container shadow-[0_0_20px_rgba(124,58,237,0.4)]"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                      }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* CONTENT SECTIONS WRAPPER */}
          <div className="w-full px-2 sm:px-4 lg:px-6 space-y-8 sm:space-y-12 pb-6 relative z-10 text-white">
            {/* ========================================== */}
            {/* BLOQUE 1: PARA ESTUDIANTES */}
            {/* ========================================== */}
            {(activeCategoryTab === "all" || activeCategoryTab === "estudiantes" || activeCategoryTab === "examenes") && (
              <section
                className="bg-[#151023] border border-white/10 rounded-2xl md:rounded-[2.5rem] p-4 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden text-white"
                id="para-estudiantes"
              >
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                  <div className="w-[460px] h-[360px] rounded-full bg-white/20 blur-[110px] absolute -right-20 -bottom-20 blob-wander-a"></div>
                  <div className="w-[360px] h-[320px] rounded-full bg-white/15 blur-[100px] absolute left-10 -top-10 blob-wander-b"></div>
                  <div className="w-[420px] h-[340px] rounded-full bg-white/20 blur-[120px] absolute -left-16 -bottom-24 blob-wander-c"></div>
                  <div className="w-[320px] h-[280px] rounded-full bg-white/10 blur-[90px] absolute right-1/3 -top-16 blob-wander-d"></div>
                  <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white/25 via-white/10 to-transparent pointer-events-none"></div>
                </div>

                {/* Top bar with avatar & description */}
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-white/10 bg-[#100c1c] -mx-4 -mt-4 px-4 pt-4 sm:-mx-6 sm:-mt-6 sm:px-6 sm:pt-6 md:-mx-8 md:-mt-8 md:px-8 md:pt-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white shrink-0 border border-white/20">
                      <span className="material-symbols-outlined text-[32px]">school</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl md:text-3xl text-white font-extrabold tracking-tight">
                          Para estudiantes
                        </h3>
                        <span className="hidden sm:inline-flex px-3 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-bloom-200 backdrop-blur-sm border border-white/15">
                          Nivel A1-C2
                        </span>
                      </div>
                      <p className="text-sm sm:text-sm text-bloom-100/90 mt-0.5">
                        Recursos prácticos, interactivos y motivadores con tutor IA para aprender y mejorar tu fluidez a tu ritmo.
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-1.5 text-sm sm:text-xs font-bold text-white hover:text-bloom-200 transition-colors shrink-0 self-start md:self-auto"
                  >
                    <span>Ver todos ({studentPacksToDisplay.length} packs)</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>

                {/* Cards Grid: 2 columns on mobile, auto-expanding flex rows on sm+ */}
                <div
                  className="relative z-10 grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-4 md:gap-5 pt-4 sm:pt-6"
                  data-cms-locked="true"
                >
                  {studentPacksToDisplay.map((pack, i) => breakpoint !== "base" && isLoneCard(i, studentPacksToDisplay.length, studentCols) ? (
                    <FeaturedPackCard
                      key={pack.id}
                      image={pack.image}
                      title={pack.title}
                      description={pack.fullDescription || pack.description}
                      metricLeft={pack.metricLeft}
                      metricLeftIcon={pack.metricLeftIcon}
                      metricRight={pack.metricRight}
                      highlights={pack.highlights?.length ? pack.highlights : DEFAULT_HIGHLIGHTS}
                      link={pack.link}
                      badge={
                        <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm text-[10px] font-bold text-white flex items-center gap-1 shadow-sm border border-white/10">
                          <span className="material-symbols-outlined text-[14px] text-tertiary">{pack.badgeIcon}</span>
                          <span>{pack.badge}</span>
                        </div>
                      }
                    />
                  ) : (
                    <article
                      key={pack.id}
                      onClick={() => pack.link && navigate(pack.link)}
                      className="group cursor-pointer flex-1 min-w-0 basis-[calc(50%-0.35rem)] sm:basis-[calc(50%-0.55rem)] lg:basis-[calc(25%-1rem)] bg-white hover:bg-slate-50/95 rounded-xl sm:rounded-2xl overflow-hidden p-3 sm:p-3 md:p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 shadow-lg hover:ring-2 hover:ring-bloom-300"
                    >
                      <div>
                        {/* Visual media container */}
                        <div className="relative -mx-3 -mt-3 sm:-mx-3 sm:-mt-3 md:-mx-4 md:-mt-4 h-32 sm:h-36 md:h-48 overflow-hidden bg-slate-100 mb-2.5 sm:mb-4">
                          <img
                            src={pack.image}
                            alt={pack.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm text-[11px] sm:text-[10px] font-bold text-white flex items-center gap-1 shadow-sm border border-white/10">
                            <span className="material-symbols-outlined text-[14px] text-tertiary">
                              {pack.badgeIcon}
                            </span>
                            <span>{pack.badge}</span>
                          </div>
                        </div>

                        <h4 className="text-sm sm:text-sm md:text-base font-bold text-slate-900 group-hover:text-bloom-700 transition-colors mb-1.5 sm:mb-2 leading-snug line-clamp-2">
                          {pack.title}
                        </h4>
                        <p className="text-base sm:text-lg text-slate-700 font-medium line-clamp-3 mb-2.5 sm:mb-4 leading-relaxed">
                          {pack.description}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 mb-2.5 sm:mb-3 pt-2 border-t border-slate-100">
                          <span className="flex items-center gap-1 text-slate-600">
                            <span className="material-symbols-outlined text-[15px] text-bloom-600">
                              {pack.metricLeftIcon}
                            </span>
                            {pack.metricLeft}
                          </span>
                          <span className="text-slate-900 font-bold text-xs sm:text-[11px]">{pack.metricRight}</span>
                        </div>
                        <Link
                          to={pack.link}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full py-2.5 sm:py-2.5 px-3 sm:px-4 rounded-full bg-primary-container hover:bg-primary text-on-primary-container shadow-[0_0_20px_rgba(124,58,237,0.4)] text-xs sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 hover:shadow-[0_0_18px_rgba(124,58,237,0.4)] transition-all truncate"
                        >
                          <span>VER PACK</span>
                          <span className="material-symbols-outlined text-[14px] sm:text-[16px] group-hover:translate-x-1 transition-transform">
                            arrow_forward
                          </span>
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* ========================================== */}
            {/* BLOQUE 2: PARA DOCENTES */}
            {/* ========================================== */}
            {(activeCategoryTab === "all" || activeCategoryTab === "docentes") && (
              <section
                className="bg-[#151023] border border-white/10 rounded-2xl md:rounded-[2.5rem] p-4 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden text-white"
                id="para-docentes"
              >
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                  <div className="w-[460px] h-[360px] rounded-full bg-white/20 blur-[110px] absolute -right-20 -bottom-20 blob-wander-a"></div>
                  <div className="w-[360px] h-[320px] rounded-full bg-white/15 blur-[100px] absolute left-10 -top-10 blob-wander-b"></div>
                  <div className="w-[420px] h-[340px] rounded-full bg-white/20 blur-[120px] absolute -left-16 -bottom-24 blob-wander-c"></div>
                  <div className="w-[320px] h-[280px] rounded-full bg-white/10 blur-[90px] absolute right-1/3 -top-16 blob-wander-d"></div>
                  <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white/25 via-white/10 to-transparent pointer-events-none"></div>
                </div>

                {/* Section Header */}
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10 bg-[#100c1c] -mx-4 -mt-4 px-4 pt-4 sm:-mx-6 sm:-mt-6 sm:px-6 sm:pt-6 md:-mx-8 md:-mt-8 md:px-8 md:pt-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white shrink-0 border border-white/20">
                      <span className="material-symbols-outlined text-[32px]">groups</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl md:text-3xl text-white font-extrabold tracking-tight">
                          Para docentes
                        </h3>
                        <span className="hidden sm:inline-flex px-3 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-bloom-200 backdrop-blur-sm border border-white/15">
                          Teacher Ready
                        </span>
                      </div>
                      <p className="text-sm sm:text-sm text-bloom-100/90 mt-0.5">
                        Materiales listos para usar en el aula o clases online que ahorran horas de preparación y potencian tus clases.
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-1.5 text-sm sm:text-xs font-bold text-white hover:text-bloom-200 transition-colors shrink-0 self-start md:self-auto"
                  >
                    <span>Ver packs docentes ({teacherPacksToDisplay.length})</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>

                {/* 5 Cards: 2 columns on mobile, auto-expanding flex rows on sm+ */}
                <div
                  className="relative z-10 grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-3.5 md:gap-4 pt-4 sm:pt-6"
                  data-cms-locked="true"
                >
                  {teacherPacksToDisplay.map((pack, i) => breakpoint !== "base" && isLoneCard(i, teacherPacksToDisplay.length, teacherCols) ? (
                    <FeaturedPackCard
                      key={pack.id}
                      image={pack.image}
                      title={pack.title}
                      description={pack.fullDescription || pack.description}
                      highlights={pack.highlights?.length ? pack.highlights : ["Listo para el aula", "Clases online o presenciales", "Ahorra horas de preparación"]}
                      link={pack.link}
                      badge={
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container-highest/90 text-white backdrop-blur-sm border border-white/10">
                          {pack.levelBadge}
                        </span>
                      }
                    />
                  ) : (
                    <article
                      key={pack.id}
                      onClick={() => pack.link && navigate(pack.link)}
                      className="group cursor-pointer flex-1 min-w-0 basis-[calc(50%-0.35rem)] sm:basis-[calc(33.333%-0.7rem)] lg:basis-[calc(20%-0.85rem)] bg-white hover:bg-slate-50/95 rounded-xl sm:rounded-2xl overflow-hidden p-3 sm:p-3 md:p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 shadow-lg hover:ring-2 hover:ring-bloom-300"
                    >
                      <div>
                        <div className="relative -mx-3 -mt-3 sm:-mx-3 sm:-mt-3 md:-mx-4 md:-mt-4 h-28 sm:h-32 md:h-40 overflow-hidden bg-slate-100 mb-2.5 sm:mb-3">
                          <img
                            src={pack.image}
                            alt={pack.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[11px] sm:text-[10px] font-bold bg-surface-container-highest/90 text-white backdrop-blur-sm border border-white/10">
                            {pack.levelBadge}
                          </span>
                        </div>
                        <h4 className="text-sm sm:text-xs md:text-sm font-bold text-slate-900 group-hover:text-bloom-700 transition-colors mb-1.5 sm:mb-1.5 line-clamp-2 sm:line-clamp-1">
                          {pack.title}
                        </h4>
                        <p className="text-base sm:text-lg text-slate-700 font-medium line-clamp-3 mb-2.5 sm:mb-4 leading-relaxed">
                          {pack.description}
                        </p>
                      </div>

                      <Link
                        to={pack.link}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full py-2 sm:py-2 px-2.5 sm:px-3 rounded-full bg-primary-container hover:bg-primary text-on-primary-container shadow-[0_0_20px_rgba(124,58,237,0.4)] text-xs sm:text-xs font-bold flex items-center justify-center gap-1 hover:shadow-[0_0_16px_rgba(124,58,237,0.4)] transition-all truncate"
                      >
                        <span>VER PACK</span>
                        <span className="material-symbols-outlined text-[14px] sm:text-[15px] group-hover:translate-x-1 transition-transform">
                          arrow_forward
                        </span>
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* ========================================== */}
            {/* BLOQUE 3: READING FOR PLEASURE */}
            {/* ========================================== */}
            {(activeCategoryTab === "all" || activeCategoryTab === "reading") && (
              <section
                className="bg-[#151023] border border-white/10 rounded-2xl md:rounded-[2.5rem] p-4 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden text-white"
                id="reading-for-pleasure"
              >
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                  <div className="w-[460px] h-[360px] rounded-full bg-white/20 blur-[110px] absolute -right-20 -bottom-20 blob-wander-a"></div>
                  <div className="w-[360px] h-[320px] rounded-full bg-white/15 blur-[100px] absolute left-10 -top-10 blob-wander-b"></div>
                  <div className="w-[420px] h-[340px] rounded-full bg-white/20 blur-[120px] absolute -left-16 -bottom-24 blob-wander-c"></div>
                  <div className="w-[320px] h-[280px] rounded-full bg-white/10 blur-[90px] absolute right-1/3 -top-16 blob-wander-d"></div>
                  <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white/25 via-white/10 to-transparent pointer-events-none"></div>
                </div>

                {/* Section Header */}
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10 bg-[#100c1c] -mx-4 -mt-4 px-4 pt-4 sm:-mx-6 sm:-mt-6 sm:px-6 sm:pt-6 md:-mx-8 md:-mt-8 md:px-8 md:pt-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white shrink-0 border border-white/20">
                      <span className="material-symbols-outlined text-[32px]">auto_stories</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl md:text-3xl text-white font-extrabold tracking-tight">
                          Reading for Pleasure
                        </h3>
                        <span className="hidden sm:inline-flex px-3 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-bloom-200 backdrop-blur-sm border border-white/15">
                          Audiobooks + Glosario
                        </span>
                      </div>
                      <p className="text-sm sm:text-sm text-bloom-100/90 mt-0.5">
                        Historias fascinantes para disfrutar de la lectura en inglés, enriquecer tu vocabulario natural y sumergirte en nuevos mundos.
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/mis-cursos"
                    className="inline-flex items-center gap-1.5 text-sm sm:text-xs font-bold text-white hover:text-bloom-200 transition-colors shrink-0 self-start md:self-auto"
                  >
                    <span>Ver biblioteca completa ({readingPacksToDisplay.length} libros)</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>

                {/* 4 Story Cards: 2 columns on mobile, auto-expanding flex rows on sm+ */}
                <div
                  className="relative z-10 grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-4 md:gap-5 pt-4 sm:pt-6"
                  data-cms-locked="true"
                >
                  {readingPacksToDisplay.map((novel, i) => breakpoint !== "base" && isLoneCard(i, readingPacksToDisplay.length, readingCols) ? (
                    <FeaturedPackCard
                      key={novel.id}
                      image={novel.image}
                      title={novel.title}
                      description={novel.fullDescription || novel.description}
                      metricLeft="Con audio nativo"
                      metricLeftIcon="headphones"
                      metricRight={novel.audioTime}
                      highlights={novel.highlights?.length ? novel.highlights : [novel.levelBadge, "Audio nativo", "Glosario incluido"]}
                      link={novel.link}
                      badge={
                        <>
                          <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm text-[10px] font-bold text-white flex items-center gap-1 shadow-sm border border-white/10">
                            <span className="material-symbols-outlined text-[14px] text-tertiary">auto_stories</span>
                            <span>{novel.category || "Reading for Pleasure"}</span>
                          </span>
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container-lowest/80 text-white backdrop-blur-sm border border-white/10">
                            {novel.levelBadge}
                          </span>
                        </>
                      }
                    />
                  ) : (
                    <article
                      key={novel.id}
                      onClick={() => novel.link && navigate(novel.link)}
                      className="group cursor-pointer flex-1 min-w-0 basis-[calc(50%-0.35rem)] sm:basis-[calc(50%-0.55rem)] lg:basis-[calc(25%-1rem)] bg-white hover:bg-slate-50/95 rounded-xl sm:rounded-2xl overflow-hidden p-3 sm:p-3 md:p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 shadow-lg hover:ring-2 hover:ring-bloom-300"
                    >
                      <div>
                        <div className="relative -mx-3 -mt-3 sm:-mx-3 sm:-mt-3 md:-mx-4 md:-mt-4 h-32 sm:h-36 md:h-48 overflow-hidden bg-slate-100 mb-2.5 sm:mb-4">
                          <img
                            src={novel.image}
                            alt={novel.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm text-[11px] sm:text-[10px] font-bold text-white flex items-center gap-1 shadow-sm border border-white/10">
                            <span className="material-symbols-outlined text-[14px] text-tertiary">auto_stories</span>
                            <span>{novel.category || "Reading for Pleasure"}</span>
                          </span>
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[11px] sm:text-[10px] font-bold bg-surface-container-lowest/80 text-white backdrop-blur-sm border border-white/10">
                            {novel.levelBadge}
                          </span>
                        </div>
                        <h4 className="text-sm sm:text-sm md:text-base font-bold text-slate-900 group-hover:text-bloom-700 transition-colors mb-1.5 sm:mb-2 tracking-wide line-clamp-2 sm:line-clamp-1">
                          {novel.title}
                        </h4>
                        <p className="text-base sm:text-lg text-slate-700 font-medium line-clamp-3 mb-2.5 sm:mb-4 leading-relaxed">
                          {novel.description}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 mb-2.5 sm:mb-3 pt-2 border-t border-slate-100">
                          <span className="flex items-center gap-1 text-slate-600">
                            <span className="material-symbols-outlined text-[15px] text-bloom-600">
                              headphones
                            </span>{" "}
                            Con audio nativo
                          </span>
                          <span className="text-slate-900 font-bold text-xs sm:text-[11px]">{novel.audioTime}</span>
                        </div>
                        <Link
                          to={novel.link}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full py-2.5 sm:py-2.5 px-3 sm:px-4 rounded-full bg-primary-container hover:bg-primary text-on-primary-container shadow-[0_0_20px_rgba(124,58,237,0.4)] text-xs sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 hover:shadow-[0_0_18px_rgba(124,58,237,0.4)] transition-all truncate"
                        >
                          <span>VER PACK</span>
                          <span className="material-symbols-outlined text-[14px] sm:text-[16px] group-hover:translate-x-1 transition-transform">
                            arrow_forward
                          </span>
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* ========================================== */}
            {/* BANNER INFERIOR DE INSPIRACIÓN & CATÁLOGO */}
            {/* ========================================== */}
            <div className="w-full bg-[#151023] border border-white/10 rounded-2xl md:rounded-[2.5rem] p-5 sm:p-8 md:p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 text-center md:text-left text-white">
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="w-[460px] h-[360px] rounded-full bg-white/20 blur-[110px] absolute -right-20 -bottom-20 blob-wander-a"></div>
                <div className="w-[360px] h-[320px] rounded-full bg-white/15 blur-[100px] absolute left-10 -top-10 blob-wander-b"></div>
                <div className="w-[420px] h-[340px] rounded-full bg-white/20 blur-[120px] absolute -left-16 -bottom-24 blob-wander-c"></div>
                <div className="w-[320px] h-[280px] rounded-full bg-white/10 blur-[90px] absolute right-1/3 -top-16 blob-wander-d"></div>
                  <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white/25 via-white/10 to-transparent pointer-events-none"></div>
              </div>

              <div className="flex items-center gap-5 max-w-2xl relative z-10">
                <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white shrink-0 hidden sm:flex border border-white/20">
                  <span className="material-symbols-outlined text-[36px]">filter_vintage</span>
                </div>
                <div>
                  <div className="inline-flex items-center justify-center md:justify-start gap-1.5 px-3 py-1 rounded-full bg-white/10 text-bloom-200 text-xs font-semibold border border-white/15 mb-2">
                    <span className="material-symbols-outlined text-[16px]">favorite</span>
                    <span>Better resources. Brighter learners. A more confident you.</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl text-white font-extrabold tracking-tight">
                    ¿Listo para dar el siguiente paso en tu aprendizaje?
                  </h3>
                  <p className="text-xs sm:text-sm text-bloom-100/90 mt-2 leading-relaxed">
                    Accedé a más de 200 actividades interactivas, simulaciones orales con IA y materiales descargables para docentes y estudiantes.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 relative z-10 w-full sm:w-auto">
                <Link
                  to="/products"
                  className="w-full sm:w-auto px-7 py-3 rounded-full bg-white hover:bg-bloom-100 text-bloom-900 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg transition-transform hover:-translate-y-0.5 duration-200"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  <span>Descargar Catálogo Completo (PDF)</span>
                </Link>
                <Link
                  to="/pronunciation"
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors text-center border border-white/20 backdrop-blur-sm"
                >
                  Pruébalo gratis
                </Link>
              </div>
            </div>
          </div>
        </div>
        {/* END: NUESTRAS CATEGORÍAS */}

        {/* BEGIN: BannerInscripcion */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-20 lg:mt-28" id="inscripcion">
          <div className="relative rounded-[2.5rem] overflow-hidden bg-[#151023] border border-white/10 text-white shadow-2xl">
            {/* Curved Background Abstract Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
              <div className="w-[520px] h-[380px] rounded-full bg-white/20 blur-[110px] absolute -right-20 -bottom-20 blob-wander-a"></div>
              <div className="w-[380px] h-[340px] rounded-full bg-white/15 blur-[100px] absolute left-10 -top-10 blob-wander-b"></div>
              <div className="w-[420px] h-[340px] rounded-full bg-white/20 blur-[120px] absolute -left-16 -bottom-24 blob-wander-c"></div>
              <div className="w-[320px] h-[280px] rounded-full bg-white/10 blur-[90px] absolute right-1/3 -top-16 blob-wander-d"></div>
                  <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white/25 via-white/10 to-transparent pointer-events-none"></div>
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-center">
              {/* Text Content */}
              <div className="p-6 sm:p-12 lg:p-16 lg:col-span-7 space-y-4 sm:space-y-6">
                <span className="inline-block px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/10 text-bloom-200 backdrop-blur-sm border border-white/15">
                  🌸 Metodología 100% Inmersiva
                </span>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-balance">
                  ¡Comienza a hablar inglés desde tu primera lección!
                </h2>
                <p className="text-bloom-100/90 text-sm sm:text-base leading-relaxed max-w-lg">
                  Supera el miedo escénico con simulaciones guiadas por IA y mentoría en vivo de profesores certificados. Desarrolla fluidez real para tus entrevistas laborales, certificaciones y viajes.
                </p>
                <div className="pt-2">
                  <Link
                    className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3 rounded-full text-xs sm:text-sm font-bold tracking-wide uppercase text-bloom-900 bg-white hover:bg-bloom-100 shadow-lg transition-transform hover:-translate-y-0.5 duration-200"
                    to="/products"
                  >
                    Inscribirme a un Curso
                    <i className="fa-solid fa-chevron-right ml-2 text-xs"></i>
                  </Link>
                </div>
              </div>

              {/* Feature Image Section inside Banner */}
              <div className="lg:col-span-5 h-72 sm:h-96 lg:h-full relative overflow-hidden">
                <img
                  alt="Estudiantes en clase interactiva de inglés"
                  className="w-full h-full object-cover object-center lg:rounded-l-[2rem] opacity-90 transition-transform duration-500 hover:scale-105"
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bloom-900/80 via-transparent to-transparent lg:hidden"></div>
              </div>
            </div>
          </div>
        </section>
        {/* END: BannerInscripcion */}

        {/* BEGIN: CaseStudiesSection (Metodología & Simulaciones) */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-20 lg:mt-28 mb-12 sm:mb-20 lg:mb-28 relative z-10" id="metodologia">
          <div className="space-y-6">
            {/* Metodología Card 1 */}
            <div className="bg-surface-container-low hover:bg-surface-container rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-md border border-white/5 hover:border-primary/30 transition-all duration-300 grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-center">
              <div className="md:col-span-5 rounded-2xl overflow-hidden aspect-[4/3] bg-surface-container-high">
                <img
                  alt="Práctica conversacional interactiva con tutor IA"
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800"
                />
              </div>
              <div className="md:col-span-7 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-primary/15 text-primary uppercase tracking-wider border border-primary/20">
                    Tutor IA 24/7
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">Simulación de Escenarios Reales</span>
                </div>
                <h4 className="text-xl sm:text-2xl font-bold text-on-surface">
                  Práctica Conversacional sin Miedo al Error
                </h4>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Entrena en más de 150 escenarios reales: negociaciones, entrevistas de trabajo, check-in en aeropuertos y presentaciones orales. Nuestro tutor de IA analiza tu gramática y pronunciación de inmediato, dándote sugerencias constructivas.
                </p>
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-4 text-xs font-medium text-on-surface-variant">
                    <span className="flex items-center gap-1.5">
                      <i className="fa-solid fa-circle-check text-primary"></i> Reconocimiento Fonético Preciso
                    </span>
                    <span className="flex items-center gap-1.5">
                      <i className="fa-solid fa-circle-check text-primary"></i> Respuestas en Audio Nativo
                    </span>
                  </div>
                  <Link
                    className="inline-flex items-center px-6 py-2.5 rounded-full text-xs font-bold text-on-primary-container bg-primary-container hover:bg-primary shadow-[0_0_20px_rgba(124,58,237,0.35)] transition-all transform hover:-translate-y-0.5"
                    to="/products"
                  >
                    Ver Cursos Disponibles
                    <i className="fa-solid fa-arrow-right ml-2 text-[10px]"></i>
                  </Link>
                </div>
              </div>
            </div>

            {/* Metodología Card 2 */}
            <div className="bg-surface-container-low hover:bg-surface-container rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-md border border-white/5 hover:border-primary/30 transition-all duration-300 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-5 rounded-2xl overflow-hidden aspect-[4/3] bg-surface-container-high">
                <img
                  alt="Preparación para certificaciones oficiales de inglés"
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                  src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800"
                />
              </div>
              <div className="md:col-span-7 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-primary/15 text-primary uppercase tracking-wider border border-primary/20">
                    Certificaciones Globales
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">IELTS • TOEFL • Cambridge</span>
                </div>
                <h4 className="text-xl sm:text-2xl font-bold text-on-surface">
                  Ruta Estratégica para Certificar tu Nivel
                </h4>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Nuestros alumnos logran un 96% de tasa de aprobación en exámenes internacionales gracias a simulacros completos cronometrados, bancos de preguntas actualizados y mentoría individual de examinadores certificados.
                </p>
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-4 text-xs font-medium text-on-surface-variant">
                    <span className="flex items-center gap-1.5">
                      <i className="fa-solid fa-circle-check text-primary"></i> 96% Tasa de Aprobación
                    </span>
                    <span className="flex items-center gap-1.5">
                      <i className="fa-solid fa-circle-check text-primary"></i> Simulacros Cronometrados
                    </span>
                  </div>
                  <Link
                    className="inline-flex items-center px-6 py-2.5 rounded-full text-xs font-bold text-on-primary-container bg-primary-container hover:bg-primary shadow-[0_0_20px_rgba(124,58,237,0.35)] transition-all transform hover:-translate-y-0.5"
                    to="/products"
                  >
                    Ver Programas Oficiales
                    <i className="fa-solid fa-arrow-right ml-2 text-[10px]"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* END: CaseStudiesSection */}

      </main>

      {/* BEGIN: SiteFooter */}
      <Footer />
      {/* END: SiteFooter */}
    </div>
  );
};

export default HOME;
