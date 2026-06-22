import React, { useEffect, useState } from 'react';

const TopVendidos = () => {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL;
    useEffect(() => {
        const fetchProductos = async () => {
            try {
                const response = await fetch(`${API_URL}/recaudacionFinal/`);
                const data = await response.json();
                procesarDatos(data);
            } catch (error) {
                console.error("Error cargando productos:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProductos();
    }, []);

    const procesarDatos = (data) => {
        const conteoProductos = {};

        data.forEach(registro => {
            // Combinamos ambos arrays de pagos para procesar todo por igual
            const todosLosPagos = [...registro.pagosEcommerce, ...registro.pagosLocal];

            todosLosPagos.forEach(pago => {
                const nombre = pago.nombreProducto;
                const cantidad = pago.cantidadComprada || 0;
                const monto = pago.monto || 0;

                if (conteoProductos[nombre]) {
                    conteoProductos[nombre].cantidad += cantidad;
                    conteoProductos[nombre].totalGenerado += monto;
                } else {
                    conteoProductos[nombre] = {
                        nombre: nombre,
                        cantidad: cantidad,
                        totalGenerado: monto
                    };
                }
            });
        });

        // Convertir a array, ordenar de mayor a menor y tomar los mejores
        const listaOrdenada = Object.values(conteoProductos)
            .sort((a, b) => b.cantidad - a.cantidad);

        setProductos(listaOrdenada);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-5xl mx-auto">
                {/* Header del Módulo */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
                            Ranking de <span className="text-blue-600">Más Vendidos</span>
                        </h2>
                        <p className="text-gray-500 mt-1">Análisis de rendimiento basado en recaudación final.</p>
                    </div>
                    <div className="bg-white shadow-sm border border-gray-200 px-4 py-2 rounded-lg">
                        <span className="text-sm font-medium text-gray-600">Total Productos: {productos.length}</span>
                    </div>
                </div>

                {/* Grid de Visualización */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-900 text-white">
                                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Puesto</th>
                                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Producto</th>
                                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-center">Unidades</th>
                                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-right">Rendimiento</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {productos.map((producto, index) => (
                                <tr
                                    key={index}
                                    className="hover:bg-blue-50 transition-colors duration-200 group"
                                >
                                    <td className="px-6 py-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-400 text-yellow-900 animate-pulse' :
                                            index === 1 ? 'bg-gray-300 text-gray-700' :
                                                index === 2 ? 'bg-orange-300 text-orange-900' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                                            {producto.nombre}
                                        </p>
                                        <span className="text-xs text-gray-400">ID Original: {index + 100}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                            {producto.cantidad} sold
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-sm font-bold text-gray-900">
                                            ${producto.totalGenerado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
                                            <div
                                                className="bg-blue-600 h-1.5 rounded-full"
                                                style={{ width: `${Math.min((producto.cantidad / productos[0].cantidad) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TopVendidos;