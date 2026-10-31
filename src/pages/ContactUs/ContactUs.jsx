import React, { useRef } from "react";
import { NavLink } from "react-router-dom";
import { FiMail, FiInstagram, FiArrowLeft, FiMessageCircle } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { motion } from "framer-motion";
import EditableText from "../../components/EditableText/EditableText.jsx";

const ContactUs = () => {
  const containerRef = useRef(null);

  const contacts = [
    {
      id: "01",
      icon: <FiMail className="w-7 h-7 text-primary" strokeWidth={1.5} />,
      label: "Email Oficial",
      text: (
        <a
          href="mailto:englishbloom.a@gmail.com"
          className="hover:text-primary transition-colors break-all"
        >
          englishbloom.a@gmail.com
        </a>
      ),
    },
    {
      id: "02",
      icon: <FaWhatsapp className="w-7 h-7 text-emerald-400" />,
      label: "WhatsApp Directo",
      text: (
        <a
          href="https://wa.me/qr/6W7U7V577IMEO1"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-emerald-300 text-emerald-400 font-bold transition-colors"
        >
          Iniciar Chat
        </a>
      ),
    },
    {
      id: "03",
      icon: <FiInstagram className="w-7 h-7 text-secondary" strokeWidth={1.5} />,
      label: "Instagram Oficial",
      text: (
        <a
          href="https://www.instagram.com/inglesbloom"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors"
        >
          @inglesbloom
        </a>
      ),
    },
    {
      id: "04",
      icon: <FiMessageCircle className="w-7 h-7 text-tertiary" strokeWidth={1.5} />,
      label: "Asesoramiento",
      text: (
        <a
          href="https://wa.me/qr/6W7U7V577IMEO1"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors"
        >
          Consultar Curso
        </a>
      ),
    },
  ];

  return (
    <section ref={containerRef} className="relative min-h-screen w-full bg-[#151023] overflow-hidden text-on-surface pt-32 pb-16 font-sans">
      {/* Ambient decorative glows */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-primary-container/20 blur-[130px] pointer-events-none rounded-full"></div>
      <div className="absolute top-96 right-10 w-[420px] h-[320px] bg-secondary-container/15 blur-[120px] pointer-events-none rounded-full"></div>
      <div className="absolute bottom-40 left-10 w-[500px] h-[350px] bg-primary-container/15 blur-[140px] pointer-events-none rounded-full"></div>

      <div className="relative z-10 container mx-auto px-6 lg:px-12">

        {/* Encabezado */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-high/70 backdrop-blur-md shadow-sm mb-6 border border-white/5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-[11px] font-bold text-secondary tracking-widest uppercase">
              <EditableText textKey="contact_badge" defaultText="CANALES OFICIALES DE ATENCIÓN" section="CONTACT" />
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight text-on-surface">
            <EditableText textKey="contact_title" defaultText="Contacta con <span class='text-[#b273c2]'>English Bloom</span>" section="CONTACT" />
          </h1>
          <p className="text-on-surface-variant max-w-xl mx-auto text-base md:text-lg leading-relaxed">
            <EditableText textKey="contact_subtitle" defaultText="¿Tienes dudas sobre los cursos, acceso a materiales o prácticas con Tutor IA? Escríbenos y te responderemos a la brevedad." section="CONTACT" />
          </p>
        </motion.div>

        {/* Tarjetas de Comunicación */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto">
          {contacts.map((contact, index) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 + index * 0.15, ease: "easeOut" }}
              className="relative bg-surface-container-low hover:bg-surface-container p-8 rounded-2xl shadow-md border border-white/5 hover:border-primary/30 flex flex-col items-center text-center group transition-all duration-300 hover:-translate-y-1.5"
            >
              {/* Contenedor de Ícono */}
              <div className="mb-5 w-16 h-16 rounded-full bg-surface-container flex items-center justify-center shadow-[0_0_24px_rgba(124,58,237,0.35)] border border-white/5 transition-transform duration-500 group-hover:scale-110">
                {contact.icon}
              </div>

              {/* Etiqueta */}
              <span className="font-bold text-[11px] text-on-surface-variant mb-2 uppercase tracking-widest">
                <EditableText textKey={`contact_card_${contact.id}_label`} defaultText={contact.label} section="CONTACT" />
              </span>

              {/* Texto de contacto */}
              <div className="font-bold text-[14px] text-on-surface w-full">
                {contact.id === "01" && (
                  <a href="mailto:englishbloom.a@gmail.com" className="hover:text-primary transition-colors break-all">
                    <EditableText textKey="contact_email" defaultText="englishbloom.a@gmail.com" section="CONTACT" />
                  </a>
                )}
                {contact.id === "02" && (
                  <a href="https://wa.me/qr/6W7U7V577IMEO1" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-300 text-emerald-400 font-bold transition-colors">
                    <EditableText textKey="contact_whatsapp_text" defaultText="Iniciar Chat WhatsApp" section="CONTACT" />
                  </a>
                )}
                {contact.id === "03" && (
                  <a href="https://www.instagram.com/inglesbloom" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    <EditableText textKey="contact_instagram" defaultText="@inglesbloom" section="CONTACT" />
                  </a>
                )}
                {contact.id === "04" && (
                  <a href="https://wa.me/qr/6W7U7V577IMEO1" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    <EditableText textKey="contact_whatsapp" defaultText="Consultar por un Curso" section="CONTACT" />
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Módulo Especial Soporte WhatsApp */}
        <motion.div
            className="max-w-4xl mx-auto mt-12 bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl md:rounded-3xl shadow-xl border border-white/5 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 justify-between group relative overflow-hidden"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
        >
            <div className="absolute -top-20 -left-10 w-[320px] h-[200px] bg-emerald-500/10 blur-[90px] pointer-events-none rounded-full" />
            <div className="relative flex items-center gap-5">
                <div className="w-14 h-14 rounded-full bg-surface-container text-emerald-400 flex items-center justify-center text-3xl border border-white/5 shadow-[0_0_24px_rgba(16,185,129,0.3)] shrink-0">
                    <FaWhatsapp />
                </div>
                <div>
                    <h3 className="font-extrabold text-xl md:text-2xl text-on-surface mb-1 tracking-tight">
                        <EditableText textKey="contact_live_chat_title" defaultText="Atención Rápida por WhatsApp" section="CONTACT" />
                    </h3>
                    <p className="text-on-surface-variant text-sm">
                        <EditableText textKey="contact_live_chat_desc" defaultText="Comunícate de manera directa con nuestro equipo ante cualquier consulta académica o de pago." section="CONTACT" />
                    </p>
                </div>
            </div>
            <a
              href="https://wa.me/qr/6W7U7V577IMEO1"
              target="_blank"
              rel="noopener noreferrer"
              className="relative bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-full text-sm font-semibold tracking-wide shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all hover:-translate-y-0.5 w-full md:w-auto flex items-center justify-center gap-2 shrink-0"
            >
                <FaWhatsapp className="text-xl" />
                <EditableText textKey="contact_open_chat_btn" defaultText="Abrir WhatsApp" section="CONTACT" />
            </a>
        </motion.div>

        {/* Botón de Retorno */}
        <motion.div
            className="text-center mt-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
        >
          <NavLink
            to="/"
            className="inline-flex items-center group px-6 py-3.5 rounded-full text-white bg-white/10 hover:bg-white/20 border border-white/25 backdrop-blur-md shadow-soft transition-all"
          >
            <FiArrowLeft className="mr-3 text-secondary transition-transform duration-300 group-hover:-translate-x-1" strokeWidth={2} />
            <span className="font-semibold text-xs tracking-wider uppercase">
              Volver al Inicio
            </span>
          </NavLink>
        </motion.div>

        {/* Footer Minimalista */}
        <div className="text-center mt-24 pt-10 border-t border-white/5">
          <p className="font-bold text-[10px] text-on-surface-variant uppercase tracking-widest">
            &copy; {new Date().getFullYear()} ENGLISH BLOOM. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;
