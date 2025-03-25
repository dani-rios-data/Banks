// Brand accurate color palette for banks
export const bankColors = {
    'Wells Fargo': '#CD1309',
    'Bank of America': '#012169',
    'Capital One': '#004977',
    'Chase Bank': '#117ACA'
  };
  
  // Secondary colors for banks
  export const bankSecondaryColors = {
    'Wells Fargo': '#FFC726',
    'Bank of America': '#DC1431',
    'Capital One': '#C9082A',
    'Chase Bank': '#000000'
  };
  
  // Color palette for media
  export const mediaColors = {
    'Digital': '#3B82F6',
    'Television': '#EF4444',
    'Audio': '#10B981',
    'Print': '#8B5CF6',
    'Outdoor': '#F59E0B'
  };
  
  // Media category colors
  export const mediaCategoryColors = {
    'Television': '#2563EB',
    'Digital': '#7C3AED',
    'Audio': '#EA580C',
    'Print': '#059669',
    'Outdoor': '#0891B2',
    'Streaming': '#8B5CF6',
    'Cinema': '#DB2777'
  };
  
  // Función para obtener un gradiente lineal
  export const getGradient = (bankName, isSecondary = false) => {
    const baseColor = isSecondary ? bankSecondaryColors[bankName] : bankColors[bankName];
    return `linear-gradient(90deg, ${baseColor}80, ${baseColor})`;
  };