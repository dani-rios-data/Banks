/**
 * Formatea un valor numérico como moneda en formato abreviado
 * @param {number} value - Valor a formatear
 * @returns {string} Valor formateado
 */
export const formatCurrency = (value) => {
  if (value === undefined || value === null) return '$0';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '$0';
  
  if (numValue >= 1000000) return `$${(numValue / 1000000).toFixed(1)}M`;
  if (numValue >= 1000) return `$${(numValue / 1000).toFixed(1)}K`;
  return `$${numValue.toFixed(0)}`;
};

/**
 * Limpia y convierte un valor de dólar en número
 * @param {string} value - Valor en formato de dólar (e.g., "$1,234.56")
 * @returns {number} - Valor numérico
 */
export const cleanDollarValue = (value) => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  
  // Remover el símbolo de dólar y las comas, luego convertir a número
  return parseFloat(value.replace(/[$,]/g, '')) || 0;
};

/**
 * Formatea un número como valor de dólar
 * @param {number} value - Valor numérico
 * @returns {string} - Valor formateado (e.g., "$1,234.56")
 */
export const formatDollarValue = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

/**
 * Formatea un número como porcentaje
 * @param {number} value - Valor numérico
 * @returns {string} - Valor formateado (e.g., "12.34%")
 */
export const formatPercentage = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
};