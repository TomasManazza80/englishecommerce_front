import { useContext, useEffect } from "react";

import { Formik, Form, Field, ErrorMessage } from "formik";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import * as Yup from "yup";
import authContext from "../../store/store";
import { FiMail, FiLock, FiArrowRight, FiActivity } from "react-icons/fi";
import { motion } from "framer-motion";

import logo from "../../images/ai_logo.png";
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
      .email("*Invalid email format")
      .required("*Email is required"),
    password: Yup.string().required("*Password is required"),
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
        error: error.response?.data?.message || "Invalid credentials. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };



  useEffect(() => {
    const token = localStorage.getItem("token");
    authCtx.setToken(token);
    if (token) {
      navigate("/admin");
    }
  }, [authCtx, navigate]);

  return (
    <div className="min-h-screen bg-[#f8f3f6] flex items-center justify-center p-6 text-[#1d1d1d] font-sans selection:bg-[#b273c2] selection:text-white pt-24">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Encabezado Visual */}
        <div className="text-center mb-10 flex flex-col items-center">
          <motion.img
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            src={logo}
            alt="AI Speaking Logo"
            className="w-20 h-20 mb-4 object-contain shadow-sm rounded-[20px]"
          />
          <h1 className="text-3xl font-black tracking-tight text-[#1d1d1d]">
            AI <span className="text-[#b273c2]">SPEAKING</span>
          </h1>
          <p className="text-gray-500 font-medium mt-2">Welcome back! Let's practice.</p>
        </div>

        {/* Tarjeta de Login (Modern SaaS) */}
        <div className="bg-white border border-[#f0dff3] shadow-2xl p-10 text-center rounded-[35px]">
          <h2 className="text-xl font-bold text-[#1d1d1d] mb-8">
            Login to your account
          </h2>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
          >
            {({ isSubmitting, status }) => (
              <Form className="space-y-6 text-left">

                {/* Campo Email */}
                <div>
                  <label className="text-xs text-gray-600 font-bold uppercase tracking-widest mb-2 block">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[#b273c2]">
                      <FiMail size={18} className="text-gray-400 group-focus-within:text-[#b273c2]" />
                    </div>
                    <Field
                      type="email"
                      name="email"
                      className="w-full bg-[#f8f3f6] border border-[#f0dff3] rounded-2xl py-3.5 pl-12 pr-4 text-[#1d1d1d] font-medium text-sm focus:border-[#b273c2] focus:ring-2 focus:ring-[#b273c2]/20 focus:outline-none transition-all placeholder:text-gray-400"
                      placeholder="you@email.com"
                    />
                  </div>
                  <ErrorMessage
                    name="email"
                    component="p"
                    className="text-xs text-red-500 mt-2 font-semibold"
                  />
                </div>

                {/* Campo Contraseña */}
                <div>
                  <label className="text-xs text-gray-600 font-bold uppercase tracking-widest mb-2 block">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[#b273c2]">
                      <FiLock size={18} className="text-gray-400 group-focus-within:text-[#b273c2]" />
                    </div>
                    <Field
                      type="password"
                      name="password"
                      className="w-full bg-[#f8f3f6] border border-[#f0dff3] rounded-2xl py-3.5 pl-12 pr-4 text-[#1d1d1d] font-medium text-sm focus:border-[#b273c2] focus:ring-2 focus:ring-[#b273c2]/20 focus:outline-none transition-all placeholder:text-gray-400 tracking-widest"
                      placeholder="••••••••"
                    />
                  </div>
                  <ErrorMessage
                    name="password"
                    component="p"
                    className="text-xs text-red-500 mt-2 font-semibold"
                  />
                </div>

                {/* Utilidades */}
                <div className="flex items-center justify-between mt-4">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 border-[#e8d1ed] text-[#b273c2] focus:ring-[#b273c2] rounded transition-all"
                    />
                    <span className="ml-2 text-sm text-gray-600 font-medium group-hover:text-[#b273c2] transition-colors">
                      Remember me
                    </span>
                  </label>
                  <a href="#" className="text-sm text-gray-600 font-medium hover:text-[#b273c2] transition-colors">
                    Forgot password?
                  </a>
                </div>

                {/* Mensaje de error de status */}
                {status && status.error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-50 border border-red-100 p-4 flex items-center justify-center gap-3 rounded-2xl"
                  >
                    <FiActivity className="text-red-500" />
                    <p className="text-xs text-red-600 font-bold uppercase tracking-wider">{status.error}</p>
                  </motion.div>
                )}

                {/* Botón de Login */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full group relative flex items-center justify-center py-4 px-6 bg-[#b273c2] hover:bg-[#9d5fb0] text-white font-bold text-sm uppercase tracking-widest transition-all duration-300 disabled:opacity-50 rounded-[20px] shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                      LOGGING IN...
                    </span>
                  ) : (
                    <>
                      LOG IN <FiArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" size={18} />
                    </>
                  )}
                </button>
              </Form>
            )}
          </Formik>



          {/* Registro */}
          <div className="mt-8 text-center bg-[#f8f3f6] p-4 rounded-2xl border border-[#f0dff3]">
            <p className="text-sm text-gray-600 font-medium">
              Don't have an account?{" "}
              <NavLink
                to="/signup"
                className="font-bold text-[#b273c2] hover:text-[#9d5fb0] transition-colors ml-1"
              >
                Sign up
              </NavLink>
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-[10px] text-gray-400 tracking-widest uppercase font-bold">
            © {new Date().getFullYear()} AI SPEAKING PRACTICE
          </p>
        </footer>
      </motion.div>
    </div>
  );
}

export default Login;