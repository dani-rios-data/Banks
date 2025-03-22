import React from 'react';
import { formatCurrency } from '../../utils/formatters';

/**
 * Componente de tooltip personalizado para gráficos de Recharts
 * @param {Object} props - Propiedades del tooltip
 * @param {boolean} props.active - Si el tooltip está activo
 * @param {Array} props.payload - Datos a mostrar en el tooltip
 * @param {string} props.label - Etiqueta del punto de datos
 * @param {Function} props.formatter - Función para formatear valores (opcional)
 */
const CustomTooltip = ({ active, payload, label, formatter = formatCurrency }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-100 shadow-lg rounded-md" style={{backdropFilter: 'blur(4px)'}}>
        <p className="font-medium text-gray-800 mb-2 border-b pb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center my-1">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: entry.color || entry.stroke }}
            ></div>
            <p style={{ color: '#374151' }}>
              <span className="font-medium">{entry.name}: </span>
              <span>{formatter(entry.value)}</span>
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default CustomTooltip;