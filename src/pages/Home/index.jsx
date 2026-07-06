import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import BuySteps from "../../components/BuyStepsCard/BuySteps.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import Hero from "../../components/Hero/Hero.jsx";
import ProductsHome from "../Products/productsHome.jsx";
import RepairsModule from "../../components/RepairsModule/RepairsModule.jsx";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const HOME = () => {
  const containerRef = useRef(null);
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

  useGSAP(() => {
    gsap.fromTo(".fade-in", { opacity: 0 }, { opacity: 1, duration: 1.5, ease: "power2.out" });
    
    gsap.utils.toArray(".fade-up").forEach(el => {
      gsap.fromTo(el, { opacity: 0, y: 50 }, {
        opacity: 1, y: 0, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 80%", toggleActions: "play none none reverse" }
      });
    });

    gsap.to(".arrow-anim", { x: 5, repeat: -1, yoyo: true, ease: "power1.inOut", duration: 0.6 });
    
    const exploreBtn = document.querySelector(".explore-btn");
    if(exploreBtn) {
      exploreBtn.addEventListener("mouseenter", () => gsap.to(exploreBtn, { scale: 1.02, boxShadow: "0px 15px 35px rgba(178, 115, 194, 0.2)", duration: 0.3 }));
      exploreBtn.addEventListener("mouseleave", () => gsap.to(exploreBtn, { scale: 1, boxShadow: "none", duration: 0.3 }));
    }
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="w-full max-w-full overflow-x-hidden bg-[#f8f3f6] text-[#1d1d1d] font-['Inter',sans-serif] selection:bg-[#b273c2] selection:text-white" style={{ zoom: 0.8 }}>

      {/* 2. CONCEPT: INITIAL LOAD ANIMATION */}
      <div className="relative w-full fade-in">
        <Hero />
        {/* En la plataforma de AI, el BuySteps podría usarse para los pasos de aprendizaje */}

      </div>

      {/* BOTÓN "VER TODOS" - ESTILOS SAAS APLICADOS */}
      <div className="w-full flex justify-center py-24 bg-[#f8f3f6] fade-up">
        <button
          onClick={() => window.location.href = '/products'}
          className="explore-btn group relative overflow-hidden bg-white/60 backdrop-blur-2xl border border-white/50 px-12 py-5 transition-all duration-300 rounded-[20px] shadow-sm"
        >
          <span className="relative z-10 text-[#1d1d1d] font-bold text-sm tracking-wide uppercase flex items-center gap-4 transition-colors duration-300">
            EXPLORE ALL SCENARIOS

            <span className="arrow-anim inline-block text-[#b273c2] font-black text-lg leading-none">
              ⟶
            </span>
          </span>

          {/* Efecto hover suave SaaS */}
          <div className="absolute inset-0 bg-[#f6edf8]/80 backdrop-blur-xl translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
        </button>
      </div>

      {/* SECCIÓN PROMOS - DINÁMICA CMS */}
      {visualContent.urls?.[2] && (
        <section className="w-full py-20 px-6 bg-[#f8f3f6] fade-up">
          <div className="max-w-7xl mx-auto relative group overflow-hidden border border-white/40 rounded-[35px] shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
            <div className="absolute inset-0 bg-gradient-to-r from-[#1d1d1d]/80 via-[#1d1d1d]/30 to-transparent z-10" />
            <img
              src={visualContent.urls[2]}
              className="w-full h-[300px] md:h-[500px] object-cover transition-transform duration-1000 group-hover:scale-105"
              style={{ objectPosition: visualContent.positions?.[2] || 'center center' }}
              alt="Promociones Especiales"
            />
            <div className="absolute bottom-12 left-12 z-20">
              <span className="font-bold text-[#b273c2] text-xs tracking-widest uppercase mb-4 block bg-white/60 backdrop-blur-2xl border border-white/40 inline-block px-4 py-1 rounded-full shadow-sm">
                PREMIUM FEATURES
              </span>
              <h3 className="font-black text-white text-4xl md:text-6xl uppercase tracking-tight leading-tight">
                UPGRADE YOUR <br /><span className="text-[#d7a7e3]">FLUENCY</span>
              </h3>
            </div>
          </div>
        </section>
      )}

      {/* MÓDULO DE REPARACIONES / SOPORTE */}


      <div className="w-full">
        <Footer />
      </div>
    </div>
  );
};

export default HOME;