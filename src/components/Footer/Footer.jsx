import React, { useState } from "react";
import { FaFacebook, FaInstagram, FaTwitter, FaEnvelope, FaChevronDown, FaChevronUp, FaTimes } from "react-icons/fa";

// =================================================================
// ESTILOS AI SPEAKING PRACTICE: DARK MODE FOOTER
// =================================================================
const AiFooterStyles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');

.ai-font { font-family: 'Inter', sans-serif; }

.ai-gradient-btn {
    background: #b273c2;
    box-shadow: 0 4px 15px rgba(178, 115, 194, 0.2);
    transition: all 0.4s ease;
}

.ai-gradient-btn:hover {
    background: #9d5fb0;
    box-shadow: 0 6px 20px rgba(178, 115, 194, 0.4);
    transform: translateY(-2px);
}

.ai-footer-input {
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #ffffff;
    transition: all 0.3s ease;
    border-radius: 12px;
}

.ai-footer-input:focus {
    border-color: #d7a7e3;
    outline: none;
    background-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 0 0 4px rgba(215, 167, 227, 0.1);
}

.ai-footer-input::placeholder {
    color: rgba(255, 255, 255, 0.3);
}

/* Modal Scrollbar */
.ai-modal-scroll::-webkit-scrollbar {
    width: 6px;
}
.ai-modal-scroll::-webkit-scrollbar-track {
    background: #1f1723; 
}
.ai-modal-scroll::-webkit-scrollbar-thumb {
    background: #d7a7e3; 
    border-radius: 10px;
}
`;

const Footer = () => {
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [openSections, setOpenSections] = useState({});
    const [floatingContent, setFloatingContent] = useState(null);
    const [showFloatingDiv, setShowFloatingDiv] = useState(false);

    const toggleSection = (section) => {
        setOpenSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleFloatingContent = (contentKey) => {
        const contentMap = {
            historia: {
                title: "Our Story",
                content: "AI Speaking Practice was born from the need to make language learning accessible, natural, and highly effective. We believe that conversation is the key to fluency, and our AI tutors are designed to provide a judgment-free, 24/7 environment to practice and master your English skills."
            },
            sustentabilidad: {
                title: "AI Technology",
                content: "We use state-of-the-art NLP models and the OpenAI Whisper API to provide instant, highly accurate transcription and grammatical feedback, allowing you to learn from your mistakes in real time."
            },
            tiendas: {
                title: "Global Reach",
                content: "Our platform is accessible from anywhere in the world. Whether you are at home or traveling, your AI tutor is always in your pocket."
            },
            trabajo: {
                title: "Careers",
                content: "Passionate about AI and education? We are always looking for talented engineers and linguists. Send your resume to careers@aispeaking.com."
            },
            cuidado: {
                title: "Privacy Policy",
                content: "Your conversations are completely private. We use your voice data only to provide real-time feedback and do not store audio recordings permanently without your explicit consent."
            },
            mayoristas: {
                title: "For Schools",
                content: "We offer special pricing for educational institutions. Integrate our AI tutors into your curriculum. Contact us at schools@aispeaking.com for more information."
            },
            compra: {
                title: "Subscription Info",
                content: "All our plans include unlimited practice scenarios. You can cancel at any time. We process payments securely via Stripe."
            },
            terminos: {
                title: "Terms and Conditions",
                content: "By using our platform, you agree to our terms of service. Fair usage policies apply to unlimited plans."
            },
            arrepentimiento: {
                title: "Refund Policy",
                content: "If you are not satisfied with your progress, you can request a full refund within the first 14 days of your subscription. Contact us at support@aispeaking.com"
            },
            aromatizadores: {
                title: "Travel Scenarios",
                content: "Practice situations like checking in at the airport, ordering food, or asking for directions."
            },
            difusores: {
                title: "Business English",
                content: "Master professional vocabulary, practice job interviews, and learn how to lead meetings with confidence."
            },
            velas: {
                title: "Daily Life",
                content: "Learn how to make small talk, navigate the supermarket, or chat with neighbors."
            },
            productos: {
                title: "All Scenarios",
                content: "Explore our complete library of over 100+ AI-driven speaking scenarios."
            }
        };

        if (contentMap[contentKey]) {
            setFloatingContent(contentMap[contentKey]);
            setShowFloatingDiv(true);
        }
    };

    const closeFloatingDiv = () => {
        setShowFloatingDiv(false);
        setFloatingContent(null);
    };

    const handleSubscribe = (e) => {
        e.preventDefault();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            setEmailError("Email is required");
            return;
        }

        if (!emailRegex.test(email)) {
            setEmailError("Please enter a valid email");
            return;
        }

        console.log("Subscribed with email:", email);
        setIsSubscribed(true);
        setEmailError("");
        setEmail("");
        setTimeout(() => setIsSubscribed(false), 3000);
    };

    const footerSections = [
        { title: "Our Story", url: "/nuestra-historia", key: "historia" },
        { title: "AI Technology", url: "/sustentabilidad", key: "sustentabilidad" },
        { title: "Global Reach", url: "/tiendas", key: "tiendas" },
        { title: "Careers", url: "/trabaja-con-nosotros", key: "trabajo" },
        { title: "Privacy Policy", url: "/cuidado-del-producto", key: "cuidado" }
    ];

    const footerContact = [
        { title: "For Schools", url: "/mayoristas", key: "mayoristas" },
        { title: "Subscription Info", url: "/informacion-compra", key: "compra" },
        { title: "Terms & Conditions", url: "/terminos-condiciones", key: "terminos" },
        { title: "Refund Policy", url: "/arrepentimiento", key: "arrepentimiento" }
    ];

    const productCategories = [
        { title: "Travel Scenarios", url: "/aromatizadores-ultrasonicos", key: "aromatizadores" },
        { title: "Business English", url: "/difusores-ambiente", key: "difusores" },
        { title: "Daily Life", url: "/velas-aromaticas", key: "velas" },
        { title: "All Scenarios", url: "/productos", key: "productos" }
    ];

    const socialLinks = [
        { icon: <FaFacebook size={20} />, url: "https://facebook.com" },
        { icon: <FaInstagram size={20} />, url: "https://instagram.com" },
        { icon: <FaTwitter size={20} />, url: "https://twitter.com" },
    ];

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: AiFooterStyles }} />

            {/* Div flotante / Modal de Información */}
            {showFloatingDiv && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1f1723] text-white border border-white/10 rounded-[25px] max-w-lg w-full max-h-[85vh] shadow-2xl overflow-hidden flex flex-col transform transition-all ai-font">
                        <div className="flex justify-between items-center p-6 border-b border-white/10">
                            <h3 className="font-bold text-[14px] text-[#d7a7e3] uppercase tracking-wider">{floatingContent?.title}</h3>
                            <button
                                onClick={closeFloatingDiv}
                                className="text-gray-400 hover:text-white transition-colors bg-white/5 rounded-full w-8 h-8 flex items-center justify-center"
                            >
                                <FaTimes size={16} />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto ai-modal-scroll flex-1">
                            <p className="text-[15px] leading-relaxed text-gray-300 font-medium">{floatingContent?.content}</p>
                        </div>
                        <div className="p-6 bg-white/5 flex justify-center border-t border-white/10">
                            <button
                                onClick={closeFloatingDiv}
                                className="px-10 py-3 font-bold text-[12px] tracking-wider bg-white/10 text-white hover:bg-white/20 transition-colors rounded-[12px] uppercase"
                            >
                                CLOSE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FOOTER PRINCIPAL */}
            <footer className="bg-[#1f1723] text-white px-6 sm:px-12 pt-24 pb-12 relative rounded-t-[50px] mt-[-50px] z-10 ai-font">
                <div className="max-w-6xl mx-auto">

                    {/* Newsletter Section */}
                    <div className="mb-24 text-center">
                        <div className="inline-block bg-[#d7a7e3]/10 text-[#d7a7e3] px-4 py-1.5 rounded-full text-xs font-bold tracking-widest mb-6 border border-[#d7a7e3]/20 uppercase">
                            STAY UPDATED
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Level up your <span className="text-[#d7a7e3]">Fluency</span></h2>
                        <p className="text-[15px] text-gray-400 mb-10 max-w-lg mx-auto font-medium">Subscribe to our newsletter for exclusive English learning tips, new AI scenarios, and premium discounts.</p>

                        <form onSubmit={handleSubscribe} className="max-w-md mx-auto relative">
                            <div className="mb-6 flex flex-col md:flex-row gap-3">
                                <div className="flex-1 relative">
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setEmailError("");
                                        }}
                                        className="ai-footer-input w-full px-5 py-4 text-center md:text-left text-[14px] font-medium"
                                        placeholder="Your email address"
                                    />
                                    {emailError && (
                                        <p className="text-red-400 text-[11px] font-bold mt-2 text-left px-2">{emailError}</p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    className="w-full md:w-auto ai-gradient-btn text-white px-8 py-4 font-bold text-[13px] tracking-wider rounded-[12px] uppercase"
                                >
                                    SUBSCRIBE
                                </button>
                            </div>
                            {isSubscribed && (
                                <p className="text-[#d7a7e3] font-bold text-[13px] mt-2">Welcome to the AI Speaking community! 🎉</p>
                            )}
                        </form>
                    </div>

                    <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent mb-16"></div>

                    {/* Footer Links */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 mb-20 text-center md:text-left">

                        {/* Column 1 - Compañía */}
                        <div className="border-b border-white/5 md:border-none pb-6 md:pb-0">
                            <div
                                className="flex justify-between items-center cursor-pointer md:cursor-auto"
                                onClick={() => toggleSection('company')}
                            >
                                <h3 className="font-bold text-[12px] text-[#d7a7e3] tracking-widest uppercase w-full md:w-auto text-center md:text-left mb-0 md:mb-6">Company</h3>
                                <span className="md:hidden text-[#d7a7e3]">
                                    {openSections['company'] ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                                </span>
                            </div>
                            <div className={`${openSections['company'] ? 'block' : 'hidden'} md:block mt-6 md:mt-0`}>
                                <ul className="space-y-4">
                                    {footerSections.map((item, index) => (
                                        <li key={index}>
                                            <button
                                                onClick={() => handleFloatingContent(item.key)}
                                                className="text-[14px] text-gray-400 hover:text-white font-medium transition-colors duration-300 w-full md:w-auto text-center md:text-left"
                                            >
                                                {item.title}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Column 2 - Contacto */}
                        <div className="border-b border-white/5 md:border-none pb-6 md:pb-0">
                            <div
                                className="flex justify-between items-center cursor-pointer md:cursor-auto"
                                onClick={() => toggleSection('contact')}
                            >
                                <h3 className="font-bold text-[12px] text-[#d7a7e3] tracking-widest uppercase w-full md:w-auto text-center md:text-left mb-0 md:mb-6">Support</h3>
                                <span className="md:hidden text-[#d7a7e3]">
                                    {openSections['contact'] ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                                </span>
                            </div>
                            <div className={`${openSections['contact'] ? 'block' : 'hidden'} md:block mt-6 md:mt-0`}>
                                <ul className="space-y-4">
                                    {footerContact.map((item, index) => (
                                        <li key={index}>
                                            <button
                                                onClick={() => handleFloatingContent(item.key)}
                                                className="text-[14px] text-gray-400 hover:text-white font-medium transition-colors duration-300 w-full md:w-auto text-center md:text-left"
                                            >
                                                {item.title}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Column 3 - Productos */}
                        <div className="border-b border-white/5 md:border-none pb-6 md:pb-0">
                            <div
                                className="flex justify-between items-center cursor-pointer md:cursor-auto"
                                onClick={() => toggleSection('products')}
                            >
                                <h3 className="font-bold text-[12px] text-[#d7a7e3] tracking-widest uppercase w-full md:w-auto text-center md:text-left mb-0 md:mb-6">Library</h3>
                                <span className="md:hidden text-[#d7a7e3]">
                                    {openSections['products'] ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                                </span>
                            </div>
                            <div className={`${openSections['products'] ? 'block' : 'hidden'} md:block mt-6 md:mt-0`}>
                                <ul className="space-y-4">
                                    {productCategories.map((item, index) => (
                                        <li key={index}>
                                            <button
                                                onClick={() => handleFloatingContent(item.key)}
                                                className="text-[14px] text-gray-400 hover:text-white font-medium transition-colors duration-300 w-full md:w-auto text-center md:text-left"
                                            >
                                                {item.title}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center pt-10 border-t border-white/10">
                        {/* Social Links */}
                        <div className="flex space-x-6 mb-8">
                            {socialLinks.map((social, index) => (
                                <a
                                    key={index}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-[#d7a7e3] hover:bg-white/10 transition-all duration-300"
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>

                        {/* Contact Email */}
                        <div className="mb-10">
                            <a href="mailto:support@aispeaking.com" className="flex items-center text-[14px] text-gray-400 hover:text-white transition-colors duration-300 font-medium">
                                <FaEnvelope className="mr-3 text-[#d7a7e3]" />
                                support@aispeaking.com
                            </a>
                        </div>

                        {/* Copyright */}
                        <div className="text-center">
                            <p className="font-bold text-[10px] tracking-widest text-gray-500 uppercase mb-3">
                                © 2026 AI SPEAKING PRACTICE. ALL RIGHTS RESERVED.
                            </p>
                            <p className="font-bold text-[9px] tracking-wider text-gray-600 uppercase">
                                EMPOWERED BY NEXT-GEN AI
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default Footer;