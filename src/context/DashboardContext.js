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

// Función auxiliar para corregir porcentajes y asegurar que sumen 100%
const fixPercentages = (items, totalAmount) => {
  if (!items || !totalAmount || totalAmount === 0) return items;

  // Log para depuración
  console.log(`Fixing percentages for ${items.length} items. Total amount: ${totalAmount}`);
  
  return items.map(item => {
    // Obtener el monto de inversión, sin importar cómo se llame la propiedad
    const amount = item.investment || item.amount || item.totalInvestment || 0;
    
    // Calcular el porcentaje correcto basado en el total
    const correctPercentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
    
    // Log para depuración
    if (Math.abs(correctPercentage - (item.percentage || item.share || item.marketShare || 0)) > 5) {
      console.log(`Corrigiendo porcentaje para ${item.name || item.bank || item.category || 'desconocido'}: 
        Original: ${item.percentage || item.share || item.marketShare || 0}%, 
        Corregido: ${correctPercentage}% 
        (${amount} / ${totalAmount})`);
    }
    
    // Actualizar todas las propiedades posibles de porcentaje
    return {
      ...item,
      percentage: correctPercentage,
      share: correctPercentage,
      marketShare: correctPercentage
    };
  });
};

// Función para recalcular y corregir porcentajes basados en el total real
const recalculatePercentages = (items, totalAmount) => {
  if (!items || items.length === 0 || !totalAmount || totalAmount === 0) return items;
  
  return items.map(item => {
    // Determinar el monto a utilizar (puede tener diferentes nombres según el objeto)
    const amount = item.investment || item.amount || item.totalInvestment || 0;
    
    // Calcular el porcentaje correcto
    const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
    
    // Devolver el objeto con todos los porcentajes corregidos
    return {
      ...item,
      percentage: percentage,
      share: percentage,
      marketShare: percentage
    };
  });
};

// Imprimir valores para depurar
const debugBankValues = (banks) => {
  console.log("===== VALORES DE BANCOS (ORDENADOS) =====");
  // Ordenar por valor de inversión descendente
  const sortedBanks = [...banks].sort((a, b) => b.totalInvestment - a.totalInvestment);
  
  // Imprimir totales para cada banco
  sortedBanks.forEach((bank, index) => {
    console.log(`${index + 1}. ${bank.name}: ${bank.totalInvestment.toFixed(2)} (${bank.marketShare.toFixed(2)}%)`);
  });
  
  // Validar que los porcentajes suman aproximadamente 100%
  const totalShare = sortedBanks.reduce((sum, bank) => sum + bank.marketShare, 0);
  console.log(`Total porcentajes: ${totalShare.toFixed(2)}%`);
  
  // Verificar si hay valores anómalos (muy grandes o muy pequeños)
  const maxValue = Math.max(...sortedBanks.map(bank => bank.totalInvestment));
  const minValue = Math.min(...sortedBanks.filter(bank => bank.totalInvestment > 0).map(bank => bank.totalInvestment));
  
  if (maxValue / minValue > 1000) {
    console.warn(`⚠️ Posible problema con unidades: Mayor valor (${maxValue}) es ${(maxValue/minValue).toFixed(2)}x el menor valor (${minValue})`);
  }
  
  return sortedBanks;
};

