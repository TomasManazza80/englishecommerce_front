import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBars,
    faCartShopping,
    faXmark,
    faChevronDown,
    faUser,
    faSignOutAlt,
    faMicrochip,
    faHouse,
    faMobileScreen,
    faCircleInfo,
    faEnvelope,
    faShieldHalved,
    faTerminal,
    faDollarSign,
    faWrench
} from "@fortawesome/free-solid-svg-icons";
import { NavLink, Outlet, useLocation, Link } from "react-router-dom";
import authContext from "../../store/store";
import { useContext, useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

import logoBlack from "../../images/ai_logo.png";

import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const API_URL = import.meta.env.VITE_API_URL;

// =================================================================
// ESTILOS AI SPEAKING PRACTICE: MODERN SAAS
// =================================================================
const AiNavbarStyles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');

:root {
    --header-height: 80px;
    --ai-primary: #b273c2;
    --ai-primary-hover: #9d5fb0;
    --ai-dark: #1d1d1d;
    --ai-bg: #f8f3f6;
    --ai-border: #f0dff3;
    --transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.navbar-header {
    position: fixed;
    width: 100%;
    z-index: 1000;
    transition: var(--transition);
    font-family: 'Inter', sans-serif;
}

.navbar-header.menu-open {
    z-index: 9999;
}

/* HEADER STATES */
.header-transparent {
    background-color: transparent;
    padding: 15px 0;
    border-bottom: 1px solid transparent;
}

.header-solid {
    background-color: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(24px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.6);
    padding: 0;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05), inset 0 0 20px rgba(255, 255, 255, 0.2);
}

.navbar-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem;
    height: var(--header-height);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

@media (max-width: 1024px) {
    .navbar-container { padding: 0 1.5rem; }
    :root { --header-height: 70px; }
    .header-solid { background-color: rgba(255, 255, 255, 0.95); }
}

/* NAVIGATION LINKS */
.nav-link {
    font-weight: 600;
    font-size: 0.85rem;
    text-decoration: none;
    color: var(--ai-dark);
    transition: all 0.3s ease;
    position: relative;
    padding: 0.4rem 0.5rem;
    border-radius: 8px;
}

.header-transparent .nav-link {
    color: var(--ai-dark);
}

.nav-link:hover, .nav-link.active {
    color: var(--ai-primary);
    background-color: #f6edf8;
}

.admin-link {
    color: var(--ai-primary) !important;
    background-color: #f6edf8;
    padding: 0.5rem 1rem;
    border-radius: 999px;
}
.admin-link:hover {
    background-color: var(--ai-primary);
    color: white !important;
}

/* ACCOUNT BUTTONS */
.account-button {
    font-weight: 700;
    font-size: 0.85rem;
    background: #f6edf8;
    border: 1px solid var(--ai-border);
    color: var(--ai-primary);
    padding: 10px 24px;
    transition: all 0.3s ease;
    cursor: pointer;
    border-radius: 999px; /* Pill shape */
}

.account-button:hover {
    background: var(--ai-primary);
    color: #ffffff;
    border-color: transparent;
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(178, 115, 194, 0.2);
}

/* CART */
.cart-icon {
    font-size: 1.2rem;
    transition: var(--transition);
    color: #000000 !important;
}

.cart-icon:hover { color: var(--ai-primary); }

.cart-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background: var(--ai-primary);
    color: white;
    font-weight: 700;
    font-size: 10px;
    height: 18px;
    min-width: 18px;
    padding: 0 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    box-shadow: 0 2px 5px rgba(178, 115, 194, 0.4);
}

/* MOBILE DRAWER */
.mobile-drawer {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 100%;
    max-width: 320px;
    background: #ffffff;
    z-index: 2000;
    display: flex;
    flex-direction: column;
    box-shadow: 20px 0 50px rgba(0, 0, 0, 0.1);
    font-family: 'Inter', sans-serif;
}

.drawer-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(29, 29, 29, 0.4);
    backdrop-filter: blur(8px);
    z-index: 1999;
}

.mobile-item {
    border-bottom: 1px solid var(--ai-border);
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 1.2rem;
    transition: background 0.3s ease;
}

.mobile-item:hover {
    background: #f6edf8;
}

.mobile-link {
    font-weight: 600;
    font-size: 1rem;
    color: var(--ai-dark);
    text-decoration: none;
    flex: 1;
}

.mobile-link.active { color: var(--ai-primary); }

.mobile-icon {
    width: 20px;
    color: var(--ai-primary);
}
`;

function Index() {
    const [toggle, setToggle] = useState(false);
    const authCtx = useContext(authContext);
    const role = authCtx.role;
    const cartLength = useSelector((state) => state.cart.length);
    const [scrolled, setScrolled] = useState(false);
    const [categories, setCategories] = useState([]);
    const location = useLocation();
    const navbarRef = useRef(null);

    const isHomePage = location.pathname === "/";

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/categories`);
                setCategories(res.data || []);
            } catch (error) {
                console.error("Error fetching categories", error);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useGSAP(() => {
        gsap.from(".navbar-container .nav-link, .account-button, .cart-container", {
            y: -20,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out",
            delay: 0.2
        });
        
        const logo = document.querySelector(".nav-logo");
        if(logo) {
            logo.addEventListener('mouseenter', () => gsap.to(logo, { scale: 1.05, duration: 0.3, ease: 'power2.out' }));
            logo.addEventListener('mouseleave', () => gsap.to(logo, { scale: 1, duration: 0.3, ease: 'power2.out' }));
        }
    }, { scope: navbarRef });

    // BLOQUEO DE SCROLL AL ABRIR MENÚ
    useEffect(() => {
        if (toggle) {
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = 'var(--scrollbar-width, 0px)';
        } else {
            document.body.style.overflow = 'unset';
            document.body.style.paddingRight = '0px';
        }
        return () => {
            document.body.style.overflow = 'unset';
            document.body.style.paddingRight = '0px';
        };
    }, [toggle]);

    const signOutHandler = () => {
        localStorage.removeItem("token");
        authCtx.setToken(null);
        setToggle(false);
    };

    const NavItem = ({ to, label, isAdminLink = false, isMobile = false, icon = null }) => (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `${isMobile ? "mobile-link" : "nav-link"}${isAdminLink ? " admin-link" : ""}${isActive ? ' active' : ''}`
            }
            onClick={() => setToggle(false)}
        >
            {isMobile && icon && (
                <FontAwesomeIcon icon={icon} className="mobile-icon" />
            )}
            {label}
        </NavLink>
    );

    const menuItems = [
        { label: "Dashboard", path: "/", icon: faHouse },
        { label: "Scenarios", path: "/products", icon: faMobileScreen },
        { label: "Pronunciation", path: "/pronunciation", icon: faMicrochip },
        { label: "About AI", path: "/about", icon: faCircleInfo },
        { label: "Contact", path: "/contact", icon: faEnvelope },
    ];

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: AiNavbarStyles }} />
            <header className={`navbar-header ${isHomePage && !scrolled ? 'header-transparent' : 'header-solid'} ${toggle ? 'menu-open' : ''}`} ref={navbarRef}>
                <div className="navbar-container">

                    {/* MOBILE TOGGLE (HAMBURGER) */}
                    <button onClick={() => setToggle(!toggle)} className="lg:hidden text-[#1d1d1d] text-2xl z-[2100] w-10 text-left transition-colors hover:text-[#b273c2]">
                        <FontAwesomeIcon icon={toggle ? faXmark : faBars} className={toggle ? "text-[#b273c2]" : ""} />
                    </button>

                    {/* LOGO SECTION */}
                    <div className="flex-1 lg:flex-none flex justify-center lg:justify-start nav-logo">
                        <NavLink to="/" onClick={() => setToggle(false)} className="flex items-center gap-2">
                            <img src={logoBlack} alt="AI Logo" className="w-8 h-8 object-contain rounded-md" />
                            <span className="text-2xl font-black tracking-tight text-[#1d1d1d]">
                                AI <span className="text-[#b273c2]">SPEAKING</span>
                            </span>
                        </NavLink>
                    </div>

                    {/* DESKTOP NAVIGATION */}
                    <nav className="hidden lg:flex items-center gap-6 mx-auto">
                        {menuItems.map((item) => (
                            <NavItem key={item.label} to={item.path} label={item.label} />
                        ))}
                        {authCtx.token && <NavItem to="/mis-cursos" label="My Courses" />}
                        {role === 'admin' && <NavItem to="/admin" label="Admin Panel" isAdminLink />}
                    </nav>

                    <div className="flex items-center justify-end gap-6 w-10 lg:w-auto">
                        {/* CART (Mantenido funcionalmente) */}
                        <NavLink to="/cart" className="cart-container relative p-2 group flex items-center justify-center mt-1" onClick={() => setToggle(false)}>
                            <FontAwesomeIcon icon={faCartShopping} className="cart-icon text-black text-xl" style={{ color: '#000000', opacity: 1, visibility: 'visible', fontSize: '1.2rem' }} />
                            {cartLength > 0 && <span className="cart-badge">{cartLength}</span>}
                        </NavLink>

                        {/* AUTH DESKTOP */}
                        <div className="hidden lg:block">
                            {authCtx.token ? (
                                <button onClick={signOutHandler} className="account-button flex items-center gap-2">
                                    <FontAwesomeIcon icon={faSignOutAlt} />
                                    Logout
                                </button>
                            ) : (
                                <NavLink to="/login" className="account-button flex items-center gap-2">
                                    <FontAwesomeIcon icon={faUser} />
                                    Login
                                </NavLink>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* MOBILE DRAWER */}
            <AnimatePresence>
                {toggle && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="drawer-backdrop"
                            className="drawer-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setToggle(false)}
                        />

                        {/* Drawer Content */}
                        <motion.div
                            key="drawer-content"
                            className="mobile-drawer"
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "tween", ease: "anticipate", duration: 0.5 }}
                        >
                            <div className="p-6 border-b border-[#f0dff3] flex justify-between items-center bg-[#f8f3f6]">
                                <div className="flex items-center gap-2">
                                    <img src={logoBlack} alt="AI Logo" className="w-6 h-6 object-contain rounded-md" />
                                    <span className="text-xl font-black text-[#1d1d1d]">
                                        AI <span className="text-[#b273c2]">SPEAKING</span>
                                    </span>
                                </div>
                                <button onClick={() => setToggle(false)} className="text-gray-500 hover:text-[#b273c2] transition-colors text-2xl bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-sm">
                                    <FontAwesomeIcon icon={faXmark} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto bg-[#ffffff]">
                                <div className="px-6 pt-6 pb-2">
                                    <p className="font-bold text-xs text-[#b273c2] uppercase tracking-wider">Explore</p>
                                </div>

                                {menuItems.map((item) => (
                                    <div key={item.label} className="mobile-item">
                                        <NavItem to={item.path} label={item.label} icon={item.icon} isMobile />
                                    </div>
                                ))}

                                {authCtx.token && (
                                    <div className="mobile-item">
                                        <NavItem to="/mis-cursos" label="My Courses" icon={faTerminal} isMobile />
                                    </div>
                                )}

                                {role === 'admin' && (
                                    <div className="mobile-item bg-[#f6edf8]">
                                        <NavItem to="/admin" label="Admin Panel" icon={faShieldHalved} isAdminLink isMobile />
                                    </div>
                                )}

                                {/* CATEGORÍAS MÓVIL */}
                                <div className="mt-6 px-6 pb-2">
                                    <p className="font-bold text-xs text-[#b273c2] uppercase tracking-wider">Topics</p>
                                </div>
                                <div className="px-6 grid grid-cols-2 gap-3 mb-8">
                                    {categories.slice(0, 5).map((cat) => (
                                        <Link
                                            key={cat.id || cat.categoryName}
                                            to={`/products?category=${cat.categoryName}`}
                                            onClick={() => setToggle(false)}
                                            className="px-3 py-2 bg-[#f8f3f6] text-[#b273c2] text-xs font-bold rounded-xl text-center hover:bg-[#b273c2] hover:text-white transition-colors border border-[#f0dff3]"
                                        >
                                            {cat.categoryName}
                                        </Link>
                                    ))}
                                    <Link
                                        to="/products"
                                        onClick={() => setToggle(false)}
                                        className="px-3 py-2 border border-[#f0dff3] text-gray-500 text-xs font-bold rounded-xl text-center hover:bg-gray-50"
                                    >
                                        VIEW ALL
                                    </Link>
                                </div>

                                <div className="mt-auto px-6 pb-6">
                                    {authCtx.token ? (
                                        <button onClick={signOutHandler} className="account-button w-full flex justify-center items-center gap-2">
                                            <FontAwesomeIcon icon={faSignOutAlt} />
                                            Logout
                                        </button>
                                    ) : (
                                        <NavLink to="/login" className="account-button w-full flex justify-center items-center gap-2" onClick={() => setToggle(false)}>
                                            <FontAwesomeIcon icon={faUser} />
                                            Login
                                        </NavLink>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <main className={isHomePage ? "pt-0" : "pt-[80px] lg:pt-[80px]"}>
                <Outlet />
            </main>
        </>
    );
}

export default Index;