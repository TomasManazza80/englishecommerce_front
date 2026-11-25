import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useDispatch } from "react-redux";
import { Add } from "../../store/redux/cart/CartAction";
import Swal from "sweetalert2";
import { useLenis } from "lenis/react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3003";

export default function ProductDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const lenis = useLenis();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeModule, setActiveModule] = useState(0);
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    fetchProduct();
  }, [id, lenis]);

  useEffect(() => {
    if (!loading) {
      // Ensure the top of the course detail is visible once content is loaded
      if (lenis) {
        lenis.scrollTo(0, { immediate: true });
      }
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [loading, lenis]);

  const fetchProduct = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/products/${id}`);
      if (data && (data.id || data.nombre)) {
        setProduct(data);
      } else {
        setProduct(getDefaultCourseData(id));
      }
    } catch (error) {
      console.warn("Could not fetch product from backend, using high-fidelity fallback:", error);
      setProduct(getDefaultCourseData(id));
    } finally {
      setLoading(false);
    }
  };

  const getDefaultCourseData = (courseId) => {
    const fallbackList = {
      12: {
        id: 12,
        nombre: "INGLÉS CONVERSACIONAL - FLUIDEZ RÁPIDA",
        categoria: "Fluidez & Conversación",
        precioVenta: 149,
        descripcion: "Habla con fluidez y confianza desde la primera semana.\nMétodo de inmersión total con situaciones de la vida real.\nPráctica de pronunciación con IA de reconocimiento de voz.\nMás de 200 diálogos y conversaciones guiadas.",
        imagenes: ["https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000"]
      },
      13: {
        id: 13,
        nombre: "PREPARACIÓN IELTS / TOEFL INTENSIVO",
        categoria: "Exámenes Oficiales",
        precioVenta: 189,
        descripcion: "Preparación intensiva para certificaciones internacionales.\nEstrategias de alto puntaje para Speaking, Listening, Reading y Writing.\nSimulacros cronometrados con evaluación detallada por IA.",
        imagenes: ["https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1000"]
      },
      14: {
        id: 14,
        nombre: "INGLÉS PARA VIAJES Y TURISMO",
        categoria: "Viajeros & Turismo",
        precioVenta: 99,
        descripcion: "Vocabulario clave para viajar con seguridad por todo el mundo.\nInteracción en aeropuertos, reservas de hotel, situaciones imprevistas y restaurantes.",
        imagenes: ["https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1000"]
      },
      15: {
        id: 15,
        nombre: "INGLÉS PARA NEGOCIOS Y ENTREVISTAS",
        categoria: "Business & Corporate",
        precioVenta: 169,
        descripcion: "Vocabulario corporativo y preparación intensiva para entrevistas laborales en inglés.\nRedacción de correos ejecutivos y dinámicas de presentaciones de negocios.",
        imagenes: ["https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1000"]
      },
      16: {
        id: 16,
        nombre: "ENGLISH TEACHING & PEDAGOGÍA: PARA DOCENTES",
        categoria: "Especialización Docente",
        precioVenta: 199,
        descripcion: "Programa de actualización pedagógica y metodologías activas para profesores de inglés.\nFonética aplicada en el aula y herramientas didácticas de IA.",
        imagenes: ["https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1000"]
      },
      17: {
        id: 17,
        nombre: "ADVANCED CORPORATE COMMUNICATION & LEADERSHIP",
        categoria: "Liderazgo & Oratoria",
        precioVenta: 159,
        descripcion: "Oratoria de alto impacto y comunicación estratégica para reuniones de directorio.\nPersuasión ejecutiva y liderazgo en equipos multiculturales.",
        imagenes: ["https://images.unsplash.com/photo-1552664730-d307ca884978?w=1000"]
      },
      18: {
        id: 18,
        nombre: "CURSO VIP: MASTERCLASS DE INGLÉS COMPLETO",
        categoria: "Programa Integral VIP",
        precioVenta: 249,
        descripcion: "Domina la pronunciación, fluidez conversacional y gramática avanzada de principio a fin.\nSoporte de inteligencia artificial las 24 horas y mentoría de pronunciación.",
        imagenes: ["https://images.unsplash.com/photo-1543269664-56d93c216ecc?w=1000"]
      }
    };

    return fallbackList[courseId] || {
      id: courseId,
      nombre: "Master en Fluidez & Conversación Profesional con IA",
      categoria: "Negocios & Fluidez",
      precioVenta: 149,
      descripcion: "Aprende a comunicarte con total seguridad en reuniones ejecutivas, entrevistas internacionales y presentaciones de alto impacto con feedback fonético en milisegundos.",
      imagenes: ["https://lh3.googleusercontent.com/aida-public/AB6AXuApMYSC5cRFAzdkCLSyXS33ylZ2HHJfe0-CK7IDbN1lVs93Zy4i7sg1S6m9RMrOQCrB9HssUBUWHt5rkA65DymbaKb087H4FN8NN8bV7mq4XOapHchA6I7WZaNBhn2YNHujCChU8jHUPT7wSnAM-J-KAf27EC1D_7UMOHvyEzKiO3kHYXb_PSRUkgIgNJGKh8uN1kzi8E9JL4BvGHD3uwnevgVzJ_WdOWH4phB47EAM"]
    };
  };

  const getPrice = () => {
    if (!product) return 0;
    const vPrice = product.variantes?.[0]?.precioAlPublico;
    if (vPrice !== undefined && vPrice !== null && !isNaN(Number(vPrice)) && Number(vPrice) > 0) {
      return Number(vPrice);
    }
    if (product.precioVenta && Number(product.precioVenta) > 0) return Number(product.precioVenta);
    if (product.precio && Number(product.precio) > 0) return Number(product.precio);
    if (product.precioInfoproducto && Number(product.precioInfoproducto) > 0) return Number(product.precioInfoproducto);
    return 0;
  };

  const coursePrice = getPrice();
  const originalPrice = coursePrice > 0 ? Math.round(coursePrice * 1.5) : 0;

  const getCourseImage = () => {
    if (!product?.imagenes || product.imagenes.length === 0) {
      return "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000";
    }
    const firstImg = product.imagenes[0];
    if (typeof firstImg === "string") return firstImg;
    return firstImg?.url || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000";
  };

  const handleAddToCart = () => {
    if (!product) return;

    dispatch(
      Add({
        ProductId: product.id,
        id: `${product.id}-curso-completo`,
        title: product.nombre,
        price: coursePrice,
        precioAlPublico: coursePrice,
        precioMayorista: coursePrice,
        image: getCourseImage(),
        quantity: 1,
        color: "Unico",
        storage: "Acceso Ilimitado"
      })
    );

    Swal.fire({
      title: "¡Inscripción agregada al carrito!",
      text: `${product.nombre} ha sido agregado con éxito.`,
      icon: "success",
      background: "#1e192b",
      color: "#e8def9",
      confirmButtonColor: "#7c3aed",
      confirmButtonText: "Ir al Carrito",
      showCancelButton: true,
      cancelButtonText: "Seguir viendo",
      cancelButtonColor: "#373246"
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/cart");
      }
    });
  };

  const getAudioDemoText = () => {
    if (product?.speakingActivities?.[0]?.prompt) {
      return product.speakingActivities[0].prompt;
    }
    const nameLower = (product?.nombre || "").toLowerCase();
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
    return `Welcome to ${product?.nombre || "EnglishBloom"}. Practice your spoken English with instant acoustic feedback.`;
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

  // Build real syllabus dynamically from stored database materials and speaking activities
  const getDynamicSyllabus = () => {
    const list = [];

    // 1. Stored Speaking Activities
    if (Array.isArray(product?.speakingActivities) && product.speakingActivities.length > 0) {
      product.speakingActivities.forEach((act, idx) => {
        list.push({
          num: String(list.length + 1).padStart(2, "0"),
          title: act.title || `Práctica Conversacional ${idx + 1}`,
          duration: `Nivel ${act.level || "General"} • Laboratorio Oral con IA`,
          content: act.prompt || "Simulación oral interactiva con análisis fonético y retroalimentación inmediata.",
          tags: ["Speaking IA", act.level ? `Nivel ${act.level}` : "Conversación", "Análisis Fonético"]
        });
      });
    }

    // 2. Stored Archivos / Materials
    if (Array.isArray(product?.archivosInfoproducto) && product.archivosInfoproducto.length > 0) {
      product.archivosInfoproducto.forEach((file, idx) => {
        const isVideo = file.fileType?.includes("video") || file.name?.endsWith(".mp4");
        const isAudio = file.fileType?.includes("audio") || file.name?.endsWith(".mp3");
        list.push({
          num: String(list.length + 1).padStart(2, "0"),
          title: file.name || `Material de Estudio ${idx + 1}`,
          duration: isVideo ? "Lección en Video HD" : isAudio ? "Práctica de Listening Nativo" : "Guía PDF Digital de Estudio",
          content: `Material oficial del curso '${product?.nombre}'. Incluye vocabulario práctico, expresiones esenciales y ejercicios guiados.`,
          tags: [isVideo ? "Video HD" : isAudio ? "Audio Listening" : "Documento PDF", "Material Oficial", "Protegido DRM"]
        });
      });
    }

    // 3. Stored description points if list is short
    const descLines = (product?.descripcion || "")
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

    return list.length > 0 ? list : [
      {
        num: "01",
        title: "Fundamentos y Vocabulario Práctico",
        duration: "Módulo Principal • Clases y Simulaciones",
        content: product?.descripcion || "Desarrollo de fluidez y expresión oral en situaciones de la vida real.",
        tags: ["Speaking", "Fluidez", "Pronunciación"]
      }
    ];
  };

  const syllabusModules = getDynamicSyllabus();

  const parseDescriptionBullets = () => {
    if (!product?.descripcion) {
      return [
        "Desarrollo de fluidez conversacional en contextos reales",
        "Práctica guiada con tutor inteligente las 24 horas",
        "Corrección fonética y reducción de acento",
        "Material de estudio descargable y certificado oficial"
      ];
    }
    const lines = product.descripcion
      .split("\n")
      .map((l) => l.replace(/^[-•✅\s]+/, "").trim())
      .filter(Boolean);

    return lines.length > 0 ? lines : [product.descripcion];
  };

  const descBullets = parseDescriptionBullets();

  const faqs = [
    {
      q: "¿Cómo funciona el feedback fonético de la IA?",
      a: "Nuestro motor analiza el espectro de tu voz comparándolo con hablantes nativos en tiempo real. Te indica si la lengua o los labios fallaron en la articulación del sonido exacto, desglosando la palabra en colores para que corrijas inmediatamente."
    },
    {
      q: "¿Cuánto tiempo necesito dedicar al día?",
      a: "El método está optimizado para personas con poco tiempo: 20 a 30 minutos al día son suficientes para generar memoria muscular y fluidez duradera, complementados con la sesión semanal en vivo."
    },
    {
      q: "¿El certificado es válido a nivel internacional?",
      a: "Sí. Al completar los módulos y aprobar la prueba final de conversación, recibes un certificado oficial alineado al Marco Común Europeo de Referencia (CEFR B2-C1), con código QR verificable e integración directa en LinkedIn."
    },
    {
      q: "¿Qué pasa si el curso no cumple mis expectativas?",
      a: "Ofrecemos 14 días de garantía de satisfacción total sin preguntas. Si sientes que la metodología o el tutor inteligente no son para ti, solicitas el reembolso en un clic desde tu panel y te reintegramos el 100% de tu dinero."
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-on-surface">
        <div className="w-12 h-12 rounded-full border-4 border-primary-container border-t-transparent animate-spin mb-4"></div>
        <p className="text-on-surface-variant text-sm font-semibold tracking-wider uppercase">
          Cargando detalles del programa...
        </p>
      </div>
    );
  }

  const currentImage = product?.imagenes?.[0] || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000";

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans antialiased selection:bg-primary-container selection:text-on-primary-container relative overflow-hidden">
      {/* Subtle Ambient Glows */}
      <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-primary-container/15 rounded-full blur-[140px] pointer-events-none -z-10"></div>
      <div className="absolute top-[45%] right-10 w-[500px] h-[500px] bg-tertiary-container/15 rounded-full blur-[130px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-20 left-10 w-[600px] h-[600px] bg-secondary-container/20 rounded-full blur-[160px] pointer-events-none -z-10"></div>

      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 pt-24 sm:pt-36 pb-4">
        <nav className="flex items-center gap-2 text-on-surface-variant text-xs sm:text-sm flex-wrap">
          <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">home</span> Inicio
          </Link>
          <span className="text-outline">/</span>
          <Link to="/products" className="hover:text-primary transition-colors">
            Cursos
          </Link>
          <span className="text-outline">/</span>
          <span className="text-on-surface-variant">{product?.categoria || "Negocios & Fluidez"}</span>
          <span className="text-outline">/</span>
          <span className="text-primary font-semibold truncate max-w-xs">{product?.nombre}</span>
        </nav>
      </div>

      {/* HERO / ENROLLMENT SECTION (Asymmetric 7:5 Split) */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 pb-12 sm:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          
          {/* Left Column: Course Presentation & Core Value (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Category Pill Badge */}
            <div className="inline-flex items-center gap-2 bg-surface-container-high/80 px-4 py-1.5 rounded-full w-fit backdrop-blur-md border border-white/5">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="text-xs uppercase tracking-widest text-secondary font-bold">
                English Bloom Academy • {product?.categoria || "Edición 2025"}
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight leading-[1.18] sm:leading-[1.15]">
              {product?.nombre}
              <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-on-surface via-primary to-secondary">
                con Inteligencia Artificial
              </span>
            </h1>

            {/* Subtitle / Description */}
            <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
              {product?.descripcion?.split("\n")[0] ||
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
                <span className="text-xl font-bold text-on-surface">B1 → C1</span>
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
                  aria-label="Escuchar muestra fonética"
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

              {/* Animated Waveform Indicator */}
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

          {/* Right Column: Sticky Enrollment Card (5 cols) */}
          <div className="lg:col-span-5 relative w-full">
            <div className="relative lg:sticky top-auto lg:top-28 bg-surface-container-low rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-white/10 flex flex-col gap-4 sm:gap-5">
              
              {/* Media Preview Box */}
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden group bg-surface-container">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  src={getCourseImage()}
                  alt={product?.nombre}
                />
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
                  onClick={handleAddToCart}
                  className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-primary-container to-inverse-primary text-white font-bold text-sm tracking-wide shadow-[0_0_24px_rgba(124,58,237,0.45)] hover:shadow-[0_0_32px_rgba(124,58,237,0.7)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">bolt</span>
                  {coursePrice > 0 ? `Inscribirme por $${coursePrice.toLocaleString("es-AR")} ARS` : "Inscribirme Gratis Ahora"}
                </button>

                <button
                  type="button"
                  onClick={() => window.open("https://wa.me/+5493424213813", "_blank")}
                  className="w-full py-3 px-6 rounded-full bg-surface-container-high/80 text-on-surface hover:bg-surface-container-highest font-semibold text-xs sm:text-sm text-center transition-all flex items-center justify-center gap-2 border border-white/5"
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
                    <span>{product?.archivosInfoproducto?.length || 1} material(es) oficial(es) de estudio</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary text-[16px]">record_voice_over</span>
                    <span>{product?.speakingActivities?.length || 2} práctica(s) guiada(s) con IA</span>
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

      {/* INTERACTIVE TUTOR IA SHOWCASE */}
      <section className="w-full bg-surface-container-lowest py-16 my-8 relative overflow-hidden border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col gap-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col gap-2 max-w-xl">
              <span className="text-xs uppercase text-secondary tracking-widest font-bold">
                Tecnología Neural de Voz
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                La Experiencia de Entrenar con un Tutor IA 24/7
              </h2>
              <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
                Sin miedo a equivocarte, con corrección instantánea y modelado acústico personalizado adaptado a hablantes hispanos.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-full w-fit border border-white/5">
              <span className="material-symbols-outlined text-tertiary text-[20px]">speed</span>
              <span className="text-xs text-on-surface">Latencia media: <strong className="text-white">140ms</strong></span>
            </div>
          </div>

          {/* Feature Grid: 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-surface-container-low p-6 rounded-2xl flex flex-col gap-4 border border-white/5 hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[26px]">hearing</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface">Detección Precisa de Fonemas</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Identifica exactamente dónde la pronunciación diverge del estándar nativo en consonantes críticas (/θ/, /v/, /b/, /r/) y combinaciones vocálicas difíciles.
              </p>
              <div className="bg-surface-container p-3 rounded-xl flex items-center justify-between text-on-surface text-xs mt-auto border border-white/5 font-mono">
                <span className="text-error">/ð/ → [d] detected</span>
                <span className="text-tertiary font-bold">+ Corrección labial</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-surface-container-low p-6 rounded-2xl flex flex-col gap-4 border border-white/5 hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-full bg-secondary-container/30 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[26px]">graphic_eq</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface">Cadencia, Ritmo &amp; Muletillas</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Monitorea el uso de pausas incómodas ("eh...", "like", "you know") y entrena tu modulación melódica para sonar natural, persuasivo y asertivo en reuniones.
              </p>
              <div className="bg-surface-container p-3 rounded-xl flex items-center justify-between text-on-surface text-xs mt-auto border border-white/5">
                <span>Ritmo del discurso:</span>
                <span className="text-secondary font-bold">135 ppm (Óptimo)</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-surface-container-low p-6 rounded-2xl flex flex-col gap-4 border border-white/5 hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-full bg-tertiary-container/30 flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-[26px]">psychology</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface">Roleplays Adaptativos</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                La IA asume roles concretos: un cliente exigente de Londres, un reclutador de Silicon Valley o un inversor escéptico, respondiendo a tus argumentos en vivo.
              </p>
              <div className="bg-surface-container p-3 rounded-xl flex items-center justify-between text-on-surface text-xs mt-auto border border-white/5">
                <span>Dificultad Dinámica:</span>
                <span className="text-primary font-bold">Ajuste Continuo</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SYLLABUS / PLAN DE ESTUDIO (Expandable Accordion) */}
      <section className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-16">
        <div className="flex flex-col gap-6 max-w-4xl">
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase text-secondary tracking-widest font-bold">
              Curriculum Completo
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-on-surface">
              Plan de Estudio Paso a Paso
            </h2>
            <p className="text-sm sm:text-base text-on-surface-variant">
              Estructurado pedagógicamente para llevarte de la indecisión al dominio fluido en situaciones de alta presión corporativa y académica.
            </p>
          </div>

          {/* Accordion Container */}
          <div className="flex flex-col gap-3 mt-4">
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

      {/* INSTRUCTOR & ACADEMIC TEAM SECTION */}
      <section className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-16">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase text-secondary tracking-widest font-bold">
              Cuerpo Docente &amp; Voice Coaches
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-on-surface">
              Aprende con Expertos Nativos y Lingüistas de IA
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Mentor 1 */}
            <div className="bg-surface-container-low p-6 rounded-2xl flex flex-col gap-4 border border-white/5">
              <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 shadow-md">
                <img
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmk8pCqWe-WTzi10CphBkEv3_wJu5S5Ohw7woEeFm3fi78ZnhkCeDUxUwnpzknz63YzgvJbDaiXesVT6w41ZSf_qWUBxBoGAlhl5sv2v-kOzyrYgnTyHoSVj1l8dx6PlXur5eLvOuFUihglXVlVTdPkQW9dk5k4dPelb9K3xIXoUnq3YXUihFTpi1otHpemjqMWRfxSaNh15ZJuh04aYu1yY6we_YR-ZvedmCMe-s6"
                  alt="Dr. Eleanor Vance"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-on-surface">Dr. Eleanor Vance</span>
                <span className="text-xs font-semibold text-primary">Directora de Lingüística Aplicada</span>
                <span className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                  Ex-profesora en Oxford University. 14 años entrenando ejecutivos del Fortune 500 en dicción y fonología comparada.
                </span>
              </div>
            </div>

            {/* Mentor 2 */}
            <div className="bg-surface-container-low p-6 rounded-2xl flex flex-col gap-4 border border-white/5">
              <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 shadow-md">
                <img
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD65d1O_4YM-FKMCNUKcgX2g6rEW1LK1iVziJXYdjQcpKseuevsEt2VWGRCv43xbXiRmsAwjj7fIXDyFWOQKY9JI4ZiYwt7mkVIi9HJSbpu0JKeVN6jCnC0sbJVokva0kWMQycKDRlTJqYu3297Gbk6gwvBul3c3iYvTsN_fR57_mY2CvPUFBtotQqXGq2O9SF_tjSvvhuW9npVwM0o5UvJCKlDNyuJmL-nLDX8KCbd"
                  alt="Marcus Sterling"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-on-surface">Marcus Sterling</span>
                <span className="text-xs font-semibold text-primary">Head of Business Negotiations</span>
                <span className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                  Consultor de comunicación para fundadores de Silicon Valley. Diseñador del framework de persuasión verbal de Bloom.
                </span>
              </div>
            </div>

            {/* Mentor 3 */}
            <div className="bg-surface-container-low p-6 rounded-2xl flex flex-col gap-4 border border-white/5">
              <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 shadow-md">
                <img
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDX3XNZZYvahHMQdvMVI2LGMqy63Yk0ZwpxYHXz2w_TVKKRzWTp7ivM9YF8heGF1EvEHuBHnQ6m3qgToEV-uyYXMj5Q8XIu1lU6q95V71f9utYqNjdrFoDajPxaoHlQ4O9d-UAbHgsZ6_vdlm5kwYSqyQblfGreqHi9yLCXRlloq0Q-HCip9s2I7Ol5iAQL7ejuWNfankdgx8r8D2JQ5HMLJQml0cGgKkA-hyGdWwdz"
                  alt="Sofia Delgado, M.Sc."
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-on-surface">Sofia Delgado, M.Sc.</span>
                <span className="text-xs font-semibold text-primary">Líder del Modelo Acústico Bloom IA</span>
                <span className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                  Investigadora en reconocimiento de patrones de habla y adaptación a acentos no nativos con deep learning.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STUDENT REVIEWS & TESTIMONIALS */}
      <section className="w-full bg-surface-container-lowest py-16 my-8 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col gap-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs uppercase text-secondary tracking-widest font-bold">
                Resultados Verificados
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-on-surface">
                Historias de Éxito de Alumnos
              </h2>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant text-xs">
              <span className="material-symbols-outlined text-primary text-[20px]">verified</span>
              <span>Reseñas certificadas de egresados 2024–2025</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Review 1 */}
            <div className="bg-surface-container-low p-6 rounded-2xl flex flex-col justify-between gap-4 border border-white/5">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-1 text-tertiary">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                  ))}
                </div>
                <p className="text-sm text-on-surface italic leading-relaxed">
                  "Tenía un bloqueo mental enorme cada vez que el VP de ventas en San Francisco me pedía opinión. El feedback fonético de la IA me quitó la vergüenza en menos de tres semanas. Ahora dirijo los comités semanales."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                  RC
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-on-surface">Rodrigo Canales</span>
                  <span className="text-xs text-on-surface-variant">Tech Lead • Remoto en EE.UU.</span>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-surface-container-low p-6 rounded-2xl flex flex-col justify-between gap-4 border border-white/5">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-1 text-tertiary">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                  ))}
                </div>
                <p className="text-sm text-on-surface italic leading-relaxed">
                  "El módulo de simulaciones de entrevistas con IA es brutal. Me hizo repetir 6 veces una respuesta sobre resolución de conflictos hasta que mi entonación sonó firme y natural. Me contrataron."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center font-bold text-secondary text-sm">
                  VM
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-on-surface">Valeria Morales</span>
                  <span className="text-xs text-on-surface-variant">Product Designer • Fintech UK</span>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-surface-container-low p-6 rounded-2xl flex flex-col justify-between gap-4 border border-white/5">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-1 text-tertiary">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                  ))}
                </div>
                <p className="text-sm text-on-surface italic leading-relaxed">
                  "Poder practicar a las 11 de la noche sin tener que cuadrar horarios con un profesor particular cambió todo. La detección de muletillas me ayudó a sonar 10 veces más profesional."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                <div className="w-10 h-10 rounded-full bg-tertiary/20 flex items-center justify-center font-bold text-tertiary text-sm">
                  JA
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-on-surface">Javier Arancibia</span>
                  <span className="text-xs text-on-surface-variant">Consultor Financiero • Madrid</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-16">
        <div className="max-w-4xl flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase text-secondary tracking-widest font-bold">
              Dudas Habituales
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-on-surface">Preguntas Frecuentes</h2>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="bg-surface-container-low rounded-2xl overflow-hidden border border-white/5">
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-on-surface hover:bg-surface-container-high/40 transition-colors"
                  >
                    <span className="text-sm sm:text-base">{faq.q}</span>
                    <span className={`material-symbols-outlined transition-transform duration-300 text-on-surface-variant ${isOpen ? "rotate-180 text-primary" : ""}`}>
                      expand_more
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-on-surface-variant text-sm leading-relaxed border-t border-white/5">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL CONVERSION BAR */}
      <section className="max-w-7xl mx-auto w-full px-6 lg:px-12 pb-20">
        <div className="bg-gradient-to-r from-primary-container/20 via-surface-container to-surface-container-high p-8 sm:p-12 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl border border-white/10">
          <div className="flex flex-col gap-2 max-w-xl text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-bold text-on-surface">
              Comienza a hablar con la fluidez que tu carrera merece
            </h3>
            <p className="text-sm text-on-surface-variant">
              Inscripción inmediata con 50% de descuento y acceso vitalicio al tutor inteligente 24/7.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
            <button
              type="button"
              onClick={handleAddToCart}
              className="py-4 px-8 rounded-full bg-primary-container text-white font-bold text-sm shadow-[0_0_24px_rgba(124,58,237,0.5)] hover:shadow-[0_0_36px_rgba(124,58,237,0.8)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>{coursePrice > 0 ? `Inscribirme por $${coursePrice.toLocaleString("es-AR")} ARS` : "Inscribirme Gratis Ahora"}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
