import authContext from "../store/store";
import { useContext } from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const authCtx = useContext(authContext);
  const isLoggedin = authCtx.token;

  if (!isLoggedin) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
