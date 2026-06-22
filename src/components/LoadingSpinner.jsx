import React from 'react';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    <span className="sr-only">Cargando...</span>
  </div>
);

export default LoadingSpinner;