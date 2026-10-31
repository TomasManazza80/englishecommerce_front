import React from 'react';
import { NavLink } from 'react-router-dom';

export default function PagoFallido() {
  return (
    <div className="w-full max-w-2xl mx-auto my-12 bg-gray-900 border border-red-500/30 shadow-2xl rounded-2xl p-8 md:p-12 text-center text-gray-200">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-500 mb-6 text-3xl">
        ✕
      </div>
      <h1 className="text-3xl font-extrabold text-white mb-3">No pudimos procesar tu pago</h1>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">
        La transacción no se pudo completar con Mercado Pago. No se ha realizado ningún cobro a tu cuenta o tarjeta.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <NavLink
          to="/cart"
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
        >
          Reintentar con otro medio de pago
        </NavLink>
        <NavLink
          to="/contact"
          className="px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold transition"
        >
          Contactar a Soporte
        </NavLink>
      </div>
    </div>
  );
}
