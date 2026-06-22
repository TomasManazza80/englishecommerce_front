// src/components/admin/SalesList.jsx

import React from 'react';
import { FiPlus, FiX } from 'react-icons/fi';

const SalesList = ({ productosVendidos, handleEliminarProductoVendido, setMostrarFormVentaManual }) => {
  return (
    <div className="bg-gray-800 shadow-lg rounded-lg border border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-medium text-white">Productos Vendidos (Caja actual)</h2>
        <button
          onClick={() => setMostrarFormVentaManual(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <FiPlus className="mr-2" /> Venta Manual
        </button>
      </div>
      <div className="divide-y divide-gray-700">
        {productosVendidos.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No hay ventas registradas en la caja actual</div>
        ) : (
          productosVendidos.map((producto) => (
            <div key={producto.ProductId} className="p-6 flex flex-col md:flex-row md:items-center hover:bg-gray-700 transition duration-150">
              <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                {producto.imagenes?.length > 0 ? (
                  <img 
                    src={producto.imagenes[0]} 
                    alt={producto.nombre}
                    className="h-20 w-20 object-cover rounded border border-gray-600"
                  />
                ) : (
                  <div className="h-20 w-20 bg-gray-700 rounded flex items-center justify-center text-gray-500">
                    Sin imagen
                  </div>
                )}
              </div>
              
              <div className="flex-grow">
                <h3 className="text-lg font-medium text-white">{producto.nombre}</h3>
                <div className="mt-1 text-sm text-gray-400 grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div><span className="font-medium text-gray-300">Precio:</span> ${producto.precio}</div>
                  <div><span className="font-medium text-gray-300">Cantidad:</span> {producto.cantidad}</div>
                  <div><span className="font-medium text-gray-300">Marca:</span> {producto.marca || 'N/A'}</div> 
                  <div><span className="font-medium text-gray-300">Total:</span> ${(producto.precio * producto.cantidad).toFixed(2)}</div>
                  <div>
                    <span className="font-medium text-gray-300">Fecha:</span>{' '}
                    {new Date(producto.fechaCompra).toLocaleDateString('es-AR')}
                  </div>
                  <div><span className="font-medium text-gray-300">Descripción:</span> {producto.descripcion || 'N/A'}</div>
                  <div><span className="font-medium text-gray-300">Categoría:</span> {producto.categoria || 'N/A'}</div>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 flex space-x-3">
                <button
                  onClick={() => handleEliminarProductoVendido(producto.ProductId)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-800"
                >
                  <FiX className="mr-2" /> Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SalesList;