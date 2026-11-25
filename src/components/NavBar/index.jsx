import React, { useContext, useState, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import authContext from "../../store/store";
import bloomLogo from "../../images/logoingles.png";

/* ---------- iOS Clear Liquid Glass tokens ---------- */
const GLASS_BACKDROP = "blur(3px) saturate(180%) brightness(1.08) contrast(1.05)";

const glassBaseStyle = {
  backdropFilter: GLASS_BACKDROP,
  WebkitBackdropFilter: GLASS_BACKDROP,
};

// Refraction layer (Chromium applies the SVG displacement; others gracefully fall back to blur)
const glassRefractionStyle = {
  backdropFilter: `url(#ios-clear-glass) ${GLASS_BACKDROP}`,
  WebkitBackdropFilter: GLASS_BACKDROP,
};

// Diagonal rim light (gradient border via mask)
const glassRimStyle = {
  padding: "1px",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.05) 60%, rgba(255,255,255,0.35) 100%)",
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
};

const GLASS_BEVEL =
  "shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.45),inset_0_-1px_1px_0_rgba(255,255,255,0.15),inset_0_0_14px_0_rgba(255,255,255,0.06),0_12px_32px_-4px_rgba(0,0,0,0.35)]";
const GLASS_BEVEL_SCROLLED =
  "shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.5),inset_0_-1px_1px_0_rgba(255,255,255,0.18),inset_0_0_16px_0_rgba(255,255,255,0.08),0_18px_40px_-6px_rgba(0,0,0,0.45)]";

const TEXT_LEGIBLE = "text-white/95 hover:text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)]";
const GLASS_PILL_HOVER =
  "hover:bg-white/10 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] rounded-full transition-all duration-300 ease-out";
const GLASS_PILL_ACTIVE =
  "bg-white/[0.14] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),inset_0_-1px_0_0_rgba(255,255,255,0.08),0_4px_12px_-2px_rgba(0,0,0,0.25)] rounded-full transition-all duration-300 ease-out drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]";

const desktopLinkClass = ({ isActive }) =>
  `px-3 xl:px-4 py-2 xl:py-2.5 font-medium ${isActive ? GLASS_PILL_ACTIVE : `${TEXT_LEGIBLE} ${GLASS_PILL_HOVER}`}`;

const mobileLinkClass = ({ isActive }) =>
  `group px-4 py-3.5 text-[15px] rounded-2xl min-h-[48px] flex items-center justify-between transition-all duration-200 ${
    isActive
      ? "bg-purple-50 text-[#7c3aed] font-bold border border-purple-200/80 shadow-2xs"
      : "text-neutral-900 font-semibold hover:bg-neutral-100 hover:text-[#7c3aed]"
  }`;

const MOBILE_NAV_LINKS = [
  { to: "/", label: "Home", end: true, icon: "fa-house" },
  { to: "/products", label: "Courses", end: false, icon: "fa-graduation-cap" },
  { to: "/about", label: "About us", end: false, icon: "fa-circle-info" },
  { to: "/contact", label: "Contact", end: false, icon: "fa-envelope" },
  { to: "/mis-cursos", label: "My Courses", end: false, icon: "fa-book-open" },
];

const GLASS_BUTTON =
  "inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium text-white/95 hover:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] bg-white/[0.08] border border-white/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),inset_0_-1px_0_0_rgba(255,255,255,0.08)] hover:bg-white/[0.16] transition-all duration-300 ease-out active:scale-95 min-h-[40px] sm:min-h-0";

/* Light frosted variant (used over light pages for logo/text legibility) */
const TEXT_LEGIBLE_LIGHT = "text-slate-800 hover:text-[#9b59b6] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]";
const GLASS_PILL_HOVER_LIGHT =
  "hover:bg-white/60 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_2px_8px_-2px_rgba(155,89,182,0.18)] rounded-full transition-all duration-300 ease-out";
const GLASS_PILL_ACTIVE_LIGHT =
  "bg-white/70 text-[#9b59b6] shadow-[inset_0_1px_0_0_rgba(255,255,255,1),inset_0_-1px_0_0_rgba(155,89,182,0.08),0_4px_12px_-2px_rgba(155,89,182,0.22)] rounded-full transition-all duration-300 ease-out";
const desktopLinkClassLight = ({ isActive }) =>
  `px-3 xl:px-4 py-2 xl:py-2.5 font-medium ${isActive ? GLASS_PILL_ACTIVE_LIGHT : `${TEXT_LEGIBLE_LIGHT} ${GLASS_PILL_HOVER_LIGHT}`}`;
const GLASS_BUTTON_LIGHT =
  "inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium text-[#9b59b6] hover:text-[#8e44ad] bg-white/55 border border-white/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),inset_0_-1px_0_0_rgba(155,89,182,0.08),0_2px_8px_-2px_rgba(155,89,182,0.18)] hover:bg-white/80 transition-all duration-300 ease-out active:scale-95 min-h-[40px] sm:min-h-0";

const GLASS_BUTTON_ACCENT =
  "inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium text-white bg-[#9b59b6]/70 border border-white/30 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.5),inset_0_-1px_1px_0_rgba(0,0,0,0.15),0_6px_18px_-4px_rgba(155,89,182,0.6)] hover:bg-[#9b59b6]/85 transition-all duration-300 ease-out active:scale-95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] min-h-[40px] sm:min-h-0";

/* Shared visual layers for any glass surface */
function GlassLayers({ radius = "rounded-full" }) {
  return (
    <>
      <span aria-hidden="true" className={`pointer-events-none absolute inset-0 ${radius}`} style={glassRefractionStyle} />
      <span aria-hidden="true" className={`pointer-events-none absolute inset-0 ${radius}`} style={glassRimStyle} />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-3 sm:inset-x-6 top-0 h-1/2 ${radius} bg-gradient-to-b from-white/[0.12] to-transparent`}
      />
    </>
  );
}

function NavBar() {
  const [toggle, setToggle] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const authCtx = useContext(authContext);
  const role = authCtx.role;
  const cartLength = useSelector((state) => state.cart?.length || 0);
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isMisCursos = location.pathname.startsWith("/mis-cursos");
  const isProductDetails = location.pathname.startsWith("/product/");
  const isProducts = location.pathname.startsWith("/products");
  const isAdminPage = location.pathname.startsWith("/admin");
  const isEditModeIframe = new URLSearchParams(location.search).get("editMode") === "true";
  const hidePublicNavbar = isAdminPage || isEditModeIframe;
  const isAbout = location.pathname.startsWith("/about");
  const isContact = location.pathname.startsWith("/contact");
  const isCart = location.pathname.startsWith("/cart");
  const isCheckout = location.pathname.startsWith("/checkout");
  const isDarkPage = isMisCursos || isProductDetails || isProducts || isAbout || isContact || isCart || isCheckout;
  const isDarkNav = false;
  const navText = TEXT_LEGIBLE_LIGHT;
  const navPillHover = GLASS_PILL_HOVER_LIGHT;
  const navLinkClass = desktopLinkClassLight;
  const navButton = GLASS_BUTTON_LIGHT;

  useEffect(() => {
    if (isDarkPage) {
      document.body.style.backgroundColor = "#151023";
    } else {
      document.body.style.backgroundColor = "#FAF7FD";
    }
    return () => {
      document.body.style.backgroundColor = "#FAF7FD";
    };
  }, [isDarkPage]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (toggle) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [toggle]);

  const signOutHandler = () => {
    localStorage.removeItem("token");
    authCtx.setToken(null);
    setToggle(false);
  };

  if (hidePublicNavbar) {
    return (
      <main className={`min-h-screen pt-0 ${isDarkPage ? "bg-surface" : ""}`}>
        <Outlet />
      </main>
    );
  }

  return (
    <>
      {/* SVG optical refraction filter */}
      <svg aria-hidden="true" className="absolute w-0 h-0 overflow-hidden" focusable="false">
        <defs>
          <filter id="ios-clear-glass" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Solid White Navbar (Full-width at top, rounded pill on scroll) */}
      <header
        className={`fixed left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 ease-out ${
          scrolled
            ? "top-2.5 sm:top-4 md:top-5 w-[calc(100%-1.25rem)] sm:w-[calc(100%-2rem)] md:w-[calc(100%-4rem)] max-w-[1440px]"
            : "top-0 w-full max-w-none"
        }`}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
          className={`relative isolate pointer-events-auto w-full bg-white px-4 sm:px-6 md:px-10 flex flex-row !flex-row items-center justify-between transition-all duration-300 ease-out ${
            scrolled
              ? "rounded-full border border-slate-200/90 shadow-[0_18px_40px_-6px_rgba(15,23,42,0.16)] py-2 sm:py-2.5 md:py-3"
              : "rounded-none border-b border-slate-200/80 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.08)] py-2.5 sm:py-3.5 md:py-4"
          }`}
        >

          {/* Logo Left */}
          <Link
            to="/"
            style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
            className="relative z-10 flex flex-row !flex-row items-center gap-2 sm:gap-3 group flex-shrink-0 transition-all duration-300 ease-out"
            data-purpose="site-logo"
          >
            <img
              src={bloomLogo}
              alt="English BLOOM"
              className="h-8 sm:h-10 md:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          {/* Nav Items Center */}
          <nav
            className="relative z-10 hidden lg:flex items-center gap-1 xl:gap-2 text-sm sm:text-[15px] font-medium"
            data-purpose="main-navigation"
          >
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>

            <NavLink to="/products" className={navLinkClass}>
              Courses
            </NavLink>

            <NavLink to="/about" className={navLinkClass}>
              About us
            </NavLink>

            <NavLink to="/contact" className={navLinkClass}>
              Contact
            </NavLink>

            <NavLink to="/mis-cursos" className={navLinkClass}>
              My Courses
            </NavLink>

            {role === "admin" && (
              <NavLink
                to="/admin"
                className={({ isActive }) => `ml-1 ${isActive ? GLASS_BUTTON_ACCENT : navButton}`}
              >
                Admin Panel
              </NavLink>
            )}
          </nav>

          {/* Right: Cart & Auth */}
          <div
            style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
            className="relative z-10 flex flex-row !flex-row items-center gap-2 sm:gap-3 md:gap-4 shrink-0"
          >
            {/* Cart Icon */}
            <Link
              to="/cart"
              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
              className={`relative w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-full ${navText} ${navPillHover}`}
              title="Cart"
            >
              <i className="fa-solid fa-cart-shopping text-base sm:text-xl md:text-2xl"></i>
              {cartLength > 0 && (
                <span className="absolute -top-1 -right-1 sm:-top-0.5 sm:-right-1 bg-[#9b59b6]/90 text-white font-semibold text-[10px] sm:text-xs h-4.5 sm:h-5 min-w-[18px] sm:min-w-[20px] px-1 sm:px-1.5 rounded-full flex items-center justify-center border border-white/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.45),0_4px_10px_-2px_rgba(0,0,0,0.35)]">
                  {cartLength}
                </span>
              )}
            </Link>

            {/* Auth Pill Button */}
            {authCtx.token ? (
              <button onClick={signOutHandler} className={`hidden sm:inline-flex ${navButton}`}>
                <i className="fa-solid fa-user text-sm"></i>
                <i className="fa-solid fa-right-from-bracket text-sm"></i>
                <span>Logout</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-2 md:gap-2.5">
                <Link to="/login" className={navButton}>
                  <i className="fa-solid fa-user text-sm"></i>
                  <span>Login</span>
                </Link>
                <Link to="/signup" className={GLASS_BUTTON_ACCENT}>
                  <span>Sign Up</span>
                </Link>
              </div>
            )}

            {/* Mobile Toggle Button */}
            <button
              onClick={() => setToggle(!toggle)}
              aria-label="Toggle Navigation"
              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
              className={`lg:hidden w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-full ${navText} ${navPillHover} active:scale-95 transition-transform`}
            >
              <i className={`fa-solid ${toggle ? "fa-xmark" : "fa-bars"} text-lg sm:text-xl`}></i>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (White background, black letters, smooth animation, same sections as PC) */}
      <AnimatePresence>
        {toggle && (
          <div className="fixed inset-0 z-50 lg:hidden font-sans">
            {/* Animated Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="fixed inset-0 bg-black/45 backdrop-blur-xs"
              onClick={() => setToggle(false)}
            />

            {/* Animated White Drawer Panel */}
            <motion.div
              initial={{ x: "100%", opacity: 0.9 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.9 }}
              transition={{ type: "spring", stiffness: 340, damping: 34, mass: 0.85 }}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
              className="fixed top-3 bottom-3 right-3 sm:top-4 sm:bottom-4 sm:right-4 w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] max-w-xs sm:max-w-sm isolate rounded-[1.75rem] sm:rounded-[2rem] border border-neutral-200 bg-white text-neutral-900 p-5 sm:p-6 flex flex-col !flex-col justify-between overflow-hidden shadow-[0_24px_60px_rgba(15,23,42,0.25)]"
            >
              <div
                style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
                className="relative z-10 flex flex-col !flex-col flex-1 min-h-0"
              >
                {/* Drawer Header */}
                <div
                  style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
                  className="flex flex-row !flex-row items-center justify-between pb-4 sm:pb-5 border-b border-neutral-200 shrink-0"
                >
                  <Link to="/" onClick={() => setToggle(false)} className="flex items-center">
                    <img
                      src={bloomLogo}
                      alt="English BLOOM"
                      className="h-8 sm:h-9 w-auto object-contain"
                    />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setToggle(false)}
                    aria-label="Cerrar menú"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-900 active:scale-95 transition-all"
                  >
                    <i className="fa-solid fa-xmark text-lg"></i>
                  </button>
                </div>

                {/* Drawer Links (Identical sections to PC Navbar) */}
                <nav
                  style={{ display: "flex", flexDirection: "column" }}
                  className="mt-4 sm:mt-5 flex flex-col !flex-col space-y-1.5 overflow-y-auto flex-1 pr-1 overscroll-contain"
                >
                  {MOBILE_NAV_LINKS.map((item, idx) => (
                    <motion.div
                      key={item.to}
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.22, delay: 0.04 + idx * 0.04, ease: "easeOut" }}
                    >
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={() => setToggle(false)}
                        className={mobileLinkClass}
                      >
                        <span className="flex items-center gap-3">
                          <i className={`fa-solid ${item.icon} text-sm w-5 text-center opacity-75`}></i>
                          <span>{item.label}</span>
                        </span>
                        <i className="fa-solid fa-chevron-right text-xs opacity-40 group-hover:translate-x-0.5 transition-transform"></i>
                      </NavLink>
                    </motion.div>
                  ))}

                  {role === "admin" && (
                    <motion.div
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.22, delay: 0.26, ease: "easeOut" }}
                      className="pt-2"
                    >
                      <NavLink
                        to="/admin"
                        onClick={() => setToggle(false)}
                        className={({ isActive }) =>
                          `w-full px-4 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all border ${
                            isActive
                              ? "bg-[#7c3aed] text-white border-[#7c3aed] shadow-md"
                              : "bg-purple-50 text-[#7c3aed] border-purple-200 hover:bg-purple-100"
                          }`
                        }
                      >
                        <i className="fa-solid fa-shield-halved text-xs"></i>
                        <span>Admin Panel</span>
                      </NavLink>
                    </motion.div>
                  )}
                </nav>
              </div>

              {/* Drawer Footer (Auth Actions) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.22 }}
                className="relative z-10 pt-4 sm:pt-5 border-t border-neutral-200 space-y-2.5 shrink-0"
              >
                {authCtx.token ? (
                  <button
                    type="button"
                    onClick={signOutHandler}
                    className="w-full py-3 px-4 rounded-full text-sm font-bold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200/90 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <i className="fa-solid fa-user text-xs"></i>
                    <i className="fa-solid fa-right-from-bracket text-xs"></i>
                    <span>Logout</span>
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    <Link
                      to="/login"
                      onClick={() => setToggle(false)}
                      className="w-full py-3 px-4 rounded-full text-sm font-bold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200/90 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <i className="fa-solid fa-user text-xs"></i>
                      <span>Login</span>
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setToggle(false)}
                      className="w-full py-3 px-4 rounded-full text-sm font-bold text-white bg-[#7c3aed] hover:bg-[#6d28d9] shadow-md flex items-center justify-center transition-all active:scale-95"
                    >
                      <span>Sign Up</span>
                    </Link>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Outlet with top padding to clear floating navbar */}
      <main
        className={`min-h-screen ${
          isHomePage || isMisCursos || isProductDetails || isProducts || isAbout || isContact || isCart || isCheckout
            ? "pt-0"
            : "pt-24 sm:pt-28 lg:pt-32"
        } ${isDarkPage ? "bg-surface" : ""}`}
      >
        <Outlet />
      </main>
    </>
  );
}

export default NavBar;
