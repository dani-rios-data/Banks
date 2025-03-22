import React from 'react';

/**
 * Componente de carga para mostrar mientras se cargan los datos
 */
const Loading = () => {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-lg text-gray-700">Cargando datos del dashboard...</p>
      </div>
    </div>
  );
};

export default Loading;