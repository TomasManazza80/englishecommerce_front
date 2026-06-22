// src/components/admin/SalesChart.jsx

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// 1. REGISTRO (Mover el registro aquí para modularizar ChartJS)
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// 2. CONFIGURACIÓN DE ESTILOS (Exportada para reutilización)
export const DARK_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false, 
  plugins: {
    legend: { display: false },
    title: { display: false },
    tooltip: {
      backgroundColor: 'rgba(31, 41, 55, 0.9)', 
      titleColor: '#f9fafb', 
      bodyColor: '#d1d5db', 
    },
  },
  scales: {
    x: {
      grid: { display: false, borderColor: '#374151' },
      ticks: { color: '#9ca3af' },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: '#374151', 
        borderDash: [5, 5], 
        borderColor: '#374151',
      },
      ticks: {
        color: '#9ca3af', 
        callback: function(value) { return `$${value}`; }
      },
    },
  },
  elements: {
    line: { tension: 0.4, borderWidth: 3 },
    point: { radius: 4, hoverRadius: 6, backgroundColor: '#3b82f6' },
  },
};

// 3. COMPONENTE
const SalesChart = ({ chartData, title }) => {
  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Ventas',
        data: chartData.data,
        borderColor: '#3b82f6', 
        backgroundColor: 'rgba(59, 130, 246, 0.2)', 
        fill: 'start', 
      },
    ],
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-xl h-96 border border-gray-700">
      <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
      <div className="h-full max-h-80">
        <Line options={DARK_CHART_OPTIONS} data={data} />
      </div>
    </div>
  );
};

export default SalesChart;