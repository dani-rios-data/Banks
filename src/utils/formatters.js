/**
 * Formatea un valor numérico como moneda en formato abreviado
 * @param {number} value - Valor a formatear
 * @returns {string} Valor formateado con 2 decimales exactos y sufijo apropiado
 */
export const formatCurrency = (value) => {
  // Asegurar que value es un número
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : value;
  
  if (isNaN(numValue)) return '$0';
  
  // Para valores grandes, usa notación abreviada
  if (Math.abs(numValue) >= 1000000) {
    return `$${(numValue / 1000000).toFixed(2)}M`;
  } else if (Math.abs(numValue) >= 1000) {
    return `$${(numValue / 1000).toFixed(2)}K`;
  } else {
    return `$${numValue.toFixed(2)}`;
  }
};

/**
 * Formatea un valor numérico como moneda en formato abreviado sin decimales
 * @param {number} value - Valor a formatear
 * @returns {string} Valor formateado sin decimales y con sufijo apropiado
 */
export const formatCurrencyNoDecimals = (value) => {
  if (value === undefined || value === null) return '$0';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '$0';
  
  // Solo para valores iguales o mayores a 1 billón (1,000 millones)
  if (numValue >= 1000000000) {
    const billions = Math.floor(numValue / 1000000000);
    return `$${billions}B`;
  }
  
  // Para valores mayores o iguales a 1 millón
  if (numValue >= 1000000) {
    const millions = Math.floor(numValue / 1000000);
    return `$${millions}M`;
  }
  
  // Para valores mayores o iguales a 1 mil
  if (numValue >= 1000) {
    const thousands = Math.floor(numValue / 1000);
    return `$${thousands}K`;
  }
  
  // Para valores menores a 1000, mostrar sin centavos
  return `$${Math.floor(numValue)}`;
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
 * @param {number} value - Valor numérico (decimal o ya en porcentaje)
 * @returns {string} - Valor formateado como porcentaje con exactamente 2 decimales sin redondear (e.g., "12.34%")
 */
export const formatPercentage = (value) => {
  // Asegurar que value es un número
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0%';
  
  // Limitar a 2 decimales para porcentajes
  return `${numValue.toFixed(2)}%`;
};

// Función para convertir strings monetarios a valores numéricos
export const parseCurrencyValue = (currencyStr) => {
  if (!currencyStr) return 0;
  
  // Convertir a string si no lo es
  const strValue = String(currencyStr);
  
  // Determinar el multiplicador basado en sufijos
  let multiplier = 1;
  if (strValue.includes('K') || strValue.includes('k')) {
    multiplier = 1000;
  } else if (strValue.includes('M') || strValue.includes('m')) {
    multiplier = 1000000;
  } else if (strValue.includes('B') || strValue.includes('b')) {
    multiplier = 1000000000;
  }
  
  // Extraer el valor numérico
  const numericPart = parseFloat(strValue.replace(/[^0-9.-]+/g, ''));
  
  if (isNaN(numericPart)) return 0;
  
  return numericPart * multiplier;
};