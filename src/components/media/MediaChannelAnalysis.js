import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useDashboard } from '../../context/DashboardContext';
import { mediaColors, bankColors } from '../../utils/colorSchemes';
import CustomTooltip from '../common/CustomTooltip';
import Icons from '../common/Icons';
import MediaDetails from './MediaDetails';
import Papa from 'papaparse';

// Función para formatear valores numéricos
const formatCurrency = (value) => {
  // Para Capital One, que sabemos que está en el rango de billones
  // o cualquier valor superior a 1 billón
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(2)}B`;
  } 
  // Para valores mayores a 800 millones, también mostrar en billones
  else if (value >= 800000000) {
    return `$${(value / 1000000000).toFixed(2)}B`;
  }
  else if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
};

// Función para formatear porcentajes
const formatPercentage = (value) => {
  return `${value.toFixed(2)}%`;
};

// Colores mejorados para categorías de medios
const enhancedMediaColors = {
  'Digital': '#3498db',           // Azul digital
  'Television': '#e74c3c',        // Rojo televisión
  'Audio': '#2ecc71',             // Verde audio
  'Print': '#f39c12',             // Naranja impresión
  'Outdoor': '#9b59b6',           // Púrpura exterior
  'Streaming': '#1abc9c',         // Verde azulado streaming
  'Cinema': '#d35400',            // Marrón rojizo cine
  'All': '#34495e',               // Gris azulado para todos
};

// Colores mejorados para los bancos
const enhancedBankColors = {
  'Bank of America': '#22C55E',   // Verde
  'Wells Fargo': '#DC2626',       // Rojo
  'TD Bank': '#EAB308',           // Amarillo
  'Capital One Bank': '#6D28D9',  // Morado
  'PNC Bank': '#2563EB',          // Azul
  'Chase Bank': '#117ACA',        // Azul Chase
  'US Bank': '#0046AD',           // Azul US Bank
};

/**
 * Media channel analysis component that shows data filtered by selected months
 */
const MediaChannelAnalysis = () => {
  const { 
    selectedMediaCategory, 
    setSelectedMediaCategory, 
    setActiveMediaTab,
    selectedMonths,
    filteredData: contextFilteredData, // Obtener datos filtrados del contexto
    dashboardData // Obtener datos del dashboard
  } = useDashboard();

  const [csvData, setCsvData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processedDataState, setProcessedDataState] = useState(null);

  // Cargar datos del CSV solo si no tenemos datos del contexto
  useEffect(() => {
    // Si tenemos datos del contexto, no necesitamos cargar el CSV
    if (contextFilteredData || dashboardData) {
      console.log("Usando datos del contexto en lugar de cargar CSV");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    console.log("Cargando datos del CSV (fallback)...");
    
    Papa.parse('/data/consolidated_banks_data.csv', {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log("CSV datos cargados:", results.data.length, "filas");
        setCsvData(results.data);
        setLoading(false);
      },
      error: (error) => {
        console.error("Error al cargar CSV:", error);
        setLoading(false);
      }
    });
  }, [contextFilteredData, dashboardData]);

  // Procesar datos para crear un formato compatible con los componentes existentes
  useEffect(() => {
    // Si tenemos datos del contexto, usamos esos
    if (contextFilteredData || dashboardData) {
      console.log("Procesando datos del contexto:", {
        tieneContextoFiltrado: !!contextFilteredData,
        tieneContextoOriginal: !!dashboardData,
        mesesSeleccionados: selectedMonths
      });
      
      // Usar datos filtrados si están disponibles, sino usar datos completos
      const sourceData = contextFilteredData || dashboardData;
      
      // Verificar que tenemos los datos mensuales necesarios
      if (!sourceData || !sourceData.monthlyTrends) {
        console.error("No se encontraron datos mensuales en el contexto");
        setLoading(false);
        return;
      }
      
      // Log de depuración para ver los datos mensuales filtrados
      console.log("Datos mensuales del contexto:", {
        totalMeses: sourceData.monthlyTrends.length,
        ejemploMes: sourceData.monthlyTrends[0] || {}
      });
      
      // Extraer datos bancarios y categorías de medios del contexto
      const banks = sourceData.banks || [];
      const mediaCategories = sourceData.mediaCategories || [];
      
      // Formatear datos bancarios
      const formattedBanks = banks.map(bank => {
        // Asegurarnos de que mediaBreakdown tenga el formato correcto
        const mediaBreakdown = bank.mediaBreakdown?.map(media => ({
          category: media.category,
          percentage: media.percentage || 0,
          amount: media.amount || 0,
          formattedAmount: formatCurrency(media.amount || 0),
          formattedPercentage: formatPercentage(media.percentage || 0)
        })) || [];
        
        return {
          name: bank.name,
          totalInvestment: bank.totalInvestment || 0,
          formattedTotalInvestment: formatCurrency(bank.totalInvestment || 0),
          marketShare: bank.marketShare || 0,
          formattedMarketShare: formatPercentage(bank.marketShare || 0),
          mediaBreakdown
        };
      });
      
      // Formatear categorías de medios
      const formattedMediaCategories = mediaCategories.map(category => {
        // Asegurarnos de que bankShares tenga el formato correcto
        const bankShares = category.bankShares?.map(share => ({
          bank: share.bank,
          investment: share.investment || share.amount || 0,
          amount: share.investment || share.amount || 0,
          formattedAmount: formatCurrency(share.investment || share.amount || 0),
          percentage: share.percentage || 0,
          share: share.percentage || 0,
          formattedPercentage: formatPercentage(share.percentage || 0)
        })).filter(share => share.investment > 0) || [];
        
        return {
          name: category.category,
          type: category.category,
          total: category.totalInvestment || 0,
          formattedTotal: formatCurrency(category.totalInvestment || 0),
          bankShares,
          marketShare: category.marketShare || 0,
          formattedMarketShare: formatPercentage(category.marketShare || 0)
        };
      });
      
      // Formatear datos mensuales
      const monthlyTrends = sourceData.monthlyTrends.map(month => {
        // Asegurarnos que bankShares tenga el formato correcto
        const formattedBankShares = month.bankShares?.map(share => ({
          bank: share.bank,
          investment: share.investment || 0,
          share: month.total ? (share.investment / month.total) * 100 : 0,
          formattedInvestment: formatCurrency(share.investment || 0),
          formattedShare: formatPercentage(month.total ? (share.investment / month.total) * 100 : 0)
        })) || [];
        
        return {
          month: month.month,
          rawMonth: month.rawMonth,
          total: month.total || 0,
          formattedTotal: formatCurrency(month.total || 0),
          bankShares: formattedBankShares
        };
      });
      
      // Crear el objeto de datos procesados
      const processedData = {
        banks: formattedBanks,
        mediaCategories: formattedMediaCategories,
        monthlyTrends,
        totalInvestment: sourceData.totalInvestment || 0,
        formattedTotalInvestment: formatCurrency(sourceData.totalInvestment || 0)
      };
      
      console.log("Datos procesados del contexto:", {
        bancos: processedData.banks.length,
        categorias: processedData.mediaCategories.length,
        meses: processedData.monthlyTrends.length
      });
      
      setProcessedDataState(processedData);
      return;
    }
    
    // Código fallback: procesar datos del CSV directamente (solo si no hay datos del contexto)
    if (!csvData) return;
    
    console.log("Procesando datos del CSV como fallback:", selectedMonths);
    
    // Convertir valores de dollars a números
    const dataWithNumbers = csvData.map(row => ({
      ...row,
      dollars: parseFloat(row.dollars) || 0
    }));

    // Log para depuración del formato de meses en CSV
    console.log("Formatos de meses en CSV (primeros 5):", 
      [...new Set(dataWithNumbers.map(row => row.Month))].slice(0, 5)
    );
    
    // Filtrar por meses seleccionados si hay alguno
    let filteredData;
    if (selectedMonths && selectedMonths.length > 0) {
      console.log("Filtrando datos del CSV por meses:", selectedMonths);
      
      // Usar la función mejorada de matchMonth para comparar meses
      const matchMonth = (csvMonth, selectedMonth) => {
        // Comparación directa
        if (csvMonth === selectedMonth) return true;
        
        try {
          // Intentar extraer mes y año de ambos formatos
          let csvMonthName, csvYear, selectedMonthName, selectedYear;

          // Formato "Month Year" (e.g., "January 2023")
          if (csvMonth.includes(' ')) {
            const parts = csvMonth.split(' ');
            csvMonthName = parts[0].toLowerCase();
            csvYear = parts[1];
          }

          if (selectedMonth.includes(' ')) {
            const parts = selectedMonth.split(' ');
            selectedMonthName = parts[0].toLowerCase();
            selectedYear = parts[1];
          }

          // Formato "YYYY-MM" (e.g., "2023-01")
          if (selectedMonth.includes('-')) {
            const parts = selectedMonth.split('-');
            selectedYear = parts[0];
            // Convertir número de mes a nombre
            const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                              'july', 'august', 'september', 'october', 'november', 'december'];
            const monthNum = parseInt(parts[1], 10);
            if (monthNum >= 1 && monthNum <= 12) {
              selectedMonthName = monthNames[monthNum - 1];
            }
          }

          if (csvMonth.includes('-')) {
            const parts = csvMonth.split('-');
            csvYear = parts[0];
            // Convertir número de mes a nombre
            const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                              'july', 'august', 'september', 'october', 'november', 'december'];
            const monthNum = parseInt(parts[1], 10);
            if (monthNum >= 1 && monthNum <= 12) {
              csvMonthName = monthNames[monthNum - 1];
            }
          }

          // Si tenemos ambos componentes para ambos formatos, comparar
          if (csvMonthName && csvYear && selectedMonthName && selectedYear) {
            return csvMonthName === selectedMonthName && csvYear === selectedYear;
          }
        } catch (error) {
          console.error("Error al comparar formatos de meses:", error);
        }
        
        return false;
      };
      
      filteredData = dataWithNumbers.filter(row => {
        return selectedMonths.some(m => matchMonth(row.Month, m));
      });
      
      if (filteredData.length === 0) {
        console.warn("¡No hay datos después de filtrar por meses!");
        filteredData = dataWithNumbers;
      }
    } else {
      filteredData = dataWithNumbers;
    }
    
    console.log(`Datos filtrados: ${filteredData.length} de ${dataWithNumbers.length} filas`);

    // Obtener lista única de bancos
    const uniqueBanks = [...new Set(filteredData.map(row => row.Bank))];
    
    // Obtener lista única de categorías de medios
    const uniqueMediaCategories = [...new Set(filteredData.map(row => row['Media Category']))];

    // Calcular inversión total por banco
    const bankTotals = uniqueBanks.reduce((acc, bank) => {
      acc[bank] = filteredData
        .filter(row => row.Bank === bank)
        .reduce((sum, row) => sum + row.dollars, 0);
      return acc;
    }, {});

    // Calcular inversión total por categoría de medios
    const mediaTotals = uniqueMediaCategories.reduce((acc, category) => {
      acc[category] = filteredData
        .filter(row => row['Media Category'] === category)
        .reduce((sum, row) => sum + row.dollars, 0);
      return acc;
    }, {});

    // Calcular inversión total
    const totalInvestment = Object.values(bankTotals).reduce((a, b) => a + b, 0);

    // Crear estructura de datos compatible con componentes existentes
    const banks = uniqueBanks.map(bank => {
      // Calcular distribución de medios para este banco
      const bankData = filteredData.filter(row => row.Bank === bank);
      const bankTotal = bankTotals[bank];
      
      const mediaBreakdown = uniqueMediaCategories.map(category => {
        const categoryTotal = bankData
          .filter(row => row['Media Category'] === category)
          .reduce((sum, row) => sum + row.dollars, 0);
          
        return {
          category,
          percentage: bankTotal > 0 ? (categoryTotal / bankTotal) * 100 : 0,
          amount: categoryTotal,
          formattedAmount: formatCurrency(categoryTotal),
          formattedPercentage: formatPercentage(bankTotal > 0 ? (categoryTotal / bankTotal) * 100 : 0)
        };
      });
      
      return {
        name: bank,
        totalInvestment: bankTotal,
        formattedTotalInvestment: formatCurrency(bankTotal),
        marketShare: totalInvestment > 0 ? (bankTotal / totalInvestment) * 100 : 0,
        formattedMarketShare: formatPercentage(totalInvestment > 0 ? (bankTotal / totalInvestment) * 100 : 0),
        mediaBreakdown
      };
    });

    // Crear estructura para categorías de medios
    const mediaCategories = uniqueMediaCategories.map(category => {
      const categoryData = filteredData.filter(row => row['Media Category'] === category);
      const categoryTotal = mediaTotals[category];
      
      // Calcular distribución por banco para esta categoría
      const bankShares = uniqueBanks.map(bank => {
        const bankCategoryTotal = categoryData
          .filter(row => row.Bank === bank)
          .reduce((sum, row) => sum + row.dollars, 0);
          
        return {
          bank,
          investment: bankCategoryTotal,
          amount: bankCategoryTotal,
          formattedAmount: formatCurrency(bankCategoryTotal),
          percentage: categoryTotal > 0 ? (bankCategoryTotal / categoryTotal) * 100 : 0,
          share: categoryTotal > 0 ? (bankCategoryTotal / categoryTotal) * 100 : 0,
          formattedPercentage: formatPercentage(categoryTotal > 0 ? (bankCategoryTotal / categoryTotal) * 100 : 0)
        };
      }).filter(share => share.investment > 0);
      
      return {
        name: category,
        type: category,
        total: categoryTotal,
        formattedTotal: formatCurrency(categoryTotal),
        bankShares,
        marketShare: totalInvestment > 0 ? (categoryTotal / totalInvestment) * 100 : 0,
        formattedMarketShare: formatPercentage(totalInvestment > 0 ? (categoryTotal / totalInvestment) * 100 : 0)
      };
    });

    // Estructurar datos para tendencias mensuales
    const monthlyData = {};
    filteredData.forEach(row => {
      const month = row.Month;
      if (!monthlyData[month]) {
        monthlyData[month] = { 
          month, 
          total: 0, 
          bankShares: []
        };
      }
      
      // Sumar al total del mes
      monthlyData[month].total += row.dollars;
      
      // Actualizar bankShares
      const bankIndex = monthlyData[month].bankShares.findIndex(b => b.bank === row.Bank);
      if (bankIndex >= 0) {
        monthlyData[month].bankShares[bankIndex].investment += row.dollars;
      } else {
        monthlyData[month].bankShares.push({
          bank: row.Bank,
          investment: row.dollars
        });
      }
    });

    // Convertir a array
    const monthlyTrends = Object.values(monthlyData);
    
    // Recalcular share después de tener todos los totales
    monthlyTrends.forEach(month => {
      month.formattedTotal = formatCurrency(month.total);
      month.bankShares.forEach(share => {
        share.share = month.total > 0 ? (share.investment / month.total) * 100 : 0;
        share.formattedInvestment = formatCurrency(share.investment);
        share.formattedShare = formatPercentage(month.total > 0 ? (share.investment / month.total) * 100 : 0);
      });
    });

    const processedData = {
      banks,
      mediaCategories,
      monthlyTrends,
      totalInvestment,
      formattedTotalInvestment: formatCurrency(totalInvestment)
    };
    
    setProcessedDataState(processedData);
  }, [contextFilteredData, dashboardData, csvData, selectedMonths]);  // Recalcular cuando cambian los datos o filtros

  if (loading || !processedDataState) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="h-96 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Cargando datos de análisis de medios...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6 transition duration-300 hover:shadow-lg border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Media Channel Analysis</h2>
            <p className="text-gray-600 mt-1">
              Detailed investment distribution across different media channels
              {selectedMonths.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full">
                  Filtered by {selectedMonths.length} {selectedMonths.length === 1 ? 'month' : 'months'}
                </span>
              )}
            </p>
          </div>
        </div>
        
        {/* Media Tabs - Act as main filter */}
        <div className="flex flex-wrap border-b mb-6 pb-1">
          <button
            className={`px-4 py-2 mr-3 font-medium focus:outline-none rounded-lg transition duration-300 flex items-center transform hover:scale-105 hover:shadow-md`}
            onClick={() => {
              setSelectedMediaCategory('All');
            }}
            style={selectedMediaCategory === 'All' ? {
              background: 'linear-gradient(135deg, #3b82f680, #3b82f6)',
              color: '#ffffff',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
            } : {
              color: '#4b5563', 
              borderBottom: '3px solid transparent'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            All Media
          </button>
          
          {processedDataState.mediaCategories.map(category => (
            <button
              key={category.type}
              className={`px-4 py-2 mr-3 font-medium focus:outline-none rounded-lg transition duration-300 flex items-center transform hover:scale-105 hover:shadow-md`}
              onClick={() => {
                setActiveMediaTab(category.type);
                setSelectedMediaCategory(category.type);
              }}
              style={selectedMediaCategory === category.type ? {
                background: `linear-gradient(135deg, ${enhancedMediaColors[category.type] || mediaColors[category.type]}80, ${enhancedMediaColors[category.type] || mediaColors[category.type]})`,
                color: '#ffffff',
                fontWeight: 'bold',
                boxShadow: `0 2px 8px ${enhancedMediaColors[category.type] || mediaColors[category.type]}50`
              } : {
                color: '#4b5563',
                borderBottom: '3px solid transparent',
                transition: 'all 0.3s ease-in-out'
              }}
              onMouseOver={(e) => {
                if (selectedMediaCategory !== category.type) {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${enhancedMediaColors[category.type] || mediaColors[category.type]}15, ${enhancedMediaColors[category.type] || mediaColors[category.type]}30)`;
                  e.currentTarget.style.color = enhancedMediaColors[category.type] || mediaColors[category.type];
                }
              }}
              onMouseOut={(e) => {
                if (selectedMediaCategory !== category.type) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#4b5563';
                }
              }}
            >
              <span className="flex items-center justify-center mr-2">
                {category.type === 'Digital' && Icons.digital}
                {category.type === 'Television' && Icons.television}
                {category.type === 'Audio' && Icons.audio}
                {category.type === 'Print' && Icons.print}
                {category.type === 'Outdoor' && Icons.outdoor}
                {category.type === 'Streaming' && Icons.streaming}
                {category.type === 'Cinema' && Icons.cinema}
              </span>
              {category.type}
            </button>
          ))}
        </div>
        
        {/* Media Details */}
        <div>
          <MediaDetails 
            filteredData={processedDataState} 
            enhancedBankColors={enhancedBankColors}
          />
        </div>
      </div>
    </div>
  );
};

export default MediaChannelAnalysis;