// src/components/admin/ManualSaleModal.jsx

import React, { useState, useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';

const ManualSaleModal = ({ 
  onClose, 
  onSubmit, 
  productosFiltrados, 
  busquedaProducto, 
  setBusquedaProducto,
  productoSeleccionado, 
  setProductoSeleccionado,
  ventaManual, 
  handleVentaManualChange,
  setError // Prop para mostrar errores en Admin.jsx
}) => {
  
  const [busquedaLocal, setBusquedaLocal] = useState(busquedaProducto); 
  const inputRef = useRef(null);

  // Enfocamos el input al montar
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleBusquedaChange = (e) => {
    const value = e.target.value;
    setBusquedaLocal(value);
    setBusquedaProducto(value); 
    setError(null); // Limpiar errores al buscar
  };

  const handleSeleccionProducto = (producto) => {
    setProductoSeleccionado(producto);
    
    // Establecer el estado de venta manual basado en el producto seleccionado
    handleVentaManualChange({ target: { name: 'nombre', value: producto.nombre } });
    handleVentaManualChange({ target: { name: 'precio', value: producto.precio } });
    handleVentaManualChange({ target: { name: 'descripcion', value: producto.descripcion } });
    handleVentaManualChange({ target: { name: 'categoria', value: producto.categoria } });
    handleVentaManualChange({ target: { name: 'cantidad', value: 1 } });
    handleVentaManualChange({ target: { name: 'talle', value: producto.talle } });
    handleVentaManualChange({ target: { name: 'marca', value: producto.marca } });
    handleVentaManualChange({ target: { name: 'imagenes', value: producto.imagenes } });
    // Mantener la fecha de venta intacta (se establece en Admin al abrir)
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 text-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto border border-gray-700">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">Registrar Venta Manual</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white"><FiX size={20} /></button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
          <div>
            <label htmlFor="buscarProducto" className="block text-sm font-medium text-gray-300">
              Buscar Producto
            </label>
            <input
              ref={inputRef}
              type="text"
              id="buscarProducto"
              value={busquedaLocal}
              onChange={handleBusquedaChange}
              className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Buscar por nombre o marca"
            />
          </div>

          <div className="max-h-60 overflow-y-auto border border-gray-600 rounded-md">
            {productosFiltrados.length > 0 ? (
              productosFiltrados.map((producto) => (
                <div
                  key={producto.ProductId}
                  onClick={() => handleSeleccionProducto(producto)}
                  className={`p-3 hover:bg-gray-700 cursor-pointer transition duration-150 ${productoSeleccionado?.ProductId === producto.ProductId ? 'bg-blue-800' : 'bg-gray-800'}`}
                >
                  <div className="flex items-center">
                    {producto.imagenes?.length > 0 && (
                      <img 
                        src={producto.imagenes[0]} 
                        alt={producto.nombre}
                        className="h-10 w-10 object-cover rounded mr-3"
                      />
                    )}
                    <div>
                      <p className="font-medium">{producto.nombre}</p>
                      <p className="text-sm text-gray-400">
                        {producto.marca ? `Marca: ${producto.marca} | ` : ''} 
                        ${producto.precio} | Stock: {producto.cantidad}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-gray-500">No se encontraron productos</div>
            )}
          </div>

          {productoSeleccionado && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="precio" className="block text-sm font-medium text-gray-300">
                    Precio
                  </label>
                  <input
                    type="number"
                    name="precio"
                    value={ventaManual.precio}
                    onChange={handleVentaManualChange}
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="cantidad" className="block text-sm font-medium text-gray-300">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    name="cantidad"
                    value={ventaManual.cantidad}
                    onChange={handleVentaManualChange}
                    min="1"
                    // El max se basa en el stock del producto seleccionado, si existe
                    max={productoSeleccionado.cantidad} 
                    className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Stock disponible: {productoSeleccionado.cantidad}
                  </p>
                </div>
              </div>
              <div className="col-span-2">
                <label htmlFor="fechaVenta" className="block text-sm font-medium text-gray-300">
                  Fecha de Venta
                </label>
                <input
                  type="date"
                  name="fechaVenta"
                  value={ventaManual.fechaVenta}
                  onChange={handleVentaManualChange}
                  className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Registrar Venta
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default ManualSaleModal;