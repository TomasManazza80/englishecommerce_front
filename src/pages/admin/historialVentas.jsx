import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { FiSearch, FiDollarSign, FiCalendar, FiAlertTriangle, FiLoader, FiTag, FiBox, FiRefreshCw } from 'react-icons/fi';

// --- URL DE LA API ---
const API_URL = import.meta.env.VITE_API_URL;
const API_URL_VENTAS = `${API_URL}/boughtProduct/AllboughtProducts`;

// --- CLASES TAILWIND COMPACTAS (Reemplaza el objeto COLOR) ---
// Usaremos la paleta oscura consistente con Admin.jsx:
// - Fondo principal: #1e1e1e
// - Texto: Blanco, Gris 400
// - Acento: #3b82f6 (Azul) o Verde para Dinero.

// --- 2. COMPONENTE INTERNO: BuscadorProductos 🔎 ---
const BuscadorProductos = ({ termino, setTermino }) => {
    return (
        <div className="relative mb-3">
            <FiSearch
                size={14} // Reducido
                className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500"
            />
            <input
                type="text"
                placeholder="Buscar producto, marca o ID..."
                value={termino}
                onChange={(e) => setTermino(e.target.value)}
                // Estilos compactos y oscuros
                className="w-full py-1.5 pl-8 pr-3 text-xs border border-gray-700 rounded-md bg-gray-950 text-white placeholder-gray-500 focus:ring-[#3b82f6] focus:border-[#3b82f6] transition-all outline-none"
            />
        </div>
    );
};

