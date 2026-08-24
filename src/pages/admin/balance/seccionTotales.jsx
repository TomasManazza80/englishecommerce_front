import React from 'react';
import { ScaleIcon } from '@heroicons/react/24/solid';

const TotalsSection = ({ totalVentas, totalEgresos, totalFinal }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#e6e8ea] shadow-[0_4px_20px_rgba(0,0,0,0.03)] h-full flex flex-col justify-between font-sans">
      <div>
        <h2 className="text-lg font-bold text-[#191c1e] mb-4 border-b border-[#e6e8ea] pb-3 flex items-center gap-2 tracking-tight">
          <ScaleIcon className="w-5 h-5 text-[#0058be]" />
          Sección de Totales
        </h2>

        {/* Suma de Ventas */}
        <div className="flex justify-between items-center py-3 border-b border-[#f2f4f6]">
          <span className="font-medium text-[#424754] text-sm">Suma de Ventas (Ingresos):</span>
          <span className="text-xl font-bold text-[#006947]">${totalVentas.toLocaleString('es-AR')}</span>
        </div>

        {/* Suma de Egresos */}
        <div className="flex justify-between items-center py-3 border-b border-[#f2f4f6]">
          <span className="font-medium text-[#424754] text-sm">Suma de Egresos:</span>
          <span className="text-xl font-bold text-[#ba1a1a]">-${totalEgresos.toLocaleString('es-AR')}</span>
        </div>
      </div>

      {/* Total Final */}
      <div className={`mt-6 p-4 rounded-xl border ${totalFinal >= 0 ? 'border-[#00855b]/20 bg-[#e6f7f0]' : 'border-[#ba1a1a]/20 bg-[#ffdad6]'}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-xs font-semibold text-[#191c1e] uppercase tracking-wider">TOTAL BALANCE GLOBAL</span>
          <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${totalFinal >= 0 ? 'text-[#006947]' : 'text-[#ba1a1a]'}`}>
            ${totalFinal.toLocaleString('es-AR')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TotalsSection;