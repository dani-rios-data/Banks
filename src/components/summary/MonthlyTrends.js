import React, { useMemo, useEffect, useState, useCallback } from 'react';
import {
  
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,

  ReferenceLine,
  ComposedChart} from 'recharts';
import { useDashboard } from '../../context/DashboardContext';
import { chartColors } from '../../utils/bankColors';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

import _ from 'lodash';

// Function to format months in "Jan 2024" format
const formatMonthLabel = (month) => {
  const [year, monthNum] = month.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[parseInt(monthNum, 10) - 1]} ${year}`;
};

// Formato para el eje Y - mostrar valores en millones sin decimales
const formatYAxis = (value) => `$${(value/1000000).toFixed(0)}M`;

/**
 * Component that displays monthly investment trends across all banks
 */
const MonthlyTrends = ({ filteredData }) => {
  const { dashboardData, loading, selectedYears } = useDashboard();
  const [wellsFargoData, setWellsFargoData] = useState(null);
  const [isLoadingWfData, setIsLoadingWfData] = useState(true);
  const [marketAverageData, setMarketAverageData] = useState([]);
  const [selectedBanks, setSelectedBanks] = useState([]);
  const [showBankSelector, setShowBankSelector] = useState(false);

  // Mover y envolver la función calculateTrend con useCallback
  const calculateTrend = useCallback((values) => {
    if (values.length < 2) return { trend: 'stable', value: 0 };
    
    // Simple linear regression
    const xValues = Array.from({ length: values.length }, (_, i) => i);
    const xMean = xValues.reduce((a, b) => a + b, 0) / xValues.length;
    const yMean = values.reduce((a, b) => a + b, 0) / values.length;
    
    const numerator = xValues.reduce((sum, x, i) => sum + (x - xMean) * (values[i] - yMean), 0);
    const denominator = xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0);
    
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const percentage = values[0] !== 0 ? (slope * values.length) / values[0] * 100 : 0;
    
    let trend;
    if (Math.abs(percentage) < 5) trend = 'stable';
    else trend = percentage > 0 ? 'increasing' : 'decreasing';
    
    return { trend, value: percentage };
  }, []);

  // Determinar qué datos usar basado en si hay filtros aplicados
  const dataSource = useMemo(() => {
    if (filteredData) {
      console.log("MonthlyTrends - Usando datos filtrados:", {
        meses: filteredData.monthlyTrends?.length,
        banks: filteredData.banks?.length,
        total: formatCurrency(filteredData.totalInvestment)
      });
      return filteredData;
    }
    console.log("MonthlyTrends - Usando datos originales");
    return dashboardData;
  }, [dashboardData, filteredData]);
  
  // Registrar los meses que están disponibles en los datos filtrados para depuración
  useEffect(() => {
    if (dataSource?.monthlyTrends) {
      console.log("MonthlyTrends - Meses disponibles:", 
        dataSource.monthlyTrends.map(m => m.month).join(", "));
    }
  }, [dataSource]);
  
  // Asegurar que los filtros se están aplicando correctamente
  useEffect(() => {
    console.log("MonthlyTrends - Filtros actuales:", { 
      añosSeleccionados: selectedYears, 
      hayCambios: !!filteredData
    });
  }, [selectedYears, filteredData]);

  // Cargar datos de Wells Fargo
  useEffect(() => {
    setIsLoadingWfData(true);
    
    // Function to generate fallback data when loading fails
    const generateFallbackData = () => {
      if (dataSource?.monthlyTrends) {
        const fallbackData = {
          summary: {
            totalInvestment: 0,
            averageMarketShare: 0,
            peakInvestment: { month: '', value: 0 },
            lowestInvestment: { month: '', value: 0 },
            investmentTrend: 0,
            marketShareTrend: 0
          },
          monthlyPerformance: dataSource.monthlyTrends.map(month => {
            const wfShare = month.bankShares.find(share => share.bank === 'Wells Fargo') || 
                          { bank: 'Wells Fargo', investment: month.total * 0.15 }; // 15% if no data available
            return {
              month: month.month,
              investment: wfShare.investment,
              marketShare: (wfShare.investment / month.total) * 100,
              monthOverMonthChange: 0
            };
          })
        };
        setWellsFargoData(fallbackData);
      }
    };
    
    // En lugar de intentar cargar un archivo JSON que no existe, 
    // usamos directamente los datos del CSV a través de la función de respaldo
    generateFallbackData();
    setIsLoadingWfData(false);
    
  }, [dataSource]);

  // Calculate market average excluding Wells Fargo
  useEffect(() => {
    if (dataSource?.monthlyTrends && dataSource?.banks) {
      console.log("MonthlyTrends - Calculando promedios de mercado con", dataSource.monthlyTrends.length, "meses");
      
      // Sort data by month
      const sortedMonthlyData = _.orderBy(dataSource.monthlyTrends, 
        [month => {
          const [year, monthNum] = month.month.split('-');
          return parseInt(year) * 100 + parseInt(monthNum);
        }], 
        ['asc']
      );
      
      // Usar directamente los datos filtrados - no aplicar filtros adicionales
      const filteredMonthlyData = sortedMonthlyData;
      
      // Calculate market average for each month excluding Wells Fargo
      const marketAverageByMonth = filteredMonthlyData.map(month => {
        const otherBanks = month.bankShares.filter(share => share.bank !== 'Wells Fargo');
        const totalOtherInvestment = otherBanks.reduce((sum, bank) => sum + bank.investment, 0);
        const avgInvestment = otherBanks.length > 0 ? totalOtherInvestment / otherBanks.length : 0;
        const avgMarketShare = otherBanks.length > 0 
          ? otherBanks.reduce((sum, bank) => sum + (bank.investment / month.total) * 100, 0) / otherBanks.length 
          : 0;
          
        return {
          month: month.month,
          avgInvestment,
          avgMarketShare
        };
      });
      
      // Calculate month-over-month change for market average
      for (let i = 1; i < marketAverageByMonth.length; i++) {
        const current = marketAverageByMonth[i];
        const previous = marketAverageByMonth[i-1];
        
        if (previous.avgInvestment > 0) {
          current.avgMonthOverMonthChange = ((current.avgInvestment - previous.avgInvestment) / previous.avgInvestment) * 100;
        } else {
          current.avgMonthOverMonthChange = 0;
        }
      }
      
      // If there's data for the first month, assign a change of 0
      if (marketAverageByMonth.length > 0) {
        marketAverageByMonth[0].avgMonthOverMonthChange = 0;
      }
      
      setMarketAverageData(marketAverageByMonth);
    }
  }, [dataSource]);

  // Helper function para el análisis competitivo
  const findCompetitiveAdvantages = useCallback((bankComparison) => {
    if (bankComparison.length < 2) return [];
    
    // Calculate average market share for each bank
    const bankShares = {};
    
    bankComparison.forEach(month => {
      Object.entries(month).forEach(([bank, share]) => {
        if (bank !== 'name') {
          if (!bankShares[bank]) bankShares[bank] = [];
          bankShares[bank].push(share);
        }
      });
    });
    
    // Calculate market share trends
    const bankTrends = {};
    Object.entries(bankShares).forEach(([bank, shares]) => {
      bankTrends[bank] = {
        average: _.mean(shares),
        trend: calculateTrend(shares)
      };
    });
    
    // Find banks growing faster than Wells Fargo
    const wfTrend = bankTrends['Wells Fargo']?.trend?.value || 0;
    
    const threats = Object.entries(bankTrends)
      .filter(([bank, data]) => bank !== 'Wells Fargo' && data.trend.value > wfTrend && data.trend.value > 5)
      .map(([bank, data]) => ({
        bank,
        advantage: data.trend.value - wfTrend,
        growth: data.trend.value
      }));
    
    const opportunities = Object.entries(bankTrends)
      .filter(([bank, data]) => bank !== 'Wells Fargo' && data.trend.value < wfTrend && data.trend.value < -5)
      .map(([bank, data]) => ({
        bank,
        advantage: wfTrend - data.trend.value,
        decline: data.trend.value
      }));
    
    return { threats: _.take(_.orderBy(threats, ['advantage'], ['desc']), 2), opportunities: _.take(_.orderBy(opportunities, ['advantage'], ['desc']), 2) };
  }, [calculateTrend]);

  // Helper function to find seasonal patterns
  const findSeasonalPatterns = useCallback((trendsData) => {
    if (trendsData.length < 6) return [];
    
    // Group by quarter
    const quarters = {
      'Q1': [],
      'Q2': [],
      'Q3': [],
      'Q4': []
    };
    
    trendsData.forEach(month => {
      const [, monthNum] = month.name.split('-');
      const monthInt = parseInt(monthNum);
      
      if (monthInt <= 3) quarters.Q1.push(month.total);
      else if (monthInt <= 6) quarters.Q2.push(month.total);
      else if (monthInt <= 9) quarters.Q3.push(month.total);
      else quarters.Q4.push(month.total);
    });
    
    // Calculate average for each quarter
    const quarterAverages = Object.entries(quarters).map(([quarter, values]) => ({
      period: quarter,
      average: values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
    })).filter(q => q.average > 0);
    
    // Find peak and low quarters
    if (quarterAverages.length < 2) return [];
    
    const maxQuarter = _.maxBy(quarterAverages, 'average');
    const minQuarter = _.minBy(quarterAverages, 'average');
    
    return [
      {
        period: maxQuarter.period,
        type: 'peak',
        value: maxQuarter.average
      },
      {
        period: minQuarter.period,
        type: 'low',
        value: minQuarter.average
      }
    ];
  }, []);

  // Calculate trends and insights from monthly data
  const { trendsData, wfTrends, bankComparison, insights, marketMonthlyAvg } = useMemo(() => {
    if (!dataSource?.monthlyTrends) {
      return { 
        trendsData: [], 
        wfTrends: [], 
        bankComparison: [],
        insights: {
          overall: { trend: 'stable', value: 0 },
          wf: { trend: 'stable', value: 0 },
          seasonal: [],
          peakMonth: null,
          competitiveAdv: []
        },
        marketMonthlyAvg: 0
      };
    }

    console.log("MonthlyTrends - Calculando tendencias con", dataSource.monthlyTrends.length, "meses");

    // Sort monthly data chronologically
    const sortedMonthlyData = _.orderBy(dataSource.monthlyTrends, 
      [month => {
        const [year, monthNum] = month.month.split('-');
        return parseInt(year) * 100 + parseInt(monthNum);
      }], 
      ['asc']
    );

    // Ya no necesitamos filtrar por selectedMonths porque dataSource ya contiene los datos filtrados
    const filteredMonthlyData = sortedMonthlyData;

    // Prepare data for the charts
    const trendsData = filteredMonthlyData.map(month => {
      // Inicializa todos los bancos en 0
      const allBanks = {};
      if (dataSource?.banks) {
        dataSource.banks.forEach(bank => {
          allBanks[bank.name] = 0;
        });
      }
      // Sobrescribe con los valores reales de inversión
      month.bankShares.forEach(share => {
        allBanks[share.bank] = share.investment;
      });
      return {
        name: month.month,
        total: month.total,
        ...allBanks
      };
    });

    // Get Wells Fargo data for the same months as in filteredMonthlyData
    let wfTrends = [];
    
    if (wellsFargoData?.monthlyPerformance && wellsFargoData.monthlyPerformance.length > 0) {
      // Sort by date
      const sortedWfData = _.orderBy(wellsFargoData.monthlyPerformance, 
        [item => {
          const [year, monthNum] = item.month.split('-');
          return parseInt(year) * 100 + parseInt(monthNum);
        }],
        ['asc']
      );
      
      // Filtrar para que coincida con los meses en filteredMonthlyData
      const monthsToInclude = new Set(filteredMonthlyData.map(m => m.month));
      const filteredWfData = sortedWfData.filter(item => monthsToInclude.has(item.month));
      
      // Si no hay datos coincidentes, podemos generar datos manualmente desde filteredMonthlyData
      if (filteredWfData.length === 0 && filteredMonthlyData.length > 0) {
        console.log(`MonthlyTrends - No hay datos coincidentes de Wells Fargo, generando datos desde los filtrados`);
        
        // Generar datos de Wells Fargo basados en los datos mensuales filtrados
        const generatedWfData = filteredMonthlyData.map(month => {
          const wfShare = month.bankShares.find(share => share.bank === 'Wells Fargo');
          const investment = wfShare ? wfShare.investment : month.total * 0.15; // 15% si no hay datos
          const marketShare = wfShare ? wfShare.percentage : 15; // 15% si no hay datos
          
          return {
            month: month.month,
            investment,
            marketShare,
            monthOverMonthChange: 0
          };
        });
        
        // Ordenar cronológicamente
        const sortedGeneratedData = _.orderBy(generatedWfData, 
          [item => {
            const [year, monthNum] = item.month.split('-');
            return parseInt(year) * 100 + parseInt(monthNum);
          }],
          ['asc']
        );
        
        // Calcular cambios mes a mes
        for (let i = 1; i < sortedGeneratedData.length; i++) {
          const current = sortedGeneratedData[i];
          const previous = sortedGeneratedData[i-1];
          
          if (previous.investment > 0) {
            current.monthOverMonthChange = ((current.investment - previous.investment) / previous.investment) * 100;
          }
        }
        
        console.log(`MonthlyTrends - Generados ${sortedGeneratedData.length} meses de datos para Wells Fargo`);
        filteredWfData.push(...sortedGeneratedData);
      } else {
        console.log(`MonthlyTrends - Datos Wells Fargo: ${filteredWfData.length} meses coincidentes de ${sortedWfData.length} totales`);
        console.log(`MonthlyTrends - Primer mes con datos Wells Fargo: ${filteredWfData.length > 0 ? filteredWfData[0].month : 'ninguno'}`);
      }

      // Ahora procesamos los datos filtrados para añadir información de market average
      for (let i = 0; i < filteredWfData.length; i++) {
        const current = filteredWfData[i];
        let monthOverMonthChange = current.monthOverMonthChange;
        
        // Si no hay datos de cambio mes a mes y hay datos del mes anterior, calcularlo
        if (monthOverMonthChange === undefined && i > 0) {
          const previous = filteredWfData[i-1];
          monthOverMonthChange = previous.investment > 0
            ? ((current.investment - previous.investment) / previous.investment) * 100
            : 0;
        }
        
        // Buscar datos del promedio de mercado para este mes
        const marketAvg = marketAverageData.find(m => m.month === current.month);
        
        wfTrends.push({
          ...current,
          monthOverMonthChange: monthOverMonthChange || 0,
          // Añadir datos del promedio de mercado
          marketAvgInvestment: marketAvg?.avgInvestment || 0,
          marketAvgShare: marketAvg?.avgMarketShare || 0,
          marketAvgMoMChange: marketAvg?.avgMonthOverMonthChange || 0
        });
      }
    }
    
    // If no Wells Fargo data is available after filtering,
    // generate data from general data
    if (wfTrends.length === 0 && filteredMonthlyData.length > 0) {
      for (let i = 0; i < filteredMonthlyData.length; i++) {
        const month = filteredMonthlyData[i];
        const wfShare = month.bankShares.find(share => share.bank === 'Wells Fargo') || 
                       { bank: 'Wells Fargo', investment: month.total * 0.15 }; // 15% if no data
        
        let monthOverMonthChange = 0;
        if (i > 0 && wfShare) {
          const prevMonth = filteredMonthlyData[i-1];
          const prevWfShare = prevMonth.bankShares.find(share => share.bank === 'Wells Fargo') || 
                             { bank: 'Wells Fargo', investment: prevMonth.total * 0.15 };
          if (prevWfShare && prevWfShare.investment > 0) {
            monthOverMonthChange = ((wfShare.investment - prevWfShare.investment) / prevWfShare.investment) * 100;
          }
        }
        
        // Find market average for this month
        const marketAvg = marketAverageData.find(m => m.month === month.month);
        
        wfTrends.push({
          month: month.month,
          investment: wfShare.investment,
          marketShare: (wfShare.investment / month.total) * 100,
          monthOverMonthChange,
          // Add market average data
          marketAvgInvestment: marketAvg?.avgInvestment || 0,
          marketAvgShare: marketAvg?.avgMarketShare || 0,
          marketAvgMoMChange: marketAvg?.avgMonthOverMonthChange || 0
        });
      }
    }

    // Calculate Wells Fargo monthly average investment
    // Eliminar la línea que no se usa
    
    // Calcular el promedio mensual del mercado basado en los meses seleccionados
    // Usar el mismo filtro de meses que se aplica a trendsData
    const marketMonthlyAvg = trendsData.length > 0
      ? trendsData.reduce((sum, month) => sum + month.total, 0) / trendsData.length / dataSource.banks.length
      : 0;

    // Compare all banks over time for market share
    const bankComparison = filteredMonthlyData.map(month => {
      const total = month.total;
      const result = {
        name: month.month,
      };
      
      // Asegurar que todos los bancos en dataSource.banks estén incluidos en el resultado
      // para evitar espacios en blanco en el gráfico apilado
      if (dataSource?.banks) {
        // Primero inicializar todos los bancos con 0
        dataSource.banks.forEach(bank => {
          result[bank.name] = 0;
        });
      }
      
      // Ahora asignar los valores reales de participación de mercado
      month.bankShares.forEach(share => {
        // Calcular el porcentaje de participación correctamente
        if (total > 0) {
          result[share.bank] = (share.investment / total) * 100;
        } else {
          result[share.bank] = 0;
        }
      });
      
      // Verificar que todos los porcentajes sumen 100%
      let totalPercentage = 0;
      Object.entries(result).forEach(([key, value]) => {
        if (key !== 'name') {
          totalPercentage += value;
        }
      });
      
      // Si no suman 100%, normalizar para evitar espacios en blanco
      if (Math.abs(totalPercentage - 100) > 0.1 && totalPercentage > 0) {
        Object.keys(result).forEach(key => {
          if (key !== 'name') {
            result[key] = (result[key] / totalPercentage) * 100;
          }
        });
      }
      
      return result;
    });

    // Calculate insights
    const insights = {
      overall: calculateTrend(trendsData.map(d => d.total)),
      wf: calculateTrend(wfTrends.map(d => d.investment)),
      seasonal: findSeasonalPatterns(trendsData),
      peakMonth: trendsData.reduce((max, month) => 
        month.total > (max?.total || 0) ? month : max, null),
      competitiveAdv: findCompetitiveAdvantages(bankComparison)
    };

    return { trendsData, wfTrends, bankComparison, insights, marketMonthlyAvg };
  }, [dataSource, wellsFargoData, marketAverageData, findCompetitiveAdvantages, calculateTrend, findSeasonalPatterns]);

  // Bank selector component for multi-select dropdown
  const BankSelector = () => {
    const availableBanks = useMemo(() => {
      if (!dataSource?.banks) return [];
      
      // Solo incluir bancos que aparecen en los datos filtrados
      const banksInData = new Set();
      trendsData.forEach(month => {
        Object.keys(month).forEach(key => {
          if (key !== 'name' && key !== 'total') {
            banksInData.add(key);
          }
        });
      });
      
      return ['All', ...Array.from(banksInData)];
    }, []);
    
    const toggleBank = (bankName) => {
      if (selectedBanks.includes(bankName)) {
        setSelectedBanks(selectedBanks.filter(b => b !== bankName));
      } else {
        setSelectedBanks([...selectedBanks, bankName]);
      }
    };
    
    const selectAllBanks = () => {
      setSelectedBanks(availableBanks.filter(b => b !== 'All'));
    };
    
    const clearSelection = () => {
      setSelectedBanks([]);
    };

  return (
      <div className="absolute right-0 mt-1 w-64 bg-white rounded-md shadow-lg z-10 border border-gray-200">
        <div className="p-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Select banks</span>
            <div className="space-x-2">
              <button 
                onClick={selectAllBanks}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                All
              </button>
              <span className="text-gray-400">|</span>
              <button 
                onClick={clearSelection}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                None
              </button>
            </div>
          </div>
        </div>
        <div className="max-h-60 overflow-y-auto p-2">
          {availableBanks.filter(bank => bank !== 'All').map(bank => (
            <div key={bank} className="flex items-center px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
              <input 
                type="checkbox" 
                id={`bank-${bank}`}
                checked={selectedBanks.includes(bank)}
                onChange={() => toggleBank(bank)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label 
                htmlFor={`bank-${bank}`}
                className="ml-2 text-sm text-gray-700 cursor-pointer flex-grow flex items-center"
              >
                <span 
                  className="w-3 h-3 rounded-full inline-block mr-2" 
                  style={{ backgroundColor: chartColors[bank] }}
                ></span>
                {bank}
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-64 bg-gray-100 rounded-lg"></div>
      </div>
    );
  }

  // Custom tooltip format
  const renderTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Filtrar solo los elementos que no sean "total" y bancos con inversión > 0
      const validPayload = payload.filter(p => p.dataKey !== 'total' && p.value > 0);
      
      // Ordenar de mayor a menor según valor de inversión
      const sortedPayload = [...validPayload].sort((a, b) => b.value - a.value);
      
      // Calcular el total manualmente de los bancos mostrados
      const totalValue = validPayload.reduce((sum, p) => sum + p.value, 0);
      
      return (
        <div className="custom-tooltip bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{formatMonthLabel(label)}</p>
          {sortedPayload.map((p, index) => (
            <p key={index} className="text-sm flex justify-between items-center" style={{color: p.color}}>
              <span className="mr-4">{p.name}</span>
              <span>{formatCurrency(p.value)}</span>
            </p>
          ))}
          {/* Agregar una línea para el total sin necesidad de gráfico */}
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-sm flex justify-between items-center font-semibold">
              <span className="mr-4">Total</span>
              <span>{formatCurrency(totalValue)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Render percentage tooltip
  const renderPercentageTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Ordenar los bancos de mayor a menor porcentaje
      const sortedPayload = [...payload].sort((a, b) => b.value - a.value);
      
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{formatMonthLabel(label)}</p>
          {sortedPayload.map((p, i) => (
            <p key={i} className="text-sm flex justify-between items-center" style={{ color: chartColors[p.dataKey] || p.color }}>
              <span className="mr-4">{p.dataKey}</span>
              <span className="font-medium">{formatPercentage(p.value)}</span>
            </p>
          ))}
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-sm flex justify-between items-center font-semibold">
              <span className="mr-4">Total</span>
              <span>100%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Monthly Investment Trends</h2>
          <p className="text-sm text-gray-600 mt-1">
            Analysis of media investment patterns over time
          </p>
        </div>
        
        {/* Trend summary badges */}
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1 rounded-full text-sm ${
            insights.overall.trend === 'increasing' ? 'bg-green-100 text-green-800' :
            insights.overall.trend === 'decreasing' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            <div className="group relative">
              Market: {
                insights.overall.trend === 'increasing' 
                  ? `Growing ${Math.abs(Math.round(insights.overall.value))}%` 
                  : insights.overall.trend === 'decreasing'
                  ? `Declining ${Math.abs(Math.round(insights.overall.value))}%`
                  : 'Stable'
              }
              <div className="absolute left-0 -bottom-1 transform translate-y-full invisible group-hover:visible bg-gray-800 text-white text-xs rounded p-2 w-52 z-10 shadow-lg">
                <p>Calculated using linear regression analysis of monthly investment values over the selected period. Measures the percentage change from the first month to the last month based on the trend line slope.</p>
              </div>
            </div>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-sm ${
            insights.wf.trend === 'increasing' ? 'bg-green-100 text-green-800' :
            insights.wf.trend === 'decreasing' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`} style={{ borderLeft: `3px solid ${chartColors['Wells Fargo']}` }}>
            <div className="group relative">
              Wells Fargo: {
                insights.wf.trend === 'increasing' 
                  ? `Growing ${Math.abs(Math.round(insights.wf.value))}%` 
                  : insights.wf.trend === 'decreasing'
                  ? `Declining ${Math.abs(Math.round(insights.wf.value))}%`
                  : 'Stable'
              }
              <div className="absolute left-0 -bottom-1 transform translate-y-full invisible group-hover:visible bg-gray-800 text-white text-xs rounded p-2 w-52 z-10 shadow-lg">
                <p>Based on the percentage change in Wells Fargo's monthly investment from the beginning to the end of the selected period. A trend is considered stable if the change is less than 5%.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Total Monthly Investment Chart */}
        <div className="border border-gray-100 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700">
              Market Investment by Month
            </h3>
            <div className="relative">
              <button
                onClick={() => setShowBankSelector(!showBankSelector)}
                className="flex items-center space-x-1 rounded border border-gray-300 py-1 px-3 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <span>Filter banks</span>
                <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2">
                  {selectedBanks.length || '0'}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showBankSelector && <BankSelector />}
              
              {selectedBanks.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedBanks.map(bank => (
                    <div 
                      key={bank} 
                      className="inline-flex items-center bg-gray-100 text-xs rounded px-2 py-1"
                      style={{ borderLeft: `3px solid ${chartColors[bank]}` }}
                    >
                      {bank}
                      <button 
                        onClick={() => setSelectedBanks(selectedBanks.filter(b => b !== bank))}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
        </div>
      </div>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
                data={trendsData}
                margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  tick={{ fontSize: 12 }}
                  height={60}
                  tickFormatter={formatMonthLabel}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)} 
                  tick={{ fontSize: 12 }}
                  domain={[0, 'auto']}
                  allowDataOverflow={false}
                />
                <Tooltip content={renderTooltip} />
                {/* Render lines for each bank */}
                {dataSource?.banks && dataSource.banks.map((bank) => {
                  // Si hay bancos seleccionados, solo mostrar esos bancos
                  if (selectedBanks.length > 0 && !selectedBanks.includes(bank.name)) {
                    return null;
                  }
                  return (
                    <Area 
                      key={bank.name}
                      type="monotone" 
                      dataKey={bank.name} 
                      stroke={chartColors[bank.name]}
                      fill={chartColors[bank.name]}
                      fillOpacity={0.2}
                      strokeWidth={2}
                      activeDot={{ r: 5, stroke: 'white', strokeWidth: 1 }}
                    />
                  );
                })}
              <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors['Capital One']} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartColors['Capital One']} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Wells Fargo Monthly Performance */}
        <div className="border border-gray-100 rounded-lg p-4" style={{ borderLeft: `4px solid ${chartColors['Wells Fargo']}` }}>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Wells Fargo Performance Trends
          </h3>
          <div className="h-96">
            {isLoadingWfData ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-500"></div>
              </div>
            ) : wfTrends.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available for the selected period
              </div>
            ) : (
              <div className="rounded-lg bg-white p-4 shadow-sm h-[600px]">
                <ResponsiveContainer width="100%" height={450}>
                  <ComposedChart data={wfTrends} margin={{ top: 20, right: 150, left: 0, bottom: 30 }}>
                    <defs>
                      <linearGradient id="wellsFargoFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d82f31" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#d82f31" stopOpacity={0.05}/>
                      </linearGradient>
                      <filter id="shadow" height="200%">
                        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.1"/>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="month" 
                      tickLine={false}
                      axisLine={{ stroke: '#e0e0e0' }}
                      tick={{ fill: '#666', fontSize: 12 }}
                      tickFormatter={formatMonthLabel}
                      angle={-45} 
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tickFormatter={formatYAxis} 
                      tick={{ fill: '#666', fontSize: 12 }}
                      axisLine={{ stroke: '#e0e0e0' }}
                      tickLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const wellsFargoData = payload.find(p => p.name === "Wells Fargo Investment");
                          const marketAvgData = payload.find(p => p.name === "Monthly Avg Market");
                          
                          return (
                            <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
                              <p className="font-medium text-gray-800 mb-2">{formatMonthLabel(label)}</p>
                              {wellsFargoData && (
                                <p className="text-sm mb-1">
                                  <span className="font-medium text-red-600">Wells Fargo Investment:</span>{" "}
                                  <span className="text-gray-700">${(wellsFargoData.value/1000000).toFixed(2)}M</span>
                                </p>
                              )}
                              {marketAvgData && (
                                <p className="text-sm mb-1">
                                  <span className="font-medium text-gray-600">Monthly Avg Market:</span>{" "}
                                  <span className="text-gray-700">${(marketAvgData.value/1000000).toFixed(2)}M</span>
                                </p>
                              )}
                              <p className="text-sm border-t pt-1 mt-1 border-gray-100">
                                <span className="font-medium text-yellow-600">Monthly Avg Market:</span>{" "}
                                <span className="text-gray-700">${(marketMonthlyAvg/1000000).toFixed(2)}M</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{ paddingTop: '10px' }}
                      payload={[
                        { value: 'Wells Fargo Investment', type: 'line', color: '#d82f31' },
                        { value: 'Monthly Avg Market', type: 'line', color: '#666' }
                      ]}
                    />
                    <ReferenceLine
                      y={marketMonthlyAvg}
                      stroke="#ffc107"
                      strokeDasharray="3 3"
                      label={{ 
                        value: `Monthly Avg\nMarket`,
                        fill: '#ffc107',
                        fontSize: 12,
                        fontWeight: 'bold',
                        position: 'right',
                        offset: 30
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="investment" 
                      name="Wells Fargo Investment" 
                      stroke="#d82f31" 
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={true}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="marketAvgInvestment" 
                      name="Monthly Avg Market" 
                      stroke="#666" 
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={true}
                      activeDot={{ r: 6 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Bank Market Share Comparison */}
      <div className="mt-8 border border-gray-100 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          Bank Market Share Trends
        </h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={bankComparison}
              margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
              stackOffset="expand"
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                tick={{ fontSize: 12 }}
                height={60}
                tickFormatter={formatMonthLabel}
              />
              <YAxis 
                tickFormatter={(tick) => `${Math.round(tick * 100)}%`} 
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                content={renderPercentageTooltip}
                contentStyle={{
                  backgroundColor: 'white',
                  borderRadius: '0.375rem',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{
                  paddingTop: '10px'
                }}
              />
              {dataSource?.banks && 
                // Ordenar los bancos por total de inversión para que los más importantes estén más visibles
                [...dataSource.banks]
                  .sort((a, b) => b.totalInvestment - a.totalInvestment)
                  .map((bank) => (
                    <Area 
                      key={bank.name}
                      type="monotone" 
                      dataKey={bank.name} 
                      stackId="1"
                      stroke={chartColors[bank.name]}
                      fill={chartColors[bank.name]}
                    />
                  ))
              }
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Insights Panel - Improved and factual */}
      <div className="mt-10 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm border border-blue-100">
        <h3 className="font-semibold text-blue-800 text-lg mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Monthly Trend Insights
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Market Insights */}
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
            <h4 className="font-medium text-gray-800 mb-3 pb-2 border-b border-gray-100 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Market Investment Insights
            </h4>
            <ul className="space-y-4 text-sm text-gray-700">
              {trendsData.length > 0 && (
                <li className="flex items-start group relative transition-all duration-150 hover:bg-blue-50 p-2 rounded-md">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                    <strong>Total Investment:</strong> {formatCurrency(trendsData.reduce((sum, m) => sum + m.total, 0))} 
                    {trendsData.length > 1 ? ` across ${trendsData.length} months` : ''}
                    </p>
                  </div>
                  <div className="hidden group-hover:block absolute left-8 top-full mt-1 z-10 bg-gray-800 text-white p-3 rounded text-xs w-64 shadow-lg">
                    Sum of all media investments across all banks for the selected period.
                  </div>
                </li>
              )}
              
              {trendsData.length > 0 && (
                <li className="flex items-start group relative transition-all duration-150 hover:bg-blue-50 p-2 rounded-md">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                    <strong>Monthly Average:</strong> {formatCurrency(trendsData.reduce((sum, m) => sum + m.total, 0) / Math.max(trendsData.length, 1))} 
                    </p>
                  </div>
                  <div className="hidden group-hover:block absolute left-8 top-full mt-1 z-10 bg-gray-800 text-white p-3 rounded text-xs w-64 shadow-lg">
                    Total market investment divided by {trendsData.length} months, representing average monthly spend across all banks combined.
                  </div>
                </li>
              )}
              
              {insights.peakMonth && (
                <li className="flex items-start group relative transition-all duration-150 hover:bg-blue-50 p-2 rounded-md">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                    <strong>Peak Month:</strong> {formatMonthLabel(insights.peakMonth.name)} <span className="ml-1">with</span> {formatCurrency(insights.peakMonth.total)} 
                      <span className="ml-1 text-xs px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-full">
                        {formatPercentage(insights.peakMonth.total / trendsData.reduce((sum, m) => sum + m.total, 0) * 100)} of total
                  </span>
                    </p>
                  </div>
                  <div className="hidden group-hover:block absolute left-8 top-full mt-1 z-10 bg-gray-800 text-white p-3 rounded text-xs w-64 shadow-lg">
                    Month with highest total investment in the selected period. Represents {formatPercentage(insights.peakMonth.total / trendsData.reduce((sum, m) => sum + m.total, 0) * 100)} of total period spending.
                  </div>
                </li>
              )}

              {trendsData.length > 1 && (
                <li className="flex items-start group relative transition-all duration-150 hover:bg-blue-50 p-2 rounded-md">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      <strong>Period Change:</strong> 
                      <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                      Math.abs(insights.overall.value) < 5 
                          ? 'bg-blue-50 text-blue-700' 
                        : insights.overall.value > 0
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                      }`}>
                        {Math.abs(insights.overall.value) < 5 
                          ? 'Investment levels consistent across period' 
                          : insights.overall.value > 0
                            ? `Increased by ${Math.abs(Math.round(insights.overall.value))}%`
                            : `Decreased by ${Math.abs(Math.round(insights.overall.value))}%`
                    }
                  </span>
                    </p>
                  </div>
                  <div className="hidden group-hover:block absolute left-8 top-full mt-1 z-10 bg-gray-800 text-white p-3 rounded text-xs w-64 shadow-lg">
                    Comparison between first month ({formatMonthLabel(trendsData[0].name)}: {formatCurrency(trendsData[0].total)}) and last month ({formatMonthLabel(trendsData[trendsData.length-1].name)}: {formatCurrency(trendsData[trendsData.length-1].total)}) in selected period.
                  </div>
                </li>
              )}
            </ul>
          </div>
          
          {/* Bank Insights */}
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
            <h4 className="font-medium text-gray-800 mb-3 pb-2 border-b border-gray-100 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
              Bank Performance Insights
            </h4>
            <ul className="space-y-4 text-sm text-gray-700">
              {trendsData.length > 0 && (
                <li className="flex items-start group relative transition-all duration-150 hover:bg-blue-50 p-2 rounded-md">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3"
                       style={{ backgroundColor: `${chartColors[Object.entries(chartColors)[0][0]]}20` }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" style={{ color: chartColors[Object.entries(chartColors)[0][0]] }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                    <strong>Leading Bank:</strong> {(() => {
                      const bankTotals = {};
                      trendsData.forEach(month => {
                        Object.entries(month).forEach(([key, value]) => {
                          if (key !== 'name' && key !== 'total') {
                            bankTotals[key] = (bankTotals[key] || 0) + value;
                          }
                        });
                      });
                      
                      const sortedBanks = Object.entries(bankTotals)
                        .sort((a, b) => b[1] - a[1]);
                      
                      if (sortedBanks.length > 0) {
                        const [leadingBank, leadingAmount] = sortedBanks[0];
                        const totalInvestment = trendsData.reduce((sum, m) => sum + m.total, 0);
                        const marketShare = (leadingAmount / totalInvestment) * 100;
                        
                          return (
                            <>
                              <span className="font-medium">{leadingBank}</span> with {formatCurrency(leadingAmount)}
                              <span className="ml-1 text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                                {formatPercentage(marketShare)} market share
                              </span>
                            </>
                          );
                      }
                      
                      return 'No data available';
                    })()}
                    </p>
                  </div>
                  <div className="hidden group-hover:block absolute left-8 top-full mt-1 z-10 bg-gray-800 text-white p-3 rounded text-xs w-64 shadow-lg">
                    Bank with highest total media investment in the selected period. Market share calculated as percentage of total industry investment.
                  </div>
                </li>
              )}
              
              {wfTrends.length > 0 && (
                <li className="flex items-start group relative transition-all duration-150 hover:bg-blue-50 p-2 rounded-md">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3"
                       style={{ backgroundColor: `${chartColors['Wells Fargo']}20` }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" style={{ color: chartColors['Wells Fargo'] }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                    <strong>Wells Fargo:</strong> {formatCurrency(wfTrends.reduce((sum, m) => sum + m.investment, 0))}
                      {trendsData.length > 0 && (
                        <span className="ml-1 text-xs px-2 py-0.5 bg-red-50 text-red-700 rounded-full">
                          {formatPercentage(wfTrends.reduce((sum, m) => sum + m.investment, 0) / trendsData.reduce((sum, m) => sum + m.total, 0) * 100)} market share
                  </span>
                      )}
                    </p>
                  </div>
                  <div className="hidden group-hover:block absolute left-8 top-full mt-1 z-10 bg-gray-800 text-white p-3 rounded text-xs w-64 shadow-lg">
                    Total Wells Fargo investment across selected period. Market share calculated as percentage of total industry investment.
                  </div>
                </li>
              )}
              
              {wfTrends.length > 1 && (
                <li className="flex items-start group relative transition-all duration-150 hover:bg-blue-50 p-2 rounded-md">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3"
                       style={{ backgroundColor: `${chartColors['Wells Fargo']}20` }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" style={{ color: chartColors['Wells Fargo'] }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      <strong>Wells Fargo Change:</strong>
                      <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${(() => {
                        if (wfTrends.length < 2) return 'bg-gray-100 text-gray-600';
                        
                        const firstMonth = wfTrends[0];
                        const lastMonth = wfTrends[wfTrends.length - 1];
                        if (firstMonth.investment <= 0) return 'bg-gray-100 text-gray-600';
                        
                        const percentChange = ((lastMonth.investment - firstMonth.investment) / firstMonth.investment) * 100;
                        
                        if (Math.abs(percentChange) < 5) return 'bg-blue-50 text-blue-700';
                        return percentChange > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700';
                      })()}`}>
                        {(() => {
                      if (wfTrends.length < 2) return 'Insufficient data';
                      
                      const firstMonth = wfTrends[0];
                      const lastMonth = wfTrends[wfTrends.length - 1];
                          if (firstMonth.investment <= 0) return 'Insufficient data for calculation';
                          
                        const percentChange = ((lastMonth.investment - firstMonth.investment) / firstMonth.investment) * 100;
                          
                          if (Math.abs(percentChange) < 5) return 'Investment levels consistent';
                          return percentChange > 0 
                            ? `Increased by ${Math.abs(Math.round(percentChange))}%`
                            : `Decreased by ${Math.abs(Math.round(percentChange))}%`;
                    })()}
                    </span>
                    </p>
                  </div>
                  <div className="hidden group-hover:block absolute left-8 top-full mt-1 z-10 bg-gray-800 text-white p-3 rounded text-xs w-64 shadow-lg">
                    Comparison between first month ({formatMonthLabel(wfTrends[0].month)}: {formatCurrency(wfTrends[0].investment)}) and last month ({formatMonthLabel(wfTrends[wfTrends.length - 1].month)}: {formatCurrency(wfTrends[wfTrends.length - 1].investment)}) in selected period.
                  </div>
                </li>
              )}
              
              {wfTrends.length > 0 && (
                <li className="flex items-start group relative transition-all duration-150 hover:bg-blue-50 p-2 rounded-md">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                    <strong>Wells Fargo Monthly Avg:</strong> {formatCurrency(wfTrends.reduce((sum, m) => sum + m.investment, 0) / Math.max(wfTrends.length, 1))}
                    </p>
                  </div>
                  <div className="hidden group-hover:block absolute left-8 top-full mt-1 z-10 bg-gray-800 text-white p-3 rounded text-xs w-64 shadow-lg">
                    Average monthly investment by Wells Fargo. Industry per-bank average: {formatCurrency(trendsData.reduce((sum, m) => sum + m.total, 0) / Math.max(trendsData.length, 1) / dataSource.banks.length)}, calculated as total market investment divided by number of months, then divided by number of banks.
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyTrends;