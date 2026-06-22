import React from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faSearch,
    faCartPlus,
    faShieldHalved,
    faCreditCard,
    faTruckFast,
    faMicrochip
} from "@fortawesome/free-solid-svg-icons";
import video from "../../images/videos/herofede.mp4";

const BuySteps = ({ videoSrc = video }) => {
    const steps = [
        {
            id: "01",
            icon: faSearch,
            title: "Explora la Colección",
            description: "Navega por nuestro catálogo de fragancias exclusivas. Encuentra el aroma perfecto para tu espacio.",
        },
        {
            id: "02",
            icon: faCartPlus,
            title: "Configura tu Pedido",
            description: "Selecciona tus velas y accesorios. Nuestro sistema asegura la disponibilidad en tiempo real.",
        },
        {
            id: "03",
            icon: faShieldHalved,
            title: "Checkout Seguro",
            description: "Carga tus datos de envío bajo protocolos de encriptación avanzada para una transacción 100% confiable.",
        },
        {
            id: "04",
            icon: faCreditCard,
            title: "Pasarela de Pago",
            description: "Procesa tu operación con total fluidez. Aceptamos todas las tarjetas de crédito y débito.",
        },
        {
            id: "05",
            icon: faTruckFast,
            title: "Envío Cuidadoso",
            description: "Tu pedido es preparado, embalado con extrema protección y enviado con seguimiento prioritario a tu domicilio.",
            fullWidth: true
        }
    ];

    const container = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { delayChildren: 0.3, staggerChildren: 0.15 }
        }
    };

    const item = {
        hidden: { y: 30, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.6, ease: "easeOut" }
        }
    };

    return (
        <section className="py-24 md:py-32 bg-[#ffffff] font-sans text-[#333333] relative overflow-hidden selection:bg-[#cba394] selection:text-white">
            {/* Video de Fondo con Overlay Minimalista */}
            <video
                autoPlay loop muted playsInline
                className="absolute top-0 left-0 w-full h-full object-cover z-0 opacity-10 grayscale"
                src={videoSrc}
            />
            <div className="absolute inset-0 bg-[#ffffff]/90 z-1" />

            <div className="container mx-auto max-w-7xl px-4 md:px-8 relative z-10">

                {/* Encabezado */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-24"
                >
                    <div className="flex items-center justify-center mb-6">
                        <span className="text-[#cba394] tracking-[0.3em] text-xs md:text-sm font-light uppercase block">
                            The LuPetruccelli Experience
                        </span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-sans font-light tracking-[0.15em] uppercase text-[#333333] leading-tight mb-8">
                        PROCESO DE <span className="font-semibold">COMPRA</span>
                    </h2>

                    {/* DIVISOR GEOMÉTRICO */}
                    <div className="flex items-center justify-center opacity-70">
                        <div className="w-16 h-[1px] bg-[#cba394]"></div>
                        <div className="w-2 h-2 rotate-45 bg-[#cba394] mx-4"></div>
                        <div className="w-16 h-[1px] bg-[#cba394]"></div>
                    </div>
                </motion.div>

                {/* Pasos Grid */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                >
                    {steps.map((step, index) => (
                        <motion.article
                            key={index}
                            variants={item}
                            className={`${step.fullWidth ? 'md:col-span-2 lg:col-span-4' : ''} h-full group`}
                        >
                            <div className={`h-full bg-[#f9f3f2] p-10 md:p-14 relative overflow-hidden transition-all duration-500 hover:bg-[#f2ebe9] flex flex-col items-center text-center ${step.fullWidth ? 'lg:flex-row lg:text-left lg:px-20' : ''}`}>

                                {/* ID Subliminal */}
                                <span className="absolute top-6 right-8 text-[#e8dbd8] text-5xl font-light font-sans tracking-tighter select-none transition-transform duration-700 group-hover:scale-110">
                                    {step.id}
                                </span>

                                {/* Ícono */}
                                <div className={`relative z-10 ${step.fullWidth ? 'lg:mb-0 lg:mr-12 lg:pr-12 lg:border-r lg:border-[#e8dbd8]' : 'mb-8 mt-4'}`}>
                                    <FontAwesomeIcon
                                        icon={step.icon}
                                        className="text-3xl text-[#cba394] font-light"
                                    />
                                </div>

                                {/* Texto */}
                                <div className="relative z-10 flex flex-col flex-1 items-center lg:items-start">
                                    <h3 className="text-sm font-sans font-normal uppercase tracking-widest text-[#333333] mb-4">
                                        {step.title}
                                    </h3>
                                    <p className={`text-xs font-light text-[#777777] leading-relaxed ${step.fullWidth ? 'max-w-2xl text-center lg:text-left' : 'max-w-[250px]'}`}>
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </motion.div>

                {/* Call to Action */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-24 text-center"
                >
                    <button
                        className="bg-gradient-to-r from-[#cba394] to-[#b07d6b] px-12 py-5 text-white text-xs tracking-[0.2em] uppercase transition-all duration-300 hover:opacity-90 shadow-sm flex items-center justify-center gap-3 mx-auto"
                    >
                        INICIAR COMPRA <span className="text-[10px]">&gt;</span>
                    </button>
                    <p className="mt-8 text-[10px] text-[#999999] uppercase tracking-[0.2em] font-light">
                        Protocolo de compra seguro verificado
                    </p>
                </motion.div>
            </div>
        </section>
    );
};

export default BuySteps;