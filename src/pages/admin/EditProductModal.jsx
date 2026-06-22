// src/components/admin/EditProductModal.jsx

import React, { useState } from 'react';

// Mantenemos las categorías aquí, o deberían ser importadas desde una constante
const categorias = [
  'Vinos Tintos Malbec', 'Vinos Tintos Cabernet Sauvignon', 'Vinos Tintos Otros Varietales', 
  'Vinos Blancos', 'Vinos Rosados', 'Vinos Espumantes',
  'Licores y Destilados', 'Chocolates y Delicatessen', 'Accesorios de Vino',
  'Ofertas / Promociones'
];


const EditProductModal = ({ producto, onGuardarCambios, onCancelar }) => {
  const [formData, setFormData] = useState({ ...producto });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardarCambios({
      ...formData,
      // Asegurar que los campos numéricos sean parseados correctamente
      precio: parseFloat(formData.precio),
      cantidad: parseInt(formData.cantidad, 10),
      talle: parseFloat(formData.talle) || '', // talle es precio por mayor
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 text-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-white">Editar Producto</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {[
            { label: 'Nombre', name: 'nombre', type: 'text' },
            { label: 'Marca', name: 'marca', type: 'text' }, 
            { label: 'Precio', name: 'precio', type: 'number', step: '0.01' },
            { label: 'Cantidad (Stock)', name: 'cantidad', type: 'number', min: '0' },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-300 mb-1 capitalize">
                {field.label}
              </label>
              <input
                type={field.type}
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                min={field.min}
                step={field.step}
                required={field.name === 'nombre' || field.name === 'precio' || field.name === 'cantidad'}
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 capitalize">
              Categoría
            </label>
            <select
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 capitalize">
              Descripción
            </label>
            <textarea
              name="descripcion" 
              value={formData.descripcion}
              onChange={handleChange}
              className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 capitalize">
              Precio por mayor
            </label>
            <input
              type="number" 
              name="talle" 
              value={formData.talle}
              onChange={handleChange}
              className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: 50 (Precio por volumen)"
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onCancelar}
              className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;