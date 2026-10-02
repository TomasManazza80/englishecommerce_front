import MyRoutes from "./routing/Routes";
import authContext from "./store/store";
import { useState, useEffect } from "react";
import { Provider } from "react-redux";
import { ReduxStore } from "./store/redux/ReduxStore";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { CmsProvider } from "./store/CmsContext";
import Lenis from 'lenis';
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const updateLenis = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateLenis);

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(updateLenis);
    };
  }, []);

  useEffect(() => {
    const fetchRole = async () => {
      if (token) {
        try {
          const decoded = jwtDecode(token);
          const response = await axios.get(`${API_URL}/role/${decoded.email}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setRole(response.data || 'user');
        } catch (error) {
          console.error("Error fetching role:", error);
          setRole('user');
          if (error.response && error.response.status === 401) {
            setToken(null);
            localStorage.removeItem("token");
          }
        }
      } else {
        setRole(null);
      }
    };
    fetchRole();
  }, [token]);

  return (
    <>
      <authContext.Provider value={{ token, setToken, role, setRole }}>
        <Provider store={ReduxStore}>
          <CmsProvider>
            <MyRoutes />
          </CmsProvider>
        </Provider>
      </authContext.Provider>
    </>
  );
}

export default App;
