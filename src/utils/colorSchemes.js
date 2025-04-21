// Brand accurate color palette for banks
export const bankColors = {
    'Wells Fargo Bank': '#CD1309',
    'Bank Of America': '#012169',
    'Capital One': '#004977',
    'Chase Bank': '#117ACA',
    'Pnc Bank': '#FF5400',
    'Td Bank': '#54B848',
    'Key Bank': '#CC0000',
    'Chime Bank': '#1EC677'
};

// Secondary colors for banks
export const bankSecondaryColors = {
    'Wells Fargo': '#FFC726',
    'Bank of America': '#DC1431',
    'Capital One': '#C9082A',
    'Chase Bank': '#000000',
    'Key Bank': '#B0B7BC',
    'Chime Bank': '#17A266'
};

// Color palette for media
export const mediaColors = {
    'Digital': '#3498db',
    'Television': '#e74c3c',
    'Audio': '#2ecc71',
    'Print': '#f39c12',
    'Outdoor': '#9b59b6',
    'Streaming': '#1abc9c',
    'Cinema': '#d35400',
    'All': '#34495e'
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