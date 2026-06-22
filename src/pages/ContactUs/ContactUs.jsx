import React, { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { FiMail, FiPhone, FiInstagram, FiArrowLeft, FiMessageCircle } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import gsap from "gsap";

const ContactUs = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(
        ".gsap-header",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
      );

      // Cards stagger animation
      gsap.fromTo(
        ".gsap-contact-card",
        { opacity: 0, y: 40 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.8, 
          stagger: 0.15, 
          ease: "power3.out",
          delay: 0.2
        }
      );

      // Back button animation
      gsap.fromTo(
        ".gsap-back-btn",
        { opacity: 0 },
        { opacity: 1, duration: 1, delay: 0.8 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const contacts = [
    {
      id: "01",
      icon: <FiMail className="w-8 h-8 text-[#b273c2]" strokeWidth={1.5} />,
      label: "Email Us",
      text: "support@aispeaking.com",
    },
    {
      id: "02",
      icon: <FiPhone className="w-8 h-8 text-[#b273c2]" strokeWidth={1.5} />,
      label: "Call Us",
      text: "+1 (800) 123-4567",
    },
    {
      id: "03",
      icon: <FiInstagram className="w-8 h-8 text-[#b273c2]" strokeWidth={1.5} />,
      label: "Instagram",
      text: (
        <a
          href="https://www.instagram.com/aispeaking/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#b273c2] transition-colors"
        >
          @aispeaking
        </a>
      ),
    },
    {
      id: "04",
      icon: <FaWhatsapp className="w-8 h-8 text-[#b273c2]" />,
      label: "WhatsApp",
      text: (
        <a
          href="https://wa.me/18001234567?text=Hi! I need help with my AI Speaking Practice account."
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#b273c2] transition-colors"
        >
          Start Chat
        </a>
      ),
    },
  ];

  return (
    <section ref={containerRef} className="relative min-h-screen w-full bg-[#f8f3f6] overflow-x-hidden text-[#1d1d1d] pt-32 pb-16 font-['Inter',sans-serif]">

      <div className="relative container mx-auto px-6 lg:px-12">

        {/* Encabezado */}
        <div className="gsap-header text-center mb-20">
          <div className="inline-block bg-[#f6edf8] text-[#b273c2] px-4 py-1.5 rounded-full text-xs font-bold tracking-widest mb-6 shadow-sm border border-[#f0dff3] uppercase">
             WE'RE HERE FOR YOU
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-tight">
            Get in <span className="text-[#b273c2]">Touch</span>
          </h1>
          <p className="font-medium text-gray-500 max-w-xl mx-auto text-lg">
            Have questions about our AI tutors, pricing, or need technical support? We'd love to hear from you.
          </p>
        </div>

        {/* Tarjetas de Comunicación */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {contacts.map((contact, index) => (
            <div
              key={contact.id}
              className="gsap-contact-card relative bg-white p-10 rounded-[35px] shadow-xl border border-[#f0dff3] flex flex-col items-center text-center group transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl"
            >
              {/* Contenedor de Ícono */}
              <div className="mb-6 w-16 h-16 rounded-2xl bg-[#f8f3f6] flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 border border-[#f0dff3]">
                {contact.icon}
              </div>

              {/* Etiqueta */}
              <span className="font-bold text-[11px] text-gray-400 mb-2 uppercase tracking-widest">
                {contact.label}
              </span>

              {/* Texto de contacto */}
              <p className="font-bold text-[15px] text-[#1d1d1d]">
                {contact.text}
              </p>
            </div>
          ))}
        </div>

        {/* Módulo Especial Soporte */}
        <div className="gsap-contact-card max-w-4xl mx-auto mt-16 bg-white rounded-[35px] shadow-xl border border-[#f0dff3] p-10 flex flex-col md:flex-row items-center gap-8 justify-between group">
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-[#f6edf8] text-[#b273c2] flex items-center justify-center text-2xl border border-[#f0dff3]">
                    <FiMessageCircle />
                </div>
                <div>
                    <h3 className="font-black text-2xl text-[#1d1d1d] mb-1">Live Chat Support</h3>
                    <p className="text-gray-500 font-medium text-sm">Available Monday to Friday, 9am - 5pm EST.</p>
                </div>
            </div>
            <button className="bg-[#b273c2] hover:bg-[#9d5fb0] text-white px-8 py-4 rounded-full font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 w-full md:w-auto flex items-center justify-center gap-2">
                Open Chat
            </button>
        </div>

        {/* Botón de Retorno */}
        <div className="gsap-back-btn text-center mt-24">
          <NavLink
            to="/"
            className="inline-flex items-center group relative overflow-hidden bg-white border border-[#f0dff3] px-10 py-4 rounded-full transition-all duration-300 hover:border-[#b273c2] shadow-sm hover:shadow-md"
          >
            <FiArrowLeft className="mr-3 text-[#b273c2] transition-transform duration-300 group-hover:-translate-x-1" strokeWidth={2} />
            <span className="relative z-10 text-[#1d1d1d] font-bold text-xs tracking-wider uppercase transition-colors duration-300">
              Return Home
            </span>
          </NavLink>
        </div>

        {/* Footer Minimalista */}
        <div className="text-center mt-32 pt-10 border-t border-[#f0dff3]">
          <p className="font-bold text-[10px] text-gray-400 uppercase tracking-widest">
            &copy; {new Date().getFullYear()} AI SPEAKING PRACTICE. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;