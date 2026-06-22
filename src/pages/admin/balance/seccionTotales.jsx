import React from 'react';
import { ScaleIcon } from '@heroicons/react/24/solid';

const TotalsSection = ({ totalVentas, totalEgresos, totalFinal }) => {
  return (
    <div className="bg-white p-6 shadow-xl rounded-lg h-full flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2 flex items-center">
          <ScaleIcon className="w-5 h-5 mr-2 text-green-600" />
          SECCIÓN DE TOTALES
        </h2>

        {/* Suma de Ventas */}
        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="font-medium text-gray-600">Suma de todas las ventas (Ingresos):</span>
          <span className="text-xl font-bold text-green-600">${totalVentas.toLocaleString('es-AR')}</span>
        </div>

        {/* Suma de Egresos */}
        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="font-medium text-gray-600">Suma de Egresos:</span>
          <span className="text-xl font-bold text-red-600">-${totalEgresos.toLocaleString('es-AR')}</span>
        </div>
      </div>

      {/* Total Final */}
      <div className="mt-6 pt-4 border-t-2 border-green-200 bg-green-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-green-800">TOTAL FINAL EN TODO EL SISTEMA:</span>
          <span className={`text-3xl font-extrabold ${totalFinal >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            ${totalFinal.toLocaleString('es-AR')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TotalsSection;