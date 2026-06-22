// src/components/admin/ProductList.jsx

import React from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

const ProductList = ({ todosMisProductos, setProductoAEditar, handleEliminarProducto }) => {
  return (
    <div className="bg-gray-800 shadow-lg rounded-lg border border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-700">
        <h2 className="text-lg font-medium text-white">Lista de Productos</h2>
      </div>
      <div className="divide-y divide-gray-700">
        {todosMisProductos.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No hay productos registrados</div>
        ) : (
          todosMisProductos.map((producto) => (
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
                  <div><span className="font-medium text-gray-300">Descripción:</span> {producto.descripcion}</div>
                  <div><span className="font-medium text-gray-300">Categoría:</span> {producto.categoria}</div>
                  <div><span className="font-medium text-gray-300">Marca:</span> {producto.marca || 'N/A'}</div>
                  <div><span className="font-medium text-gray-300">Stock:</span> {producto.cantidad}</div>
                  <div><span className="font-medium text-gray-300">Precio por mayor:</span> {producto.talle}</div>
                </div>
              </div>

              <div className="mt-4 md:mt-0 flex space-x-3">
                <button
                  onClick={() => setProductoAEditar(producto)}
                  className="inline-flex items-center px-3 py-2 border border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800"
                >
                  <FiEdit2 className="mr-2" /> Editar
                </button>
                <button
                  onClick={() => handleEliminarProducto(producto.ProductId)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-800"
                >
                  <FiTrash2 className="mr-2 " /> Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductList;