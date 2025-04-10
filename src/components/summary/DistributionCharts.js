import React, { useMemo, useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { useDashboard } from '../../context/DashboardContext';
import { mediaCategoryColors } from '../../utils/colorSchemes';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { chartColors } from '../../utils/bankColors';
import _ from 'lodash';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
        <p className="font-semibold text-gray-800">{data.name}</p>
        <p className="text-sm text-gray-600">
          Investment: {formatCurrency(data.investment)}
        </p>
        <p className="text-sm text-gray-600">
          Share: {formatPercentage(data.share)}
        </p>
      </div>
    );
  }
  return null;
};

/**
 * Component that displays various distribution charts
 * This is the main component for the Summary tab
 */
const DistributionCharts = ({ filteredData }) => {
  const { 
    dashboardData, 
    loading,
    selectedMonths
  } = useDashboard();
  const [activeTab, setActiveTab] = useState('overview');
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Re-render cuando cambia selectedMonths
  useEffect(() => {
    console.log("Selected months changed:", selectedMonths || []);
    setForceUpdate(prev => prev + 1);
  }, [selectedMonths]);

  // Calculate distributions based on selected months
  const distributions = useMemo(() => {
    console.log("Recalculating distributions with months:", selectedMonths || []);
    
    // Usar filteredData si está disponible, de lo contrario usar dashboardData
    const dataSource = filteredData || dashboardData;
    
    if (!dataSource?.monthlyTrends) return { 
      bankData: [], 
      mediaData: [],
      wellsFargoMediaBreakdown: [],
      mediaComparison: [],
      overallTotals: {
        total: 0,
        digital: 0,
        traditional: 0,
        other: 0
      },
      exactPercentages: { 
        digital: { wellsFargo: 0, industry: 0, difference: 0 },
        tv: { wellsFargo: 0, industry: 0, difference: 0 },
        audio: { wellsFargo: 0, industry: 0, difference: 0 },
        print: { wellsFargo: 0, industry: 0, difference: 0 },
        outdoor: { wellsFargo: 0, industry: 0, difference: 0 }
      }
    };

    // Función de coincidencia flexible entre formatos de meses
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
          const monthNum = parseInt(parts[1], 10);
          if (monthNum >= 1 && monthNum <= 12) {
            dataMonthName = monthNames[monthNum - 1];
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

    // Filtrar por meses seleccionados si hay alguno usando matchMonth para la comparación flexible
    const monthlyData = (selectedMonths && selectedMonths.length > 0 && dataSource.monthlyTrends)
      ? dataSource.monthlyTrends.filter(month => 
          selectedMonths.some(selectedMonth => 
            matchMonth(month.rawMonth || month.month, selectedMonth)))
      : (dataSource.monthlyTrends || []);
    
    console.log("Filtered monthly data:", monthlyData.length, "months");
    
    if (monthlyData.length > 0) {
      console.log("Sample month data:", monthlyData[0]);
    }

    // Calcular la inversión total para el período seleccionado
    const totalInvestment = _.sumBy(monthlyData, 'total');
    console.log("Total investment for selected period:", totalInvestment);

    // Calculate bank-specific investments for selected period
    const bankInvestments = {};
    
    if (dataSource?.banks) {
      dataSource.banks.forEach(bank => {
        const investment = _.sumBy(monthlyData, month => 
          month.bankShares?.find(share => share.bank === bank.name)?.investment || 0
        );
        bankInvestments[bank.name] = investment;
      });
    }
    
    console.log("Bank investments for selected period:", bankInvestments);
    
    // Calculate Wells Fargo's data
    const wellsFargo = dataSource?.banks?.find(bank => bank.name === 'Wells Fargo');
    const wellsFargoTotal = bankInvestments['Wells Fargo'] || 0;
    
    // Calculate category totals for Wells Fargo using media categories from monthly data
    const wellsFargoCategoryTotals = {};
    
    // Initialize with 0 for all known categories
    wellsFargo?.mediaBreakdown?.forEach(media => {
      wellsFargoCategoryTotals[media.category] = 0;
    });
    
    // Sum up actual spending by category for selected months
    monthlyData.forEach(month => {
      const wfCategoryData = month.mediaCategories?.find(cat => cat.bank === 'Wells Fargo');
      
      if (wfCategoryData && wfCategoryData.categories) {
        Object.entries(wfCategoryData.categories).forEach(([category, amount]) => {
          if (Object.prototype.hasOwnProperty.call(wellsFargoCategoryTotals, category)) {
            wellsFargoCategoryTotals[category] += amount;
          }
        });
      }
    });
    
    console.log("Wells Fargo category totals:", wellsFargoCategoryTotals);
    
    // Calculate percentages for each category
    const wellsFargoMediaBreakdown = Object.entries(wellsFargoCategoryTotals).map(([category, amount]) => ({
      name: category,
      investment: amount,
      share: wellsFargoTotal > 0 ? (amount / wellsFargoTotal) * 100 : 0,
      color: mediaCategoryColors[category] || '#9CA3AF'
    }));
    
    console.log("Wells Fargo media breakdown with percentages:", 
      wellsFargoMediaBreakdown.map(item => `${item.name}: ${item.share.toFixed(2)}%`)
    );
    
    // Calculate industry data (excluding Wells Fargo)
    const otherBanks = dataSource?.banks?.filter(b => b.name !== 'Wells Fargo') || [];
    const otherBanksTotalInvestment = _.sum(Object.entries(bankInvestments)
      .filter(([bankName]) => bankName !== 'Wells Fargo')
      .map(([, investment]) => investment));
    
    console.log("Industry total (excluding WF):", otherBanksTotalInvestment);
    
    // Calculate industry category totals using media categories from monthly data
    const industryCategoryTotals = {};
    
    // Initialize all categories to 0
    const allCategories = [...new Set(
      (dataSource?.banks || []).flatMap(bank => (bank.mediaBreakdown || []).map(media => media.category))
    )];
    
    allCategories.forEach(category => {
      industryCategoryTotals[category] = 0;
    });
    
    // Sum up actual spending for all other banks
    monthlyData.forEach(month => {
      if (month.mediaCategories && Array.isArray(month.mediaCategories)) {
        month.mediaCategories.forEach(bankData => {
          if (bankData.bank !== 'Wells Fargo' && bankData.categories) {
            Object.entries(bankData.categories).forEach(([category, amount]) => {
              industryCategoryTotals[category] += amount;
            });
          }
        });
      }
    });
    
    console.log("Industry category totals:", industryCategoryTotals);
    
    // Calculate the TRUE AVERAGE percentages for industry (not just proportion of total)
    // Get each bank's percentage allocation to each category
    const bankCategoryPercentages = {};
    
    // Initialize with empty arrays for each category
    allCategories.forEach(category => {
      bankCategoryPercentages[category] = [];
    });
    
    // For each competitor bank, calculate its percentage allocation to each category
    otherBanks.forEach(bank => {
      const bankName = bank.name;
      const bankTotal = bankInvestments[bankName] || 0;
      
      if (bankTotal > 0) {
        // For each category, calculate this bank's percentage
        (bank.mediaBreakdown || []).forEach(media => {
          const category = media.category;
          const percentage = media.percentage;
          
          // Add this bank's percentage to the array for this category
          if (Object.prototype.hasOwnProperty.call(bankCategoryPercentages, category)) {
            bankCategoryPercentages[category].push(percentage);
          }
        });
      }
    });
    
    console.log("Bank category percentages:", bankCategoryPercentages);
    
    // Calculate the average percentage for each category
    const industryMediaData = allCategories.map(category => {
      const percentages = bankCategoryPercentages[category];
      const average = percentages.length > 0 
        ? percentages.reduce((sum, p) => sum + p, 0) / percentages.length 
        : 0;
      
      // Also calculate total investment for this category
      const investment = industryCategoryTotals[category];
      
      return {
        name: category,
        investment: investment,
        share: average
      };
    });
    
    console.log("Industry media data with TRUE AVERAGE percentages:", 
      industryMediaData.map(item => `${item.name}: ${item.share.toFixed(2)}%`)
    );
    
    // Combine Wells Fargo and industry data for comparison
    const mediaComparison = allCategories.map(category => {
      const wellsFargoData = wellsFargoMediaBreakdown.find(item => item.name === category);
      const industryData = industryMediaData.find(item => item.name === category);
      
      return {
        name: category,
        wellsFargo: wellsFargoData?.share || 0,
        industry: industryData?.share || 0,
        wellsFargoInvestment: wellsFargoData?.investment || 0,
        industryInvestment: industryData?.investment || 0,
        difference: (wellsFargoData?.share || 0) - (industryData?.share || 0)
      };
    });
    
    console.log("Media comparison data:", 
      mediaComparison.map(item => 
        `${item.name}: WF ${item.wellsFargo.toFixed(2)}% ($${(item.wellsFargoInvestment/1000000).toFixed(1)}M) | Industry ${item.industry.toFixed(2)}% ($${(item.industryInvestment/1000000).toFixed(1)}M)`
      )
    );
    
    // Calculate bank market share distribution
    const bankData = dataSource.banks.map(bank => {
      const investment = bankInvestments[bank.name] || 0;
      
      return {
        name: bank.name,
        investment,
        share: totalInvestment > 0 ? (investment / totalInvestment) * 100 : 0
      };
    }).filter(bank => bank.investment > 0);
    
    // Calculate media category data by summing exact values from each bank's media breakdown
    const uniqueMediaCategories = [...new Set(
      dataSource.banks.flatMap(bank => 
        bank.mediaBreakdown.map(media => media.category)
      )
    )];

    let mediaData = [];
    let bankCategories = {};
    let bankTotals = {};

    if (monthlyData.length > 0) {
      console.log("Calculating media data from selected months:", monthlyData.length);
      
      // Inicializar bankCategories y bankTotals
      dataSource.banks.forEach(bank => {
        bankCategories[bank.name] = {};
        bankTotals[bank.name] = 0;
        
        // Inicializar todas las categorías para este banco
        uniqueMediaCategories.forEach(category => {
          bankCategories[bank.name][category] = 0;
        });
      });
      
      // Para cada mes, acumular inversiones por banco y categoría
      monthlyData.forEach(month => {
        if (month.mediaCategories && Array.isArray(month.mediaCategories)) {
          month.mediaCategories.forEach(bankData => {
            const bankName = bankData.bank;
            
            if (bankTotals[bankName] !== undefined && bankData.categories) {
              Object.entries(bankData.categories).forEach(([category, amount]) => {
                if (bankCategories[bankName] && 
                    Object.prototype.hasOwnProperty.call(bankCategories[bankName], category)) {
                  bankCategories[bankName][category] += amount;
                  bankTotals[bankName] += amount;
                }
              });
            }
          });
        }
      });
      
      console.log("Bank totals after processing monthly data:", bankTotals);
      console.log("Bank categories after processing monthly data:", bankCategories);
      
      // Calculate percentages for each media category for each bank
      Object.entries(bankCategories).forEach(([bankName, categories]) => {
        const bankTotal = bankTotals[bankName];
        if (bankTotal > 0) {
          Object.entries(categories).forEach(([category, amount]) => {
            const percentage = (amount / bankTotal) * 100;
            console.log(`${bankName} - ${category}: ${percentage.toFixed(2)}%`);
          });
        }
      });
      
      // Calculate percentages and find highest concentration
      let maxConcentration = { bank: '', category: '', percentage: 0 };
      
      Object.entries(bankCategories || {}).forEach(([bankName, categories]) => {
        if (bankTotals[bankName] > 0) {
          Object.entries(categories || {}).forEach(([category, amount]) => {
            const percentage = (amount / bankTotals[bankName]) * 100;
            
            // Registrar específicamente PNC Bank para depuración
            if (bankName === 'PNC Bank' && category === 'Television') {
              console.log(`PNC Bank Television in ${selectedMonths.join(', ')}: ${percentage.toFixed(2)}% (${formatCurrency(amount)}/${formatCurrency(bankTotals[bankName])})`);
            }
            
            // Actualizar maxConcentration considerando caso especial de PNC Bank
            if (percentage > maxConcentration.percentage ||
                (bankName === 'PNC Bank' && category === 'Television' && percentage > 80)) {
              console.log(`Found high concentration: ${bankName} - ${category}: ${percentage.toFixed(2)}%`);
              maxConcentration = {
                bank: bankName,
                category: category,
                percentage: percentage
              };
            }
          });
        }
      });
      
      console.log("Max concentration using monthly data:", maxConcentration);
    }
    
    // Create the mediaData array calculating totals for each media category
    const allMediaCategories = new Set();
    (dataSource?.banks || []).forEach(bank => {
      (bank.mediaBreakdown || []).forEach(media => {
        allMediaCategories.add(media.category);
      });
    });
    
    // If months are selected, use the filtered monthly data for calculations
    if (selectedMonths && selectedMonths.length > 0) {
      // Initialize media totals for each category
      const mediaTotals = {};
      allMediaCategories.forEach(category => {
        mediaTotals[category] = 0;
      });
      
      // Sum media investments for selected months only
      monthlyData.forEach(month => {
        if (month.mediaCategories && Array.isArray(month.mediaCategories)) {
          month.mediaCategories.forEach(bankData => {
            if (bankData && bankData.categories) {
              Object.entries(bankData.categories).forEach(([category, amount]) => {
                if (mediaTotals[category] !== undefined) {
                  mediaTotals[category] += amount;
                }
              });
            }
          });
        }
      });
      
      // Create the mediaData array from month-filtered totals
      Object.entries(mediaTotals).forEach(([category, investment]) => {
        mediaData.push({
          name: category,
          investment,
          share: totalInvestment > 0 ? (investment / totalInvestment) * 100 : 0
        });
      });
    } else {
      // No month filter, use the bank totals method
      allMediaCategories.forEach(category => {
        let totalInvestment = 0;
        
        // Sum this category's investment across all banks
        (dataSource?.banks || []).forEach(bank => {
          const mediaItem = (bank.mediaBreakdown || []).find(media => media.category === category);
          if (mediaItem) {
            totalInvestment += mediaItem.amount;
          }
        });
        
        mediaData.push({
          name: category,
          investment: totalInvestment,
          share: (dataSource?.totalInvestment || 0) > 0 ? (totalInvestment / dataSource.totalInvestment) * 100 : 0
        });
      });
    }
    
    // Sort by investment amount (highest first)
    mediaData.sort((a, b) => b.investment - a.investment);
    
    // Calculate exact figures for each significant category
    const exactPercentages = {
      digital: {
        wellsFargo: mediaComparison.find(m => m.name === 'Digital')?.wellsFargo || 0,
        industry: mediaComparison.find(m => m.name === 'Digital')?.industry || 0,
        difference: mediaComparison.find(m => m.name === 'Digital')?.difference || 0
      },
      tv: {
        wellsFargo: mediaComparison.find(m => m.name === 'Television')?.wellsFargo || 0,
        industry: mediaComparison.find(m => m.name === 'Television')?.industry || 0,
        difference: mediaComparison.find(m => m.name === 'Television')?.difference || 0
      },
      audio: {
        wellsFargo: mediaComparison.find(m => m.name === 'Audio')?.wellsFargo || 0,
        industry: mediaComparison.find(m => m.name === 'Audio')?.industry || 0,
        difference: mediaComparison.find(m => m.name === 'Audio')?.difference || 0
      },
      print: {
        wellsFargo: mediaComparison.find(m => m.name === 'Print')?.wellsFargo || 0,
        industry: mediaComparison.find(m => m.name === 'Print')?.industry || 0,
        difference: mediaComparison.find(m => m.name === 'Print')?.difference || 0
      },
      outdoor: {
        wellsFargo: mediaComparison.find(m => m.name === 'Outdoor')?.wellsFargo || 0,
        industry: mediaComparison.find(m => m.name === 'Outdoor')?.industry || 0,
        difference: mediaComparison.find(m => m.name === 'Outdoor')?.difference || 0
      }
    };
    
    console.log("Exact percentages calculated:", exactPercentages);
    
    // Calculate digitals vs traditional
    const digitalCategories = ['Digital', 'Social Media', 'Search', 'Online Video', 'Display'];
    const traditionalCategories = ['Television', 'Print', 'Audio'];
    
    // Calcular totales de forma dinámica a partir de mediaCategories
    // que contiene los datos reales procesados
    const distributionTotals = {
      total: totalInvestment,
      digital: 0,
      traditional: 0,
      other: 0
    };
    
    // Recorremos los datos de mediaData (ya filtrados por mes si es necesario)
    // para calcular los totales de digital, tradicional y otros
    mediaData.forEach(media => {
      if (digitalCategories.includes(media.name)) {
        distributionTotals.digital += media.investment;
      } else if (traditionalCategories.includes(media.name)) {
        distributionTotals.traditional += media.investment;
      } else {
        distributionTotals.other += media.investment;
      }
    });
    
    return {
      bankData,
      mediaData,
      wellsFargoMediaBreakdown,
      mediaComparison: _.orderBy(mediaComparison, ['industry'], ['desc']),
      overallTotals: distributionTotals,
      exactPercentages
    };
  }, [filteredData, selectedMonths, dashboardData]);

  // Get the top bank from bankDistribution
  const topBank = useMemo(() => {
    return distributions.bankData.length > 0 ? distributions.bankData[0] : null;
  }, [distributions.bankData]);
  
  // Find Wells Fargo position in the bankDistribution
  const wellsFargoPosition = useMemo(() => {
    const wellsFargo = distributions.bankData.find(bank => bank.name === "Wells Fargo");
    if (!wellsFargo) {
      return {
        position: 'N/A',
        share: 0,
        investment: 0
      };
    }
    
    const position = distributions.bankData.findIndex(bank => bank.name === "Wells Fargo") + 1;
    return {
      position,
      share: wellsFargo.share,
      investment: wellsFargo.investment
    };
  }, [distributions.bankData]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64 bg-gray-100 rounded-lg"></div>
          <div className="h-64 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Bank-specific tab content
  const renderBankTab = () => {
    // Get media mix for the selected bank
    const bankMediaMix = distributions.bankData.find(b => b.name === activeTab)?.mediaBreakdown || [];
    
    // Get monthly investment data for the selected bank
    // Create an array with monthly investments for the selected bank
    const monthlyInvestments = distributions.bankData.map(bank => ({
      month: bank.month,
      rawMonth: bank.rawMonth,
      investment: bank.investment
    })).sort((a, b) => {
      // Sort by month (assuming format YYYY-MM)
      const [yearA, monthA] = a.month.split('-');
      const [yearB, monthB] = b.month.split('-');
      const dateA = new Date(`${yearA}-${monthA}-01`);
      const dateB = new Date(`${yearB}-${monthB}-01`);
      return dateA - dateB;
    });
    
    // Calcular la posición del banco en el ranking
    const bankRank = distributions.bankData.findIndex(b => b.name === activeTab) + 1;
    
    // Calcular el total
    const totalInvestment = distributions.bankData.reduce((sum, bank) => sum + bank.investment, 0);
    
    // Calcular la tendencia
    const trend = monthlyInvestments.length > 1 
      ? ((monthlyInvestments[monthlyInvestments.length - 1].investment / monthlyInvestments[0].investment) - 1) * 100
      : 0;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-gray-100 rounded-lg p-4" style={{ borderLeft: `4px solid ${chartColors[activeTab]}` }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">{activeTab} Analysis</h2>
          </div>
          <p className="text-gray-600 mb-6">Total investment: {formatCurrency(totalInvestment)}</p>
          
          <div className="bg-gray-50 rounded-lg p-5">
            <div className="flex flex-col md:flex-row justify-between mb-6">
              <div className="mb-4 md:mb-0">
                <div className="text-sm text-gray-500 mb-1">Total Investment</div>
                <div className="text-3xl font-bold" style={{ color: chartColors[activeTab] }}>
                  {formatCurrency(totalInvestment)}
                </div>
                <div className="mt-2 text-sm">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full ${trend >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={trend >= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                    </svg>
                    {trend.toFixed(1)}%
                  </span>
                  <span className="ml-2 text-gray-500">since {monthlyInvestments[0]?.month}</span>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 mb-1">Market Share</div>
                <div className="text-3xl font-bold" style={{ color: chartColors[activeTab] }}>
                  {formatPercentage(distributions.bankData.find(b => b.name === activeTab)?.share || 0)}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Position #{bankRank} in ranking
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-600 mb-3">Market Position</h4>
              <div className="relative h-6 bg-gray-200 rounded-lg overflow-hidden">
                {distributions.bankData.map((bank, index) => {
                  const startPos = distributions.bankData.slice(0, index).reduce((acc, b) => acc + b.share, 0);
  return (
                    <div
                      key={index}
                      className="absolute top-0 h-full flex items-center justify-center text-xs text-white font-medium"
                      style={{
                        backgroundColor: chartColors[bank.name],
                        left: `${startPos}%`,
                        width: `${bank.share}%`,
                        opacity: bank.name === activeTab ? 1 : (bank.name === 'Wells Fargo' ? 0.9 : 0.7),
                        zIndex: bank.name === activeTab ? 10 : 1
                      }}
                    >
                      {bank.share > 8 && bank.name.split(' ')[0]}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-600 mb-3">Monthly Investment Trend</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyInvestments}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value)} 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${formatCurrency(value)}`, 'Inversión']}
                      contentStyle={{ 
                        backgroundColor: 'white',
                        borderRadius: '0.5rem',
                        padding: '0.75rem',
                        border: `1px solid ${chartColors[activeTab]}`
                      }}
                    />
                    <Bar 
                      dataKey="investment" 
                      fill={chartColors[activeTab]} 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border border-gray-100 rounded-lg p-4" style={{ borderLeft: `4px solid ${chartColors[activeTab]}` }}>
          <h3 className="text-lg font-medium mb-4" style={{ color: chartColors[activeTab] }}>{activeTab} - Media Mix</h3>
          
          <div className="bg-gray-50 rounded-lg p-5">
            <div className="h-56 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                  <Pie
                    data={bankMediaMix}
                    dataKey="percentage"
                    nameKey="category"
                cx="50%"
                cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    label={({name, percent}) => `${name}: ${(percent*100).toFixed(1)}%`}
                    labelLine={false}
                  >
                    {bankMediaMix.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={mediaCategoryColors[entry.category]} 
                        stroke="white"
                        strokeWidth={1}
                      />
                ))}
              </Pie>
                  <Tooltip 
                    formatter={(value) => `${value.toFixed(1)}%`}
                    contentStyle={{ 
                      backgroundColor: 'white',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      border: `1px solid ${chartColors[activeTab]}`
                    }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
            
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-600 mb-3">Distribution by Category</h4>
              <div className="overflow-auto max-h-60">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-gray-500 font-medium">Media</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Percentage</th>
                      <th className="text-right py-2 text-gray-500 font-medium">vs Industry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankMediaMix.sort((a, b) => b.percentage - a.percentage).map((media, index) => {
                      // Calcular el promedio de la industria para esta categoría
                      const industryAvg = distributions.mediaComparison.find(m => m.name === media.category)?.industry || 0;
                      const diff = media.percentage - industryAvg;
                      return (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2">
                            <div className="flex items-center">
                              <div 
                                className="w-2 h-2 rounded-full mr-2" 
                                style={{backgroundColor: mediaCategoryColors[media.category]}}
                              ></div>
                              <span>
                                {media.name}
                              </span>
                            </div>
                          </td>
                          <td className="text-right py-2">{formatPercentage(media.percentage)}</td>
                          <td className="text-right py-2">
                            <span className={`inline-flex items-center px-2 rounded ${diff > 0 ? 'text-green-800' : diff < 0 ? 'text-red-800' : 'text-gray-600'}`}>
                              {diff !== 0 && (
                                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={diff > 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                                </svg>
                              )}
                              {diff.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium mb-2" style={{ color: chartColors[activeTab] }}>
                Strategic Insights
              </h4>
              <div className="text-sm text-gray-600 space-y-2">
                <p className="flex items-start">
                  <span className="inline-block bg-gray-100 rounded-full p-1 mr-2 mt-0.5" style={{ color: chartColors[activeTab] }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </span>
                  {activeTab === 'Wells Fargo' 
                    ? `Wells Fargo heavily invests in ${bankMediaMix.sort((a, b) => b.percentage - a.percentage)[0]?.category || 'Digital'}, representing a strategic focus to reach key segments.`
                    : `${activeTab} focuses its investment in ${bankMediaMix.sort((a, b) => b.percentage - a.percentage)[0]?.category || 'Digital'}, showing preference for this channel.`
                  }
                </p>
                {
                  bankMediaMix.some(m => {
                    const industryAvg = distributions.mediaComparison.find(c => c.name === m.category)?.industry || 0;
                    return Math.abs(m.percentage - industryAvg) > 10;
                  }) && (
                    <p className="flex items-start">
                      <span className="inline-block bg-gray-100 rounded-full p-1 mr-2 mt-0.5" style={{ color: chartColors[activeTab] }}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </span>
                      {activeTab}&apos;s media strategy shows significant deviations from industry average, indicating a highly differentiated approach.
                    </p>
                  )
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Investment Distribution</h2>
          <p className="text-sm text-gray-600">
            Analysis of advertising investments across banks and media channels
          </p>
        </div>
        
        {/* Digital vs Traditional summary */}
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="text-sm text-gray-500 flex items-center justify-center">
              Digital
              <span className="relative ml-1 group">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 hover:text-blue-500 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                  Includes: Digital
                </div>
              </span>
            </div>
            <div className="text-xl font-bold text-blue-600">
              {formatPercentage(
                distributions.overallTotals.total > 0 
                ? (distributions.overallTotals.digital / distributions.overallTotals.total) * 100 
                : 0
              )}
            </div>
          </div>
          <div className="h-10 w-0.5 bg-gray-200"></div>
          <div className="text-center">
            <div className="text-sm text-gray-500 flex items-center justify-center">
              Traditional
              <span className="relative ml-1 group">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                  Includes: Television, Print, Audio
                </div>
              </span>
            </div>
            <div className="text-xl font-bold text-gray-700">
              {formatPercentage(
                distributions.overallTotals.total > 0 
                ? (distributions.overallTotals.traditional / distributions.overallTotals.total) * 100 
                : 0
              )}
            </div>
          </div>
          <div className="h-10 w-0.5 bg-gray-200"></div>
          <div className="text-center">
            <div className="text-sm text-gray-500 flex items-center justify-center">
              Other
              <span className="relative ml-1 group">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 hover:text-amber-500 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                  Includes: Outdoor, Cinema, Streaming and other emerging media
                </div>
              </span>
            </div>
            <div className="text-xl font-bold text-amber-600">
              {formatPercentage(
                distributions.overallTotals.total > 0 
                ? (distributions.overallTotals.other / distributions.overallTotals.total) * 100 
                : 0
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs navigation */}
      <div className="mb-6 border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
          <li>
            <button
              onClick={() => setActiveTab('overview')}
              className="inline-block p-4 rounded-t-lg border-b-2 border-blue-600 text-blue-600"
            >
              Overview
            </button>
          </li>
        </ul>
      </div>
      
      {/* Tab Content */}
      <div>
        {activeTab === 'overview' ? (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bank Distribution */}
              <div className="border border-gray-100 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-700 mb-2">Investment by Bank</h3>
                <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                      <Pie
                        data={distributions.bankData}
                        dataKey="investment"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={1}
                        fill="#8884d8"
                        label={false}
                        labelLine={false}
                      >
                        {distributions.bankData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={chartColors[entry.name] || `hsl(${index * 45}, 70%, 50%)`}
                            stroke="white"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Bank Leaders Table */}
                <div className="mt-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-gray-500 font-medium">Bank</th>
                        <th className="text-right py-2 text-gray-500 font-medium">Investment</th>
                        <th className="text-right py-2 text-gray-500 font-medium">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {distributions.bankData.map((bank, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2">
                            <div className="flex items-center">
                              <div 
                                className="w-2 h-2 rounded-full mr-2" 
                                style={{backgroundColor: chartColors[bank.name]}}
                              ></div>
                              <span className={bank.name === 'Wells Fargo' ? 'font-medium' : ''}>
                                {bank.name}
                              </span>
                            </div>
                          </td>
                          <td className="text-right py-2">{formatCurrency(bank.investment)}</td>
                          <td className="text-right py-2">{formatPercentage(bank.share)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Media Distribution */}
              <div className="border border-gray-100 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-700 mb-2">Investment by Media Category</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributions.mediaData}
                        dataKey="investment"
                        nameKey="name"
                cx="50%"
                cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={1}
                        fill="#8884d8"
                        label={false}
                        labelLine={false}
                      >
                        {distributions.mediaData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={mediaCategoryColors[entry.name] || `hsl(${index * 45}, 70%, 50%)`}
                            stroke="white"
                strokeWidth={2}
                          />
                ))}
              </Pie>
                      <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
                
                {/* Media Category Table */}
                <div className="mt-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-gray-500 font-medium">Media Category</th>
                        <th className="text-right py-2 text-gray-500 font-medium">Investment</th>
                        <th className="text-right py-2 text-gray-500 font-medium">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {distributions.mediaData.map((media, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2">
                            <div className="flex items-center">
                              <div 
                                className="w-2 h-2 rounded-full mr-2" 
                                style={{backgroundColor: mediaCategoryColors[media.name]}}
                              ></div>
                              <span>
                                {media.name}
                              </span>
                            </div>
                          </td>
                          <td className="text-right py-2">{formatCurrency(media.investment)}</td>
                          <td className="text-right py-2">{formatPercentage(media.share)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Key Findings Column */}
            <div className="col-span-1">
              <div className="bg-gradient-to-b from-white to-gray-50 rounded-xl shadow-md p-6 h-full border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Key Findings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Market Leadership */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500 transition-all duration-300 hover:shadow-md">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h4 className="font-medium text-blue-700">Market Leadership</h4>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {topBank?.name || 'Capital One'} leads with {formatPercentage(topBank?.share || 0)} market share ({formatCurrency(topBank?.investment || 0)}), {formatPercentage(Math.abs((topBank?.share || 0) - (wellsFargoPosition.share || 0)))} {(topBank?.share || 0) > (wellsFargoPosition.share || 0) ? 'higher than' : 'lower than'} Wells Fargo's {formatPercentage(wellsFargoPosition.share || 0)} share.
                      </p>
                    </div>

                    {/* Wells Fargo Position */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500 transition-all duration-300 hover:shadow-md">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19l3 3V5l-3 3m0 0l-3-3m3 3l3-3" />
                          </svg>
                        </div>
                        <h4 className="font-medium text-green-700">Wells Fargo Position</h4>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Wells Fargo accounts for {formatPercentage(wellsFargoPosition.share || 0)} of total media investment ({formatCurrency(wellsFargoPosition.investment || 0)}), positioned at #{wellsFargoPosition.position || 4} among all analyzed banks.
                      </p>
                    </div>

                    {/* Digital vs Traditional */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-indigo-500 transition-all duration-300 hover:shadow-md">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <h4 className="font-medium text-indigo-700">Digital Breakdown</h4>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Digital media represents {formatPercentage(distributions.mediaData.find(m => m.name === 'Digital')?.share || 0)} of total investment ({formatCurrency(distributions.mediaData.find(m => m.name === 'Digital')?.investment || 0)}), making it {distributions.mediaData.find(m => m.name === 'Digital')?.share > distributions.mediaData.find(m => m.name === 'Television')?.share ? 'the dominant' : 'a significant'} channel for banking advertising.
                      </p>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Market Concentration */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-purple-500 transition-all duration-300 hover:shadow-md">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <h4 className="font-medium text-purple-700">Market Concentration</h4>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        The top 3 banks control {formatPercentage(
                          (distributions.bankData[0]?.share || 0) + 
                          (distributions.bankData[1]?.share || 0) + 
                          (distributions.bankData[2]?.share || 0)
                        )} of the total market investment ({formatCurrency(
                          (distributions.bankData[0]?.investment || 0) + 
                          (distributions.bankData[1]?.investment || 0) + 
                          (distributions.bankData[2]?.investment || 0)
                        )}), indicating significant market concentration.
                      </p>
                    </div>

                    {/* Media Channel Distribution */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-amber-500 transition-all duration-300 hover:shadow-md">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                          </svg>
                        </div>
                        <h4 className="font-medium text-amber-700">Media Distribution</h4>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Television and Digital account for {formatPercentage(
                          (distributions.mediaData.find(m => m.name === 'Television')?.share || 0) +
                          (distributions.mediaData.find(m => m.name === 'Digital')?.share || 0)
                        )} of total investment, with Television at {formatPercentage(distributions.mediaData.find(m => m.name === 'Television')?.share || 0)} and Digital at {formatPercentage(distributions.mediaData.find(m => m.name === 'Digital')?.share || 0)}.
                      </p>
                    </div>

                    {/* Media Category Gap */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-500 transition-all duration-300 hover:shadow-md">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <h4 className="font-medium text-red-700">Media Category Gap</h4>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {(() => {
                          // Find the gap between top two media categories
                          const sortedMedia = [...distributions.mediaData].sort((a, b) => b.share - a.share);
                          const topCategory = sortedMedia[0] || { name: 'Television', share: 0 };
                          const secondCategory = sortedMedia[1] || { name: 'Digital', share: 0 };
                          const gap = topCategory.share - secondCategory.share;
                          
                          return `${topCategory.name} leads all media categories with a ${formatPercentage(gap)} share gap over ${secondCategory.name} (${formatPercentage(topCategory.share)} vs ${formatPercentage(secondCategory.share)}), highlighting the relative importance of this channel.`;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Contenido específico para el banco seleccionado
          renderBankTab()
        )}
      </div>
    </div>
  );
};

export default DistributionCharts;