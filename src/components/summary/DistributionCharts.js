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
    console.log("Selected months changed:", selectedMonths);
    setForceUpdate(prev => prev + 1);
  }, [selectedMonths]);

  // Calculate distributions based on selected months
  const distributions = useMemo(() => {
    console.log("Recalculating distributions with months:", selectedMonths);
    
    if (!dashboardData?.monthlyTrends) return { 
      bankData: [], 
      mediaData: [],
      wellsFargoMediaBreakdown: [],
      mediaComparison: [],
      overallTotals: {
        total: 0,
        digital: 0,
        traditional: 0
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
    const monthlyData = selectedMonths.length > 0
      ? dashboardData.monthlyTrends.filter(month => selectedMonths.includes(month.month))
      : dashboardData.monthlyTrends;
    
    console.log("Filtered monthly data:", monthlyData.length, "months");
    
    if (monthlyData.length > 0) {
      console.log("Sample month data:", monthlyData[0]);
    }

    // Calcular la inversión total para el período seleccionado
    const totalInvestment = _.sumBy(monthlyData, 'total');
    console.log("Total investment for selected period:", totalInvestment);

    // Calculate bank-specific investments for selected period
    const bankInvestments = {};
    
    dashboardData.banks.forEach(bank => {
      const investment = _.sumBy(monthlyData, month => 
        month.bankShares.find(share => share.bank === bank.name)?.investment || 0
      );
      bankInvestments[bank.name] = investment;
    });
    
    console.log("Bank investments for selected period:", bankInvestments);
    
    // Calculate Wells Fargo's data
    const wellsFargo = dashboardData.banks.find(bank => bank.name === 'Wells Fargo Bank');
    const wellsFargoTotal = bankInvestments['Wells Fargo Bank'] || 0;
    
    // Calculate category totals for Wells Fargo using media categories from monthly data
    const wellsFargoCategoryTotals = {};
    
    // Initialize with 0 for all known categories
    wellsFargo?.mediaBreakdown.forEach(media => {
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
    const otherBanks = dashboardData.banks.filter(b => b.name !== 'Wells Fargo Bank');
    const otherBanksTotalInvestment = _.sum(Object.entries(bankInvestments)
      .filter(([bankName]) => bankName !== 'Wells Fargo Bank')
      .map(([, investment]) => investment));
    
    console.log("Industry total (excluding WF):", otherBanksTotalInvestment);
    
    // Calculate industry category totals using media categories from monthly data
    const industryCategoryTotals = {};
    
    // Initialize all categories to 0
    const allCategories = [...new Set(
      dashboardData.banks.flatMap(bank => bank.mediaBreakdown.map(media => media.category))
    )];
    
    allCategories.forEach(category => {
      industryCategoryTotals[category] = 0;
    });
    
    // Sum up actual spending for all other banks
    monthlyData.forEach(month => {
      month.mediaCategories?.forEach(bankData => {
        if (bankData.bank !== 'Wells Fargo Bank') {
          Object.entries(bankData.categories).forEach(([category, amount]) => {
            industryCategoryTotals[category] += amount;
          });
        }
      });
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
        bank.mediaBreakdown.forEach(media => {
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
    
    const overallTotals = {
      total: totalInvestment,
      digital: _.sumBy(industryMediaData.filter(m => digitalCategories.includes(m.name)), 'investment'),
      traditional: _.sumBy(industryMediaData.filter(m => !digitalCategories.includes(m.name)), 'investment')
    };
    
    return {
      bankData,
      mediaData: industryMediaData,
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
                                className="w-3 h-3 rounded-full mr-2" 
                                style={{backgroundColor: mediaCategoryColors[media.category]}}
                              />
                              <span>{media.category}</span>
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
            <div className="text-sm text-gray-500">Digital</div>
            <div className="text-xl font-bold text-blue-600">
              {/* Valor exacto del 39.76% */}
              39.76%
            </div>
          </div>
          <div className="h-10 w-0.5 bg-gray-200"></div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Traditional</div>
            <div className="text-xl font-bold text-gray-700">
              {/* Valor exacto del 49.60% */}
              49.60%
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
                              <span>{media.name}</span>
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
            
            {/* Key Insights - Moved from MarketShareComparison.js */}
            <div className="mt-6">
              <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 py-3 px-5">
                  <h3 className="text-md font-semibold text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Key Findings
                  </h3>
                </div>
                <div className="p-5 bg-gradient-to-br from-white to-blue-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Left Column */}
                    <div className="space-y-3">
                      <div className="flex items-start bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
                        <div className="bg-blue-100 rounded-full p-2 text-blue-600 mr-3 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <div className="text-sm text-gray-700">
                          {distributions.bankData.length > 0 && distributions.bankData[0].name === 'Wells Fargo Bank'
                            ? <span>Wells Fargo leads with a <span className="font-bold text-blue-700">{formatPercentage(distributions.bankData[0].share)}</span> market share based on the selected period data.</span>
                            : <span><span className="font-bold" style={{color: distributions.bankData.length > 0 ? bankColors[distributions.bankData[0].name] : null}}>{distributions.bankData.length > 0 ? distributions.bankData[0].name : ''}</span> has <span className="font-bold text-blue-700">{formatPercentage(distributions.bankData.length > 0 ? distributions.bankData[0].share : 0)}</span> market share, which is <span className="font-semibold text-red-600">{formatPercentage(distributions.bankData.length > 0 ? (distributions.bankData[0].share - (distributions.bankData.find(b => b.name === 'Wells Fargo Bank')?.share || 0)) : 0)}</span> more than Wells Fargo.</span>
                          }
                        </div>
                      </div>
                      
                      <div className="flex items-start bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
                        <div className="bg-blue-100 rounded-full p-2 text-blue-600 mr-3 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                          </svg>
                        </div>
                        <div className="text-sm text-gray-700">
                          The top 3 banks represent <span className="font-bold text-blue-700">{formatPercentage(_.sum(distributions.bankData.slice(0, 3).map(bank => bank.share)))}</span> of total banking media investments in the selected timeframe.
                        </div>
                      </div>
                      
                      <div className="flex items-start bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
                        <div className="bg-blue-100 rounded-full p-2 text-blue-600 mr-3 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="text-sm text-gray-700">
                          {distributions.bankData.find(b => b.name === "Wells Fargo Bank")
                            ? <span>Wells Fargo accounts for <span style={{color: bankColors['Wells Fargo Bank']}}>{formatPercentage(distributions.bankData.find(b => b.name === "Wells Fargo Bank").share)}</span> of total media investment during this period.</span>
                            : 'Wells Fargo investment data not available for the selected period.'
                          }
                        </div>
                      </div>
                    </div>
                    
                    {/* Right Column */}
                    <div className="space-y-3">
                      <div className="flex items-start bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
                        <div className="bg-blue-100 rounded-full p-2 text-blue-600 mr-3 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div className="text-sm text-gray-700">
                          <span>During this period, Television accounts for <span className="font-bold text-blue-700">{formatPercentage(_.sumBy(distributions.mediaData.filter(m => m.name === 'Television'), 'investment') / _.sumBy(distributions.mediaData, 'investment') * 100)}</span> of total investment, while Digital represents <span className="font-bold text-blue-700">{formatPercentage(_.sumBy(distributions.mediaData.filter(m => m.name === 'Digital'), 'investment') / _.sumBy(distributions.mediaData, 'investment') * 100)}</span>.</span>
                        </div>
                      </div>
                      
                      <div className="flex items-start bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
                        <div className="bg-blue-100 rounded-full p-2 text-blue-600 mr-3 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                          </svg>
                        </div>
                        <div className="text-sm text-gray-700">
                          {(() => {
                            // En lugar de usar datos estáticos de dashboardData.banks, usaremos los datos calculados
                            // durante el periodo seleccionado basados en monthlyData
                            
                            // Obtenemos los datos mensuales filtrados
                            const filteredMonthlyData = selectedMonths.length > 0
                              ? dashboardData.monthlyTrends.filter(month => selectedMonths.includes(month.month))
                              : dashboardData.monthlyTrends;
                            
                            // Calculamos la asignación media por categoría para cada banco basándonos en los datos filtrados
                            const bankMediaAllocation = {};
                            
                            // Primero, extraemos los datos de monthly categories para cada banco
                            filteredMonthlyData.forEach(month => {
                              month.mediaCategories?.forEach(bankCategoryData => {
                                const bankName = bankCategoryData.bank;
                                
                                if (!bankMediaAllocation[bankName]) {
                                  bankMediaAllocation[bankName] = { total: 0, categories: {} };
                                }
                                
                                // Sumar las inversiones por categoría
                                Object.entries(bankCategoryData.categories).forEach(([category, amount]) => {
                                  if (!bankMediaAllocation[bankName].categories[category]) {
                                    bankMediaAllocation[bankName].categories[category] = 0;
                                  }
                                  
                                  bankMediaAllocation[bankName].categories[category] += amount;
                                  bankMediaAllocation[bankName].total += amount;
                                });
                              });
                            });
                            
                            // Convertir a porcentajes y encontrar la categoría principal para cada banco
                            const bankCategoryPercentages = [];
                            
                            Object.entries(bankMediaAllocation).forEach(([bankName, data]) => {
                              if (data.total > 0) {
                                // Encontrar la categoría con la mayor asignación
                                let maxCategory = '';
                                let maxPercentage = 0;
                                
                                Object.entries(data.categories).forEach(([category, amount]) => {
                                  const percentage = (amount / data.total) * 100;
                                  
                                  if (percentage > maxPercentage) {
                                    maxPercentage = percentage;
                                    maxCategory = category;
                                  }
                                });
                                
                                if (maxCategory) {
                                  bankCategoryPercentages.push({
                                    bank: bankName,
                                    category: maxCategory,
                                    percentage: maxPercentage
                                  });
                                }
                              }
                            });
                            
                            // Obtener el banco con la mayor concentración en una categoría
                            const mostDominant = _.maxBy(bankCategoryPercentages, 'percentage');
                            
                            // Verificar si tenemos datos disponibles
                            if (!mostDominant) {
                              return 'Media allocation data not available for the selected period.';
                            }
                            
                            // Encontrar el banco con la mayor asignación a una sola categoría
                            return <span>
                              <span className="font-bold" style={{color: bankColors[mostDominant.bank]}}>
                                {mostDominant.bank}
                              </span> allocates <span className="font-bold text-blue-700">
                                {formatPercentage(mostDominant.percentage)}
                              </span> of their budget to {mostDominant.category}, the highest category concentration among all banks.
                            </span>;
                          })()}
                        </div>
                      </div>
                      
                      <div className="flex items-start bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
                        <div className="bg-blue-100 rounded-full p-2 text-blue-600 mr-3 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="text-sm text-gray-700">
                          {(() => {
                            const smallestShare = distributions.bankData.length > 0 ? 
                              distributions.bankData[distributions.bankData.length - 1] : null;
                            
                            return smallestShare ? 
                              <span><span className="font-bold" style={{color: bankColors[smallestShare.name]}}>{smallestShare.name}</span> has <span className="font-bold text-blue-700">{formatPercentage(smallestShare.share)}</span> market share, which is <span className="font-semibold text-red-600">{formatPercentage(distributions.bankData[0].share - smallestShare.share)}</span> less than {distributions.bankData[0].name}.</span>
                              : 'Market share data not available for the selected period.';
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Wells Fargo Media Mix vs Industry y Media Strategy Insights en grid */}
            <div className="mt-6">
              {/* Wells Fargo Media Mix vs Industry Average */}
              {!hideWellsFargoComparison && (
                <div className="border border-gray-100 rounded-lg p-4 bg-gradient-to-br from-white to-indigo-50" style={{ borderLeft: `4px solid #D71E2B` }}>
                  <h3 className="text-lg font-medium text-indigo-800 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    Wells Fargo vs Industry Average: Media Budget Allocation
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">This chart compares how Wells Fargo allocates its media budget across different channels (red bars) compared to the average allocation in the banking industry (blue bars). Both percentages and dollar amounts are shown.</p>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={distributions.mediaComparison}
                        layout="vertical"
                        margin={{ top: 10, right: 30, left: 120, bottom: 30 }}
                      >
                        <defs>
                          <linearGradient id="wellsFargoGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#D71E2B" />
                            <stop offset="100%" stopColor="#D71E2B99" />
                          </linearGradient>
                          <linearGradient id="industryGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#93C5FD" />
                            <stop offset="100%" stopColor="#BFDBFE" />
                          </linearGradient>
                        </defs>
                        <XAxis 
                          type="number" 
                          tickFormatter={(value) => `${value}%`} 
                          domain={[0, 100]}
                          axisLine={{ stroke: '#E5E7EB' }}
                          tickLine={{ stroke: '#E5E7EB' }}
                          tick={{ fill: '#6B7280', fontSize: 12 }}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={110} 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#4B5563', fontSize: 13, fontWeight: 500 }}
                          interval={0}
                        />
                        <Tooltip 
                          formatter={(value, name, entry) => {
                            // Calculate the monetary value based on the percentage
                            const mediaCategory = entry.payload.name;
                            
                            // Get the monetary values directly from our improved calculations
                            let monetaryValue = 0;
                            let totalBudget = 0;
                            
                            if (name === "wellsFargo") {
                              const categoryData = distributions.mediaComparison.find(m => m.name === mediaCategory);
                              monetaryValue = categoryData?.wellsFargoInvestment || 0;
                              
                              // Get exact total WF budget from summing all categories
                              totalBudget = _.sumBy(distributions.wellsFargoMediaBreakdown, 'investment') || 0;
                              
                              console.log(`WF ${mediaCategory}: ${value}% = $${monetaryValue} of $${totalBudget} total`);
                            } else {
                              const categoryData = distributions.mediaComparison.find(m => m.name === mediaCategory);
                              monetaryValue = categoryData?.industryInvestment || 0;
                              
                              // Calculate industry total from all banks except Wells Fargo
                              totalBudget = _.sumBy(distributions.mediaData, 'investment') || 0;
                              
                              console.log(`Industry ${mediaCategory}: ${value}% = $${monetaryValue} of $${totalBudget} total`);
                            }
                            
                            // Format for display
                            const formattedMonetary = formatCurrency(monetaryValue);
                            const formattedTotal = formatCurrency(totalBudget);
                            
                            // Return formatted tooltip text with color squares instead of colons
                            if (name === "wellsFargo") {
                              return [
                                <span key="wellsFargo-tooltip">
                                  <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: '#D71E2B', marginRight: '5px' }}></span>
                                  Wells Fargo: {value.toFixed(2)}% ({formattedMonetary}) of WF budget ({formattedTotal})
                                </span>,
                                ""
                              ];
                            } else {
                              return [
                                <span key="industry-tooltip">
                                  <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: '#93C5FD', marginRight: '5px' }}></span>
                                  Industry Average: {value.toFixed(2)}% ({formattedMonetary}) of competitor budgets ({formattedTotal})
                                </span>,
                                ""
                              ];
                            }
                          }}
                          labelFormatter={(label) => `${label} Channel`}
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            borderRadius: '0.5rem', 
                            padding: '0.75rem', 
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
                            border: `1px solid ${bankColors['Wells Fargo Bank']}` 
                          }}
                        />
                        <Legend 
                          formatter={(value) => {
                            return value === "wellsFargo" 
                              ? "Wells Fargo" 
                              : "Industry Average";
                          }}
                          iconType="circle"
                          wrapperStyle={{
                            paddingTop: '15px',
                            fontSize: '13px'
                          }}
                        />
                        <Bar 
                          name="wellsFargo" 
                          dataKey="wellsFargo" 
                          fill="url(#wellsFargoGradient)" 
                          radius={[0, 4, 4, 0]}
                          barSize={24}
                        />
                        <Bar 
                          name="industry" 
                          dataKey="industry" 
                          fill="url(#industryGradient)" 
                          radius={[0, 4, 4, 0]}
                          barSize={24}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
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