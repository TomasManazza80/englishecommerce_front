import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSave, FiTag, FiHash, FiUser, FiDollarSign, FiCalendar, FiPackage, FiLayers, FiTruck } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL;
const API_BASE_URL = `${API_URL}/balanceMensual/ActualizaBalanceMensual`;

const paymentLabels = {
  efectivo: 'EFECTIVO (CAJA)',
  debito: 'TARJETA DE DÉBITO',
  transferencia: 'TRANSFERENCIA',
  credito_1: 'CRÉDITO 1 CUOTA',
  credito_2: 'CRÉDITO 2 CUOTAS',
  credito_3: 'CRÉDITO 3 CUOTAS',
  credito_4: 'CRÉDITO 4 CUOTAS',
  credito_5: 'CRÉDITO 5 CUOTAS',
  credito_6: 'CRÉDITO 6 CUOTAS',
  mixto: 'PAGOS MIXTOS',
  mercadopago: 'MERCADO PAGO'
};

const styles = {
  label: "block text-xs font-semibold text-[#424754] uppercase tracking-wider mb-1.5 ml-0.5",
  input: "w-full bg-[#f2f4f6] border border-[#c2c6d6] p-3 text-[#191c1e] font-sans focus:bg-white focus:border-[#0058be] focus:ring-2 focus:ring-[#0058be]/20 outline-none transition-all placeholder-[#727785] text-sm rounded-xl font-medium",
  select: "w-full bg-[#f2f4f6] border border-[#c2c6d6] p-3 text-[#191c1e] font-sans focus:bg-white focus:border-[#0058be] focus:ring-2 focus:ring-[#0058be]/20 outline-none transition-all text-sm rounded-xl font-medium cursor-pointer",
  grid: "grid grid-cols-1 md:grid-cols-2 gap-4",
  btnSave: "bg-[#0058be] hover:bg-[#004395] text-white px-6 py-3 font-semibold text-xs uppercase tracking-wider flex items-center gap-2 transition-all rounded-xl shadow-sm disabled:opacity-50",
  btnCancel: "bg-[#f2f4f6] hover:bg-[#e6e8ea] border border-[#c2c6d6] text-[#191c1e] px-6 py-3 font-semibold text-xs uppercase tracking-wider transition-all rounded-xl"
};

const EditBalanceModal = ({ entry, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    producto: '',
    cliente: '',
    monto: 0,
    metodo_pago: '',
    origenDeVenta: '',
    fecha: '',
    marca: '',
    categoria: '',
    proveedor: '',
    cantidad: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (entry) {
      setFormData({
        producto: entry.producto || '',
        cliente: entry.cliente || '',
        monto: entry.monto || 0,
        metodo_pago: entry.metodo_pago || '',
        origenDeVenta: entry.origenDeVenta || '',
        fecha: entry.fecha ? entry.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
        marca: entry.marca || '',
        categoria: entry.categoria || '',
        proveedor: entry.proveedor || '',
        cantidad: entry.cantidad || 1
      });
    }
  }, [entry]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'monto' || name === 'cantidad' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const id = entry.BalanceMensualId || entry.id;
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Error al actualizar el registro');
      onUpdate();
      onClose();
    } catch (err) {
      console.error("UPDATE_ERROR:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!entry) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div
        key="edit-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 font-sans"
        onClick={onClose}
      >
        <motion.form
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white border border-[#e6e8ea] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] text-[#191c1e]"
          onClick={e => e.stopPropagation()}
          onSubmit={handleSubmit}
        >
          {/* Header */}
          <div className="p-5 border-b border-[#e6e8ea] flex justify-between items-center bg-[#f7f9fb] shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-[#0058be] text-white p-2.5 rounded-xl">
                <FiPackage size={18} />
              </div>
              <div>
                <h2 className="font-bold text-base tracking-tight text-[#191c1e]">
                  Corregir Registro de Balance
                </h2>
                <span className="text-xs font-semibold text-[#727785] tracking-wider uppercase">
                  ID: {entry.BalanceMensualId || entry.id}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-[#e6e8ea] text-[#727785] hover:text-[#191c1e] transition-colors rounded-xl"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
            {error && (
              <div className="bg-[#ffdad6] border border-[#ba1a1a]/30 p-4 rounded-xl text-[#ba1a1a] text-xs font-bold uppercase">
                ERROR: {error}
              </div>
            )}

            <div>
              <label className={styles.label}>Descripción / Producto</label>
              <div className="relative">
                <FiTag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#727785]" />
                <input
                  name="producto"
                  value={formData.producto}
                  onChange={handleChange}
                  className={`${styles.input} pl-10`}
                  required
                />
              </div>
            </div>

            <div className={styles.grid}>
              <div>
                <label className={styles.label}>Cliente</label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#727785]" />
                  <input
                    name="cliente"
                    value={formData.cliente}
                    onChange={handleChange}
                    className={`${styles.input} pl-10`}
                  />
                </div>
              </div>
              <div>
                <label className={styles.label}>Monto</label>
                <div className="relative">
                  <FiDollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#727785]" />
                  <input
                    type="number"
                    name="monto"
                    step="0.01"
                    value={formData.monto}
                    onChange={handleChange}
                    className={`${styles.input} pl-10 font-bold`}
                    required
                  />
                </div>
              </div>
            </div>

            <div className={styles.grid}>
              <div>
                <label className={styles.label}>Método de Pago</label>
                <select
                  name="metodo_pago"
                  value={formData.metodo_pago}
                  onChange={handleChange}
                  className={styles.select}
                  required
                >
                  {Object.entries(paymentLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={styles.label}>Origen de Venta</label>
                <select
                  name="origenDeVenta"
                  value={formData.origenDeVenta}
                  onChange={handleChange}
                  className={styles.select}
                  required
                >
                  <option value="LocalFisico">🏪 LOCAL FÍSICO</option>
                  <option value="Revendedor">🤝 REVENDEDOR</option>
                  <option value="ecommerce">🛒 E-COMMERCE</option>
                  <option value="n/a">S/D</option>
                </select>
              </div>
            </div>

            <div className={styles.grid}>
              <div>
                <label className={styles.label}>Fecha</label>
                <div className="relative">
                  <FiCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#727785]" />
                  <input
                    type="date"
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleChange}
                    className={`${styles.input} pl-10`}
                    required
                  />
                </div>
              </div>
              <div>
                <label className={styles.label}>Cantidad</label>
                <div className="relative">
                  <FiHash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#727785]" />
                  <input
                    type="number"
                    name="cantidad"
                    value={formData.cantidad}
                    onChange={handleChange}
                    className={`${styles.input} pl-10 font-bold`}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-[#e6e8ea]" />

            <div className={styles.grid}>
              <div>
                <label className={styles.label}>Marca</label>
                <div className="relative">
                  <FiLayers className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#727785]" />
                  <input
                    name="marca"
                    value={formData.marca}
                    onChange={handleChange}
                    className={`${styles.input} pl-10`}
                    placeholder="Ej: Apple, Samsung..."
                  />
                </div>
              </div>
              <div>
                <label className={styles.label}>Categoría</label>
                <div className="relative">
                  <FiPackage className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#727785]" />
                  <input
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                    className={`${styles.input} pl-10`}
                    placeholder="Ej: Accesorios, Celulares..."
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={styles.label}>Proveedor</label>
              <div className="relative">
                <FiTruck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#727785]" />
                <input
                  name="proveedor"
                  value={formData.proveedor}
                  onChange={handleChange}
                  className={`${styles.input} pl-10`}
                  placeholder="Nombre del proveedor"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 bg-[#f7f9fb] border-t border-[#e6e8ea] flex justify-end gap-3 shrink-0">
            <button type="button" onClick={onClose} className={styles.btnCancel}>
              Descartar
            </button>
            <button type="submit" disabled={loading} className={styles.btnSave}>
              {loading ? 'Guardando...' : <><FiSave /> Aplicar Cambios</>}
            </button>
          </div>
        </motion.form>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default EditBalanceModal;
