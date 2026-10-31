import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Hook personalizado para manejar la integración con Mercado Pago Checkout Pro (SDK v2)
 */
export const useMercadoPago = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Genera la preferencia en el backend y redirige al usuario a Mercado Pago
   * @param {Object} checkoutData - Datos de la orden ({ items, shippingCost, cellphone, name, address, etc. })
   */
  const handlePayment = async (checkoutData) => {
    setLoading(true);
    setError(null);

    try {
      // Petición al endpoint canónico de creación de preferencia
      const response = await axios.post(`${API_URL}/api/create-preference`, checkoutData);
      const { id, preferenceId, init_point, sandbox_init_point, payment_url } = response.data;

      const targetUrl = init_point || payment_url || sandbox_init_point;

      if (!targetUrl) {
        throw new Error('No se recibió la URL de pago de Mercado Pago.');
      }

      // Redirigir al Checkout Pro oficial
      window.location.href = targetUrl;
    } catch (err) {
      console.error('[MERCADOPAGO_CHECKOUT_ERROR]:', err);
      const errorMsg =
        err.response?.data?.details ||
        err.response?.data?.error ||
        err.message ||
        'Ocurrió un error al procesar el pago.';

      setError(errorMsg);

      Swal.fire({
        icon: 'error',
        title: 'Error al generar el pago',
        text: errorMsg,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3085d6',
        background: '#1f2937',
        color: '#f9fafb'
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    handlePayment,
    loading,
    error
  };
};

export default useMercadoPago;
