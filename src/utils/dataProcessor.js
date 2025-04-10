import Papa from 'papaparse';
import { 
  BANKS, 
  MONTH_ORDER, 
  PAPA_PARSE_CONFIG
} from './constants';
import { cleanDollarValue } from './formatters';

// Constantes para categorías y subcategorías de medios
export const MEDIA_SUBCATEGORIES = {
  'Digital': ['Social Media', 'Search', 'Display', 'Online Video'],
  'Television': ['Broadcast', 'Cable', 'Syndicated'],
  'Audio': ['Broadcast Radio', 'Digital Audio'],
  'Print': ['Magazine', 'Newspaper'],
  'Outdoor': ['Billboard', 'Transit', 'Street Furniture'],
};

/**
 * Procesa todos los datos de los CSV para generar los objetos de datos para el dashboard
 * @returns {Promise<Object>} Datos procesados
 */
export const processData = async () => {
  const results = {
    bankData: new Map(),
    totalInvestment: 0,
    monthlyTrends: new Map(),
    mediaCategories: new Map()
  };
  
  try {
    // Procesar cada banco en serie
    for (const bank of BANKS) {
      try {
        // Usar fetch con blob para mejor manejo de memoria
        const response = await fetch(`/data/${bank.toLowerCase().replace(/\s+/g, '_')}.csv`);
        const blob = await response.blob();
        
        // Leer el archivo como texto
        const fileContent = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsText(blob);
        });
        
        // Procesar los datos en bloques
        const bankResults = await processDataInChunks(fileContent);
        
        // Almacenar resultados del banco
        results.bankData.set(bank, bankResults);
        results.totalInvestment += bankResults.totalInvestment;
        
        // Actualizar tendencias mensuales
        bankResults.monthlyData.forEach((monthData, month) => {
          if (!results.monthlyTrends.has(month)) {
            results.monthlyTrends.set(month, { total: 0, banks: new Map() });
          }
          const monthTrend = results.monthlyTrends.get(month);
          monthTrend.total += monthData.total;
          monthTrend.banks.set(bank, monthData);
        });
        
        // Actualizar categorías de medios
        bankResults.mediaTypeData.forEach((value, mediaType) => {
          if (!results.mediaCategories.has(mediaType)) {
            results.mediaCategories.set(mediaType, { total: 0, banks: new Map() });
          }
          const mediaCategory = results.mediaCategories.get(mediaType);
          mediaCategory.total += value;
          mediaCategory.banks.set(bank, value);
        });
        
        // Dar tiempo al navegador para liberar memoria
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error procesando ${bank}:`, error);
      }
    }
    
    return {
      banks: Array.from(results.bankData.entries()).map(([bank, data]) => ({
        name: bank,
        totalInvestment: data.totalInvestment,
        marketShare: (data.totalInvestment / results.totalInvestment) * 100
      })),
      monthlyTrends: Array.from(results.monthlyTrends.entries())
        .sort((a, b) => MONTH_ORDER.indexOf(a[0]) - MONTH_ORDER.indexOf(b[0]))
        .map(([month, data]) => ({
          month,
          total: data.total,
          bankShares: Array.from(data.banks.entries()).map(([bank, bankData]) => ({
            bank,
            investment: bankData.total,
            share: (bankData.total / data.total) * 100
          }))
        })),
      mediaCategories: Array.from(results.mediaCategories.entries()).map(([mediaType, data]) => ({
        type: mediaType,
        total: data.total,
        share: (data.total / results.totalInvestment) * 100,
        bankShares: Array.from(data.banks.entries()).map(([bank, value]) => ({
          bank,
          investment: value,
          share: (value / data.total) * 100
        }))
      }))
    };
    
  } catch (error) {
    console.error('Error en el procesamiento de datos:', error);
    throw error;
  }
};

/**
 * Filtra los datos según los meses seleccionados
 * @param {Array} data - Datos a filtrar
 * @param {Array} selectedMonths - Meses seleccionados para filtrar
 * @returns {Array} Datos filtrados
 */
export const getFilteredData = (data, selectedMonths) => {
  if (!selectedMonths || selectedMonths.length === 0) {
    return data;
  }
  
  // Si estamos trabajando con datos de tendencias mensuales
  if (data && Array.isArray(data) && data.length > 0 && data[0].month) {
    return data.filter(item => selectedMonths.includes(item.month));
  }
  
  return data;
};

// Función para procesar datos en bloques
export const processDataInChunks = async (fileContent, chunkSize = 100) => {
  return new Promise((resolve, reject) => {
    const results = {
      data: [],
      totalInvestment: 0,
      monthlyData: new Map(),
      mediaTypeData: new Map()
    };
    
    let processedRows = 0;
    
    Papa.parse(fileContent, {
      ...PAPA_PARSE_CONFIG,
      step: (row) => {
        try {
          // Procesar una fila a la vez
          const investment = cleanDollarValue(row.data['Investment']);
          const month = row.data['Month'] || 'Unknown';
          const mediaType = row.data['Media Type'] || 'Unknown';
          
          // Actualizar totales
          results.totalInvestment += investment;
          
          // Actualizar datos mensuales
          if (!results.monthlyData.has(month)) {
            results.monthlyData.set(month, { total: 0, mediaTypes: new Map() });
          }
          const monthData = results.monthlyData.get(month);
          monthData.total += investment;
          
          // Actualizar datos por tipo de medio
          if (!monthData.mediaTypes.has(mediaType)) {
            monthData.mediaTypes.set(mediaType, 0);
          }
          monthData.mediaTypes.set(mediaType, monthData.mediaTypes.get(mediaType) + investment);
          
          // Actualizar totales por tipo de medio
          if (!results.mediaTypeData.has(mediaType)) {
            results.mediaTypeData.set(mediaType, 0);
          }
          results.mediaTypeData.set(mediaType, results.mediaTypeData.get(mediaType) + investment);
          
          processedRows++;
          
          // Liberar memoria periódicamente
          if (processedRows % chunkSize === 0) {
            setTimeout(() => {}, 0);
          }
        } catch (error) {
          console.error('Error procesando fila:', error);
        }
      },
      complete: () => {
        resolve(results);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

// Función para cargar datos paginados
export const loadPaginatedData = async (page = 1, pageSize = 100) => {
  // Implementar lógica de paginación según necesidades
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  // Retornar subconjunto de datos
  return {
    // ... datos paginados
  };
};