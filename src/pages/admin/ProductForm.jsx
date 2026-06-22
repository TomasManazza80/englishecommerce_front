// src/components/admin/ProductForm.jsx

import React from 'react';
import { FiTrash2 } from 'react-icons/fi';

// Mantenemos las categorías en un archivo central si son estáticas
const categorias = [
  'Vinos Tintos Malbec', 
  'Vinos Tintos Cabernet Sauvignon', 
  'Vinos Tintos Otros Varietales', 
  'Vinos Blancos', 
  'Vinos Rosados', 
  'Vinos Espumantes',
  'Licores y Destilados',
  'Chocolates y Delicatessen',
  'Accesorios de Vino',
  'Ofertas / Promociones'
];


const ProductForm = ({ 
  nuevoProducto, 
  handleInputChange, 
  handleFileChange, 
  handleRemoveImage, 
  handleAgregarProducto, 
  loading, 
  uploadProgress 
}) => {
  return (
    <div className="bg-gray-800 shadow-lg rounded-lg border border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-700">
        <h2 className="text-lg font-medium text-white">Agregar Nuevo Producto</h2>
      </div>
      <div className="p-6">
        <form className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-300">
                Nombre del Producto
              </label>
              <input
                type="text"
                name="nombre"
                id="nombre"
                value={nuevoProducto.nombre}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Campo Marca */}
            <div>
              <label htmlFor="marca" className="block text-sm font-medium text-gray-300">
                Marca
              </label>
              <input
                type="text"
                name="marca"
                id="marca"
                value={nuevoProducto.marca}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="precio" className="block text-sm font-medium text-gray-300">
                Precio
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="precio"
                  id="precio"
                  value={nuevoProducto.precio}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-600 rounded-md py-2 px-3 bg-gray-700 text-white"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            
            {/* Precio por mayor (mapeado a 'talle') */}
            <div>
              <label htmlFor="talle" className="block text-sm font-medium text-gray-300">
                Precio por mayor
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="talle"
                  id="talle"
                  value={nuevoProducto.talle}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-600 rounded-md py-2 px-3 bg-gray-700 text-white"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="categoria" className="block text-sm font-medium text-gray-300">
                Categoría
              </label>
              <select
                name="categoria"
                id="categoria"
                value={nuevoProducto.categoria}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="cantidad" className="block text-sm font-medium text-gray-300">
                Cantidad en Stock
              </label>
              <input
                type="number"
                name="cantidad"
                id="cantidad"
                value={nuevoProducto.cantidad}
                onChange={handleInputChange}
                min="0"
                className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-300">
                Descripción
              </label>
              <textarea
                name="descripcion"
                id="descripcion"
                value={nuevoProducto.descripcion}
                onChange={handleInputChange}
                rows="3"
                className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              Imágenes del Producto (Máximo 10)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <div className="flex text-sm text-gray-400">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-blue-400 hover:text-blue-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 focus-within:ring-offset-gray-800"
                  >
                    <span>Subir archivos</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      multiple
                      accept="image/jpeg, image/png, image/gif"
                    />
                  </label>
                  <p className="pl-1">o arrastrar y soltar</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF hasta 10MB cada una
                </p>
              </div>
            </div>
            
            {/* Mostrar progreso de carga */}
            {loading && uploadProgress > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                  <span>Subiendo imágenes...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* Mostrar miniaturas de imágenes */}
            {nuevoProducto.imagenes.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-300 mb-2">
                  Imágenes seleccionadas ({nuevoProducto.imagenes.length})
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {nuevoProducto.imagenes.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Preview ${index}`}
                        className="h-24 w-full object-cover rounded-md border border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Eliminar imagen"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAgregarProducto}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;