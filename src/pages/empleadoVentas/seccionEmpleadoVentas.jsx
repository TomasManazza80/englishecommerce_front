import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Iconos específicos para ventas
import {
    FiShoppingBag, FiUsers, FiDollarSign, FiCreditCard, FiActivity,
    FiLayers, FiMenu, FiX, FiArrowLeft, FiHome
} from 'react-icons/fi';
// Importación solicitada
import ModuloCaja from '../admin/caja.jsx';
import Encargos from '../admin/encargos.jsx';

// --- CONFIGURACIÓN DE ANIMACIÓN ---
const springTransition = { type: "spring", stiffness: 300, damping: 30 };

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const sidebarItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
};

const sectionVariants = {
    initial: { opacity: 0, x: 10 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -10, transition: { duration: 0.2 } }
};

const FedecellSalesStyles = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@900&family=Inter:wght@500&family=JetBrains+Mono&display=swap');
.fedecell-title { font-family: 'Montserrat', sans-serif; font-weight: 900; text-transform: uppercase; letter-spacing: -0.05em; }
.fedecell-body { font-family: 'Inter', sans-serif; font-weight: 500; }
.fedecell-tech { font-family: 'JetBrains Mono', monospace; }
.sidebar-active { background: #ff8c00 !important; color: #000 !important; font-weight: 900; box-shadow: 0 0 20px rgba(255, 140, 0, 0.2); }
`;

const EmpleadoVentas = () => {
    const [seccionActiva, setSeccionActiva] = useState('ventas');
    const [sidebarVisible, setSidebarVisible] = useState(window.innerWidth > 768);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) setSidebarVisible(false);
            else setSidebarVisible(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- CONFIGURACIÓN VISUAL FEDECELL ---
    const styles = {
        container: "min-h-screen bg-black text-white font-['Inter'] selection:bg-[#ff8c00] selection:text-black",
        header: "mb-6 md:mb-8 border-b border-white/10 pb-4 md:pb-6",
        mainTitle: "text-3xl md:text-6xl font-['Montserrat'] font-[900] uppercase tracking-tighter leading-tight text-white",
        subTitle: "font-['JetBrains_Mono'] text-[8px] md:text-[9px] font-bold text-zinc-500 mt-2 uppercase tracking-[0.3em] md:tracking-[0.4em]",
        contentWrapper: "bg-[#050505] border border-zinc-800 shadow-2xl overflow-hidden min-h-[60vh] md:min-h-[70vh]"
    };

    const menuItems = [
        { id: 'ventas', label: 'PUNTO_VENTA', icon: <FiDollarSign /> },
        { id: 'reparaciones', label: 'ENCARGOS', icon: <FiLayers /> },
    ];

    return (
        <div className={styles.container}>
            <style dangerouslySetInnerHTML={{ __html: FedecellSalesStyles }} />

            {/* OVERLAY PARA MÓVIL */}
            <AnimatePresence>
                {isMobile && sidebarVisible && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setSidebarVisible(false)}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[50]"
                    />
                )}
            </AnimatePresence>

            {/* BOTÓN MENU (Visible siempre) */}
            <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => setSidebarVisible(!sidebarVisible)}
                className="mt-[30px] fixed h-[40px] md:h-[45px] top-[20px] md:top-[40px] left-[10px] md:left-[15px] z-[1001] bg-[#ff8c00] text-black p-2 md:p-3 shadow-[0_0_20px_rgba(255,140,0,0.3)] border border-white/10"
            >
                {sidebarVisible && !isMobile ? <FiArrowLeft size={18} /> : <FiMenu size={18} />}
            </motion.button>

            {/* SIDEBAR */}
            <motion.div
                initial={false}
                animate={{ x: sidebarVisible ? 0 : (isMobile ? '-100%' : -240) }}
                transition={springTransition}
                className={` fixed top-0 left-0 h-full bg-[#050505] border-r border-white/5 z-[55] overflow-y-auto shadow-2xl ${isMobile ? 'w-[80vw]' : 'w-60'}`}
            >
                <div className="p-8 border-b border-white/5 pt-24 flex justify-between items-center">
                    <div className="flex items-center gap-2">


                    </div>
                </div>

                <motion.nav variants={containerVariants} initial="hidden" animate="visible" className="p-4 space-y-2">
                    <p className="px-4 text-[9px] text-zinc-500 font-bold tracking-widest mb-4 uppercase fedecell-tech">NAV_SYSTEM</p>
                    {menuItems.map(item => (
                        <motion.button
                            key={item.id}
                            variants={sidebarItemVariants}
                            whileHover={{ x: 5 }}
                            onClick={() => {
                                setSeccionActiva(item.id);
                                if (isMobile) setSidebarVisible(false);
                            }}
                            className={`w-full flex items-center px-4 py-3 fedecell-tech text-[10px] tracking-widest transition-all rounded-sm
                            ${seccionActiva === item.id ? 'sidebar-active' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                        >
                            <span className="mr-3 text-base">{item.icon}</span> {item.label}
                        </motion.button>
                    ))}
                </motion.nav>
            </motion.div>

            {/* CONTENIDO PRINCIPAL */}
            <motion.div
                animate={{ paddingLeft: (sidebarVisible && !isMobile) ? 240 : 0 }}
                transition={springTransition}
                className="pt-24 md:pt-28 p-4 md:p-8 min-h-screen w-full"
            >


                <AnimatePresence mode="wait">
                    <motion.div
                        key={seccionActiva}
                        variants={sectionVariants}
                        initial="initial" animate="animate" exit="exit"
                        className="w-full"
                    >
                        <div className="md:p-2">
                            {seccionActiva === 'ventas' ? <ModuloCaja /> : <Encargos />}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* FOOTER */}
                <footer className="mt-12 flex flex-col md:flex-row justify-between items-center gap-4 opacity-30">
                    <div className="font-['JetBrains_Mono'] text-[9px] uppercase tracking-widest">
                        Fedecell_Commerce_System // Fedecell Santa Fe
                    </div>
                    <div className="font-['JetBrains_Mono'] text-[9px] uppercase tracking-widest">
                        {new Date().toLocaleDateString()} // {new Date().toLocaleTimeString()}
                    </div>
                </footer>
            </motion.div>
        </div>
    );
};

export default EmpleadoVentas;