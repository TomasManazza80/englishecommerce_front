import React from "react";
import { motion } from "framer-motion";
import BuySteps from "../../components/BuyStepsCard/BuySteps.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import Hero from "../../components/Hero/Hero.jsx";
import ProductsHome from "../Products/productsHome.jsx";
import RepairsModule from "../../components/RepairsModule/RepairsModule.jsx";

// 1. CONCEPT: EASINGS & SPRINGS (Configuración de física premium)
const fadeUpVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      duration: 0.8
    }
  }
};

const HOME = () => {
  const [visualContent, setVisualContent] = React.useState({});

  React.useEffect(() => {
    const fetchVisualContent = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/contenido/obtenerContenidoVisual`);
        const data = await response.json();
        const urls = {};
        const positions = {};
        data.forEach(item => {
          urls[item.CmsVisualId] = item.imageUrl;
          positions[item.CmsVisualId] = item.position || 'center center';
        });
        setVisualContent({ urls, positions });
      } catch (error) {
        console.error("Error fetching visual content:", error);
      }
    };
    fetchVisualContent();
  }, []);

  return (
    <div className="w-full max-w-full overflow-x-hidden bg-[#f8f3f6] text-[#1d1d1d] font-['Inter',sans-serif] selection:bg-[#b273c2] selection:text-white">

      {/* 2. CONCEPT: INITIAL LOAD ANIMATION */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative w-full"
      >
        <Hero />
        {/* En la plataforma de AI, el BuySteps podría usarse para los pasos de aprendizaje */}
        <BuySteps />
      </motion.div>

      {/* BOTÓN "VER TODOS" - ESTILOS SAAS APLICADOS */}
      <motion.div
        className="w-full flex justify-center py-24 bg-[#f8f3f6]"
        variants={fadeUpVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <motion.button
          onClick={() => window.location.href = '/products'}
          whileHover={{ scale: 1.02, boxShadow: "0px 15px 35px rgba(178, 115, 194, 0.2)" }}
          whileTap={{ scale: 0.98 }}
          className="group relative overflow-hidden bg-white border border-[#f0dff3] px-12 py-5 transition-all duration-300 rounded-[20px]"
        >
          <span className="relative z-10 text-[#1d1d1d] font-bold text-sm tracking-wide uppercase flex items-center gap-4 transition-colors duration-300">
            EXPLORE ALL SCENARIOS

            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="text-[#b273c2] font-black text-lg leading-none"
            >
              ⟶
            </motion.span>
          </span>

          {/* Efecto hover suave SaaS */}
          <div className="absolute inset-0 bg-[#f6edf8] translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
        </motion.button>
      </motion.div>

      {/* SECCIÓN PROMOS - DINÁMICA CMS */}
      {visualContent.urls?.[2] && (
        <motion.section
          className="w-full py-20 px-6 bg-[#f8f3f6]"
          variants={fadeUpVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="max-w-7xl mx-auto relative group overflow-hidden border border-[#f0dff3] rounded-[35px] shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-[#1d1d1d]/80 via-transparent to-transparent z-10 opacity-70" />
            <img
              src={visualContent.urls[2]}
              className="w-full h-[300px] md:h-[500px] object-cover transition-transform duration-1000 group-hover:scale-105"
              style={{ objectPosition: visualContent.positions?.[2] || 'center center' }}
              alt="Promociones Especiales"
            />
            <div className="absolute bottom-12 left-12 z-20">
              <span className="font-bold text-[#b273c2] text-xs tracking-widest uppercase mb-4 block bg-white/90 backdrop-blur-sm inline-block px-4 py-1 rounded-full shadow-sm">
                PREMIUM FEATURES
              </span>
              <h3 className="font-black text-white text-4xl md:text-6xl uppercase tracking-tight leading-tight">
                UPGRADE YOUR <br /><span className="text-[#d7a7e3]">FLUENCY</span>
              </h3>
            </div>
          </div>
        </motion.section>
      )}

      {/* MÓDULO DE REPARACIONES / SOPORTE */}
      <RepairsModule
        bannerImage={visualContent.urls?.[3]}
        bannerPosition={visualContent.positions?.[3]}
      />

      <div className="w-full">
        <Footer />
      </div>
    </div>
  );
};

export default HOME;