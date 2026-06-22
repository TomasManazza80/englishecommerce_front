// src/components/admin/SalesDashboard.jsx

import React from 'react';
import { FiCalendar, FiClock } from 'react-icons/fi';
import SalesChart from './SalesChart'; 

// NOTA: Estos datos son de MOCK. En una app real, la lógica para obtenerlos
// debería estar en Admin.jsx y pasarse por props.
const datosMensuales = {
  labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'], 
  data: [1200.50, 1900.75, 3000.00, 5000.25],
};
const datosSemanales = {
  labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
  data: [150, 250, 400, 350, 600, 800, 750],
};

const SalesDashboard = ({ vistaGrafica, setVistaGrafica }) => {
  
  const datosGraficoActivo = vistaGrafica === 'mensual' ? datosMensuales : datosSemanales;
  const tituloGraficoActivo = vistaGrafica === 'mensual' ? 'Ventas del Mes' : 'Ventas de la Semana';

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold text-white mb-4">📈 Análisis de Ventas</h2>
      
      <div className="flex justify-start space-x-4 mb-6">
        <button
          onClick={() => setVistaGrafica('mensual')}
          className={`py-2 px-4 rounded-md text-sm font-medium flex items-center ${
            vistaGrafica === 'mensual'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <FiCalendar className="inline-block mr-2" /> Vista Mensual
        </button>
        <button
          onClick={() => setVistaGrafica('semanal')}
          className={`py-2 px-4 rounded-md text-sm font-medium flex items-center ${
            vistaGrafica === 'semanal'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <FiClock className="inline-block mr-2" /> Vista Semanal
        </button>
      </div>

      <div className="w-full">
        <SalesChart chartData={datosGraficoActivo} title={tituloGraficoActivo} />
      </div>
    </div>
  );
};

export default SalesDashboard;