// Función para procesar y depurar categorías de medios
const debugMediaValues = (mediaCategories) => {
  console.log("===== VALORES DE CATEGORÍAS DE MEDIOS (ORDENADOS) =====");
  // Ordenar por valor de inversión descendente
  const sortedMedia = [...mediaCategories].sort((a, b) => b.totalInvestment - a.totalInvestment);
  
  // Imprimir totales para cada categoría
  sortedMedia.forEach((media, index) => {
    console.log(`${index + 1}. ${media.category}: ${media.totalInvestment.toFixed(2)} (${media.marketShare.toFixed(2)}%)`);
  });
  
  // Validar que los porcentajes suman aproximadamente 100%
  const totalShare = sortedMedia.reduce((sum, media) => sum + media.marketShare, 0);
  console.log(`Total porcentajes medios: ${totalShare.toFixed(2)}%`);
  
  // Verificar si hay valores anómalos (muy grandes o muy pequeños)
  const maxValue = Math.max(...sortedMedia.map(media => media.totalInvestment));
  const minValue = Math.min(...sortedMedia.filter(media => media.totalInvestment > 0).map(media => media.totalInvestment));
  
  if (maxValue / minValue > 1000) {
    console.warn(`⚠️ Posible problema con unidades en medios: Mayor valor (${maxValue}) es ${(maxValue/minValue).toFixed(2)}x el menor valor (${minValue})`);
  }
  
  // Normalizar los porcentajes si no suman 100%
  if (Math.abs(totalShare - 100) > 1) {
    console.warn(`Los porcentajes de medios no suman 100% (${totalShare.toFixed(2)}%). Normalizando...`);
    return sortedMedia.map(media => ({
      ...media,
      marketShare: (media.marketShare / totalShare) * 100
    }));
  }
  
  return sortedMedia;
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
  const [selectedBank, setSelectedBank] = useState(null);
  
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
  
  // Función auxiliar para convertir valor de dólares del CSV con mejor manejo de unidades
  const parseDollarValue = (dollarStr) => {
    if (!dollarStr) return 0;
    
    // Asegurarse de que estamos trabajando con un string
    const strValue = String(dollarStr).trim();
    
    // Detectar sufijos de unidades (K, M, B)
    let multiplier = 1;
    if (strValue.toUpperCase().includes('K')) {
      multiplier = 1000;
    } else if (strValue.toUpperCase().includes('M')) {
      multiplier = 1000000;
    } else if (strValue.toUpperCase().includes('B')) {
      multiplier = 1000000000;
    }
    
    // Eliminar cualquier caracter que no sea número, punto o signo negativo
    const numericValue = parseFloat(strValue.replace(/[^\d.-]/g, ''));
    
    // Verificar si es un número válido
    if (isNaN(numericValue)) {
      console.warn(`Valor inválido para conversión: "${dollarStr}" => Se utilizará 0`);
      return 0;
    }
    
    // Aplicar el multiplicador según la unidad
    return numericValue * multiplier;
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
    
    // DEBUG: Datos antes del filtrado
    console.log("===== FILTRADO DE DATOS =====");
    console.log("Tendencias mensuales antes del filtrado:", dashboardData.monthlyTrends.length);
    
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
  
  // Cargar datos iniciales cuando el componente se monta
  const loadData = useCallback(async () => {
      try {
        setLoading(true);
        
      // Intentar cargar el CSV probando diferentes rutas
      const possiblePaths = [
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
        console.log("Fetch falló para todas las rutas, intentando cargar directamente con PapaParse");
        // Intentar cargar con PapaParse directamente como alternativa
        let papaSuccess = false;
        
        for (const path of possiblePaths) {
          try {
            console.log(`Intentando cargar CSV con PapaParse desde: ${path}`);
            
            const parsedData = await new Promise((resolve, reject) => {
              Papa.parse(path, {
                download: true,
                header: true,
                skipEmptyLines: true,
                delimiter: ",", // Usar explícitamente coma como delimitador
                transformHeader: header => header.trim(), // Eliminar espacios en blanco de los encabezados
                complete: (results) => {
                  console.log("PapaParse directo - Resultados:", {
                    totalRows: results.data ? results.data.length : 0,
                    headers: results.meta ? results.meta.fields : [],
                    delimiter: results.meta ? results.meta.delimiter : 'unknown',
                    errors: results.errors || []
                  });
                  console.log("PapaParse directo - Primera fila:", results.data && results.data.length > 0 ? results.data[0] : 'No hay datos');
                  
                  if (results.data && results.data.length > 0) {
                    resolve(results);
                  } else {
                    reject(new Error("Datos CSV vacíos o inválidos"));
                  }
                },
                error: (error) => {
                  reject(error);
                }
              });
            });
            
            if (parsedData && parsedData.data && parsedData.data.length > 0) {
              console.log(`¡Éxito! CSV cargado con PapaParse desde: ${path} (${parsedData.data.length} filas)`);
              
              // Si llegamos aquí, el CSV se ha cargado correctamente con PapaParse
              const csvData = parsedData.data.filter(row => row.Bank && row.dollars);
              
              // Continuar con el procesamiento de datos como si lo hubiéramos cargado con fetch
              // Calcular inversión total
              const totalInvestment = csvData.reduce((sum, row) => sum + parseDollarValue(row.dollars), 0);
              
              // Obtener lista de bancos únicos
              const bankNames = [...new Set(csvData.map(row => row.Bank))];
              
              // Obtener lista de años y meses únicos para los filtros
              const years = [...new Set(csvData.map(row => row.Year))].sort();
              const months = [...new Set(csvData.map(row => {
                // Verificar que row.Month existe antes de intentar hacer split
                if (!row.Month) {
                  console.warn("Fila sin propiedad Month:", row);
                  return "Unknown";
                }
                
                try {
                  const monthPart = row.Month.split(' ')[0]; // Extraer solo el nombre del mes
                  return monthPart;
                } catch (error) {
                  console.error("Error al procesar el mes:", error, "Fila:", row);
                  return "Unknown";
                }
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
                if (!row.Month) {
                  console.warn("Fila sin propiedad Month en uniqueMonths:", row);
                  return {
                    rawMonth: "Unknown",
                    month: "0000-00",
                    monthNum: 0,
                    year: 0
                  };
                }
                
                try {
                  const monthStr = row.Month;
                  const parts = monthStr.split(' ');
                  
                  if (parts.length < 2) {
                    console.warn("Formato de mes inválido:", monthStr);
                    return {
                      rawMonth: monthStr,
                      month: "0000-00",
                      monthNum: 0,
                      year: 0
                    };
                  }
                  
                  const monthName = parts[0];
                  const yearStr = parts[1];
                  const year = parseInt(yearStr) || 0;
                  const monthNum = getMonthOrder(monthName);
                  
                  return {
                    rawMonth: monthStr,
                    month: `${year}-${monthNum.toString().padStart(2, '0')}`,
                    monthNum,
                    year
                  };
                } catch (error) {
                  console.error("Error al procesar uniqueMonths:", error, "Fila:", row);
                  return {
                    rawMonth: "Error",
                    month: "0000-00",
                    monthNum: 0,
                    year: 0
                  };
                }
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
                if (monthStr === "Unknown" || monthStr === "Error") {
                  console.warn("Saltando mes inválido:", monthData);
                  return; // Saltar este mes
                }
                
                const monthRows = csvData.filter(row => row.Month === monthStr);
                const monthTotal = monthRows.reduce((sum, row) => sum + parseDollarValue(row.dollars), 0);
                
                // DEBUG: Información de procesamiento por mes
                console.log(`Mes: ${monthStr}, Filas: ${monthRows.length}, Total: ${monthTotal}`);
                
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
              
              // DEBUG: Mostrar tendencias mensuales procesadas
              console.log("===== TENDENCIAS MENSUALES =====");
              console.log("Meses procesados:", monthsData.length);
              if (monthsData.length > 0) {
                console.log("Ejemplo de mes procesado:", monthsData[0]);
              }
              
              // Calcular categorías de medios principales
              const mediaCategories = [...new Set(csvData.map(row => row.Media_Category || row['Media Category']))];
              const mediaCategoryData = mediaCategories.map(category => {
                // Filtrar filas para esta categoría
                const categoryRows = csvData.filter(row => (row.Media_Category || row['Media Category']) === category);
                
                // Sumar inversión para esta categoría
                const categoryInvestment = categoryRows.reduce((sum, row) => {
                  const value = parseDollarValue(row.dollars);
                  return sum + value;
                }, 0);
                
                // Calcular porcentaje de mercado para esta categoría
                const marketShare = (totalInvestment > 0) ? (categoryInvestment / totalInvestment) * 100 : 0;
                
                // Calcular inversiones por banco para esta categoría
                const bankShares = bankNames.map(bankName => {
                  // Filtrar filas de esta categoría para este banco
                  const bankCategoryRows = categoryRows.filter(row => row.Bank === bankName);
                  
                  // Sumar inversión de este banco en esta categoría
                  const bankCategoryInvestment = bankCategoryRows.reduce((sum, row) => {
                    const value = parseDollarValue(row.dollars);
                    return sum + value;
                  }, 0);
                  
                  // Calcular porcentaje de este banco en esta categoría
                  const percentage = (categoryInvestment > 0) ? (bankCategoryInvestment / categoryInvestment) * 100 : 0;
                  
                  return {
                    bank: bankName,
                    investment: bankCategoryInvestment,
                    percentage: percentage
                  };
                }).filter(share => share.investment > 0)
                  .sort((a, b) => b.investment - a.investment);
              
                return {
                  category,
                  totalInvestment: categoryInvestment,
                  marketShare: marketShare,
                  bankShares
                };
              }).sort((a, b) => b.totalInvestment - a.totalInvestment);
              
              // Verificar cálculos para categorías de medios
              const mediaTotalCheck = mediaCategoryData.reduce((sum, category) => sum + category.totalInvestment, 0);
              const mediaShareSum = mediaCategoryData.reduce((sum, category) => sum + category.marketShare, 0);
              console.log("Verificación de totales para categorías de medios:", {
                totalInvestment,
                mediaTotalCheck,
                diferencia: totalInvestment - mediaTotalCheck,
                sumaPorcentajes: mediaShareSum
              });
              
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
              
              // Verificar cálculos para bancos
              const bankTotalCheck = banks.reduce((sum, bank) => sum + bank.totalInvestment, 0);
              const bankShareSum = banks.reduce((sum, bank) => sum + bank.marketShare, 0);
              console.log("Verificación de totales para bancos:", {
                totalInvestment,
                bankTotalCheck,
                diferencia: totalInvestment - bankTotalCheck,
                sumaPorcentajes: bankShareSum
              });
              
              // Procesar y depurar los datos de bancos
              const processedBanks = debugBankValues(banks);

              // Procesar y depurar categorías de medios
              const processedMediaCategories = debugMediaValues(mediaCategoryData);

              // Crear el objeto de datos del dashboard usando los bancos procesados
              const dashboardData = {
                banks: processedBanks,
                totalInvestment,
                monthlyTrends: processedMonthsData,
                allMonthlyTrends: processedMonthsData,
                mediaCategories: processedMediaCategories,
                sortedMonthData: sortedMonths,
                availableYears: years,
                availableMonths: months,
                yoyData: yoyData,  // Añadir los datos YoY precalculados
                rawData: csvData   // Añadir los datos originales del CSV para los filtros
              };
              
              // Actualizar el estado con los datos procesados
              setDashboardData(dashboardData);
              setLoading(false);
              
              // Indicar que tuvimos éxito con PapaParse
              papaSuccess = true;
              break;
            }
          } catch (papaError) {
            console.warn(`Error al intentar cargar con PapaParse desde ${path}:`, papaError.message);
          }
        }
        
        // Si no tuvimos éxito con ninguna aproximación, lanzar un error
        if (!papaSuccess) {
          throw new Error(`No se pudo cargar el archivo CSV consolidado. Rutas intentadas: ${possiblePaths.join(', ')}`);
        }
        
        // Si llegamos aquí con papaSuccess = true, ya hemos hecho todo el procesamiento y no necesitamos continuar
        return;
        }
        
        const csvText = await response.text();
      console.log(`CSV cargado correctamente desde: ${successPath} (${csvText.length} bytes)`);
      
      // Verificar si el contenido parece ser un archivo HTML en lugar de CSV
      if (csvText.trim().toLowerCase().startsWith('<!doctype html>') || 
          csvText.trim().toLowerCase().startsWith('<html')) {
        console.error('El archivo cargado parece ser HTML, no CSV. Esto podría indicar un error 404 o una redirección:');
        console.error(csvText.substring(0, 200) + '...');
        
        setError('El archivo cargado parece ser HTML, no CSV. Compruebe que el archivo exista y sea accesible.');
        setLoading(false);
        
        // Intentar con carga directa con PapaParse como último recurso
        console.log("Intentando cargar CSV directamente con PapaParse como último recurso");
        
        // Intentar cargar con rutas específicas que fueron probadas exitosamente en desarrollo
        const lastResortPaths = [
          '/consolidated_banks_data.csv',
          './consolidated_banks_data.csv',
          'consolidated_banks_data.csv',
          `${window.location.origin}/consolidated_banks_data.csv`,
          `${window.location.href.split('#')[0].split('?')[0]}consolidated_banks_data.csv`
        ];
        
        for (const path of lastResortPaths) {
          try {
            console.log(`Último intento de carga CSV con PapaParse desde: ${path}`);
            
            await new Promise((resolve, reject) => {
              Papa.parse(path, {
                download: true,
                header: true,
                skipEmptyLines: true,
                delimiter: ",", 
                transformHeader: header => header.trim(),
                beforeParse: function(file) {
                  // Verificar si el contenido parece ser CSV válido
                  if (typeof file === 'string' && 
                      (file.trim().toLowerCase().startsWith('<!doctype html>') || 
                       file.trim().toLowerCase().startsWith('<html'))) {
                    console.error('El archivo cargado parece ser HTML, no CSV:', file.substring(0, 200));
                    reject(new Error('El contenido no parece ser un CSV válido'));
                    return null;
                  }
                  return file;
                },
                complete: (results) => {
                  if (results.data && results.data.length > 0) {
                    console.log(`¡Éxito en último intento! CSV cargado desde: ${path} (${results.data.length} filas)`);
                    resolve(results);
                  } else {
                    reject(new Error("Datos CSV vacíos o inválidos"));
                  }
                },
                error: (error) => {
                  reject(error);
                }
              });
            });
            
            // Si llegamos aquí, tuvimos éxito con esta ruta
            console.log(`Carga exitosa con último intento desde: ${path}`);
            break;
          } catch (lastError) {
            console.warn(`Error en último intento desde ${path}:`, lastError.message);
          }
        }
        
        return;
      }
        
        // Procesar CSV con Papa Parse
        Papa.parse(csvText, {
          header: true,
        skipEmptyLines: true,
        delimiter: ",", // Forzar coma como delimitador en lugar de "auto"
        transformHeader: header => header.trim(), // Eliminar espacios en blanco de los encabezados
          complete: (results) => {
          console.log("Resultados completos del parseo:", results);
          console.log("Headers detectados:", results.meta.fields);
          console.log("Delimitador detectado:", results.meta.delimiter);
          console.log("Errores durante el parseo:", results.errors);
          
          // Diagnóstico adicional del CSV
          diagnosticarCSV(results, csvText);
          
          // Verificar si hay datos
          if (!results.data || results.data.length === 0) {
            console.error("El CSV se cargó pero no contiene datos procesables");
            // Intentar mostrar el contenido crudo del CSV para debug
            console.log("Contenido crudo del CSV (primeros 200 caracteres):", csvText.substring(0, 200));
            setError('El archivo CSV no contiene datos procesables');
            setLoading(false);
            return;
          }
          
          // Aplicar filtro más flexible
          const csvData = results.data.filter(row => 
            row && ((row.Bank && row.dollars) || 
            Object.values(row).some(val => val && val.trim() !== ''))
          );
          
          // DEBUG: Ver datos del CSV
          console.log("===== DATOS CARGADOS DEL CSV =====");
          console.log("Total de filas en CSV:", results.data.length);
          console.log("Filas filtradas (con Bank y dollars):", csvData.length);
          if (results.data.length > 0) {
            console.log("Estructura de la primera fila:", Object.keys(results.data[0]));
            console.log("Muestra de datos:", results.data.slice(0, 3));
          }
          if (csvData.length > 0) {
            console.log("Muestra de datos filtrados:", csvData.slice(0, 3));
          }
            
            // Calcular inversión total sumando todos los valores de dollars
            const totalInvestment = csvData.reduce((sum, row) => {
              const value = parseDollarValue(row.dollars);
              return sum + value;
            }, 0);
          console.log("Inversión total calculada:", totalInvestment);
            
            // Obtener lista de bancos únicos
            const bankNames = [...new Set(csvData.map(row => row.Bank))];
          console.log("Bancos encontrados:", bankNames);
            
            // Obtener lista de años y meses únicos para los filtros
            const years = [...new Set(csvData.map(row => row.Year))].sort();
            const months = [...new Set(csvData.map(row => {
            // Verificar que row.Month existe antes de intentar hacer split
            if (!row.Month) {
              console.warn("Fila sin propiedad Month:", row);
              return "Unknown";
            }
            
            try {
              const monthPart = row.Month.split(' ')[0]; // Extraer solo el nombre del mes
              return monthPart;
            } catch (error) {
              console.error("Error al procesar el mes:", error, "Fila:", row);
              return "Unknown";
            }
            }))];
          console.log("Años encontrados:", years);
          console.log("Meses encontrados:", months);
            
            // Procesar datos de bancos
            const banks = bankNames.map(bankName => {
              // Filtrar todas las filas para este banco
              const bankRows = csvData.filter(row => row.Bank === bankName);
              
              // Calcular el total de inversión para este banco sumando sus valores de dollars
              const bankInvestment = bankRows.reduce((sum, row) => {
                const value = parseDollarValue(row.dollars);
                return sum + value;
              }, 0);
              
              // Procesar categorías de medios para este banco
              const mediaCategories = [...new Set(bankRows.map(row => row.Media_Category || row['Media Category']))];
              
              const mediaBreakdown = mediaCategories.map(category => {
                // Filtrar filas de este banco para esta categoría
                const categoryRows = bankRows.filter(row => (row.Media_Category || row['Media Category']) === category);
                
                // Sumar inversión para esta categoría
                const categoryInvestment = categoryRows.reduce((sum, row) => {
                  const value = parseDollarValue(row.dollars);
                  return sum + value;
                }, 0);
                
                // Calcular porcentaje de esta categoría respecto al total del banco
                const percentage = (bankInvestment > 0) ? (categoryInvestment / bankInvestment) * 100 : 0;
                
                return {
                  category,
                  amount: categoryInvestment,
                  percentage: percentage
                };
              }).sort((a, b) => b.amount - a.amount); // Ordenar por monto descendente
              
              // Calcular porcentaje de mercado de este banco respecto al total
              const marketShare = (totalInvestment > 0) ? (bankInvestment / totalInvestment) * 100 : 0;
              
              return {
                name: bankName,
                totalInvestment: bankInvestment,
                mediaBreakdown,
                marketShare: marketShare
              };
            }).sort((a, b) => b.totalInvestment - a.totalInvestment); // Ordenar bancos por inversión total
          
          // Verificar cálculos para bancos
          const bankTotalCheck = banks.reduce((sum, bank) => sum + bank.totalInvestment, 0);
          const bankShareSum = banks.reduce((sum, bank) => sum + bank.marketShare, 0);
          console.log("Verificación de totales para bancos:", {
            totalInvestment,
            bankTotalCheck,
            diferencia: totalInvestment - bankTotalCheck,
            sumaPorcentajes: bankShareSum
          });
            
            // Procesar tendencias mensuales
            const monthsData = [];
            
            // Extraer todos los meses únicos
            const uniqueMonths = csvData.map(row => {
            if (!row.Month) {
              console.warn("Fila sin propiedad Month en uniqueMonths:", row);
              return {
                rawMonth: "Unknown",
                month: "0000-00",
                monthNum: 0,
                year: 0
              };
            }
            
            try {
              const monthStr = row.Month;
              const parts = monthStr.split(' ');
              
              if (parts.length < 2) {
                console.warn("Formato de mes inválido:", monthStr);
                return {
                  rawMonth: monthStr,
                  month: "0000-00",
                  monthNum: 0,
                  year: 0
                };
              }
              
              const monthName = parts[0];
              const yearStr = parts[1];
              const year = parseInt(yearStr) || 0;
              const monthNum = getMonthOrder(monthName);
              
              return {
                rawMonth: monthStr,
                month: `${year}-${monthNum.toString().padStart(2, '0')}`,
                monthNum,
                year
              };
            } catch (error) {
              console.error("Error al procesar uniqueMonths:", error, "Fila:", row);
              return {
                rawMonth: "Error",
                month: "0000-00",
                monthNum: 0,
                year: 0
              };
            }
          });
          
          // DEBUG: Ver meses procesados
          console.log("===== MESES PROCESADOS =====");
          console.log("Datos de meses extraídos:", uniqueMonths.length);
          console.log("Muestra de meses extraídos:", uniqueMonths.slice(0, 5));
            
            // Filtrar meses únicos
            const uniqueMonthsMap = {};
            uniqueMonths.forEach(m => {
              uniqueMonthsMap[m.month] = m;
            });
            
            // Ordenar meses cronológicamente
            const sortedMonths = sortMonths(Object.values(uniqueMonthsMap));
          console.log("Meses únicos ordenados:", sortedMonths.length);
          console.log("Muestra de meses ordenados:", sortedMonths.slice(0, 5));
            
            // Para cada mes, calcular inversiones por banco y categoría de medios
            sortedMonths.forEach(monthData => {
              const monthStr = monthData.rawMonth;
            if (monthStr === "Unknown" || monthStr === "Error") {
              console.warn("Saltando mes inválido:", monthData);
              return; // Saltar este mes
            }
            
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
              // Filtrar filas para esta categoría
              const categoryRows = csvData.filter(row => (row.Media_Category || row['Media Category']) === category);
              
              // Sumar inversión para esta categoría
              const categoryInvestment = categoryRows.reduce((sum, row) => {
                const value = parseDollarValue(row.dollars);
                return sum + value;
              }, 0);
              
              // Calcular porcentaje de mercado para esta categoría
              const marketShare = (totalInvestment > 0) ? (categoryInvestment / totalInvestment) * 100 : 0;
              
              // Calcular inversiones por banco para esta categoría
              const bankShares = bankNames.map(bankName => {
                // Filtrar filas de esta categoría para este banco
                const bankCategoryRows = categoryRows.filter(row => row.Bank === bankName);
                
                // Sumar inversión de este banco en esta categoría
                const bankCategoryInvestment = bankCategoryRows.reduce((sum, row) => {
                  const value = parseDollarValue(row.dollars);
                  return sum + value;
                }, 0);
                
                // Calcular porcentaje de este banco en esta categoría
                const percentage = (categoryInvestment > 0) ? (bankCategoryInvestment / categoryInvestment) * 100 : 0;
                
                return {
                  bank: bankName,
                  investment: bankCategoryInvestment,
                  percentage: percentage
                };
              }).filter(share => share.investment > 0)
                .sort((a, b) => b.investment - a.investment);
            
            return {
                category,
                totalInvestment: categoryInvestment,
                marketShare: marketShare,
                bankShares
              };
            }).sort((a, b) => b.totalInvestment - a.totalInvestment);
            
            // Verificar cálculos para categorías de medios
            const mediaTotalCheck = mediaCategoryData.reduce((sum, category) => sum + category.totalInvestment, 0);
            const mediaShareSum = mediaCategoryData.reduce((sum, category) => sum + category.marketShare, 0);
            console.log("Verificación de totales para categorías de medios:", {
              totalInvestment,
              mediaTotalCheck,
              diferencia: totalInvestment - mediaTotalCheck,
              sumaPorcentajes: mediaShareSum
            });
            
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
          
            // Procesar y depurar categorías de medios
            const processedMediaCategories = debugMediaValues(mediaCategoryData);

            // Crear el objeto de datos del dashboard
            const dashboardData = {
              banks: recalculatePercentages(banks, totalInvestment),
              totalInvestment,
              monthlyTrends: processedMonthsData,
              allMonthlyTrends: processedMonthsData,
              mediaCategories: processedMediaCategories,
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
    } catch (error) {
      console.error("Error al cargar datos:", error);
      setError(error.message);
        setLoading(false);
      }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
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
    setSelectedPeriod,
    
    // Selección de banco para gráficos interactivos
    selectedBank,
    setSelectedBank
  };
  
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

// Función para diagnosticar problemas con el CSV
function diagnosticarCSV(results, rawText) {
  console.log("=== DIAGNÓSTICO CSV ===");
  
  // Comprobar cantidad de columnas
  if (results.meta.fields && results.meta.fields.length < 5) {
    console.error(`Problema detectado: Solo se encontraron ${results.meta.fields.length} columnas en lugar de 5`);
    console.log("Columnas detectadas:", results.meta.fields);
    
    // Mostrar las primeras líneas del CSV para depuración
    const lines = rawText.split('\n').slice(0, 5);
    console.log("Primeras 5 líneas del CSV:");
    lines.forEach((line, index) => {
      console.log(`Línea ${index + 1}: ${line}`);
      console.log(`Número de comas: ${(line.match(/,/g) || []).length}`);
    });
    
    // Intentar detectar manualmente
    const comaSeparado = rawText.indexOf(',') !== -1;
    const puntoYComaSeparado = rawText.indexOf(';') !== -1;
    const tabSeparado = rawText.indexOf('\t') !== -1;
    
    console.log("Posibles delimitadores detectados:");
    console.log(`- Coma (,): ${comaSeparado}`);
    console.log(`- Punto y coma (;): ${puntoYComaSeparado}`);
    console.log(`- Tab (\\t): ${tabSeparado}`);
  }
  
  // Comprobar primeras filas
  if (results.data && results.data.length > 0) {
    console.log("=== MUESTRA DE DATOS PROCESADOS ===");
    
    // Mostrar estructuras de las primeras 3 filas
    for (let i = 0; i < Math.min(3, results.data.length); i++) {
      console.log(`Fila ${i + 1}:`);
      console.log(results.data[i]);
      
      // Verificar campos esperados
      const row = results.data[i];
      const camposEsperados = ['Bank', 'Year', 'Month', 'Media Category', 'dollars'];
      camposEsperados.forEach(campo => {
        if (row[campo] === undefined) {
          console.error(`Campo '${campo}' no encontrado en la fila ${i + 1}`);
        } else {
          console.log(`Campo '${campo}' = '${row[campo]}'`);
        }
      });
    }
  }
  
  console.log("=== FIN DIAGNÓSTICO CSV ===");
}