import React, { useState } from 'react';
import axios from 'axios';


const API_URL = import.meta.env.REACT_APP_API_URL;



const Checkout = () => {
    const [product, setProduct] = useState({
        title: 'Nombre del Producto',
        unit_price: 100,
        quantity: 1
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProduct(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const createPayment = async () => {
        try {lo
            const response = await axios.post(`${API_URL}/create_payment`, {
                product: {
                    title: product.nombre,
                    unit_price: product.precio,
                    quantity: product.cantidad
                }
            });
            setError(''); // Limpiar el error si la solicitud es exitosa
            window.location.href = response.data.payment_url; // Redirigir al enlace de pago
        } catch (error) {
            console.error('Error al crear el pago:', error);
            setError(error.message);
        }
    };

    return (
        <div className="payment-gateway">
            <br />
            <br />
            <br />
            <br />
            <h2>Pasarela de Pago</h2>
            <div className="product-form">
                <label>
                    Título del Producto:
                    <input
                        type="text"
                        name="title"
                        value={product.title}
                        onChange={handleChange}
                    />
                </label>
                <label>
                    Precio Unitario:
                    <input
                        type="number"
                        name="unit_price"
                        value={product.unit_price}
                        onChange={handleChange}
                    />
                </label>
                <label>
                    Cantidad:
                    <input
                        type="number"
                        name="quantity"
                        value={product.quantity}
                        onChange={handleChange}
                    />
                </label>
                <button onClick={createPayment}>Crear Pago</button>
            </div>
            {error && (
                <div className="error-message">
                    <p>Error al crear el pago: {error}</p>
                </div>
            )}
        </div>
    );
};

export default Checkout;
