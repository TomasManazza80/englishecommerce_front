import React, { useContext, useState, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
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
  `px-4 py-3 sm:py-2.5 text-sm sm:text-base font-medium rounded-full min-h-[44px] flex items-center transition-all duration-200 ${isActive ? GLASS_PILL_ACTIVE : `${TEXT_LEGIBLE} ${GLASS_PILL_HOVER}`}`;

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
  const isDarkNav = isDarkPage || isHomePage;
  const navText = isDarkNav ? TEXT_LEGIBLE : TEXT_LEGIBLE_LIGHT;
  const navPillHover = isDarkNav ? GLASS_PILL_HOVER : GLASS_PILL_HOVER_LIGHT;
  const navLinkClass = isDarkNav ? desktopLinkClass : desktopLinkClassLight;
  const navButton = isDarkNav ? GLASS_BUTTON : GLASS_BUTTON_LIGHT;

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

      {/* Floating Clear Liquid Glass Capsule */}
      <header className="fixed top-2.5 sm:top-4 md:top-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.25rem)] sm:w-[calc(100%-2rem)] md:w-[calc(100%-4rem)] max-w-[1440px] pointer-events-none transition-all duration-300 ease-out">
        <div
          style={{
            ...glassBaseStyle,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
          className={`relative isolate pointer-events-auto w-full rounded-full border ${
            isDarkNav ? "border-white/30 bg-[rgba(52,42,78,0.5)]" : "border-white/70 bg-white/[0.55]"
          } px-3.5 sm:px-6 md:px-9 flex flex-row !flex-row items-center justify-between transition-all duration-300 ease-out ${
            scrolled
              ? `${GLASS_BEVEL_SCROLLED} py-2 sm:py-2.5 md:py-3`
              : `${GLASS_BEVEL} py-2.5 sm:py-3.5 md:py-4`
          }`}
        >
          <GlassLayers />

          {/* Logo Left */}
          <Link
            to="/"
            style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
            className={`relative z-10 flex flex-row !flex-row items-center gap-2 sm:gap-3 group flex-shrink-0 transition-all duration-300 ease-out ${
              isDarkNav
                ? "-ml-1.5 sm:-ml-3 md:-ml-5 px-2.5 sm:px-3 md:px-4 py-0.5 sm:py-1 rounded-full bg-white/90 border border-white/80 shadow-[inset_0_1px_1px_0_rgba(255,255,255,1),inset_0_-1px_1px_0_rgba(155,89,182,0.12),0_4px_14px_-2px_rgba(0,0,0,0.35)] hover:bg-white"
                : ""
            }`}
            data-purpose="site-logo"
          >
            <img
              src={bloomLogo}
              alt="English BLOOM"
              className={`${
                isDarkNav
                  ? "h-7 sm:h-9 md:h-12"
                  : "h-8 sm:h-10 md:h-14 drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]"
              } w-auto object-contain transition-transform duration-300 group-hover:scale-105`}
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

      {/* Mobile Drawer */}
      {toggle && (
        <div className="fixed inset-0 z-50 lg:hidden font-sans">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setToggle(false)}
          ></div>

          {/* Drawer panel (Clear Glass) */}
          <div
            style={{
              ...glassBaseStyle,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
            className={`fixed top-3 bottom-3 right-3 sm:top-4 sm:bottom-4 sm:right-4 w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] max-w-xs sm:max-w-sm isolate rounded-[1.75rem] sm:rounded-[2rem] border border-white/25 bg-[#151023]/95 sm:bg-white/[0.06] ${GLASS_BEVEL} p-4 sm:p-6 flex flex-col !flex-col justify-between transition-all duration-300 ease-out overflow-hidden shadow-2xl`}
          >
            <GlassLayers radius="rounded-[1.75rem] sm:rounded-[2rem]" />

            <div
              style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
              className="relative z-10 flex flex-col !flex-col flex-1 min-h-0"
            >
              <div
                style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
                className="flex flex-row !flex-row items-center justify-between pb-4 sm:pb-6 border-b border-white/15 shrink-0"
              >
                <img
                  src={bloomLogo}
                  alt="English BLOOM"
                  className="h-7 sm:h-8 w-auto object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
                />
                <button
                  onClick={() => setToggle(false)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                  className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full ${TEXT_LEGIBLE} ${GLASS_PILL_HOVER} active:scale-95`}
                >
                  <i className="fa-solid fa-xmark text-lg sm:text-xl"></i>
                </button>
              </div>

              <nav
                style={{ display: "flex", flexDirection: "column" }}
                className="mt-4 sm:mt-6 flex flex-col !flex-col space-y-1 sm:space-y-1.5 overflow-y-auto flex-1 pr-1 overscroll-contain"
              >
                <NavLink to="/" end onClick={() => setToggle(false)} className={mobileLinkClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/products" onClick={() => setToggle(false)} className={mobileLinkClass}>
                  Scenarios
                </NavLink>
                <NavLink to="/pronunciation" onClick={() => setToggle(false)} className={mobileLinkClass}>
                  Pronunciation
                </NavLink>
                <NavLink to="/about" onClick={() => setToggle(false)} className={mobileLinkClass}>
                  About AI
                </NavLink>
                <NavLink to="/contact" onClick={() => setToggle(false)} className={mobileLinkClass}>
                  Contact
                </NavLink>
                <NavLink to="/mis-cursos" onClick={() => setToggle(false)} className={mobileLinkClass}>
                  My Courses
                </NavLink>

                {role === "admin" && (
                  <NavLink
                    to="/admin"
                    onClick={() => setToggle(false)}
                    className={({ isActive }) => `justify-center mt-2 ${isActive ? GLASS_BUTTON_ACCENT : GLASS_BUTTON}`}
                  >
                    Admin Panel
                  </NavLink>
                )}
              </nav>
            </div>

            <div className="relative z-10 pt-4 sm:pt-6 border-t border-white/15 space-y-2.5 sm:space-y-3 shrink-0">
              {authCtx.token ? (
                <button onClick={signOutHandler} className={`w-full justify-center ${GLASS_BUTTON}`}>
                  <i className="fa-solid fa-user text-xs"></i>
                  <i className="fa-solid fa-right-from-bracket text-xs"></i>
                  <span>Logout</span>
                </button>
              ) : (
                <>
                  <Link to="/login" onClick={() => setToggle(false)} className={`w-full justify-center ${GLASS_BUTTON}`}>
                    Login
                  </Link>
                  <Link to="/signup" onClick={() => setToggle(false)} className={`w-full justify-center ${GLASS_BUTTON_ACCENT}`}>
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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
