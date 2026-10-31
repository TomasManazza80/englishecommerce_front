import React, { useState } from 'react';
import { MercadoPagoButton } from '../../components/Checkout/MercadoPagoButton';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldAlt, faLock, faGraduationCap, faCheckCircle } from "@fortawesome/free-solid-svg-icons";

const Checkout = () => {
  const [product, setProduct] = useState({
    title: 'Membresía / Programa English Bloom',
    unit_price: 25000,
    quantity: 1
  });

  const [customer, setCustomer] = useState({
    name: '',
    cellphone: '',
    userEmail: ''
  });

  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: name === 'title' ? value : Number(value)
    }));
  };

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomer(prev => ({ ...prev, [name]: value }));
  };

  const checkoutPayload = {
    items: [product],
    cellphone: customer.cellphone || 'N/A',
    name: customer.name || 'Cliente',
    userEmail: customer.userEmail || null,
    shippingCost: 0
  };

  return (
    <div className="min-h-screen bg-[#151023] text-on-surface pt-32 pb-24 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-hidden isolate font-sans">
      {/* Ambient background glows */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-primary-container/20 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-96 right-10 w-[420px] h-[340px] bg-secondary-container/15 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-40 left-10 w-[500px] h-[350px] bg-primary-container/15 blur-[140px] pointer-events-none rounded-full" />

      <div className="relative z-10 w-full max-w-lg bg-[#18112b]/95 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_35px_rgba(155,89,182,0.2)] p-6 sm:p-10 space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-4 shadow-sm">
            <FontAwesomeIcon icon={faShieldAlt} />
            <span>CHECKOUT SEGURO &bull; MERCADO PAGO</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Finalizar Compra</h2>
          <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">
            Ingresa tus datos para completar tu inscripción y acceder al contenido oficial vía Mercado Pago.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
              Concepto / Programa
            </label>
            <input
              type="text"
              name="title"
              value={product.title}
              onChange={handleProductChange}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-primary focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Precio (ARS)
              </label>
              <input
                type="number"
                name="unit_price"
                value={product.unit_price}
                onChange={handleProductChange}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-primary focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Cantidad
              </label>
              <input
                type="number"
                min="1"
                name="quantity"
                value={product.quantity}
                onChange={handleProductChange}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-primary focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
              Nombre y Apellido
            </label>
            <input
              type="text"
              name="name"
              placeholder="Ej: Juan Pérez"
              value={customer.name}
              onChange={handleCustomerChange}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-primary focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
              Correo Electrónico
            </label>
            <input
              type="email"
              name="userEmail"
              placeholder="tuemail@ejemplo.com"
              value={customer.userEmail}
              onChange={handleCustomerChange}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-primary focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
              WhatsApp / Teléfono
            </label>
            <input
              type="tel"
              name="cellphone"
              placeholder="Ej: 3425937358"
              value={customer.cellphone}
              onChange={handleCustomerChange}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-primary focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            />
          </div>

          <div className="pt-4 border-t border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs text-on-surface-variant">
              <span>Subtotal:</span>
              <span>${(product.unit_price * product.quantity).toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold text-white">
              <span>Total a pagar:</span>
              <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-bloom-300 via-bloom-100 to-white">
                ${(product.unit_price * product.quantity).toLocaleString('es-AR')}
              </span>
            </div>
          </div>
        </div>

        <MercadoPagoButton
          checkoutData={checkoutPayload}
          disabled={!customer.name || !customer.userEmail}
          className="w-full"
        />

        <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-on-surface-variant/70">
          <span className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faLock} className="text-emerald-400" /> SSL Encriptado
          </span>
          <span className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faCheckCircle} className="text-primary" /> Acceso Directo
          </span>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
