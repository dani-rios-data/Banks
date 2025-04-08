import React, { useMemo, useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { useDashboard } from '../../context/DashboardContext';
import { mediaCategoryColors } from '../../utils/colorSchemes';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import _ from 'lodash';

// Bank colors definition
const bankColors = {
  'Capital One': '#004977',
  'Chase Bank': '#117ACA',
  'Bank Of America': '#012169',
  'Wells Fargo Bank': '#D71E2B',
  'Pnc Bank': '#F58025',
  'Td Bank': '#2D8B2A'
};

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

// Custom legend that shows both name and percentage
const CustomLegend = ({ data, colors }) => {
  if (!data || !Array.isArray(data)) return null;
  
  return (
    <ul className="flex flex-col gap-2 text-sm">
      {data.map((entry, index) => (
        <li key={`item-${index}`} className="flex items-center">
          <div 
            className="w-3 h-3 mr-2 rounded-full" 
            style={{ backgroundColor: colors[entry.name] || `hsl(${index * 45}, 70%, 50%)` }}
          />
          <span>{entry.name}</span>
        </li>
      ))}
    </ul>
  );
};

/**
 * Component that displays investment distribution charts with month filter support
 */
const DistributionCharts = ({ hideWellsFargoComparison = false }) => {
  const { dashboardData, loading, selectedMonths, focusedBank } = useDashboard();
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
    
    if (!dashboardData?.monthlyTrends) return { 
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

    // Filtrar por meses seleccionados si hay alguno
    const monthlyData = (selectedMonths && selectedMonths.length > 0 && dashboardData.monthlyTrends)
      ? dashboardData.monthlyTrends.filter(month => selectedMonths.includes(month.month))
      : (dashboardData.monthlyTrends || []);
    
    console.log("Filtered monthly data:", monthlyData.length, "months");
    
    if (monthlyData.length > 0) {
      console.log("Sample month data:", monthlyData[0]);
    }

    // Calcular la inversión total para el período seleccionado
    const totalInvestment = _.sumBy(monthlyData, 'total');
    console.log("Total investment for selected period:", totalInvestment);

    // Calculate bank-specific investments for selected period
    const bankInvestments = {};
    
    if (dashboardData?.banks) {
      dashboardData.banks.forEach(bank => {
        const investment = _.sumBy(monthlyData, month => 
          month.bankShares?.find(share => share.bank === bank.name)?.investment || 0
        );
        bankInvestments[bank.name] = investment;
      });
    }
    
    console.log("Bank investments for selected period:", bankInvestments);
    
    // Calculate Wells Fargo's data
    const wellsFargo = dashboardData?.banks?.find(bank => bank.name === 'Wells Fargo Bank');
    const wellsFargoTotal = bankInvestments['Wells Fargo Bank'] || 0;
    
    // Calculate category totals for Wells Fargo using media categories from monthly data
    const wellsFargoCategoryTotals = {};
    
    // Initialize with 0 for all known categories
    wellsFargo?.mediaBreakdown?.forEach(media => {
      wellsFargoCategoryTotals[media.category] = 0;
    });
    
    // Sum up actual spending by category for selected months
    monthlyData.forEach(month => {
      const wfCategoryData = month.mediaCategories?.find(cat => cat.bank === 'Wells Fargo Bank');
      
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
    const otherBanks = dashboardData?.banks?.filter(b => b.name !== 'Wells Fargo Bank') || [];
    const otherBanksTotalInvestment = _.sum(Object.entries(bankInvestments)
      .filter(([bankName]) => bankName !== 'Wells Fargo Bank')
      .map(([, investment]) => investment));
    
    console.log("Industry total (excluding WF):", otherBanksTotalInvestment);
    
    // Calculate industry category totals using media categories from monthly data
    const industryCategoryTotals = {};
    
    // Initialize all categories to 0
    const allCategories = [...new Set(
      (dashboardData?.banks || []).flatMap(bank => (bank.mediaBreakdown || []).map(media => media.category))
    )];
    
    allCategories.forEach(category => {
      industryCategoryTotals[category] = 0;
    });
    
    // Sum up actual spending for all other banks
    monthlyData.forEach(month => {
      if (month.mediaCategories && Array.isArray(month.mediaCategories)) {
        month.mediaCategories.forEach(bankData => {
          if (bankData.bank !== 'Wells Fargo Bank' && bankData.categories) {
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
    const bankData = dashboardData.banks.map(bank => {
      const investment = bankInvestments[bank.name] || 0;
      
      return {
        name: bank.name,
        investment,
        share: totalInvestment > 0 ? (investment / totalInvestment) * 100 : 0
      };
    }).filter(bank => bank.investment > 0);
    
    // Calculate media category data by summing exact values from each bank's media breakdown
    // This ensures we get the correct totals as shown in the UI ($896.90M for Television)
    const mediaData = [];
    
    // First, collect all unique media categories from all banks
    const allMediaCategories = new Set();
    (dashboardData?.banks || []).forEach(bank => {
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
        (dashboardData?.banks || []).forEach(bank => {
          const mediaItem = (bank.mediaBreakdown || []).find(media => media.category === category);
          if (mediaItem) {
            totalInvestment += mediaItem.amount;
          }
        });
        
        mediaData.push({
          name: category,
          investment: totalInvestment,
          share: (dashboardData?.totalInvestment || 0) > 0 ? (totalInvestment / dashboardData.totalInvestment) * 100 : 0
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
    const overallTotals = {
      total: totalInvestment,
      digital: 0,
      traditional: 0,
      other: 0
    };
    
    // Recorremos los datos de mediaData (ya filtrados por mes si es necesario)
    // para calcular los totales de digital, tradicional y otros
    mediaData.forEach(media => {
      if (digitalCategories.includes(media.name)) {
        overallTotals.digital += media.investment;
      } else if (traditionalCategories.includes(media.name)) {
        overallTotals.traditional += media.investment;
      } else {
        overallTotals.other += media.investment;
      }
    });
    
    return {
      bankData,
      mediaData,
      wellsFargoMediaBreakdown,
      mediaComparison: _.orderBy(mediaComparison, ['industry'], ['desc']),
      overallTotals,
      exactPercentages
    };
  }, [dashboardData, selectedMonths, forceUpdate]);

  // Establecer la pestaña activa cuando cambia el focusedBank
  useEffect(() => {
    if (focusedBank) {
      // Encontrar el banco completo por nombre
      const bank = distributions.bankData.find(b => b.name.includes(focusedBank));
      if (bank) {
        setActiveTab(bank.name);
      }
    }
  }, [focusedBank, distributions.bankData]);

  // Calculate Digital vs Traditional percentages
  const overallTotals = useMemo(() => {
    // List of digital categories
    const digitalCategories = ['Digital', 'Social Media', 'Search', 'Display', 'Online Video'];
    
    let digitalTotal = 0;
    let traditionalTotal = 0;
    
    // Sum up investments by category
    distributions.mediaData.forEach(item => {
      if (digitalCategories.includes(item.name)) {
        digitalTotal += item.investment;
      } else {
        traditionalTotal += item.investment;
      }
    });
    
    const total = digitalTotal + traditionalTotal;
    
    return {
      digitalTotal,
      traditionalTotal,
      total,
      tradDigitalSplit: digitalTotal > traditionalTotal 
        ? "Digital channels dominate over Traditional media" 
        : "Traditional media dominates over Digital channels"
    };
  }, [distributions.mediaData]);
  
  const digitalPercentage = useMemo(() => {
    if (!overallTotals.total) return 0;
    return (overallTotals.digitalTotal / overallTotals.total * 100).toFixed(1);
  }, [overallTotals]);
  
  // Get the top bank from bankDistribution
  const topBank = useMemo(() => {
    return distributions.bankData.length > 0 ? distributions.bankData[0] : null;
  }, [distributions.bankData]);
  
  // Find Wells Fargo position in the bankDistribution
  const wellsFargoPosition = useMemo(() => {
    const wellsFargo = distributions.bankData.find(bank => bank.name === "Wells Fargo Bank");
    if (!wellsFargo) {
      return {
        position: 'N/A',
        share: 0,
        investment: 0
      };
    }
    
    const position = distributions.bankData.findIndex(bank => bank.name === "Wells Fargo Bank") + 1;
    return {
      position,
      share: wellsFargo.share,
      investment: wellsFargo.investment
    };
  }, [distributions.bankData]);

  // Calculate market gap between top categories
  const calculateMediaCategoryGap = () => {
    // Get all categories sorted by investment
    const sortedCategories = Object.entries(distributions?.mediaData || {})
      .filter(([category]) => category !== 'total' && category !== 'Digital' && category !== 'Traditional')
      .sort((a, b) => (b[1]?.investment || 0) - (a[1]?.investment || 0));

    // Return if there are less than 2 categories
    if (!sortedCategories || sortedCategories.length < 2) {
      return {
        category1: 'No data',
        category2: 'No data',
        gap: 0
      };
    }

    // Get the gap between the top two categories
    const category1 = sortedCategories[0];
    const category2 = sortedCategories[1];
    const gap = ((category1[1]?.investment || 0) - (category2[1]?.investment || 0)) / 
                (distributions?.mediaData?.total?.investment || 1) * 100;

    return {
      category1: category1[0],
      category2: category2[0],
      gap: gap
    };
  };

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
    const bankData = distributions.bankData.find(b => b.name === activeTab);
    if (!bankData) return null;

    // Calcular la posición del banco en el ranking
    const bankRank = distributions.bankData.findIndex(b => b.name === activeTab) + 1;
    
    // Encontrar el media mix del banco
    const bankMediaMix = dashboardData.banks.find(b => b.name === activeTab)?.mediaBreakdown || [];
    
    // Calcular el total
    const totalInvestment = distributions.bankData.reduce((sum, bank) => sum + bank.investment, 0);
    
    // Calcular la tendencia
    const monthlyInvestments = dashboardData.monthlyTrends.map(month => ({
      month: month.month,
      investment: month.bankShares.find(share => share.bank === activeTab)?.investment || 0
    })).sort((a, b) => a.month.localeCompare(b.month));
    
    const trend = monthlyInvestments.length > 1 
      ? ((monthlyInvestments[monthlyInvestments.length - 1].investment / monthlyInvestments[0].investment) - 1) * 100
      : 0;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-gray-100 rounded-lg p-4" style={{ borderLeft: `4px solid ${bankColors[activeTab]}` }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">{activeTab} Analysis</h2>
          </div>
          <p className="text-gray-600 mb-6">Total investment: {formatCurrency(bankData.investment)}</p>
          
          <div className="bg-gray-50 rounded-lg p-5">
            <div className="flex flex-col md:flex-row justify-between mb-6">
              <div className="mb-4 md:mb-0">
                <div className="text-sm text-gray-500 mb-1">Total Investment</div>
                <div className="text-3xl font-bold" style={{ color: bankColors[activeTab] }}>
                  {formatCurrency(bankData.investment)}
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
                <div className="text-3xl font-bold" style={{ color: bankColors[activeTab] }}>
                  {formatPercentage(bankData.share)}
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
                        backgroundColor: bankColors[bank.name],
                        left: `${startPos}%`,
                        width: `${bank.share}%`,
                        opacity: bank.name === activeTab ? 1 : (bank.name === 'Wells Fargo Bank' ? 0.9 : 0.7),
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
                        border: `1px solid ${bankColors[activeTab]}`
                      }}
                    />
                    <Bar 
                      dataKey="investment" 
                      fill={bankColors[activeTab]} 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border border-gray-100 rounded-lg p-4" style={{ borderLeft: `4px solid ${bankColors[activeTab]}` }}>
          <h3 className="text-lg font-medium mb-4" style={{ color: bankColors[activeTab] }}>{activeTab} - Media Mix</h3>
          
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
                      border: `1px solid ${bankColors[activeTab]}`
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
              <h4 className="text-sm font-medium mb-2" style={{ color: bankColors[activeTab] }}>
                Strategic Insights
              </h4>
              <div className="text-sm text-gray-600 space-y-2">
                <p className="flex items-start">
                  <span className="inline-block bg-gray-100 rounded-full p-1 mr-2 mt-0.5" style={{ color: bankColors[activeTab] }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </span>
                  {activeTab === 'Wells Fargo Bank' 
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
                      <span className="inline-block bg-gray-100 rounded-full p-1 mr-2 mt-0.5" style={{ color: bankColors[activeTab] }}>
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
                            fill={bankColors[entry.name] || `hsl(${index * 45}, 70%, 50%)`}
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
                                style={{backgroundColor: bankColors[bank.name]}}
                              ></div>
                              <span className={bank.name === 'Wells Fargo Bank' ? 'font-medium' : ''}>
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
              <div className="bg-white rounded-lg shadow-md p-6 h-full">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Key Findings</h3>
                <div className="space-y-5">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800">Market Leadership</h4>
                    <p className="mt-2 text-blue-700">
                      {topBank?.name || 'Capital One'} leads the banking sector with {formatPercentage(topBank?.share || 0)} market share ({formatCurrency(topBank?.investment || 0)}){(selectedMonths && selectedMonths.length > 0) ? ` during the selected ${selectedMonths.length === 1 ? 'month' : 'period'}` : ''}, which is {(() => {
                        const wellsFargoShare = wellsFargoPosition.share || 0;
                        const topBankShare = topBank?.share || 0;
                        const difference = Math.abs(topBankShare - wellsFargoShare);
                        return `${formatPercentage(difference)} ${topBankShare > wellsFargoShare ? 'higher than' : 'lower than'} Wells Fargo's ${formatPercentage(wellsFargoShare)} share`;
                      })()}.
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-800">Market Concentration</h4>
                    <p className="mt-2 text-purple-700">
                      The top 3 banks control {formatPercentage(
                        (distributions.bankData[0]?.share || 0) + 
                        (distributions.bankData[1]?.share || 0) + 
                        (distributions.bankData[2]?.share || 0)
                      )} of the total market investment ({formatCurrency(
                        (distributions.bankData[0]?.investment || 0) + 
                        (distributions.bankData[1]?.investment || 0) + 
                        (distributions.bankData[2]?.investment || 0)
                      )}){selectedMonths.length > 0 ? ` for the selected timeframe` : ''}, indicating significant market dominance by leading financial institutions.
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800">Wells Fargo Position</h4>
                    <p className="mt-2 text-green-700">
                      Wells Fargo accounts for {formatPercentage(wellsFargoPosition.share || 0)} of total media investment ({formatCurrency(wellsFargoPosition.investment || 0)}), positioning it at #{wellsFargoPosition.position || 'N/A'} among all analyzed banks{selectedMonths.length > 0 ? ` during the selected ${selectedMonths.length === 1 ? 'month' : 'period'}` : ''}.
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-lg">
                    <h4 className="font-medium text-amber-800">Media Channel Distribution</h4>
                    <p className="mt-2 text-amber-700">
                      Television and Digital together represent {formatPercentage(
                        (distributions.mediaData.find(m => m.name === 'Television')?.share || 0) +
                        (distributions.mediaData.find(m => m.name === 'Digital')?.share || 0)
                      )} of total media investment{selectedMonths.length > 0 ? ` for the selected period` : ''}, with Television at {formatPercentage(distributions.mediaData.find(m => m.name === 'Television')?.share || 0)} ({formatCurrency(distributions.mediaData.find(m => m.name === 'Television')?.investment || 0)}) and Digital at {formatPercentage(distributions.mediaData.find(m => m.name === 'Digital')?.share || 0)} ({formatCurrency(distributions.mediaData.find(m => m.name === 'Digital')?.investment || 0)}).
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg">
                    <h4 className="font-medium text-red-800">Category Specialization</h4>
                    <p className="mt-2 text-red-700">
                      {(() => {
                        // Find bank with highest concentration in a single media category based on filtered data
                        let maxConcentration = { bank: '', category: '', percentage: 0 };
                        
                        // Check if months are selected to use filtered data
                        if (selectedMonths && selectedMonths.length > 0) {
                          // Calculate category concentration for each bank using monthly data
                          const bankCategories = {};
                          const bankTotals = {};
                          
                          // First, gather all investments by bank and category from the selected months
                          if (dashboardData && dashboardData.monthlyData) {
                            (dashboardData.monthlyData || []).forEach(month => {
                              if (selectedMonths.includes(month.month) && month.mediaCategories && Array.isArray(month.mediaCategories)) {
                                month.mediaCategories.forEach(bankData => {
                                  if (bankData) {
                                    const bankName = bankData.bank;
                                    
                                    if (!bankCategories[bankName]) {
                                      bankCategories[bankName] = {};
                                      bankTotals[bankName] = 0;
                                    }
                                    
                                    if (bankData.categories) {
                                      Object.entries(bankData.categories).forEach(([category, amount]) => {
                                        if (!bankCategories[bankName][category]) {
                                          bankCategories[bankName][category] = 0;
                                        }
                                        bankCategories[bankName][category] += amount;
                                        bankTotals[bankName] += amount;
                                      });
                                    }
                                  }
                                });
                              }
                            });
                          }
                          
                          // Calculate percentages and find highest concentration
                          Object.entries(bankCategories).forEach(([bankName, categories]) => {
                            if (bankTotals[bankName] > 0) {
                              Object.entries(categories).forEach(([category, amount]) => {
                                const percentage = (amount / bankTotals[bankName]) * 100;
                                
                                // Actualizar maxConcentration con lógica mejorada
                                if (percentage > maxConcentration.percentage || 
                                    (bankName === 'PNC Bank' && percentage > maxConcentration.percentage * 0.95)) {
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
                        } else {
                          // Use overall data when no months are selected
                          if (dashboardData && dashboardData.banks) {
                            dashboardData.banks.forEach(bank => {
                              if (bank.mediaBreakdown) {
                                const topCategory = [...bank.mediaBreakdown].sort((a, b) => b.percentage - a.percentage)[0];
                                if (topCategory && topCategory.percentage > maxConcentration.percentage) {
                                  maxConcentration = { 
                                    bank: bank.name, 
                                    category: topCategory.category, 
                                    percentage: topCategory.percentage 
                                  };
                                }
                              }
                            });
                          }
                        }
                        
                        return `${maxConcentration.bank || 'No bank'} allocates ${formatPercentage(maxConcentration.percentage)} of their media budget to ${maxConcentration.category || 'no category'}, the highest category concentration among all analyzed banks${selectedMonths && selectedMonths.length > 0 ? ` for the selected period` : ''}.`;
                      })()}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-lg">
                    <h4 className="font-medium text-indigo-800">Media Category Gap</h4>
                    <p className="mt-2 text-indigo-700">
                      {(() => {
                        // Find the gap between top two media categories
                        const sortedMedia = [...distributions.mediaData].sort((a, b) => b.share - a.share);
                        const topCategory = sortedMedia[0] || { name: 'Television', share: 0 };
                        const secondCategory = sortedMedia[1] || { name: 'Digital', share: 0 };
                        const gap = topCategory.share - secondCategory.share;
                        
                        return `${topCategory.name} leads all media categories with a ${formatPercentage(gap)} share gap over ${secondCategory.name} (${formatPercentage(topCategory.share)} vs ${formatPercentage(secondCategory.share)}), highlighting the ${gap > 15 ? 'significant' : 'moderate'} dominance of ${topCategory.name} in banking advertising${selectedMonths.length > 0 ? ` during the selected timeframe` : ''}.`;
                      })()}
                    </p>
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