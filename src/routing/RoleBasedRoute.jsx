import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import authContext from "../store/store";

const RoleBasedRoute = ({ children, allowedRoles }) => {
    const authCtx = useContext(authContext);
    const { role, token } = authCtx;

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (role === null) {
        // Wait for role to be loaded from App.jsx useEffect
        return <div className="min-h-screen bg-black flex items-center justify-center text-orange-500 font-mono">
            VERIFICANDO_PERMISOS...
        </div>;
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
        // If not authorized, redirect to home or show unauthorized page
        // For now, redirecting to home
        return <Navigate to="/" replace />;
    }

    return children;
};

export default RoleBasedRoute;
