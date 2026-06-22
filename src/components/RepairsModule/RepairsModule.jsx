import React from 'react';
import { motion } from 'framer-motion';

const STYLES = {
    title: "font-['Montserrat'] font-light uppercase tracking-widest text-[#333333]",
    accent: "font-[cursive] text-[#cba394] text-xl md:text-2xl",
    body: "font-sans font-light text-[13px] md:text-[14px] text-[#333333]",
};

const RepairsModule = ({ bannerImage, bannerPosition }) => {
    const fadeUpVariant = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    return (
        <section className="py-32 bg-[#ffffff] relative overflow-hidden">
            {/* Background Accent - Nude sutil */}
            <div className="absolute top-0 left-0 w-full h-full opacity-50 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#f9f3f2] blur-[100px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                    <motion.div
                        className="flex-1 text-center lg:text-left"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUpVariant}
                    >
                        {/* Acento en fuente Script */}
                    

                        <h2 className={STYLES.title + " text-3xl md:text-5xl mb-8 leading-relaxed"}>
                            Laboratorio <br /><span className="text-[#cba394]">Técnico</span>
                        </h2>

                        {/* Divisor Minimalista Rose Gold */}
                        <div className="flex items-center justify-center lg:justify-start gap-4 mb-8 opacity-70">
                            <div className="h-[1px] w-12 bg-[#cba394]"></div>
                            <span className="text-[#cba394] text-[10px]">✦</span>
                            <div className="h-[1px] w-12 bg-[#cba394]"></div>
                        </div>

                        <p className={STYLES.body + " max-w-xl leading-loose mx-auto lg:mx-0"}>
                            Contamos con equipamiento de última generación para reparaciones de microelectrónica.
                            Garantía oficial y repuestos originales en cada trabajo. Nuestro equipo especializado
                            está listo para devolverle la vida a tus dispositivos con la calidad de LuPetruccelli.
                        </p>
                    </motion.div>

                    {bannerImage && (
                        <motion.div
                            className="flex-1 w-full"
                            initial={{ opacity: 0, scale: 0.98, x: 20 }}
                            whileInView={{ opacity: 1, scale: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                            {/* Tarjeta de imagen con padding generoso y fondo rosa pálido */}
                            <div className="relative p-4 md:p-6 bg-[#f9f3f2]">
                                <img
                                    src={bannerImage}
                                    alt="Laboratorio Técnico LuPetruccelli"
                                    className="relative w-full h-[350px] md:h-[500px] object-cover"
                                    style={{ objectPosition: bannerPosition || 'center center' }}
                                />

                                {/* Badge minimalista */}
                                <div className="absolute top-8 right-8 bg-[#ffffff] text-[#333333] px-6 py-2 text-[10px] font-['Montserrat'] uppercase tracking-widest border border-[#cba394]/20 shadow-sm">
                                    Service Oficial
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default RepairsModule;