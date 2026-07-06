import { Formik, Form, Field, ErrorMessage } from "formik";

import * as Yup from "yup";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiUser, FiPhone, FiMail, FiLock, FiArrowRight, FiActivity } from "react-icons/fi";
import authContext from "../../store/store";
import { useContext, useEffect } from "react";
import { motion } from "framer-motion";
import logo from "../../images/ai_logo.png";

const API_URL = import.meta.env.VITE_API_URL;

function SignUp() {
  const authCtx = useContext(authContext);
  const navigate = useNavigate();

  const initialValues = {
    name: "",
    number: "",
    email: "",
    password: "",
    confirmPassword: "",
    termsAndConditions: false,
  };

  const validationSchema = Yup.object({
    name: Yup.string().min(2).required("*Name is required"),
    number: Yup.string().matches(/^[0-9]+$/).min(8).required("*Phone number is required"),
    email: Yup.string().email().required("*Email is required"),
    password: Yup.string().min(6).required("*Password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], "*Passwords do not match")
      .required("*Password confirmation is required"),
    termsAndConditions: Yup.boolean().oneOf([true], "*You must accept the terms"),
  });

  const onSubmit = async (values, { setSubmitting, setStatus }) => {
    try {
      const data = {
        name: values.name,
        number: values.number,
        email: values.email,
        password: values.password,
      };

      await axios.post(`${API_URL}/createuser`, data);
      navigate("/login");
    } catch (error) {
      setStatus("Error creating account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };



  useEffect(() => {
    const token = localStorage.getItem("token");
    authCtx.setToken(token);
    if (token) navigate("/");
  }, [authCtx, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f3f6] text-[#1d1d1d] font-sans p-6 selection:bg-[#b273c2] selection:text-white pt-24">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-lg"
      >

        {/* Encabezado Visual */}
        <div className="text-center mb-8 flex flex-col items-center">
          <motion.img
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            src={logo}
            alt="AI Speaking Logo"
            className="w-16 h-16 mb-4 object-contain shadow-sm rounded-[16px]"
          />
          <h1 className="text-2xl font-black tracking-tight text-[#1d1d1d]">
            AI <span className="text-[#b273c2]">SPEAKING</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1">Create your account to start practicing</p>
        </div>

        {/* Tarjeta de Registro */}
        <div className="bg-white border border-[#f0dff3] shadow-2xl p-8 md:p-10 text-center rounded-[35px]">

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
          >
            {({ isSubmitting, status }) => (
              <Form className="space-y-5 text-left">

                <div className="grid md:grid-cols-2 gap-5">
                  {/* NOMBRE */}
                  <div>
                    <label className="text-xs text-gray-600 font-bold uppercase tracking-widest mb-2 block">
                      Full Name
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[#b273c2]">
                        <FiUser size={18} className="text-gray-400 group-focus-within:text-[#b273c2]" />
                      </div>
                      <Field
                        name="name"
                        className="w-full bg-[#f8f3f6] border border-[#f0dff3] rounded-2xl py-3 pl-12 pr-4 text-[#1d1d1d] font-medium text-sm focus:border-[#b273c2] focus:ring-2 focus:ring-[#b273c2]/20 focus:outline-none transition-all placeholder:text-gray-400"
                        placeholder="John Doe"
                      />
                    </div>
                    <ErrorMessage name="name" component="p" className="text-xs text-red-500 mt-1 font-semibold" />
                  </div>

                  {/* TELEFONO */}
                  <div>
                    <label className="text-xs text-gray-600 font-bold uppercase tracking-widest mb-2 block">
                      Phone Number
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[#b273c2]">
                        <FiPhone size={18} className="text-gray-400 group-focus-within:text-[#b273c2]" />
                      </div>
                      <Field
                        name="number"
                        className="w-full bg-[#f8f3f6] border border-[#f0dff3] rounded-2xl py-3 pl-12 pr-4 text-[#1d1d1d] font-medium text-sm focus:border-[#b273c2] focus:ring-2 focus:ring-[#b273c2]/20 focus:outline-none transition-all placeholder:text-gray-400"
                        placeholder="12345678"
                      />
                    </div>
                    <ErrorMessage name="number" component="p" className="text-xs text-red-500 mt-1 font-semibold" />
                  </div>
                </div>

                {/* EMAIL */}
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
                      className="w-full bg-[#f8f3f6] border border-[#f0dff3] rounded-2xl py-3 pl-12 pr-4 text-[#1d1d1d] font-medium text-sm focus:border-[#b273c2] focus:ring-2 focus:ring-[#b273c2]/20 focus:outline-none transition-all placeholder:text-gray-400"
                      placeholder="you@email.com"
                    />
                  </div>
                  <ErrorMessage name="email" component="p" className="text-xs text-red-500 mt-1 font-semibold" />
                </div>

                {/* PASSWORD */}
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
                      className="w-full bg-[#f8f3f6] border border-[#f0dff3] rounded-2xl py-3 pl-12 pr-4 text-[#1d1d1d] font-medium text-sm tracking-widest focus:border-[#b273c2] focus:ring-2 focus:ring-[#b273c2]/20 focus:outline-none transition-all placeholder:text-gray-400"
                      placeholder="••••••••"
                    />
                  </div>
                  <ErrorMessage name="password" component="p" className="text-xs text-red-500 mt-1 font-semibold" />
                </div>

                {/* CONFIRM PASSWORD */}
                <div>
                  <label className="text-xs text-gray-600 font-bold uppercase tracking-widest mb-2 block">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[#b273c2]">
                      <FiLock size={18} className="text-gray-400 group-focus-within:text-[#b273c2]" />
                    </div>
                    <Field
                      type="password"
                      name="confirmPassword"
                      className="w-full bg-[#f8f3f6] border border-[#f0dff3] rounded-2xl py-3 pl-12 pr-4 text-[#1d1d1d] font-medium text-sm tracking-widest focus:border-[#b273c2] focus:ring-2 focus:ring-[#b273c2]/20 focus:outline-none transition-all placeholder:text-gray-400"
                      placeholder="••••••••"
                    />
                  </div>
                  <ErrorMessage name="confirmPassword" component="p" className="text-xs text-red-500 mt-1 font-semibold" />
                </div>

                {/* TERMS */}
                <div className="flex items-start gap-3 pt-2">
                  <Field
                    type="checkbox"
                    name="termsAndConditions"
                    className="mt-0.5 w-4 h-4 border-[#e8d1ed] text-[#b273c2] focus:ring-[#b273c2] rounded transition-all cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 font-medium">
                    I agree to the Terms and Conditions of AI Speaking Practice
                  </span>
                </div>
                <ErrorMessage name="termsAndConditions" component="p" className="text-xs text-red-500 font-semibold" />

                {status && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-50 border border-red-100 p-4 flex items-center justify-center gap-3 rounded-2xl"
                  >
                    <FiActivity className="text-red-500" />
                    <p className="text-xs text-red-600 font-bold uppercase tracking-wider">{status}</p>
                  </motion.div>
                )}

                {/* BUTTON */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full group relative flex items-center justify-center py-4 px-6 mt-4 bg-[#b273c2] hover:bg-[#9d5fb0] text-white font-bold text-sm uppercase tracking-widest transition-all duration-300 disabled:opacity-50 rounded-[20px] shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                      PROCESSING...
                    </span>
                  ) : (
                    <>
                      CREATE ACCOUNT <FiArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" size={18} />
                    </>
                  )}
                </button>
              </Form>
            )}
          </Formik>



          {/* FOOTER */}
          <div className="mt-8 text-center bg-[#f8f3f6] p-4 rounded-2xl border border-[#f0dff3]">
            <p className="text-sm text-gray-600 font-medium">
              Already have an account?{" "}
              <NavLink
                to="/login"
                className="font-bold text-[#b273c2] hover:text-[#9d5fb0] transition-colors ml-1"
              >
                Log in
              </NavLink>
            </p>
          </div>
        </div>

        {/* Footer Text */}
        <footer className="mt-8 text-center">
          <p className="text-[10px] text-gray-400 tracking-widest uppercase font-bold">
            © {new Date().getFullYear()} AI SPEAKING PRACTICE
          </p>
        </footer>
      </motion.div>
    </div>
  );
}

export default SignUp;