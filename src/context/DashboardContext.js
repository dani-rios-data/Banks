import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

import Papa from 'papaparse';
import { 
   
  DEFAULT_ACTIVE_MEDIA_TAB} from '../utils/constants';
import _ from 'lodash';

// Crear el contexto
const DashboardContext = createContext();

// Hook personalizado para usar el contexto
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard debe ser usado dentro de un DashboardProvider');
  }
  return context;
};

// Proveedor del contexto
export const DashboardProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMediaTab, setActiveMediaTab] = useState(DEFAULT_ACTIVE_MEDIA_TAB);
  const [focusedBank, setFocusedBank] = useState('All');
  const [selectedMediaCategory, setSelectedMediaCategory] = useState('Digital');
  
  // Estados para filtros globales
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [showMonthFilter, setShowMonthFilter] = useState(false);
  const [showYearFilter, setShowYearFilter] = useState(false);
  const [tempSelectedMonths, setTempSelectedMonths] = useState([]);
  const [tempSelectedYears, setTempSelectedYears] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('All Period');
  
  // Crear un state adicional para almacenar los datos filtrados
  const [filteredDashboardData, setFilteredDashboardData] = useState(null);
  
  // Función para procesar y enriquecer datos mensuales por categoría
  const processBankMediaMonthlyData = (monthlyData, banks) => {
    if (!monthlyData || !banks) return [];
    
    // Mapeo de los datos mensuales para incluir información detallada por categoría
    return monthlyData.map(month => {
      // Estructura para almacenar datos de categorías por banco para este mes
      const mediaCategoriesData = [];
      
      // Para cada banco, calcular su distribución por categoría en este mes
      month.bankShares.forEach(bankShare => {
        const bankName = bankShare.bank;
        const bank = banks.find(b => b.name === bankName);
        
        if (bank) {
          // Distribución media por porcentaje para este banco
          const mediaBreakdown = bank.mediaBreakdown;
          
          // Calcular la inversión para cada categoría de este banco en este mes
          const categoriesData = {};
          
          mediaBreakdown.forEach(media => {
            // Porcentaje de esta categoría para este banco
            const percentage = media.percentage;
            
            // Inversión total del banco en este mes
            const bankMonthlyInvestment = bankShare.investment;
            
            // Inversión en esta categoría para este mes
            const categoryInvestment = (percentage / 100) * bankMonthlyInvestment;
            
            // Almacenar datos de categoría
            categoriesData[media.category] = categoryInvestment;
          });
          
          // Agregar datos de este banco a la lista
          mediaCategoriesData.push({
            bank: bankName,
            categories: categoriesData
          });
        }
      });
      
      // Agregamos los datos de categorías al objeto del mes
      return {
        ...month,
        mediaCategories: mediaCategoriesData
      };
    });
  };
  
  // Función auxiliar para convertir valor de dólares del CSV
  const parseDollarValue = (dollarStr) => {
    if (!dollarStr) return 0;
    const numericValue = parseFloat(dollarStr.replace(/[^\d.-]/g, ''));
    return isNaN(numericValue) ? 0 : numericValue;
  };

  // Función para obtener el orden numérico del mes
  const getMonthOrder = (monthName) => {
    const months = {
      'January': 1, 'February': 2, 'March': 3, 'April': 4,
      'May': 5, 'June': 6, 'July': 7, 'August': 8,
      'September': 9, 'October': 10, 'November': 11, 'December': 12
    };
    return months[monthName] || 0;
  };

  // Función para ordenar meses cronológicamente
  const sortMonths = (months) => {
    return [...months].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.monthNum - b.monthNum;
    });
  };
  
  // Función para filtrar datos según los filtros seleccionados
  const getFilteredData = useCallback(() => {
    if (!dashboardData) return null;
    
    console.log("Filtrando datos con:", {
      selectedYears: selectedYears,
      selectedMonths: selectedMonths
    });
    
    let filteredData = { ...dashboardData };
    
    // Guardar los datos completos para cálculos posteriores (como YoY)
    filteredData.allMonthlyTrends = dashboardData.monthlyTrends;
    
    // Crear una función auxiliar para comparar meses en diferentes formatos
    const matchMonth = (dataMonth, selectedMonth) => {
      // Comparación directa
      if (dataMonth === selectedMonth) return true;
      
      try {
        // Intentar extraer mes y año de ambos formatos
        let dataMonthName, dataYear, selectedMonthName, selectedYear;

        // Formato "Month Year" (e.g., "January 2023")
        if (dataMonth.includes(' ')) {
          const parts = dataMonth.split(' ');
          dataMonthName = parts[0].toLowerCase();
          dataYear = parts[1];
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

        if (dataMonth.includes('-')) {
          const parts = dataMonth.split('-');
          dataYear = parts[0];
          // Convertir número de mes a nombre
          const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                             'july', 'august', 'september', 'october', 'november', 'december'];
          const dataMonthNum = parseInt(parts[1], 10);
          if (dataMonthNum >= 1 && dataMonthNum <= 12) {
            dataMonthName = monthNames[dataMonthNum - 1];
          }
        }

        // Si tenemos ambos componentes para ambos formatos, comparar
        if (dataMonthName && dataYear && selectedMonthName && selectedYear) {
          return dataMonthName === selectedMonthName && dataYear === selectedYear;
        }
      } catch (error) {
        console.error("Error al comparar formatos de meses:", error);
      }
      
      return false;
    };
    
    // Aplicar filtros
    if (selectedYears.length > 0 || selectedMonths.length > 0) {
      console.log("Filtrando tendencias mensuales. Detalles:", {
        totalTrends: dashboardData.monthlyTrends.length,
        ejemplosMeses: dashboardData.monthlyTrends.slice(0, 3).map(m => ({ 
          month: m.month, 
          rawMonth: m.rawMonth 
        }))
      });
      
      // Filtrar tendencias mensuales
      const filteredMonthlyTrends = dashboardData.monthlyTrends.filter(monthData => {
        // Extraer año y mes del formato 'YYYY-MM'
        const [year] = monthData.month.split('-');
        
        // Obtener el mes en formato texto (para comparar con selectedMonths)
        const monthText = monthData.rawMonth;
        
        // Debug del formato de este mes
        if (selectedMonths.length > 0) {
          console.log(`Comparando mes de datos: '${monthText}' (formato interno: '${monthData.month}')`);
        }
        
        // Comprobar si pasa el filtro de año
        const passYearFilter = selectedYears.length === 0 || selectedYears.includes(year);
        
        // Comprobar si pasa el filtro de mes, usando la función de coincidencia flexible
        const passMonthFilter = selectedMonths.length === 0 || 
                                selectedMonths.some(selectedMonth => 
                                  matchMonth(monthText, selectedMonth));
        
        if (selectedMonths.length > 0 && passMonthFilter) {
          console.log(`¡Coincidencia encontrada para mes: ${monthText}!`);
        }
        
        return passYearFilter && passMonthFilter;
      });
      
      console.log(`Después de filtrar: ${filteredMonthlyTrends.length} meses de ${dashboardData.monthlyTrends.length}`);
      
      filteredData.monthlyTrends = filteredMonthlyTrends;
      
      // Recalcular datos de bancos en base a los meses filtrados
      if (filteredMonthlyTrends.length > 0) {
        // Calcular inversión total en el período filtrado
        const totalFilteredInvestment = filteredMonthlyTrends.reduce((sum, month) => sum + month.total, 0);
        filteredData.totalInvestment = totalFilteredInvestment;
        
        // Recalcular datos por banco
        const bankDataMap = new Map();
        
        filteredMonthlyTrends.forEach(month => {
          month.bankShares.forEach(share => {
            const bankName = share.bank;
            if (!bankDataMap.has(bankName)) {
              bankDataMap.set(bankName, { 
                totalInvestment: 0,
                mediaCategories: new Map()
              });
            }
            
            const bankData = bankDataMap.get(bankName);
            bankData.totalInvestment += share.investment;
            
            // Actualizar categorías de medios
            if (month.mediaCategories) {
              const bankMediaData = month.mediaCategories.find(m => m.bank === bankName);
              if (bankMediaData && bankMediaData.categories) {
                Object.entries(bankMediaData.categories).forEach(([category, amount]) => {
                  if (!bankData.mediaCategories.has(category)) {
                    bankData.mediaCategories.set(category, 0);
                  }
                  bankData.mediaCategories.set(category, bankData.mediaCategories.get(category) + amount);
                });
              }
            }
          });
        });
        
        // Regenerar el array de bancos con los datos filtrados
        filteredData.banks = Array.from(bankDataMap.entries()).map(([name, data]) => {
          // Calcular distribución de medios
          const mediaBreakdown = Array.from(data.mediaCategories.entries())
            .map(([category, amount]) => ({
              category,
              amount,
              percentage: (amount / data.totalInvestment) * 100
            }))
            .sort((a, b) => b.amount - a.amount);
          
          return {
            name,
            totalInvestment: data.totalInvestment,
            mediaBreakdown,
            marketShare: (data.totalInvestment / totalFilteredInvestment) * 100
          };
        }).sort((a, b) => b.totalInvestment - a.totalInvestment);
        
        // Recalcular categorías de medios en base a los datos filtrados
        const mediaCategoryMap = new Map();
        
        // Primero acumulamos los totales para cada categoría de medios
        filteredData.banks.forEach(bank => {
          bank.mediaBreakdown.forEach(media => {
            if (!mediaCategoryMap.has(media.category)) {
              mediaCategoryMap.set(media.category, {
                totalInvestment: 0,
                bankShares: new Map()
              });
            }
            
            const categoryData = mediaCategoryMap.get(media.category);
            categoryData.totalInvestment += media.amount;
            
            if (!categoryData.bankShares.has(bank.name)) {
              categoryData.bankShares.set(bank.name, 0);
            }
            categoryData.bankShares.set(bank.name, media.amount);
          });
        });
        
        // Luego generamos el array de categorías de medios con los datos filtrados
        filteredData.mediaCategories = Array.from(mediaCategoryMap.entries()).map(([category, data]) => {
          // Procesar los datos de los bancos para esta categoría
          const bankShares = Array.from(data.bankShares.entries()).map(([bank, investment]) => ({
            bank,
            investment,
            percentage: (investment / data.totalInvestment) * 100
          })).sort((a, b) => b.investment - a.investment);
          
          return {
            category,
            totalInvestment: data.totalInvestment,
            marketShare: (data.totalInvestment / totalFilteredInvestment) * 100,
            bankShares
          };
        }).sort((a, b) => b.totalInvestment - a.totalInvestment);
      } else {
        // Si no hay datos después de filtrar, inicializar estructuras vacías
        filteredData.banks = [];
        filteredData.mediaCategories = [];
        filteredData.totalInvestment = 0;
      }
    }
    
    return filteredData;
  }, [dashboardData, selectedYears, selectedMonths]);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Intentar cargar el CSV probando diferentes rutas
        const publicUrl = process.env.PUBLIC_URL || '';
        const possiblePaths = [
          `${publicUrl}/data/consolidated_banks_data.csv`,
          './data/consolidated_banks_data.csv',
          '/data/consolidated_banks_data.csv',
          'data/consolidated_banks_data.csv', 
          '../data/consolidated_banks_data.csv',
          'consolidated_banks_data.csv'
        ];
        
        let response = null;
        let successPath = '';
        
        // Intentar cada ruta hasta que una funcione
        for (const path of possiblePaths) {
          try {
            console.log(`Intentando cargar CSV desde: ${path}`);
            const tempResponse = await fetch(path);
            if (tempResponse.ok) {
              response = tempResponse;
              successPath = path;
              console.log(`¡Éxito! CSV cargado desde: ${path}`);
              break;
            }
          } catch (pathError) {
            console.warn(`Error al intentar ruta ${path}:`, pathError.message);
          }
        }
        
        if (!response || !response.ok) {
          throw new Error(`No se pudo cargar el archivo CSV consolidado. Rutas intentadas: ${possiblePaths.join(', ')}`);
        }
        
        const csvText = await response.text();
        console.log(`CSV cargado correctamente desde: ${successPath} (${csvText.length} bytes)`);
        
        // Procesar CSV con Papa Parse
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            const csvData = results.data.filter(row => row.Bank && row.dollars);
            
            // Calcular inversión total
            const totalInvestment = csvData.reduce((sum, row) => sum + parseDollarValue(row.dollars), 0);
            
            // Obtener lista de bancos únicos
            const bankNames = [...new Set(csvData.map(row => row.Bank))];
            
            // Obtener lista de años y meses únicos para los filtros
            const years = [...new Set(csvData.map(row => row.Year))].sort();
            const months = [...new Set(csvData.map(row => {
              const monthPart = row.Month.split(' ')[0]; // Extraer solo el nombre del mes
              return monthPart;
            }))];
            
            // Procesar datos de bancos
            const banks = bankNames.map(bankName => {
              const bankRows = csvData.filter(row => row.Bank === bankName);
              const bankInvestment = bankRows.reduce((sum, row) => sum + parseDollarValue(row.dollars), 0);
              
              // Procesar categorías de medios
              const mediaCategories = [...new Set(bankRows.map(row => row.Media_Category || row['Media Category']))];
              const mediaBreakdown = mediaCategories.map(category => {
                const categoryRows = bankRows.filter(row => (row.Media_Category || row['Media Category']) === category);
                const categoryInvestment = categoryRows.reduce((sum, row) => sum + parseDollarValue(row.dollars), 0);
                
                return {
                  category,
                  amount: categoryInvestment,
                  percentage: (categoryInvestment / bankInvestment) * 100
                };
              }).sort((a, b) => b.amount - a.amount);
              
              return {
                name: bankName,
                totalInvestment: bankInvestment,
                mediaBreakdown,
                marketShare: (bankInvestment / totalInvestment) * 100
              };
            }).sort((a, b) => b.totalInvestment - a.totalInvestment);
            
            // Procesar tendencias mensuales
            const monthsData = [];
            
            // Extraer todos los meses únicos
            const uniqueMonths = csvData.map(row => {
              const monthStr = row.Month;
              const [monthName, yearStr] = monthStr.split(' ');
              const year = parseInt(yearStr);
              const monthNum = getMonthOrder(monthName);
              
              return {
                rawMonth: monthStr,
                month: `${year}-${monthNum.toString().padStart(2, '0')}`,
                monthNum,
                year
              };
            });
            
            // Filtrar meses únicos
            const uniqueMonthsMap = {};
            uniqueMonths.forEach(m => {
              uniqueMonthsMap[m.month] = m;
            });
            
            // Ordenar meses cronológicamente
            const sortedMonths = sortMonths(Object.values(uniqueMonthsMap));
            
            // Para cada mes, calcular inversiones por banco y categoría de medios
            sortedMonths.forEach(monthData => {
              const monthStr = monthData.rawMonth;
              const monthRows = csvData.filter(row => row.Month === monthStr);
              const monthTotal = monthRows.reduce((sum, row) => sum + parseDollarValue(row.dollars), 0);
              
              // Calcular inversiones por banco
              const bankShares = bankNames.map(bankName => {
                const bankMonthRows = monthRows.filter(row => row.Bank === bankName);
                const bankMonthInvestment = bankMonthRows.reduce((sum, row) => sum + parseDollarValue(row.dollars), 0);
                
                return {
                  bank: bankName,
                  investment: bankMonthInvestment,
                  percentage: (bankMonthInvestment / monthTotal) * 100
                };
              }).filter(share => share.investment > 0)
                .sort((a, b) => b.investment - a.investment);
              
              // Agregar datos del mes
              monthsData.push({
                month: monthData.month,
                rawMonth: monthStr,
                total: monthTotal,
                bankShares
              });
            });
            
            // Calcular categorías de medios principales
            const mediaCategories = [...new Set(csvData.map(row => row.Media_Category || row['Media Category']))];
            const mediaCategoryData = mediaCategories.map(category => {
              const categoryRows = csvData.filter(row => (row.Media_Category || row['Media Category']) === category);
              const categoryInvestment = categoryRows.reduce((sum, row) => sum + parseDollarValue(row.dollars), 0);
              
              // Calcular inversiones por banco para esta categoría
              const bankShares = bankNames.map(bankName => {
                const bankCategoryRows = categoryRows.filter(row => row.Bank === bankName);
                const bankCategoryInvestment = bankCategoryRows.reduce((sum, row) => sum + parseDollarValue(row.dollars), 0);
                
                return {
                  bank: bankName,
                  investment: bankCategoryInvestment,
                  percentage: (bankCategoryInvestment / categoryInvestment) * 100
                };
              }).filter(share => share.investment > 0)
                .sort((a, b) => b.investment - a.investment);
            
            return {
                category,
                totalInvestment: categoryInvestment,
                marketShare: (categoryInvestment / totalInvestment) * 100,
                bankShares
              };
            }).sort((a, b) => b.totalInvestment - a.totalInvestment);
            
            // Procesar datos de meses con información de categorías de medios
            const processedMonthsData = processBankMediaMonthlyData(monthsData, banks);
            
            // Calcular Year-over-Year (YoY) para cada mes
            const yoyData = {};
            
            // Ordenar los meses cronológicamente para facilitar el cálculo
            const chronologicalMonths = _.orderBy(processedMonthsData, 
              [month => {
                const [year, monthNum] = month.month.split('-');
                return parseInt(year) * 100 + parseInt(monthNum);
              }], 
              ['asc']
            );
            
            // Para cada mes, buscar el dato del mismo mes del año anterior
            chronologicalMonths.forEach(monthData => {
              const [year, monthNum] = monthData.month.split('-');
              const previousYearMonth = `${parseInt(year) - 1}-${monthNum}`;
              
              // Buscar el mismo mes del año anterior
              const previousYearData = chronologicalMonths.find(m => m.month === previousYearMonth);
              
              let yoyGrowth = 0;
              let yoyDescription = '';
              
              if (previousYearData && previousYearData.total > 0) {
                // Calcular YoY growth
                yoyGrowth = ((monthData.total - previousYearData.total) / previousYearData.total) * 100;
                
                // Formato para mostrar los meses
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const currentMonthFormatted = `${monthNames[parseInt(monthNum) - 1]} ${year}`;
                const prevMonthFormatted = `${monthNames[parseInt(monthNum) - 1]} ${parseInt(year) - 1}`;
                
                yoyDescription = `${prevMonthFormatted} vs ${currentMonthFormatted}`;
              } else {
                yoyDescription = `No data available for comparison`;
              }
              
              // Almacenar los datos calculados
              yoyData[monthData.month] = {
                growth: yoyGrowth,
                description: yoyDescription,
                currentTotal: monthData.total,
                previousYearTotal: previousYearData ? previousYearData.total : 0
            };
          });
          
            // Crear el objeto de datos del dashboard
            const dashboardData = {
              banks,
              totalInvestment,
              monthlyTrends: processedMonthsData,
              allMonthlyTrends: processedMonthsData,
              mediaCategories: mediaCategoryData,
              sortedMonthData: sortedMonths,
              availableYears: years,
              availableMonths: months,
              yoyData: yoyData,  // Añadir los datos YoY precalculados
              rawData: csvData   // Añadir los datos originales del CSV para los filtros
            };
            
            setDashboardData(dashboardData);
            setLoading(false);
          },
          error: (error) => {
            console.error('Error al parsear CSV:', error);
            setError('Error al procesar el archivo CSV');
            setLoading(false);
          }
        });
      } catch (err) {
        console.error('Error al cargar los datos:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadData();
  }, []);
  
  // Aplicar filtros cada vez que cambien selectedYears o selectedMonths
  useEffect(() => {
    if (dashboardData) {
      const newFilteredData = getFilteredData();
      setFilteredDashboardData(newFilteredData);
      
      // Actualizar el período seleccionado en función de los filtros aplicados
      let selectedPeriodText = 'All Period';
      
      if (selectedYears.length > 0 && selectedMonths.length > 0) {
        selectedPeriodText = `${selectedMonths.length} months in ${selectedYears.length} years`;
      } else if (selectedYears.length > 0) {
        selectedPeriodText = selectedYears.length === 1 
          ? `Year ${selectedYears[0]}` 
          : `${selectedYears.length} selected years`;
      } else if (selectedMonths.length > 0) {
        selectedPeriodText = selectedMonths.length === 1 
          ? `Month: ${selectedMonths[0]}` 
          : `${selectedMonths.length} selected months`;
      }
      
      setSelectedPeriod(selectedPeriodText);
    }
  }, [dashboardData, selectedYears, selectedMonths, getFilteredData]);
  
  // Objeto de valor que se proporcionará a los consumidores del contexto
  const value = {
    // Datos y estado
    dashboardData,
    loading,
    error,
    
    // Agregar los datos filtrados al valor del contexto
    filteredData: filteredDashboardData,
    
    // Estado de navegación
    activeTab,
    setActiveTab,
    activeMediaTab,
    setActiveMediaTab,
    
    // Filtros
    focusedBank,
    setFocusedBank,
    selectedMediaCategory,
    setSelectedMediaCategory,
    
    // Filtro de meses y años
    selectedMonths,
    setSelectedMonths,
    selectedYears,
    setSelectedYears,
    showMonthFilter,
    setShowMonthFilter,
    showYearFilter,
    setShowYearFilter,
    tempSelectedMonths,
    setTempSelectedMonths,
    tempSelectedYears,
    setTempSelectedYears,
    
    // Función para obtener datos filtrados
    getFilteredData,
    
    // Estado de período seleccionado
    selectedPeriod,
    setSelectedPeriod
  };
  
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};