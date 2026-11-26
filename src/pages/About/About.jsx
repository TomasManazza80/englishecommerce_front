import React, { useRef } from "react";
import { NavLink } from "react-router-dom";
import {
  CpuChipIcon,
  ShieldCheckIcon,
  MicrophoneIcon,
  GlobeAltIcon,
  ChatBubbleBottomCenterTextIcon
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import EditableText from "../../components/EditableText/EditableText.jsx";

const About = () => {
  const containerRef = useRef(null);

  const features = [
    {
      id: "01",
      title: "State-of-the-Art AI",
      description: "Powered by advanced NLP models like OpenAI's GPT and Whisper for perfect transcription and human-like interactions.",
      icon: <CpuChipIcon className="h-9 w-9 text-primary" strokeWidth={1.5} />,
    },
    {
      id: "02",
      title: "Real-Time Feedback",
      description: "Instantly identify grammatical errors and receive vocabulary suggestions to improve your fluency on the spot.",
      icon: <ChatBubbleBottomCenterTextIcon className="h-9 w-9 text-secondary" strokeWidth={1.5} />,
    },
    {
      id: "03",
      title: "Zero Judgment",
      description: "Practice at your own pace without the pressure or anxiety of speaking to a real person. Make mistakes and learn.",
      icon: <ShieldCheckIcon className="h-9 w-9 text-tertiary" strokeWidth={1.5} />,
    },
    {
      id: "04",
      title: "Global Contexts",
      description: "From checking in at a Tokyo hotel to leading a business meeting in New York. Scenarios for every situation.",
      icon: <GlobeAltIcon className="h-9 w-9 text-primary" strokeWidth={1.5} />,
    },
  ];

  return (
    <section ref={containerRef} className="relative min-h-screen pt-32 pb-24 bg-[#151023] text-on-surface overflow-hidden font-sans">
      {/* Ambient decorative glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-24 left-1/4 w-[520px] h-[380px] bg-bloom-800/45 blur-[120px] rounded-full blob-wander-a"></div>
        <div className="absolute top-64 right-10 w-[440px] h-[360px] bg-primary-container/30 blur-[110px] rounded-full blob-wander-b"></div>
        <div className="absolute bottom-20 left-10 w-[480px] h-[360px] bg-bloom-700/35 blur-[130px] rounded-full blob-wander-c"></div>
        <div className="absolute top-1/2 left-1/2 w-[360px] h-[320px] bg-bloom-900/60 blur-[100px] rounded-full blob-wander-d"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        {/* Encabezado */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-high/70 backdrop-blur-md shadow-sm mb-6 border border-white/5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-[11px] font-bold text-secondary tracking-widest uppercase">
              <EditableText textKey="about_badge" defaultText="OUR PHILOSOPHY" section="ABOUT" />
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight text-on-surface">
            <EditableText textKey="about_title" defaultText="Redefining <span class='text-[#b273c2]'>Language</span> Learning" section="ABOUT" />
          </h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto leading-relaxed text-base md:text-lg font-normal">
            <EditableText textKey="about_subtitle" defaultText="We believe that conversation is the key to fluency. AI Speaking Practice was created to provide a natural, accessible, and highly effective environment for mastering English anywhere, anytime." section="ABOUT" />
          </p>
        </motion.div>

        {/* Tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, delay: index * 0.15, ease: "easeOut" }}
              className="relative bg-surface-container-low hover:bg-surface-container p-8 rounded-2xl shadow-md border border-white/5 hover:border-primary/30 flex flex-col items-center text-center group transition-all duration-300 hover:-translate-y-1.5"
            >
              {/* ID Sutil */}
              <span className="absolute top-5 right-6 font-extrabold text-white text-4xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] group-hover:text-primary transition-colors">
                {feature.id}
              </span>

              {/* Ícono */}
              <div className="mb-6 w-16 h-16 rounded-full bg-surface-container flex items-center justify-center shadow-[0_0_24px_rgba(124,58,237,0.35)] border border-white/5 transition-transform duration-500 group-hover:scale-110 relative z-10">
                {feature.icon}
              </div>

              <h3 className="font-extrabold text-xl text-on-surface mb-3 tracking-tight">
                <EditableText textKey={`about_feature_${feature.id}_title`} defaultText={feature.title} section="ABOUT" />
              </h3>

              <p className="text-sm text-on-surface-variant leading-relaxed">
                <EditableText textKey={`about_feature_${feature.id}_desc`} defaultText={feature.description} section="ABOUT" />
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          className="text-center mt-24 bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl md:rounded-3xl shadow-xl border border-white/5 p-10 md:p-16 max-w-4xl mx-auto relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[220px] bg-primary-container/25 blur-[100px] pointer-events-none rounded-full" />
          <div className="relative z-10">
            <h3 className="text-2xl md:text-3xl font-extrabold text-on-surface mb-8 tracking-tight">
              <EditableText textKey="about_cta_title" defaultText="Ready to break the language barrier?" section="ABOUT" />
            </h3>
            <NavLink to="/products">
              <button className="inline-flex items-center gap-3 mx-auto px-8 py-3.5 rounded-full text-sm font-semibold tracking-wide text-white bg-bloom-600 hover:bg-bloom-700 shadow-pill transition-all transform hover:-translate-y-0.5">
                <MicrophoneIcon className="w-5 h-5" />
                <EditableText textKey="about_cta_btn" defaultText="Start Practicing Now" section="ABOUT" />
              </button>
            </NavLink>
            <p className="mt-8 font-bold text-[11px] text-on-surface-variant uppercase tracking-widest">
              <EditableText textKey="about_cta_sub" defaultText="Over 100+ Scenarios Available" section="ABOUT" />
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;
