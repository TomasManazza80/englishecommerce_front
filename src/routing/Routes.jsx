import React from "react";
import { Routes, Route } from "react-router-dom";
import HOME from "../pages/Home/index.jsx";
import Products from "../pages/Products/index.jsx";
import ProductDetails from "../pages/ProductDetails/ProductDetails.jsx";
import Login from "../pages/Login/Login.jsx";
import Cart from "../pages/Cart/Cart.jsx";
import NavBar from "../components/NavBar/index.jsx";
import SignUp from "../pages/SignUp/SignUp.jsx";
import About from "../pages/About/About.jsx";
import ContactUs from "../pages/ContactUs/ContactUs.jsx";
import ErrorPage from "../pages/ErrPage/ErrorPage.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import Checkout from "../pages/Checkout/Checkout.jsx";
import Fproduct from "../components/Fproduct/Fproduct.jsx";
import Admin from "../pages/admin/admin.jsx";
import ResellersModule from "../pages/Revendedores/revendedores.jsx";
import ServicioTecnico from "../pages/seccionParaTecnicos/seccionParaTecnicos.jsx";
import EmpleadoVentas from "../pages/empleadoVentas/seccionEmpleadoVentas.jsx";
import ProductDetailsWholesale from "../pages/ProductDetails/ProductDetailsWholesale.jsx";
import SeccionReparacionesPasoAPaso from "../components/seccionReparacionesPasoAPaso/SeccionReparacionesPasoAPaso.jsx";
import PagoExitoso from "../pages/admin/pagoExitoso/pagoExitoso.jsx";
import ExcelToProductJson from "../pages/admin/conversorDeExcelAJson/conversorExcelAJson.jsx";
import CargaMercaderiaMasiva from "../pages/admin/productos/cargaMercaderiaMasiva.jsx";
import MisCursos from "../pages/MisCursos/MisCursos.jsx";
import AdminPronunciation from "../pages/AdminPronunciation.jsx";
import StudentPronunciation from "../pages/StudentPronunciation.jsx";





import AdminRoute from './AdminRoute.jsx';
import RoleBasedRoute from './RoleBasedRoute.jsx';
import CartWholesale from "../pages/Cart/CartWholesale.jsx";

function MyRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<NavBar />}>
          <Route index element={<HOME />} />
          <Route path="/seccionReparaciones" element={<SeccionReparacionesPasoAPaso />} />
          <Route path="/cargaMercaderiaMasiva" element={<CargaMercaderiaMasiva />} />
          <Route path="/servicioTecnico" element={
            <RoleBasedRoute allowedRoles={['tecnico', 'admin']}>
              <ServicioTecnico />
            </RoleBasedRoute>
          } />
          <Route path="/empleadoVentas" element={
            <RoleBasedRoute allowedRoles={['vendedor', 'ventas', 'admin']}>
              <EmpleadoVentas />
            </RoleBasedRoute>
          } />

          <Route path="revendedores" element={<ResellersModule />} />
          <Route path="conversorExcelAJson" element={<ExcelToProductJson />} />
          <Route
            path="checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="mis-cursos"
            element={
              <ProtectedRoute>
                <MisCursos />
              </ProtectedRoute>
            }
          />
          <Route path="cart" element={<Cart />} />
          <Route path="cart-wholesale" element={<CartWholesale />} />
          <Route path="producto-mayorista/:id" element={<ProductDetailsWholesale />} />
          <Route path="product/:id" element={<ProductDetails />}>
            <Route index element={<Fproduct />} />
          </Route>
          <Route path="products" element={<Products />}></Route>
          <Route path="success" element={<PagoExitoso />} />
          <Route path="about" element={<About />} />
          <Route path="admin" element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          } />
          <Route path="admin/pronunciation" element={
            <AdminRoute>
              <AdminPronunciation />
            </AdminRoute>
          } />
          <Route path="pronunciation" element={
            <ProtectedRoute>
              <StudentPronunciation />
            </ProtectedRoute>
          } />
          <Route path="contact" element={<ContactUs />} />
          <Route path="*" element={<ErrorPage />} />
        </Route>
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<SignUp />} />
      </Routes>
    </>
  );
}

export default MyRoutes;
