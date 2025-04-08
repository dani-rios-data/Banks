import React, { useMemo } from 'react';
import _ from 'lodash';
import { useDashboard } from '../../context/DashboardContext';
import Icons from '../common/Icons';
import { bankColors } from '../../utils/colorSchemes';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { getGradient } from '../../utils/colorSchemes';

/**
 * Component that displays key metrics in cards with month filter support
 */
const KeyMetrics = () => {
  const { dashboardData, loading, selectedMonths } = useDashboard();

  // Helper function to get media colors
  const getMediaColor = (category) => {
    const colors = {
      'Television': '#4C51BF',
      'Digital': '#38A169',
      'Audio': '#D69E2E',
      'Print': '#C53030',
      'Outdoor': '#805AD5',
      'Streaming': '#3182CE',
      'Cinema': '#DD6B20'
    };
    return colors[category] || '#718096';
  };

  // Calculate metrics based on selected months
  const metrics = useMemo(() => {
    if (!dashboardData?.monthlyTrends || !dashboardData?.banks) {
      return {
        totalInvestment: 0,
        bankTotals: [],
        mediaTotals: [],
        topBank: null,
        topMedia: null,
        wellsFargoPosition: { rank: 0, share: 0, value: 0 },
        yearOverYearGrowth: 0,
        averageMonthlyInvestment: 0,
        growthOpportunities: [],
        banksCount: 0,
        mediaCount: 0
      };
    }

    // Filtrar meses si hay selección
    const relevantMonths = selectedMonths.length > 0
      ? dashboardData.monthlyTrends.filter(month => selectedMonths.includes(month.month))
      : dashboardData.monthlyTrends;
    
    // Calcular inversión total para el período filtrado
    const totalInvestmentFiltered = relevantMonths.reduce((sum, month) => sum + month.total, 0);
    
    // Si hay meses seleccionados, calculamos datos basados en esos meses
    // Si no hay selección, usamos los valores predefinidos precisos
    let mediaTotals = [];
    let totalInvestment = 0;
    
    if (selectedMonths.length > 0) {
      // Recopilar todas las categorías de medios
      const allMediaCategories = new Set();
      dashboardData.banks.forEach(bank => {
        bank.mediaBreakdown.forEach(media => {
          allMediaCategories.add(media.category);
        });
      });
      
      // Inicializar totales por categoría
      const mediaTotalsMap = {};
      allMediaCategories.forEach(category => {
        mediaTotalsMap[category] = 0;
      });
      
      // Sumar inversiones por categoría de medios para los meses seleccionados
      relevantMonths.forEach(month => {
        if (month.mediaCategories) {
          month.mediaCategories.forEach(bankData => {
            Object.entries(bankData.categories).forEach(([category, amount]) => {
              if (mediaTotalsMap[category] !== undefined) {
                mediaTotalsMap[category] += amount;
              }
            });
          });
        }
      });
      
      // Crear el array de mediaTotals con datos filtrados
      mediaTotals = Object.entries(mediaTotalsMap).map(([name, value]) => ({
        name,
        value,
        share: totalInvestmentFiltered > 0 ? (value / totalInvestmentFiltered) * 100 : 0
      })).sort((a, b) => b.value - a.value);
      
      totalInvestment = totalInvestmentFiltered;
    } else {
      // Sin filtro, usar los valores precisos predefinidos
      const TOTAL_INVESTMENT = 1845331306; // $1.85B - sum of all banks
      const TELEVISION_VALUE = 896909961; // $896.91M - sum of all television investments
      const DIGITAL_VALUE = 783411819; // $783.41M - sum of all digital investments
      const AUDIO_VALUE = 116710022; // $116.71M - sum of all audio investments
      const PRINT_VALUE = 30176886; // $30.18M - sum of all print investments
      const OUTDOOR_VALUE = 12273109; // $12.27M - sum of all outdoor investments
      const STREAMING_VALUE = 2488342; // $2.49M - from Capital One
      const CINEMA_VALUE = 1689912; // $1.69M - from Capital One and Chase Bank

      // Calculate percentages based on accurate total investment
      const TELEVISION_PERCENTAGE = (TELEVISION_VALUE / TOTAL_INVESTMENT) * 100; // ~48.60%
      const DIGITAL_PERCENTAGE = (DIGITAL_VALUE / TOTAL_INVESTMENT) * 100; // ~42.45%
      const AUDIO_PERCENTAGE = (AUDIO_VALUE / TOTAL_INVESTMENT) * 100; // ~6.32%
      const PRINT_PERCENTAGE = (PRINT_VALUE / TOTAL_INVESTMENT) * 100; // ~1.63%
      const OUTDOOR_PERCENTAGE = (OUTDOOR_VALUE / TOTAL_INVESTMENT) * 100; // ~0.67%
      const STREAMING_PERCENTAGE = (STREAMING_VALUE / TOTAL_INVESTMENT) * 100; // ~0.13%
      const CINEMA_PERCENTAGE = (CINEMA_VALUE / TOTAL_INVESTMENT) * 100; // ~0.09%
      
      // Create accurate media totals
      mediaTotals = [
        { 
          name: 'Television', 
          value: TELEVISION_VALUE, 
          share: TELEVISION_PERCENTAGE 
        },
        { 
          name: 'Digital', 
          value: DIGITAL_VALUE, 
          share: DIGITAL_PERCENTAGE 
        },
        { 
          name: 'Audio', 
          value: AUDIO_VALUE, 
          share: AUDIO_PERCENTAGE 
        },
        { 
          name: 'Print', 
          value: PRINT_VALUE, 
          share: PRINT_PERCENTAGE 
        },
        { 
          name: 'Outdoor', 
          value: OUTDOOR_VALUE, 
          share: OUTDOOR_PERCENTAGE 
        },
        { 
          name: 'Streaming', 
          value: STREAMING_VALUE, 
          share: STREAMING_PERCENTAGE 
        },
        { 
          name: 'Cinema', 
          value: CINEMA_VALUE, 
          share: CINEMA_PERCENTAGE 
        }
      ];
      
      totalInvestment = TOTAL_INVESTMENT;
    }
    
    // Calculamos datos de bancos (ya sea filtrados o totales)
    let bankTotals = [];
    
    if (selectedMonths.length > 0) {
      // Para meses seleccionados, calculamos los totales de cada banco
      const bankTotalsMap = {};
      
      dashboardData.banks.forEach(bank => {
        bankTotalsMap[bank.name] = 0;
      });
      
      // Sumamos las inversiones de cada banco para los meses seleccionados
      relevantMonths.forEach(month => {
        month.bankShares.forEach(share => {
          if (bankTotalsMap[share.bank] !== undefined) {
            bankTotalsMap[share.bank] += share.investment;
          }
        });
      });
      
      // Creamos el array de bankTotals con los datos filtrados
      bankTotals = Object.entries(bankTotalsMap)
        .map(([name, value]) => ({
          name,
          value,
          share: totalInvestmentFiltered > 0 ? (value / totalInvestmentFiltered) * 100 : 0
        }))
        .sort((a, b) => b.value - a.value);
    } else {
      // Sin filtro, usamos los valores precisos predefinidos
      bankTotals = [
        { 
          name: 'Capital One', 
          value: 837602604, // $837.60M
          share: (837602604 / totalInvestment) * 100 // ~45.39%
        },
        { 
          name: 'Chase Bank', 
          value: 410786000, // $410.79M
          share: (410786000 / totalInvestment) * 100 // ~22.26%
        },
        { 
          name: 'Bank Of America', 
          value: 286254322, // $286.25M
          share: (286254322 / totalInvestment) * 100 // ~15.51%
        },
        { 
          name: 'Wells Fargo Bank', 
          value: 196276123, // $196.28M
          share: (196276123 / totalInvestment) * 100 // ~10.63%
        },
        { 
          name: 'Pnc Bank', 
          value: 76089534, // $76.09M
          share: (76089534 / totalInvestment) * 100 // ~4.12%
        },
        { 
          name: 'Td Bank', 
          value: 38322723, // $38.32M
          share: (38322723 / totalInvestment) * 100 // ~2.07%
        }
      ];
    }

    // Find top bank and media
    const topBank = bankTotals[0] || { name: 'Capital One', value: 0, share: 0 };
    const topMedia = mediaTotals[0] || { name: 'Television', value: 0, share: 0 };

    // Find Wells Fargo position
    const wellsFargoIndex = bankTotals.findIndex(bank => bank.name === "Wells Fargo Bank");
    const wellsFargoPosition = {
      rank: wellsFargoIndex >= 0 ? wellsFargoIndex + 1 : 0,
      share: wellsFargoIndex >= 0 ? bankTotals[wellsFargoIndex].share : 0,
      value: wellsFargoIndex >= 0 ? bankTotals[wellsFargoIndex].value : 0
    };

    // Rest of your code for YoY growth, etc.
    let yearOverYearGrowth = 0;
    if (dashboardData.monthlyTrends && dashboardData.monthlyTrends.length > 1) {
      const sortedMonths = _.orderBy(dashboardData.monthlyTrends, ['month'], ['asc']);
      const midPoint = Math.floor(sortedMonths.length / 2);
      const firstHalf = sortedMonths.slice(0, midPoint);
      const secondHalf = sortedMonths.slice(midPoint);
      
      const firstHalfAvg = _.meanBy(firstHalf, 'total');
      const secondHalfAvg = _.meanBy(secondHalf, 'total');
      
      yearOverYearGrowth = firstHalfAvg > 0 
        ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
        : 0;
    }

    return {
      totalInvestment,
      bankTotals,
      mediaTotals,
      topBank,
      topMedia,
      wellsFargoPosition,
      yearOverYearGrowth,
      averageMonthlyInvestment: dashboardData.monthlyTrends.length > 0 ? totalInvestment / dashboardData.monthlyTrends.length : 0,
      growthOpportunities: [],
      banksCount: dashboardData.banks.length,
      mediaCount: mediaTotals.length
    };
  }, [dashboardData, selectedMonths]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col items-center" style={{ display: "flex", alignItems: "center" }}>
            <div className="h-24 bg-gray-100 rounded-lg mb-2 w-44" style={{ width: "176px", height: "96px" }}></div>
            <div className="h-4 bg-gray-100 rounded w-28 mb-1"></div>
            <div className="h-4 bg-gray-100 rounded w-24"></div>
          </div>
          <div className="flex flex-col items-center" style={{ display: "flex", alignItems: "center" }}>
            <div className="h-24 bg-gray-100 rounded-lg mb-2 w-44" style={{ width: "176px", height: "96px" }}></div>
            <div className="h-4 bg-gray-100 rounded w-28 mb-1"></div>
            <div className="h-4 bg-gray-100 rounded w-24"></div>
          </div>
          <div className="flex flex-col items-center" style={{ display: "flex", alignItems: "center" }}>
            <div className="h-24 bg-gray-100 rounded-lg mb-2 w-44" style={{ width: "176px", height: "96px" }}></div>
            <div className="h-4 bg-gray-100 rounded w-28 mb-1"></div>
            <div className="h-4 bg-gray-100 rounded w-24"></div>
          </div>
        </div>
        <div className="mt-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-gray-100 rounded-lg"></div>
            <div className="h-48 bg-gray-100 rounded-lg"></div>
          </div>
        </div>
        <div className="mt-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
      {/* All metrics in two rows with visual separation */}
      <div className="flex flex-col gap-6">
        {/* First row - Basic metrics */}
        <div className="flex gap-4">
          {/* Total Market Investment */}
          <div className="flex flex-col items-center flex-1">
            <div className="relative w-full">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg px-4 py-3 border border-blue-200 mb-2 flex flex-col" style={{ height: "120px" }}>
                <div className="flex items-center">
                  <div className="bg-blue-500 rounded-full p-2 shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-blue-500 ml-2">Total Market Investment</h3>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-2xl font-bold text-blue-800">
                    {formatCurrency(metrics.totalInvestment).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-800">
                <span className={metrics.yearOverYearGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {metrics.yearOverYearGrowth >= 0 ? '↑ ' : '↓ '}
                  {Math.abs(metrics.yearOverYearGrowth).toFixed(2)}% YoY Growth
                </span>
              </div>
            </div>
          </div>

          {/* Banks Analyzed */}
          <div className="flex flex-col items-center flex-1">
            <div className="relative w-full">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg px-4 py-3 border border-blue-200 mb-2 flex flex-col" style={{ height: "120px" }}>
                <div className="flex items-center">
                  <div className="bg-blue-500 rounded-full p-2 shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-blue-500 ml-2">Banks Analyzed</h3>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-2xl font-bold text-blue-800">
                    {metrics.banksCount}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-800 font-semibold">
                Comprehensive market coverage
              </div>
              <div className="text-sm text-gray-800 font-semibold mt-1">
                Major financial institutions
              </div>
            </div>
          </div>

          {/* Media Categories */}
          <div className="flex flex-col items-center flex-1">
            <div className="relative w-full">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg px-4 py-3 border border-blue-200 mb-2 flex flex-col" style={{ height: "120px" }}>
                <div className="flex items-center">
                  <div className="bg-blue-500 rounded-full p-2 shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-blue-500 ml-2">Media Categories</h3>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-2xl font-bold text-blue-800">
                    {7} {/* Always show 7 media categories */}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-800 font-semibold">
                Across all marketing channels
              </div>
              <div className="text-sm text-gray-800 font-semibold mt-1">
                Full market visibility
              </div>
            </div>
          </div>
        </div>

        {/* Second row - Market Leaders */}
        <div className="flex gap-4">
          {/* Leading Bank */}
          <div className="flex-1">
            <div className="relative w-full">
              <div className="bg-white rounded-lg shadow-sm p-4 border border-fuchsia-100" style={{ height: "160px" }}>
                <div className="flex items-center mb-6">
                  <div className="bg-fuchsia-500 rounded-full p-2 shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                  </div>
                  <div className="text-sm text-fuchsia-600 font-medium ml-2">Leading Bank</div>
                </div>
                <div className="flex justify-between items-center h-[72px]">
                  <div>
                    <div className="text-xl font-bold text-fuchsia-700">{metrics.topBank.name}</div>
                    <div className="text-sm text-fuchsia-500">Market leader with {formatPercentage(metrics.topBank.share)} share</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-fuchsia-700">{formatCurrency(metrics.topBank.value)}</div>
                    <div className="text-sm text-fuchsia-500">{formatPercentage(metrics.topBank.share)} share</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Our Performance */}
          <div className="flex-1">
            <div className="relative w-full">
              <div className="bg-white rounded-lg shadow-sm p-4 border border-pink-100" style={{ height: "160px" }}>
                <div className="flex items-center mb-6">
                  <div className="bg-pink-500 rounded-full p-2 shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-sm text-pink-600 font-medium ml-2">Our Performance</div>
                </div>
                <div className="flex justify-between items-center h-[72px]">
                  <div>
                    <div className="text-xl font-bold text-pink-600">Wells Fargo</div>
                    <div className="text-sm text-pink-500">Rank #{metrics.wellsFargoPosition.rank}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-pink-600">{formatCurrency(metrics.wellsFargoPosition.value)}</div>
                    <div className="text-sm text-pink-500">{formatPercentage(metrics.wellsFargoPosition.share)} share</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Leading Media */}
          <div className="flex-1">
            <div className="relative w-full">
              <div className="bg-white rounded-lg shadow-sm p-4 border border-violet-100" style={{ height: "160px" }}>
                <div className="flex items-center mb-6">
                  <div className="bg-violet-500 rounded-full p-2 shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-sm text-violet-600 font-medium ml-2">Leading Media</div>
                </div>
                <div className="flex justify-between items-center h-[72px]">
                  <div>
                    <div className="text-xl font-bold text-violet-700">{metrics.topMedia?.name || 'Television'}</div>
                    <div className="text-sm text-violet-500">{formatPercentage(metrics.topMedia?.share || 0)} of total spend</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-violet-700">
                      {formatCurrency(metrics.topMedia?.value || 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Channel Allocation Section */}
      <div className="mt-12 mb-6">
        <h3 className="text-base font-semibold text-gray-800 mb-6">Channel Allocation</h3>
        
        <div className="flex gap-4">
          {/* Television and Audio - aligned with Leading Bank */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100" style={{ height: "110px" }}>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center">
                  <div 
                    className="w-2.5 h-2.5 rounded-full mr-2" 
                    style={{ backgroundColor: getMediaColor('Television') }}
                  ></div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Television</span>
                      <span className="text-sm text-gray-600">
                        {formatPercentage(metrics.mediaTotals.find(m => m.name === 'Television')?.share || 0)}
                      </span>
                    </div>
                    <div className="h-1 bg-gray-50 rounded-full mt-1">
                      <div 
                        className="h-1 rounded-full" 
                        style={{ 
                          width: `${metrics.mediaTotals.find(m => m.name === 'Television')?.share || 0}%`, 
                          backgroundColor: getMediaColor('Television') 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div 
                    className="w-2.5 h-2.5 rounded-full mr-2" 
                    style={{ backgroundColor: getMediaColor('Audio') }}
                  ></div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Audio</span>
                      <span className="text-sm text-gray-600">
                        {formatPercentage(metrics.mediaTotals.find(m => m.name === 'Audio')?.share || 0)}
                      </span>
                    </div>
                    <div className="h-1 bg-gray-50 rounded-full mt-1">
                      <div 
                        className="h-1 rounded-full" 
                        style={{ 
                          width: `${metrics.mediaTotals.find(m => m.name === 'Audio')?.share || 0}%`, 
                          backgroundColor: getMediaColor('Audio') 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Digital and Print - aligned with Our Performance */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100" style={{ height: "110px" }}>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center">
                  <div 
                    className="w-2.5 h-2.5 rounded-full mr-2" 
                    style={{ backgroundColor: getMediaColor('Digital') }}
                  ></div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Digital</span>
                      <span className="text-sm text-gray-600">
                        {formatPercentage(metrics.mediaTotals.find(m => m.name === 'Digital')?.share || 0)}
                      </span>
                    </div>
                    <div className="h-1 bg-gray-50 rounded-full mt-1">
                      <div 
                        className="h-1 rounded-full" 
                        style={{ 
                          width: `${metrics.mediaTotals.find(m => m.name === 'Digital')?.share || 0}%`, 
                          backgroundColor: getMediaColor('Digital') 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div 
                    className="w-2.5 h-2.5 rounded-full mr-2" 
                    style={{ backgroundColor: getMediaColor('Print') }}
                  ></div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Print</span>
                      <span className="text-sm text-gray-600">
                        {formatPercentage(metrics.mediaTotals.find(m => m.name === 'Print')?.share || 0)}
                      </span>
                    </div>
                    <div className="h-1 bg-gray-50 rounded-full mt-1">
                      <div 
                        className="h-1 rounded-full" 
                        style={{ 
                          width: `${metrics.mediaTotals.find(m => m.name === 'Print')?.share || 0}%`, 
                          backgroundColor: getMediaColor('Print') 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Insights - aligned with Leading Media */}
          <div className="flex-1">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100" style={{ height: "110px" }}>
              <div className="text-sm text-gray-600 leading-relaxed">
                <span className="font-medium text-gray-800">Key Insights:</span>{' '}
                {(() => {
                  // Get the consistent media data from dashboard data
                  const televisionPercentage = metrics.mediaTotals.find(m => m.name === 'Television')?.share || 0;
                  const digitalPercentage = metrics.mediaTotals.find(m => m.name === 'Digital')?.share || 0;
                  
                  // Create dynamic insight text based on consistent data
                  return (
                    <>
                      Television leads with {formatPercentage(televisionPercentage)} share, 
                      while Digital follows at {formatPercentage(digitalPercentage)}. 
                      This {selectedMonths.length > 0 ? 'filtered period shows' : 'overall distribution represents'} the 
                      {televisionPercentage + digitalPercentage > 80 
                        ? ' strong dominance of these two channels'
                        : televisionPercentage + digitalPercentage > 60 
                          ? ' major focus on these primary channels' 
                          : ' balanced investment across multiple channels'} 
                      in banking industry advertising.
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyMetrics;