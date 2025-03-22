// Brand accurate color palette for banks
export const bankColors = {
    'Bank Of America': '#047857',
    'Wells Fargo Bank': '#B91C1C',
    'Td Bank': '#F59E0B',
    'Capital One': '#6D28D9',
    'Pnc Bank': '#3B82F6'
  };
  
  // Secondary colors for banks
  export const bankSecondaryColors = {
    'Bank Of America': '#D00000',
    'Wells Fargo Bank': '#F5BD1F',
    'Td Bank': '#A2C835',
    'Capital One': '#E31837',
    'Pnc Bank': '#003B5C'
  };
  
  // Color palette for media
  export const mediaColors = {
    'Digital': '#3B82F6',
    'Television': '#EF4444',
    'Audio': '#10B981',
    'Print': '#8B5CF6',
    'Outdoor': '#F59E0B'
  };
  
  // Función para obtener un gradiente lineal
  export const getGradient = (bankName, isSecondary = false) => {
    const baseColor = isSecondary ? bankSecondaryColors[bankName] : bankColors[bankName];
    return `linear-gradient(90deg, ${baseColor}80, ${baseColor})`;
  };