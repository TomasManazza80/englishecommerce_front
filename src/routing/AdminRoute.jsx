import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode"; // Cambiado aquí
import AuthContext from '../store/store'; // Asegúrate de tener el contexto de autenticación

const API_URL = import.meta.env.VITE_API_URL;


const AdminRoute = ({ children }) => {
  const [status, setStatus] = useState('LOADING'); // 'LOADING', 'NOT_LOGGED_IN', 'NOT_ADMIN', 'ADMIN'
  const authCtx = useContext(AuthContext);

  useEffect(() => {
    const checkAdmin = async () => {
      const token = localStorage.getItem("token");
   
      if (!token) {
        setStatus('NOT_LOGGED_IN');
        return;
      }

      try {
        const decodedToken = jwtDecode(token);
        const response = await axios.get(`${API_URL}/role/${decodedToken.email}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const userRole = response.data;
        if (userRole === 'admin') {
          setStatus('ADMIN');
        } else {
          setStatus('NOT_ADMIN');
        }
      } catch (error) {
        console.error('Error retrieving user role:', error);
        setStatus('NOT_LOGGED_IN');
      }
    };

    checkAdmin();
  }, [authCtx]);

  if (status === 'LOADING') {
    return <div>Loading...</div>;
  }

  if (status === 'NOT_LOGGED_IN') {
    return <Navigate to="/login" replace />;
  }

  if (status === 'NOT_ADMIN') {
    alert("No tienes autorización para acceder a la ruta de administración.");
    return <Navigate to="/" replace />;
  }

  return children; // ADMIN
};

export default AdminRoute;
