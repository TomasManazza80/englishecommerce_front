import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="mt-12 sm:mt-24 bg-bloom-footer text-slate-300 border-t border-purple-950 font-sans" data-purpose="site-footer" id="contact">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-8 sm:pb-12">
        {/* Top Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 pb-8 sm:pb-12 border-b border-white/10">
          {/* Brand Summary */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-bloom-600 flex items-center justify-center text-white shadow-md shadow-bloom-600/30">
                <i className="fa-solid fa-shapes text-sm"></i>
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                English Bloom<span className="text-bloom-400">.</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              Cursos interactivos de inglés y práctica conversacional con Tutor IA 24/7. Desarrolla tu fluidez, vocabulario y pronunciación a tu propio ritmo.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                aria-label="WhatsApp"
                title="WhatsApp Oficial"
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-emerald-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors text-sm"
                href="https://wa.me/+5493424213813"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fa-brands fa-whatsapp"></i>
              </a>
              <a
                aria-label="Instagram"
                title="Instagram @inglesbloom"
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-pink-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors text-sm"
                href="https://www.instagram.com/inglesbloom"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fa-brands fa-instagram"></i>
              </a>
              <a
                aria-label="Email"
                title="Enviar correo"
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-bloom-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors text-sm"
                href="mailto:englishbloom.a@gmail.com"
              >
                <i className="fa-solid fa-envelope"></i>
              </a>
            </div>
          </div>

          {/* Links Column 1 */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Cursos &amp; Práctica
            </h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link className="hover:text-bloom-400 transition-colors" to="/products">
                  Catálogo de Cursos
                </Link>
              </li>
              <li>
                <Link className="hover:text-bloom-400 transition-colors" to="/products?category=Viaje">
                  Inglés para Viajes
                </Link>
              </li>
              <li>
                <Link className="hover:text-bloom-400 transition-colors" to="/pronunciation">
                  Simulador de Pronunciación IA
                </Link>
              </li>
              <li>
                <Link className="hover:text-bloom-400 transition-colors" to="/mis-cursos">
                  Área de Estudiante
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Comunidad
            </h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <a
                  className="hover:text-bloom-400 transition-colors flex items-center gap-1.5"
                  href="https://www.instagram.com/inglesbloom"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fa-brands fa-instagram text-pink-400"></i>
                  <span>@inglesbloom</span>
                </a>
              </li>
              <li>
                <a
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                  href="https://wa.me/+5493424213813"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fa-brands fa-whatsapp text-emerald-400"></i>
                  <span>Comunidad WhatsApp</span>
                </a>
              </li>
              <li>
                <Link className="hover:text-bloom-400 transition-colors" to="/contact">
                  Soporte &amp; Consultas
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 3: Contacto */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Contacto Directo
            </h5>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              ¿Dudas sobre inscripciones, pagos o tutorías? Escríbenos directamente:
            </p>
            <div className="space-y-2.5 text-xs">
              <a
                href="mailto:englishbloom.a@gmail.com"
                className="flex items-center gap-2 text-bloom-400 hover:underline font-medium break-all"
              >
                <i className="fa-regular fa-envelope text-xs shrink-0"></i>
                <span>englishbloom.a@gmail.com</span>
              </a>
              <a
                href="https://wa.me/+5493424213813"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-slate-300 hover:text-emerald-400 transition-colors"
              >
                <i className="fa-brands fa-whatsapp text-emerald-400 text-xs shrink-0"></i>
                <span>WhatsApp: Chatear ahora</span>
              </a>
              <a
                href="https://www.instagram.com/inglesbloom"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-slate-300 hover:text-pink-400 transition-colors"
              >
                <i className="fa-brands fa-instagram text-pink-400 text-xs shrink-0"></i>
                <span>Instagram: @inglesbloom</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Legal Row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} English Bloom. Todos los derechos reservados.</p>
          <div className="flex items-center space-x-6">
            <Link className="hover:text-bloom-400 transition-colors" to="/contact">
              Contacto
            </Link>
            <Link className="hover:text-bloom-400 transition-colors" to="/products">
              Cursos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
