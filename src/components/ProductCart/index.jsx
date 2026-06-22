import { useNavigate, Outlet } from "react-router-dom";
import { motion } from "framer-motion";

// Aplicamos desestructuración segura con un valor por defecto
const ProductCard = (props) => {
  const navigate = useNavigate();
  const { product } = props;

  // 1. GESTIÓN DE ERROR Y MAPEO DE DATOS
  // Si se pasa el objeto product, lo usamos; si no, usamos los props individuales
  const data = product || props;

  const {
    id = data.ProductId,
    nombre = data.name || "Generic_Hardware",
    categoria = data.category || "Electrónica",
    marca = data.marca || "FEDE_CELL",
    imagenes = data.image ? [data.image] : [],
    variantes = []
  } = data;

  const stockVariant = variantes.find(v => Number(v.stock) > 0) || (variantes.length > 0 ? variantes[0] : null);
  const price = stockVariant?.precioAlPublico || data.price || 0;
  const totalStock = variantes.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0);
  const isAvailable = totalStock > 0 || (price > 0 && variantes.length === 0);
  const displayImage = imagenes.length > 0 ? imagenes[0] : null;
  const safeId = id ? String(id).padStart(4, '0') : "0000";

  const formatPrice = (value) => {
    const numericPrice = typeof value === 'string' ? parseFloat(value) : value;
    if (!numericPrice || isNaN(numericPrice) || numericPrice === 0) return "CONSULTAR";
    return new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS', minimumFractionDigits: 0
    }).format(numericPrice).replace('ARS', '$').replace(/\s/g, '\u00A0');
  };

  return (
    <motion.div
      className="group relative bg-[#0a0a0a] min-h-[550px] w-full rounded-2xl overflow-hidden border border-white/5 
                 hover:border-[#ff8c00]/40 transition-all duration-500 shadow-2xl hover:shadow-[#ff8c00]/10 cursor-pointer"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -10 }}
      onClick={() => navigate(`/product/${id}`)}
    >
      {/* HEADER TECH - ESTILOS FEDECELL */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-20">
        <span className="text-[9px] text-white/30 tracking-[0.3em] uppercase"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          FC-2026 // ID_{safeId}
        </span>
        <div className="flex gap-1">
          <div className="w-1 h-1 bg-[#ff8c00] rounded-full animate-pulse"></div>
          <div className="w-1 h-1 bg-white/10 rounded-full"></div>
        </div>
      </div>

      {/* ÁREA DE IMAGEN */}
      <div className="relative h-72 w-full mt-8 flex items-center justify-center overflow-hidden">
        {/* Brillo radial decorativo */}
        <div className="absolute inset-0 bg-radial-gradient from-[#ff8c00]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        {displayImage ? (
          <motion.img
            src={displayImage}
            alt={nombre}
            className="relative z-10 h-[85%] w-[85%] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.7)]"
            whileHover={{ scale: 1.05 }}
          />
        ) : (
          <span className="font-mono text-white/10 text-[10px]" style={{ fontFamily: 'JetBrains Mono' }}>SIGNAL_LOST</span>
        )}
      </div>

      {/* CONTENIDO */}
      <div className="p-6 flex flex-col h-[calc(550px-18rem)]">
        <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-4 group-hover:text-[#ff8c00] transition-colors"
          style={{ fontFamily: 'Montserrat, sans-serif' }}>
          {nombre}
        </h3>

        <div className="flex gap-4 mb-6">
          <div className="flex flex-col">
            <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono' }}>Stock_Status</span>
            <span className={`text-[10px] font-bold ${isAvailable ? 'text-green-500' : 'text-red-500'}`}>
              {isAvailable ? `ONLINE (${totalStock})` : 'DISCONNECTED'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono' }}>Sector</span>
            <span className="text-[10px] text-white/60 font-bold uppercase">{categoria || 'GENERAL'}</span>
          </div>
          <div className="w-px h-6 bg-white/5"></div>
          <div className="flex flex-col">
            <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono' }}>Brand</span>
            <span className="text-[10px] text-white/60 font-bold uppercase">{marca}</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-[#ff8c00]/50 uppercase tracking-[0.2em] mb-1" style={{ fontFamily: 'JetBrains Mono' }}>Price_Model</span>
            <span className="text-3xl font-black text-white tracking-tighter" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {formatPrice(price)}
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="h-12 w-12 flex items-center justify-center rounded-sm bg-[#ff8c00] text-black shadow-[0_0_20px_rgba(255,140,0,0.2)] group-hover:bg-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;