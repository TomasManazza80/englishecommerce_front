import { Formik, Form, Field, ErrorMessage } from "formik";
import { GoogleLogin } from '@react-oauth/google';
import * as Yup from "yup";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiUser, FiPhone, FiMail, FiLock } from "react-icons/fi";
import authContext from "../../store/store";
import { useContext, useEffect } from "react";

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
    name: Yup.string().min(2).required("*Nombre requerido"),
    number: Yup.string().matches(/^[0-9]+$/).min(8).required("*Número requerido"),
    email: Yup.string().email().required("*Email requerido"),
    password: Yup.string().min(6).required("*Contraseña requerida"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], "*Las contraseñas no coinciden")
      .required("*Confirmación requerida"),
    termsAndConditions: Yup.boolean().oneOf([true], "*Debes aceptar los términos"),
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
      setStatus("Error al crear la cuenta. Intente nuevamente.");
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
      navigate("/");
    } catch (error) {
      console.error("Google Signup Error:", error);
    }
  };

  const handleGoogleError = () => {
    console.log('Login Failed');
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    authCtx.setToken(token);
    if (token) navigate("/");
  }, [authCtx, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#ffffff] text-[#333333] font-sans px-4 py-12 selection:bg-[#cba394] selection:text-white">
      <div className="w-full max-w-md bg-[#f9f3f2] border-0 p-12 rounded-sm text-center">

        {/* HEADER */}


        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          {({ isSubmitting, status }) => (
            <Form className="space-y-6 text-left">

              {/* NOMBRE */}
              <div>
                <p className="text-[11px] tracking-widest text-[#b07d6b] uppercase mb-1 font-medium">
                  Nombre Completo
                </p>
                <div className="relative group">
                  <FiUser className="absolute left-3 top-3.5 text-[#cba394] group-focus-within:text-[#b07d6b] transition-colors" />
                  <Field
                    name="name"
                    className="w-full bg-white border-b border-[#cba394]/30 px-10 py-3 text-[13px] font-light focus:outline-none focus:border-[#b07d6b] transition-all placeholder:text-gray-400"
                    placeholder="Tu nombre"
                  />
                </div>
                <ErrorMessage name="name" component="p" className="text-[11px] text-[#b07d6b] mt-1 italic" />
              </div>

              {/* TELEFONO */}
              <div>
                <p className="text-[11px] tracking-widest text-[#b07d6b] uppercase mb-1 font-medium">
                  Teléfono
                </p>
                <div className="relative group">
                  <FiPhone className="absolute left-3 top-3.5 text-[#cba394] group-focus-within:text-[#b07d6b] transition-colors" />
                  <Field
                    name="number"
                    className="w-full bg-white border-b border-[#cba394]/30 px-10 py-3 text-[13px] font-light focus:outline-none focus:border-[#b07d6b] transition-all placeholder:text-gray-400"
                    placeholder="Tu número"
                  />
                </div>
                <ErrorMessage name="number" component="p" className="text-[11px] text-[#b07d6b] mt-1 italic" />
              </div>

              {/* EMAIL */}
              <div>
                <p className="text-[11px] tracking-widest text-[#b07d6b] uppercase mb-1 font-medium">
                  Email
                </p>
                <div className="relative group">
                  <FiMail className="absolute left-3 top-3.5 text-[#cba394] group-focus-within:text-[#b07d6b] transition-colors" />
                  <Field
                    type="email"
                    name="email"
                    className="w-full bg-white border-b border-[#cba394]/30 px-10 py-3 text-[13px] font-light focus:outline-none focus:border-[#b07d6b] transition-all placeholder:text-gray-400"
                    placeholder="tu@email.com"
                  />
                </div>
                <ErrorMessage name="email" component="p" className="text-[11px] text-[#b07d6b] mt-1 italic" />
              </div>

              {/* PASSWORD */}
              <div>
                <p className="text-[11px] tracking-widest text-[#b07d6b] uppercase mb-1 font-medium">
                  Contraseña
                </p>
                <div className="relative group">
                  <FiLock className="absolute left-3 top-3.5 text-[#cba394] group-focus-within:text-[#b07d6b] transition-colors" />
                  <Field
                    type="password"
                    name="password"
                    className="w-full bg-white border-b border-[#cba394]/30 px-10 py-3 text-[13px] font-light tracking-widest focus:outline-none focus:border-[#b07d6b] transition-all placeholder:text-gray-400"
                    placeholder="••••••••"
                  />
                </div>
                <ErrorMessage name="password" component="p" className="text-[11px] text-[#b07d6b] mt-1 italic" />
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <p className="text-[11px] tracking-widest text-[#b07d6b] uppercase mb-1 font-medium">
                  Confirmar Contraseña
                </p>
                <div className="relative group">
                  <FiLock className="absolute left-3 top-3.5 text-[#cba394] group-focus-within:text-[#b07d6b] transition-colors" />
                  <Field
                    type="password"
                    name="confirmPassword"
                    className="w-full bg-white border-b border-[#cba394]/30 px-10 py-3 text-[13px] font-light tracking-widest focus:outline-none focus:border-[#b07d6b] transition-all placeholder:text-gray-400"
                    placeholder="••••••••"
                  />
                </div>
                <ErrorMessage
                  name="confirmPassword"
                  component="p"
                  className="text-[11px] text-[#b07d6b] mt-1 italic"
                />
              </div>

              {/* TERMS */}
              <div className="flex items-start gap-3 mt-4">
                <Field
                  type="checkbox"
                  name="termsAndConditions"
                  className="mt-0.5 w-3.5 h-3.5 border-[#cba394] text-[#b07d6b] focus:ring-0 rounded-sm transition-all accent-[#b07d6b]"
                />
                <span className="text-[12px] font-light text-[#333333]">
                  Acepto los términos y condiciones de LuPetruccelli
                </span>
              </div>
              <ErrorMessage
                name="termsAndConditions"
                component="p"
                className="text-[11px] text-[#b07d6b] italic"
              />

              {status && (
                <p className="text-[11px] text-[#b07d6b] text-center uppercase tracking-wider bg-white p-2 rounded-sm border border-[#b07d6b]/20">
                  {status}
                </p>
              )}

              {/* BUTTON */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-6 py-4 bg-gradient-to-r from-[#cba394] to-[#b07d6b] text-white font-medium tracking-widest text-[12px] uppercase hover:opacity-90 transition-opacity rounded-sm shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? "PROCESANDO..." : "REGISTRARSE"}
              </button>
            </Form>
          )}
        </Formik>

        {/* Divider */}
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
            text="signup_with"
            size="large"
            width="300"
          />
        </div>

        {/* FOOTER */}
        <p className="text-[12px] text-[#333333] font-light text-center mt-10">
          ¿Ya tienes una cuenta?{" "}
          <NavLink
            to="/login"
            className="font-medium text-[#b07d6b] hover:text-[#cba394] transition-colors ml-1 border-b border-transparent hover:border-[#cba394] pb-0.5 uppercase tracking-wider text-[11px]"
          >
            Iniciar Sesión
          </NavLink>
        </p>
      </div>
    </div>
  );
}

export default SignUp;