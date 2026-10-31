import React from 'react';
import { useMercadoPago } from '../../hooks/useMercadoPago';

/**
 * Componente botón de pago para Checkout Pro de Mercado Pago
 */
export const MercadoPagoButton = ({
  checkoutData,
  buttonText = "Pagar con Mercado Pago",
  disabled = false,
  className = ""
}) => {
  const { handlePayment, loading } = useMercadoPago();

  const onClick = (e) => {
    e.preventDefault();
    if (loading || disabled) return;
    handlePayment(checkoutData);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className={`relative inline-flex items-center justify-center gap-3 px-6 py-4 rounded-full font-bold text-sm text-white transition-all duration-300 shadow-md ${
        loading || disabled
          ? 'bg-white/10 text-white/40 border border-white/5 cursor-not-allowed'
          : 'bg-gradient-to-r from-[#009EE3] via-bloom-600 to-purple-600 hover:brightness-110 active:scale-[0.98] shadow-[0_0_25px_rgba(0,158,227,0.4)]'
      } ${className}`}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>Conectando con Mercado Pago...</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
          </svg>
          <span>{buttonText}</span>
        </>
      )}
    </button>
  );
};

export default MercadoPagoButton;
