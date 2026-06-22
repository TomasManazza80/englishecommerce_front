import MyRoutes from "./routing/Routes";
import authContext from "./store/store";
import { useState, useEffect } from "react";
import { Provider } from "react-redux";
import { ReduxStore } from "./store/redux/ReduxStore";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [role, setRole] = useState(null);

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
          <MyRoutes />
        </Provider>
      </authContext.Provider>
    </>
  );
}

export default App;
