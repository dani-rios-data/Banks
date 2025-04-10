/**
 * Formatea un valor numérico como moneda en formato abreviado
 * @param {number} value - Valor a formatear
 * @returns {string} Valor formateado con 2 decimales exactos y sufijo apropiado
 */
export const formatCurrency = (value) => {
  if (value === undefined || value === null) return '$0.00';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '$0.00';
  
  // Función para extraer exactamente 2 decimales sin redondeo
  const getExactDecimals = (num) => {
    const numStr = num.toString();
    const decimalPos = numStr.indexOf('.');
    
    if (decimalPos === -1) {
      return `${numStr}.00`;
    } else {
      const intPart = numStr.substring(0, decimalPos);
      const decPart = numStr.substring(decimalPos + 1);
      const formattedDecPart = decPart.length >= 2 
        ? decPart.substring(0, 2) 
        : decPart.padEnd(2, '0');
      
      return `${intPart}.${formattedDecPart}`;
    }
  };
  
  // Solo para valores iguales o mayores a 1 billón (1,000 millones)
  if (numValue >= 1000000000) {
    const billions = numValue / 1000000000;
    return `$${getExactDecimals(billions)}B`;
  }
  
  // Para valores mayores o iguales a 1 millón
  if (numValue >= 1000000) {
    const millions = numValue / 1000000;
    return `$${getExactDecimals(millions)}M`;
  }
  
  // Para valores mayores o iguales a 1 mil
  if (numValue >= 1000) {
    const thousands = numValue / 1000;
    return `$${getExactDecimals(thousands)}K`;
  }
  
  // Para valores menores a 1000, mostrar con centavos
  return `$${getExactDecimals(numValue)}`;
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
 * @param {number} value - Valor numérico (decimal)
 * @returns {string} - Valor formateado como porcentaje con exactamente 2 decimales sin redondear (e.g., "12.34%")
 */
export const formatPercentage = (value) => {
  // Asegurar que value es un número
  const numValue = Number(value);
  if (isNaN(numValue)) return '0.00%';
  
  // Multiplicar por 100 para convertir de decimal a porcentaje
  const percentValue = numValue * 100;
  
  // Obtener el valor con 2 decimales sin redondear
  const valueStr = String(percentValue);
  const decimalPos = valueStr.indexOf('.');
  
  if (decimalPos === -1) {
    // Si no tiene parte decimal, agregar ".00"
    return `${valueStr}.00%`;
  } else {
    // Tomar solo los primeros dos decimales sin redondear
    const intPart = valueStr.substring(0, decimalPos);
    const decPart = valueStr.substring(decimalPos + 1);
    
    // Asegurar que hay al menos 2 decimales
    const formattedDecPart = decPart.length >= 2 
      ? decPart.substring(0, 2) 
      : decPart.padEnd(2, '0');
    
    return `${intPart}.${formattedDecPart}%`;
  }
};