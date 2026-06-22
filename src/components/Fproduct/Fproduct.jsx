import React from "react";
import { Link } from "react-router-dom";

function ProductCard({ products }) {
  // Ejemplo de datos que podrías recibir como prop
  const sampleProducts = [
    {
      id: 1,
      name: "DIFUSOR LAB MANDARIN ROSE",
      price: 48500,
    },
    {
      id: 2,
      name: "DIFUSOR CLOSSY MANDARIN ROSE",
      price: 34500,
    },
    {
      id: 3,
      name: "DIFUSOR BASE: MANDARIN ROSE",
      price: 20900,
    },
    {
      id: 4,
      name: "REPUESTO PARA DIFUSOR MANDARIN ROSE",
      price: 32500,
    },
  ];

  // Usa los productos que llegan por props o los de muestra
  const productsToShow = products || sampleProducts;

  // Función para formatear el precio como en la imagen ($48.500)
  const formatPrice = (price) => {
    return `$${price.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {productsToShow.map((product) => (
          <div
            key={product.id}
            className="product-card relative pb-6 flex flex-col"
          >
            <Link to={`/product/${product.id}`} className="block flex-grow">
              {/* Imagen del producto - reemplaza con tu imagen real */}
              <div className="bg-gray-100 h-64 mb-4 flex items-center justify-center">
                <span className="text-gray-400">IMAGEN DEL PRODUCTO</span>
              </div>
              
              {/* Nombre del producto */}
              <h3 className="text-sm font-medium uppercase text-gray-900 mb-2">
                {product.name}
              </h3>
              
              {/* Precio */}
              <p className="text-lg font-normal text-gray-900 mb-4">
                {formatPrice(product.price)}
              </p>
            </Link>
            
            {/* Botón Agregar al carrito - siempre visible */}
            <button className="mt-auto w-full py-3 text-xs font-medium uppercase border border-black text-black hover:bg-black hover:text-white transition-colors duration-300">
              Agregar al carrito
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductCard;