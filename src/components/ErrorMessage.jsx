import React from 'react';

const ErrorMessage = ({ message = 'Ocurrió un error', onRetry }) => (
  <div className="text-center py-12">
    <div className="text-red-500 mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="mt-2 font-medium">{message}</p>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
      >
        Reintentar
      </button>
    )}
  </div>
);

export default ErrorMessage;