// --- 3. COMPONENTE INTERNO: ListaVentas 📃 ---
const ListaVentas = ({ ventas }) => {
    if (ventas.length === 0) {
        return (
            <div className="text-center text-gray-400 p-4 border border-dashed border-gray-700 rounded-lg bg-gray-900 text-xs">
                <FiAlertTriangle size={20} className="mx-auto mb-2 text-gray-500" />
                <p className="m-0">No se encontraron ventas que coincidan con la búsqueda.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse mt-3 rounded-lg shadow-lg overflow-hidden border border-gray-700">
                <thead>
                    <tr>
                        {/* Cabeceras - Compactas y Oscuras */}
                        <th className="py-2 px-3 text-left border-b-2 border-gray-700 bg-gray-800 text-gray-300 font-semibold text-xs rounded-tl-lg">Producto</th>
                        <th className="py-2 px-3 text-left border-b-2 border-gray-700 bg-gray-800 text-gray-300 font-semibold text-xs">Marca</th>
                        <th className="py-2 px-3 text-left border-b-2 border-gray-700 bg-gray-800 text-gray-300 font-semibold text-xs">Cantidad</th>
                        <th className="py-2 px-3 text-left border-b-2 border-gray-700 bg-gray-800 text-gray-300 font-semibold text-xs">Precio Total</th>
                        <th className="py-2 px-3 text-left border-b-2 border-gray-700 bg-gray-800 text-gray-300 font-semibold text-xs rounded-tr-lg">Fecha de Venta</th>
                    </tr>
                </thead>
                <tbody>
                    {ventas.map((venta, index) => {
                        const precioUnitario = Number(venta.precio) || 0;
                        const cantidad = Number(venta.cantidad) || 0;
                        const precioTotal = (precioUnitario * cantidad).toLocaleString('es-AR', { minimumFractionDigits: 2 });

                        return (
                            <tr
                                key={venta.ProductId || index}
                                className="bg-[#1e1e1e] border-b border-gray-800 hover:bg-gray-700 transition duration-200"
                            >
                                {/* Nombre */}
                                <td className="py-2 px-3 text-white text-xs font-medium">{venta.nombre}</td>

                                {/* Marca */}
                                <td className="py-2 px-3 text-gray-400 text-xs">
                                    <FiTag size={10} className="inline mr-1 text-gray-500" />
                                    {venta.marca || 'N/A'}
                                </td>

                                {/* Cantidad */}
                                <td className="py-2 px-3 text-gray-400 text-xs">
                                    <FiBox size={10} className="inline mr-1 text-gray-500" />
                                    {cantidad}
                                </td>

                                {/* Precio Total */}
                                <td className="py-2 px-3 text-xs font-bold text-green-400 tracking-wider">
                                    <FiDollarSign size={12} className="inline mr-1" />
                                    ${precioTotal}
                                </td>

                                {/* Fecha de Compra */}
                                <td className="py-2 px-3 text-gray-400 text-xs">
                                    <FiCalendar size={10} className="inline mr-1 text-gray-500" />
                                    {venta.fechaCompra ? venta.fechaCompra.substring(0, 10) : 'N/A'}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};


// ------------------------------------------------------------------
// --- 4. COMPONENTE PRINCIPAL: HistorialDeVentas 🛍️ ---
// ------------------------------------------------------------------

const HistorialDeVentas = () => {
    const [ventas, setVentas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState(null);
    const [terminoBusqueda, setTerminoBusqueda] = useState('');

    // --- FILTROS DE FECHA (default: últimos 30 días) ---
    const hoy = new Date().toISOString().split('T')[0];
    const hace30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(hace30);
    const [endDate, setEndDate] = useState(hoy);

    const obtenerVentas = async (start = startDate, end = endDate) => {
        setCargando(true);
        setErrorCarga(null);
        try {
            const response = await axios.get(API_URL_VENTAS, {
                params: { startDate: start, endDate: end }
            });
            if (response.data && Array.isArray(response.data)) {
                const sortedVentas = response.data.sort((a, b) => new Date(b.fechaCompra) - new Date(a.fechaCompra));
                setVentas(sortedVentas);
            } else {
                setVentas([]);
                throw new Error("La API no devolvió una lista de productos válidos.");
            }
        } catch (error) {
            console.error("Error al cargar las ventas:", error);
            setErrorCarga(`❌ Error: ${error.message}`);
            setVentas([]);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        obtenerVentas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Lógica de filtrado optimizada con useMemo
    const ventasFiltradas = useMemo(() => {
        if (!terminoBusqueda) {
            return ventas;
        }
        const terminoLower = terminoBusqueda.toLowerCase();

        return ventas.filter(venta =>
            (venta.nombre && venta.nombre.toLowerCase().includes(terminoLower)) ||
            (venta.marca && venta.marca.toLowerCase().includes(terminoLower)) ||
            (venta.ProductId && String(venta.ProductId).includes(terminoLower))
        );
    }, [ventas, terminoBusqueda]);

    // Cálculo del Total Facturado global
    const totalVentas = useMemo(() => {
        return ventas.reduce((sum, venta) =>
            sum + ((Number(venta.precio) || 0) * (Number(venta.cantidad) || 0))
            , 0).toLocaleString('es-AR', { minimumFractionDigits: 2 });
    }, [ventas]);

    // RENDERIZADO
    return (
        <div
            // Contenedor principal: Dark BG y estilos compactos
            className="p-4 rounded-lg max-w-5xl mx-auto bg-[#1e1e1e] border border-gray-800 shadow-2xl text-white"
        >
            <h2
                // Título compacto
                className="border-b-2 border-[#3b82f6] pb-2 text-xl font-bold text-white mb-4 flex items-center"
            >
                <FiCalendar size={20} className="mr-2 text-[#3b82f6]" /> Historial de Ventas | Gestión
            </h2>

            {/* Mensajes de Estado - Compactos y Oscuros */}
            {errorCarga && (
                <div className="p-2 mb-3 bg-red-900/50 border border-red-700 rounded-md text-red-300 text-xs flex items-center shadow-inner">
                    <FiAlertTriangle size={14} className="mr-2" />
                    {errorCarga}
                </div>
            )}

            {/* Selector de rango de fecha */}
            <div className="flex flex-wrap items-end gap-2 mb-3 p-3 bg-gray-900 border border-gray-700 rounded-md">
                <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Desde</span>
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="bg-gray-950 border border-gray-700 rounded px-2 py-1 text-white text-xs outline-none focus:border-blue-500 transition-all"
                    />
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Hasta</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="bg-gray-950 border border-gray-700 rounded px-2 py-1 text-white text-xs outline-none focus:border-blue-500 transition-all"
                    />
                </div>
                <button
                    onClick={() => obtenerVentas(startDate, endDate)}
                    disabled={cargando}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition-colors disabled:opacity-50"
                >
                    <FiRefreshCw size={12} className={cargando ? 'animate-spin' : ''} />
                    Buscar
                </button>
                <span className="text-[9px] text-gray-600 self-end pb-1">{ventas.length} registros</span>
            </div>

            <BuscadorProductos
                termino={terminoBusqueda}
                setTermino={setTerminoBusqueda}
            />

            {cargando ? (
                // Loading compacto y oscuro
                <div className="text-center p-4 bg-gray-900 rounded-lg">
                    <FiLoader size={20} className="text-[#3b82f6] mx-auto mb-2 animate-spin" />
                    <p className="text-gray-400 text-xs">Cargando datos de ventas...</p>
                </div>
            ) : (
                <>
                    {/* Estadísticas clave - Compactas */}
                    <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-2 text-xs">
                        <p className="text-gray-400 m-0">
                            Ítems mostrados: <strong className="text-white">{ventasFiltradas.length}</strong> de {ventas.length} totales
                        </p>
                        <p className="text-gray-400 m-0 flex items-center">
                            Total Facturado (Global):
                            <strong className="text-green-400 text-sm ml-1 font-bold">
                                ${totalVentas}
                            </strong>
                        </p>
                    </div>

                    {/* Lista de Productos Vendidos */}
                    <ListaVentas
                        ventas={ventasFiltradas}
                    />
                </>
            )}
        </div>
    );
};

export default HistorialDeVentas;