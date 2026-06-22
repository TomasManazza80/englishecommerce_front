import React, { useState, useEffect } from "react";
import axios from 'axios';
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faLightbulb,
    faPenNib,
    faWandMagicSparkles,
    faAward,
    faChevronLeft,
    faChevronRight,
    faQuoteLeft
} from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";

const PortfolioEncargos = () => {
    const WHATSAPP_NUMBER = "5491112345678";
    const MESSAGE = encodeURIComponent("Hola! Vi su portfolio de clientes y quisiera consultar por un encargo exclusivo.");
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${MESSAGE}`;
    const API_URL = import.meta.env.VITE_API_URL;

    // DATA DE CLIENTES Y CASOS DE ÉXITO (Dinámica)
    const [casosExito, setCasosExito] = useState([]);

    useEffect(() => {
        const fetchCasos = async () => {
            try {
                // Asegúrate de que el endpoint devuelva los campos: cliente, proyecto, testimonio, imagen
                const res = await axios.get(`${API_URL}/success-cases/get`);
                if (Array.isArray(res.data) && res.data.length > 0) {
                    setCasosExito(res.data);
                }
            } catch (error) {
                console.error("Error fetching success cases", error);
            }
        };
        fetchCasos();
    }, []);

    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev === casosExito.length - 1 ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev === 0 ? casosExito.length - 1 : prev - 1));
    };

    // Textos adaptados para un servicio de encargos/agencia/freelance
    const pasos = [
        { id: "01", titulo: "DESCUBRIMIENTO", descripcion: "Entendemos la visión y las necesidades únicas de tu marca.", icono: faLightbulb },
        { id: "02", titulo: "DISEÑO Y PROPUESTA", descripcion: "Creación de conceptos estéticos y selección de lineamientos.", icono: faPenNib },
        { id: "03", titulo: "DESARROLLO A MEDIDA", descripcion: "Ejecución impecable cuidando cada detalle del proyecto.", icono: faWandMagicSparkles },
        { id: "04", titulo: "ENTREGA FINAL", descripcion: "Presentación del encargo con los más altos estándares de calidad.", icono: faAward }
    ];

    return (
        <section className="bg-[#ffffff] py-32 px-6 font-sans overflow-hidden text-[#333333]">
            <div className="mx-auto max-w-6xl">

                {/* 1. SECCIÓN PORTFOLIO / CASOS DE ÉXITO */}
                {casosExito.length > 0 && (
                    <div className="mb-40" id="portfolio-clientes">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-20"
                        >
                            <h2 className="text-3xl md:text-4xl uppercase tracking-widest font-light mb-4">
                                Clientes & Destacados
                            </h2>
                            <p className="font-[cursive] text-[#b07d6b] text-3xl md:text-5xl lowercase">
                                LuPetruccelli
                            </p>
                        </motion.div>

                        <div className="relative mx-auto max-w-5xl">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentIndex}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                    className="grid overflow-hidden bg-[#f9f3f2] md:grid-cols-2 rounded-sm shadow-sm"
                                >
                                    {/* Imagen del Proyecto */}
                                    <div className="relative h-80 md:h-[500px]">
                                        <img
                                            src={casosExito[currentIndex]?.imagen}
                                            alt="Proyecto destacado"
                                            className="h-full w-full object-cover grayscale-[20%] transition-all duration-700 hover:grayscale-0"
                                        />
                                    </div>

                                    {/* Texto del Caso / Cliente */}
                                    <div className="flex flex-col justify-center items-center text-center p-12 md:p-16">
                                        <FontAwesomeIcon icon={faQuoteLeft} className="text-[#cba394] text-2xl mb-8 opacity-40" />

                                        {/* Nombre del Cliente */}
                                        <h3 className="text-xl md:text-2xl uppercase tracking-widest text-[#333333] font-normal mb-3">
                                            {casosExito[currentIndex]?.cliente || "Nombre del Cliente"}
                                        </h3>

                                        <div className="w-8 h-[1px] bg-[#cba394] mb-6"></div>

                                        {/* Tipo de Encargo */}
                                        <span className="text-[#b07d6b] text-[10px] tracking-[0.25em] mb-6 uppercase">
                                            PROYECTO: {casosExito[currentIndex]?.proyecto || "Diseño Exclusivo"}
                                        </span>

                                        {/* Testimonio / Descripción */}
                                        <p className="text-[#333333] font-light text-sm leading-loose italic px-4">
                                            "{casosExito[currentIndex]?.testimonio || "Un resultado que superó todas las expectativas, reflejando a la perfección nuestra identidad."}"
                                        </p>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Controles de navegación */}
                            {casosExito.length > 1 && (
                                <div className="absolute -bottom-16 left-1/2 flex -translate-x-1/2 gap-8 md:bottom-auto md:top-1/2 md:w-full md:-translate-y-1/2 md:justify-between md:-px-12">
                                    <button
                                        onClick={prevSlide}
                                        className="flex h-10 w-10 md:-ml-16 items-center justify-center rounded-full border border-[#cba394] bg-white text-[#b07d6b] transition-all duration-300 hover:bg-[#f9f3f2]"
                                    >
                                        <FontAwesomeIcon icon={faChevronLeft} className="text-sm font-light" />
                                    </button>
                                    <button
                                        onClick={nextSlide}
                                        className="flex h-10 w-10 md:-mr-16 items-center justify-center rounded-full border border-[#cba394] bg-white text-[#b07d6b] transition-all duration-300 hover:bg-[#f9f3f2]"
                                    >
                                        <FontAwesomeIcon icon={faChevronRight} className="text-sm font-light" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}


                {/* 2. SECCIÓN PASOS DE TRABAJO */}
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-32">
                    <div className="text-center mb-16">
                        <h2 className="text-2xl md:text-3xl uppercase tracking-widest font-light mb-3">
                            Cómo Trabajamos
                        </h2>
                        <div className="w-12 h-[1px] bg-[#cba394] mx-auto"></div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {pasos.map((paso, idx) => (
                            <div key={idx} className="bg-[#f9f3f2] p-10 flex flex-col items-center text-center transition-all duration-500 hover:-translate-y-1">
                                <FontAwesomeIcon icon={paso.icono} className="text-[#cba394] text-2xl mb-6 opacity-80" />
                                <h3 className="text-[#b07d6b] font-normal text-[10px] tracking-widest mb-4">FASE {paso.id}</h3>
                                <h4 className="text-[#333333] uppercase tracking-widest text-xs font-medium mb-3">{paso.titulo}</h4>
                                <p className="text-[#333333] text-xs font-light leading-relaxed">{paso.descripcion}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>


                {/* 3. BOTÓN DE CONTACTO */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex justify-center"
                >
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-4 bg-gradient-to-r from-[#cba394] to-[#b07d6b] px-12 py-5 text-xs font-normal uppercase tracking-[0.2em] text-white shadow-md transition-all duration-300 hover:shadow-lg hover:opacity-90 rounded-sm"
                    >
                        <FontAwesomeIcon icon={faWhatsapp} className="text-lg font-light" />
                        <span>Agendar un Proyecto</span>
                    </a>
                </motion.div>

            </div>
        </section>
    );
};

export default PortfolioEncargos;