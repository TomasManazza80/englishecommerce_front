import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiCheckCircle,
  FiShield,
  FiCopy,
  FiClock,
  FiExternalLink,
  FiBookOpen,
  FiHome,
  FiCheck
} from 'react-icons/fi';

export default function PagoExitoso() {
  const [searchParams] = useSearchParams();
  const [verificationCode, setVerificationCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // 1. Intentar obtener código desde localStorage o parámetros de URL de Mercado Pago
    const savedCode = localStorage.getItem('bloom_verification_code');
    const paramCode = searchParams.get('verification_code') || searchParams.get('external_reference');

    if (savedCode) {
      setVerificationCode(savedCode);
    } else if (paramCode) {
      setVerificationCode(`BLOOM-${paramCode}`);
    } else {
      setVerificationCode('BLOOM-VERIFICADO');
    }
  }, [searchParams]);

  const handleCopy = () => {
    if (!verificationCode) return;
    navigator.clipboard.writeText(verificationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const waMessage = encodeURIComponent(
    `¡Hola English Bloom! Acabo de completar el pago de mi curso. Mi código de verificación es: ${verificationCode}. ¿Podrían habilitar mi acceso? ¡Muchas gracias!`
  );

  return (
    <div className="min-h-screen bg-[#151023] text-white flex items-center justify-center p-4 sm:p-6 pt-28 pb-16 relative overflow-hidden font-sans">
      {/* Luces de ambiente VisionOS */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary-container/20 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-emerald-500/10 blur-[140px] pointer-events-none rounded-full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] relative z-10"
      >
        {/* Badge superior */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <FiCheckCircle className="w-3.5 h-3.5" /> Transacción Aprobada
          </span>
        </div>

        {/* Ícono de Éxito */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-[0_0_40px_rgba(16,185,129,0.35)] flex items-center justify-center mb-4">
            <div className="w-full h-full bg-[#151023] rounded-[22px] flex items-center justify-center">
              <FiCheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            ¡Pago Realizado con Éxito!
          </h1>
          <p className="text-sm text-neutral-300 max-w-md mx-auto">
            Hemos registrado tu pago de forma segura a través de Mercado Pago.
          </p>
        </div>

        {/* Tarjeta de Código de Verificación */}
        <div className="bg-[#1c152e]/80 border border-purple-500/30 rounded-2xl p-5 mb-6 text-center shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />
          <span className="text-[11px] font-semibold text-purple-300 uppercase tracking-widest block mb-1.5">
            Tu Código de Verificación de Alumno
          </span>
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl sm:text-3xl font-mono font-black text-white tracking-widest selection:bg-purple-600">
              {verificationCode}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white transition-colors"
              title="Copiar código"
            >
              {copied ? <FiCheck className="w-4 h-4 text-emerald-400" /> : <FiCopy className="w-4 h-4" />}
            </button>
          </div>
          {copied && (
            <span className="text-[11px] text-emerald-400 font-medium block mt-1">
              ¡Código copiado al portapapeles!
            </span>
          )}
        </div>

        {/* Explicación de Activación Manual */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 sm:p-5 mb-8 flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
            <FiClock className="w-5 h-5" />
          </div>
          <div className="text-xs sm:text-sm text-neutral-300 space-y-1">
            <h4 className="font-bold text-amber-200">Activación de Acceso al Curso</h4>
            <p className="text-neutral-300 leading-relaxed text-xs">
              Por políticas de seguridad, el administrador habilitará tu cuenta tras validar el código. Podés avisar de inmediato por WhatsApp con un solo clic.
            </p>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="space-y-3">
          <a
            href={`https://wa.me/543425937358?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-6 rounded-full font-bold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 shadow-[0_0_25px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <span>Validar Acceso por WhatsApp</span>
            <FiExternalLink className="w-4 h-4" />
          </a>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <Link
              to="/mis-cursos"
              className="py-3 px-4 rounded-full font-semibold text-xs text-white bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center gap-2 transition-all text-center"
            >
              <FiBookOpen className="w-3.5 h-3.5" />
              <span>Ir a Mis Cursos</span>
            </Link>

            <Link
              to="/"
              className="py-3 px-4 rounded-full font-semibold text-xs text-neutral-400 hover:text-white bg-transparent hover:bg-white/5 border border-white/5 flex items-center justify-center gap-2 transition-all text-center"
            >
              <FiHome className="w-3.5 h-3.5" />
              <span>Volver al Inicio</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
