import React, { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import {
  CpuChipIcon,
  ShieldCheckIcon,
  MicrophoneIcon,
  GlobeAltIcon,
  ChatBubbleBottomCenterTextIcon
} from "@heroicons/react/24/outline";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const About = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(
        ".gsap-about-header",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
      );

      // Cards ScrollTrigger stagger
      gsap.fromTo(
        ".gsap-about-card",
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".gsap-about-grid",
            start: "top 80%",
            toggleActions: "play none none none"
          }
        }
      );

      // CTA animation
      gsap.fromTo(
        ".gsap-about-cta",
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".gsap-about-cta",
            start: "top 90%",
          }
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const features = [
    {
      id: "01",
      title: "State-of-the-Art AI",
      description: "Powered by advanced NLP models like OpenAI's GPT and Whisper for perfect transcription and human-like interactions.",
      icon: <CpuChipIcon className="h-10 w-10 text-[#b273c2]" strokeWidth={1.5} />,
    },
    {
      id: "02",
      title: "Real-Time Feedback",
      description: "Instantly identify grammatical errors and receive vocabulary suggestions to improve your fluency on the spot.",
      icon: <ChatBubbleBottomCenterTextIcon className="h-10 w-10 text-[#b273c2]" strokeWidth={1.5} />,
    },
    {
      id: "03",
      title: "Zero Judgment",
      description: "Practice at your own pace without the pressure or anxiety of speaking to a real person. Make mistakes and learn.",
      icon: <ShieldCheckIcon className="h-10 w-10 text-[#b273c2]" strokeWidth={1.5} />,
    },
    {
      id: "04",
      title: "Global Contexts",
      description: "From checking in at a Tokyo hotel to leading a business meeting in New York. Scenarios for every situation.",
      icon: <GlobeAltIcon className="h-10 w-10 text-[#b273c2]" strokeWidth={1.5} />,
    },
  ];

  return (
    <section ref={containerRef} className="relative min-h-screen pt-32 pb-24 bg-[#f8f3f6] overflow-hidden font-['Inter',sans-serif]">
      <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
        {/* Encabezado */}
        <div className="gsap-about-header text-center mb-24">
          <div className="inline-block bg-[#f6edf8] text-[#b273c2] px-4 py-1.5 rounded-full text-xs font-bold tracking-widest mb-6 shadow-sm border border-[#f0dff3] uppercase">
            OUR PHILOSOPHY
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight tracking-tight text-[#1d1d1d]">
            Redefining <span className="text-[#b273c2]">Language</span> Learning
          </h2>
          <p className="font-medium text-gray-500 max-w-2xl mx-auto leading-relaxed text-lg">
            We believe that conversation is the key to fluency. AI Speaking Practice was created to provide a natural, accessible, and highly effective environment for mastering English anywhere, anytime.
          </p>
        </div>

        {/* Tarjetas Minimalistas */}
        <div className="gsap-about-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className="gsap-about-card relative bg-white p-10 rounded-[35px] shadow-xl border border-[#f0dff3] flex flex-col items-center text-center group transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl"
            >
              {/* ID Sutil */}
              <span className="absolute top-6 right-8 font-black text-[#f6edf8] text-4xl group-hover:text-[#f0dff3] transition-colors">
                {feature.id}
              </span>

              {/* Ícono */}
              <div className="mb-8 w-20 h-20 rounded-2xl bg-[#f8f3f6] flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 border border-[#f0dff3] relative z-10">
                {feature.icon}
              </div>

              <h3 className="font-black text-xl text-[#1d1d1d] mb-4 tracking-tight">
                {feature.title}
              </h3>

              <p className="font-medium text-sm text-gray-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="gsap-about-cta text-center mt-32 bg-white rounded-[40px] shadow-2xl border border-[#f0dff3] p-16 max-w-4xl mx-auto relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#f9f1f7] to-[#efe4f2] opacity-50 pointer-events-none" />
          <div className="relative z-10">
              <h3 className="text-3xl font-black text-[#1d1d1d] mb-6">Ready to break the language barrier?</h3>
              <NavLink to="/products">
                <button className="bg-[#b273c2] hover:bg-[#9d5fb0] text-white px-10 py-5 rounded-full font-bold shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 text-lg flex items-center gap-3 mx-auto">
                    <MicrophoneIcon className="w-6 h-6" />
                    Start Practicing Now
                </button>
              </NavLink>
              <p className="mt-8 font-bold text-xs text-gray-400 uppercase tracking-widest">
                Over 100+ Scenarios Available
              </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;