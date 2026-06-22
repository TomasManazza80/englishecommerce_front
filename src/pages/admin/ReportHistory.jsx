// src/components/admin/ReportHistory.jsx

import React from 'react';
import { FiX } from 'react-icons/fi';

const ReportHistory = ({ recaudaciones, recaudacionesExpandidas, toggleExpandirRecaudacion, eliminarRecaudacion, loading }) => {
  return (
    <div className="bg-gray-800 shadow-lg rounded-lg border border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-white">Reporte de Ganancias (Historial)</h2>
          <p className="text-sm text-gray-400">Historial de cierres de caja y recaudaciones registradas. Total de registros: {recaudaciones.length}</p>
        </div>
      </div>
      <div className="divide-y divide-gray-700">
        {recaudaciones.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No hay recaudaciones registradas</div>
        ) : (
          recaudaciones.map((recaudacion) => (
            <div key={recaudacion.id} className="p-6 hover:bg-gray-700 transition duration-150">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-white">{recaudacion.mes}</h3>
                  <div className="mt-2 text-sm text-gray-400">
                    <p><span className="font-medium text-gray-300">Monto Recaudado:</span> ${recaudacion.montoRecaudado.toLocaleString()}</p>
                    <p><span className="font-medium text-gray-300">Productos Vendidos:</span> {recaudacion.productosVendidos.length}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <div className="text-sm text-gray-500">
                    <p>Fecha: {new Date(recaudacion.createdAt).toLocaleDateString('es-AR')}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleExpandirRecaudacion(recaudacion.id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {recaudacionesExpandidas[recaudacion.id] ? 'Ocultar productos' : 'Ver productos'}
                    </button>
                    <button
                      onClick={() => eliminarRecaudacion(recaudacion.id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      disabled={loading}
                    >
                      {loading ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Mostrar productos vendidos si están expandidos */}
              {recaudacionesExpandidas[recaudacion.id] && recaudacion.productosVendidos.length > 0 && (
                <div className="mt-4 border-t border-gray-700 pt-4">
                  <h4 className="text-md font-medium text-white mb-2">Productos vendidos:</h4>
                  <div className="space-y-3">
                    {recaudacion.productosVendidos.map((producto, index) => (
                      <div key={index} className="pl-4 border-l-2 border-gray-600">
                        <p className="text-sm font-medium text-gray-200">{producto.nombre} {producto.marca ? `(${producto.marca})` : ''}</p>
                        <p className="text-xs text-gray-500">
                          Cantidad: {producto.cantidad} - Total: ${(producto.precio * producto.cantidad).toFixed(2)} - fecha: {new Date(producto.fechaCompra).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReportHistory;