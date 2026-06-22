import { useContext, useEffect } from "react";
import { GoogleLogin } from '@react-oauth/google';
import { Formik, Form, Field, ErrorMessage } from "formik";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import * as Yup from "yup";
import authContext from "../../store/store";
import { FiMail, FiLock, FiArrowRight, FiActivity } from "react-icons/fi";

import logo from "../../images/logo.png";
const API_URL = import.meta.env.VITE_API_URL;

function Login() {
  const navigate = useNavigate();
  const authCtx = useContext(authContext);

  const initialValues = {
    email: "",
    password: "",
  };

  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email("*Formato de email inválido")
      .required("*El email es requerido"),
    password: Yup.string().required("*La contraseña es requerida"),
  });

  const onSubmit = async (values, { setSubmitting, setStatus }) => {
    try {
      const data = {
        email: values.email,
        password: values.password,
      };

      const response = await axios.post(`${API_URL}/login`, data);
      authCtx.setToken(response.data.token);
      localStorage.setItem("token", response.data.token);
      navigate("/");
    } catch (error) {
      setStatus({
        error: error.response?.data?.message || "Credenciales inválidas. Por favor, reintenta.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post(`${API_URL}/google-login`, {
        token: credentialResponse.credential
      });
      authCtx.setToken(response.data.token);
      localStorage.setItem("token", response.data.token);
      navigate("/admin");
    } catch (error) {
      console.error("Google Login Error:", error);
    }
  };

  const handleGoogleError = () => {
    console.log('Login Failed');
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    authCtx.setToken(token);
    if (token) {
      navigate("/admin");
    }
  }, [authCtx, navigate]);

  return (
    <div className="min-h-screen bg-[#ffffff] flex items-center justify-center p-6 text-[#333333] font-sans selection:bg-[#cba394] selection:text-white">
      <div className="w-full max-w-md animate-in fade-in duration-700">

        {/* Encabezado Visual */}
        <div className="text-center mb-10">
          <img
            src={logo}
            alt="LuPetruccelli"
            className="h-20 mx-auto mb-4 object-contain transition-all hover:scale-105"
          />

        </div>

        {/* Tarjeta de Login (Minimalist Luxury) */}
        <div className="bg-[#f9f3f2] border-0 p-12 text-center rounded-sm">
          <h2 className="text-xl text-[#333333] mb-10 uppercase tracking-widest font-light">
            Iniciar Sesión
          </h2>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
          >
            {({ isSubmitting, status }) => (
              <Form className="space-y-8 text-left">

                {/* Campo Email */}
                <div className="relative">
                  <label className="text-[11px] text-[#b07d6b] uppercase tracking-widest mb-2 block font-medium">
                    Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-[#b07d6b]">
                      <FiMail size={18} className="text-[#cba394]" />
                    </div>
                    <Field
                      type="email"
                      name="email"
                      className="w-full bg-white border-b border-[#cba394]/30 py-3 pl-10 pr-4 text-[#333333] font-light text-[13px] focus:border-[#b07d6b] focus:outline-none transition-all placeholder:text-gray-400"
                      placeholder="tu@email.com"
                    />
                  </div>
                  <ErrorMessage
                    name="email"
                    component="p"
                    className="text-[11px] text-[#b07d6b] mt-2 italic font-light"
                  />
                </div>

                {/* Campo Contraseña */}
                <div className="relative">
                  <label className="text-[11px] text-[#b07d6b] uppercase tracking-widest mb-2 block font-medium">
                    Contraseña
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-[#b07d6b]">
                      <FiLock size={18} className="text-[#cba394]" />
                    </div>
                    <Field
                      type="password"
                      name="password"
                      className="w-full bg-white border-b border-[#cba394]/30 py-3 pl-10 pr-4 text-[#333333] font-light text-[13px] focus:border-[#b07d6b] focus:outline-none transition-all placeholder:text-gray-400 tracking-widest"
                      placeholder="••••••••"
                    />
                  </div>
                  <ErrorMessage
                    name="password"
                    component="p"
                    className="text-[11px] text-[#b07d6b] mt-2 italic font-light"
                  />
                </div>

                {/* Utilidades */}
                <div className="flex items-center justify-between mt-6">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 border-[#cba394] text-[#b07d6b] focus:ring-0 rounded-sm transition-all accent-[#b07d6b]"
                    />
                    <span className="ml-2 text-[11px] text-[#333333] font-light hover:text-[#b07d6b] transition-colors">
                      Recordarme
                    </span>
                  </label>
                  <a href="#" className="text-[11px] text-[#333333] font-light hover:text-[#b07d6b] transition-colors">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>

                {/* Mensaje de error de status */}
                {status && status.error && (
                  <div className="bg-white border border-[#b07d6b]/20 p-3 flex items-center justify-center gap-3 rounded-sm">
                    <FiActivity className="text-[#b07d6b]" />
                    <p className="text-[11px] text-[#b07d6b] uppercase tracking-wider">{status.error}</p>
                  </div>
                )}

                {/* Botón de Login */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full group relative flex items-center justify-center py-4 px-6 bg-gradient-to-r from-[#cba394] to-[#b07d6b] text-white font-medium text-[12px] uppercase tracking-widest hover:opacity-90 transition-all duration-500 disabled:opacity-50 rounded-sm shadow-sm"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                      INGRESANDO...
                    </span>
                  ) : (
                    <>
                      INGRESAR <FiArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" size={16} />
                    </>
                  )}
                </button>
              </Form>
            )}
          </Formik>

          {/* Divider de Lujo */}
          <div className="mt-10 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#cba394]/30"></div>
            </div>
            <div className="relative flex justify-center text-[#cba394]">
              <span className="px-4 bg-[#f9f3f2] text-[14px]">✦</span>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              shape="rectangular"
              text="signin_with"
              size="large"
              width="300"
            />
          </div>

          {/* Registro */}
          <div className="mt-10 text-center">
            <p className="text-[12px] text-[#333333] font-light">
              ¿No tienes una cuenta?{" "}
              <NavLink
                to="/signup"
                className="font-medium text-[#b07d6b] hover:text-[#cba394] transition-colors ml-1 border-b border-transparent hover:border-[#cba394] pb-0.5 uppercase tracking-wider text-[11px]"
              >
                Crear Cuenta
              </NavLink>
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-[10px] text-gray-400 tracking-widest uppercase font-light">
            © {new Date().getFullYear()} LuPetruccelli
          </p>
        </footer>
      </div>
    </div>
  );
}

export default Login;