import React, { useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { useDashboard } from '../../context/DashboardContext';
import { chartColors } from '../../utils/bankColors';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
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
const DistributionCharts = () => {
  const { dashboardData, loading, selectedMonths, focusedBank } = useDashboard();
  const [activeTab, setActiveTab] = React.useState('overview');

  // Media category colors
  const categoryColors = useMemo(() => ({
    'Digital': '#4F46E5',    // Indigo
    'Television': '#2563EB', // Azul
    'Audio': '#0EA5E9',      // Sky blue
    'Print': '#8B5CF6',      // Violeta
    'Outdoor': '#A855F7',    // Morado
    'Other': '#D946EF'       // Fucsia
  }), []);

  // Calculate distributions based on selected months
  const distributions = useMemo(() => {
    if (!dashboardData?.monthlyTrends) return { 
      bankData: [], 
      mediaData: [],
      wellsFargoMediaBreakdown: [],
      mediaComparison: [],
      overallTotals: {
        total: 0,
        digital: 0,
        traditional: 0
      }
    };

    // Filter data by selected months
    const monthlyData = selectedMonths.length > 0
      ? dashboardData.monthlyTrends.filter(month => selectedMonths.includes(month.month))
      : dashboardData.monthlyTrends;

    // Calculate total investment for the period
    const totalInvestment = _.sumBy(monthlyData, 'total');

    // Calculate bank distribution
    const bankData = dashboardData.banks.map(bank => {
      const investment = _.sumBy(monthlyData, month => 
        month.bankShares.find(share => share.bank === bank.name)?.investment || 0
      );
      
      // Calculate media breakdown for this bank
      const mediaBreakdown = bank.mediaBreakdown.map(media => ({
        ...media,
        // Calculate actual investment based on total bank investment in selected period
        actualInvestment: (media.percentage / 100) * investment
      }));
      
      return {
        name: bank.name,
        investment,
        share: totalInvestment > 0 ? (investment / totalInvestment) * 100 : 0,
        mediaBreakdown
      };
    }).filter(bank => bank.investment > 0);

    // Calculate media distribution
    const mediaData = _.uniqBy(
      dashboardData.banks.flatMap(bank => bank.mediaBreakdown),
      'category'
    ).map(media => {
      const total = _.sumBy(dashboardData.banks, bank => {
        const mediaShare = bank.mediaBreakdown.find(m => m.category === media.category);
        if (!mediaShare) return 0;
        
        // Calculate the proportion of bank's investment in this media for selected months
        const bankTotal = _.sumBy(monthlyData, month => 
          month.bankShares.find(share => share.bank === bank.name)?.investment || 0
        );
        return (mediaShare.percentage / 100) * bankTotal;
      });

      return {
        name: media.category,
        investment: total,
        share: totalInvestment > 0 ? (total / totalInvestment) * 100 : 0
      };
    }).filter(media => media.investment > 0);

    // Get Wells Fargo's media breakdown
    const wellsFargo = dashboardData.banks.find(bank => bank.name === 'Wells Fargo Bank');
    const wellsFargoTotal = _.sumBy(monthlyData, month => 
      month.bankShares.find(share => share.bank === 'Wells Fargo Bank')?.investment || 0
    );
    
    const wellsFargoMediaBreakdown = wellsFargo?.mediaBreakdown.map(media => ({
      name: media.category,
      investment: (media.percentage / 100) * wellsFargoTotal,
      share: media.percentage,
      color: categoryColors[media.category] || '#9CA3AF'
    })) || [];

    // Create media comparison data between Wells Fargo and industry average
    const mediaComparison = _.uniqBy(
      dashboardData.banks.flatMap(bank => bank.mediaBreakdown),
      'category'
    ).map(media => {
      // Wells Fargo percentage 
      const wellsFargoMedia = wellsFargo?.mediaBreakdown.find(m => m.category === media.category);
      const wellsFargoPercentage = wellsFargoMedia?.percentage || 0;

      // Industry average (excluding Wells Fargo)
      const otherBanks = dashboardData.banks.filter(b => b.name !== 'Wells Fargo Bank');
      const otherBanksWithMedia = otherBanks.filter(b => 
        b.mediaBreakdown.some(m => m.category === media.category)
      );
      
      let industryAverage = 0;
      if (otherBanksWithMedia.length > 0) {
        // Calculate weighted average based on each bank's investment in selected period
        const otherBanksTotalInvestment = _.sumBy(otherBanks, bank => {
          return _.sumBy(monthlyData, month => 
            month.bankShares.find(share => share.bank === bank.name)?.investment || 0
          );
        });

        if (otherBanksTotalInvestment > 0) {
          industryAverage = _.sumBy(otherBanks, bank => {
            const bankInvestment = _.sumBy(monthlyData, month => 
              month.bankShares.find(share => share.bank === bank.name)?.investment || 0
            );
            const mediaItem = bank.mediaBreakdown.find(m => m.category === media.category);
            return mediaItem ? (mediaItem.percentage * bankInvestment / otherBanksTotalInvestment) : 0;
          });
        }
      }

      return {
        name: media.category,
        wellsFargo: wellsFargoPercentage,
        industry: industryAverage,
        difference: wellsFargoPercentage - industryAverage
      };
    });

    // Calculate the totals for digital vs traditional
    const digitalCategories = ['Digital', 'Social Media', 'Search', 'Online Video', 'Display'];
    const overallTotals = {
      total: totalInvestment,
      digital: _.sumBy(mediaData.filter(m => digitalCategories.includes(m.name)), 'investment'),
      traditional: _.sumBy(mediaData.filter(m => !digitalCategories.includes(m.name)), 'investment')
    };

    return {
      bankData,
      mediaData,
      wellsFargoMediaBreakdown,
      mediaComparison: _.orderBy(mediaComparison, ['industry'], ['desc']),
      overallTotals
    };
  }, [dashboardData, selectedMonths, categoryColors]);

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
        <div className="border border-gray-100 rounded-lg p-4" style={{ borderLeft: `4px solid ${chartColors[activeTab]}` }}>
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
                <div className="text-3xl font-bold" style={{ color: chartColors[activeTab] }}>
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
                <div className="text-3xl font-bold" style={{ color: chartColors[activeTab] }}>
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
                        backgroundColor: chartColors[bank.name],
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
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} 
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
                        fill={categoryColors[entry.category]} 
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
                                className="w-3 h-3 rounded-full mr-2" 
                                style={{backgroundColor: categoryColors[media.category]}}
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
                      <span className="inline-block bg-gray-100 rounded-full p-1 mr-2 mt-0.5" style={{ color: chartColors[activeTab] }}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </span>
                      {activeTab}'s media strategy shows significant deviations from industry average, indicating a highly differentiated approach.
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
              {formatPercentage(distributions.overallTotals.digital / distributions.overallTotals.total * 100)}
            </div>
          </div>
          <div className="h-10 w-0.5 bg-gray-200"></div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Traditional</div>
            <div className="text-xl font-bold text-gray-700">
              {formatPercentage(distributions.overallTotals.traditional / distributions.overallTotals.total * 100)}
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
                <div className="grid grid-cols-2 gap-4">
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
                              fill={categoryColors[entry.name] || `hsl(${index * 45}, 70%, 50%)`}
                              stroke="white"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Media Investment Insights</h4>
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded-lg border border-gray-100">
                        <div className="flex items-center text-sm text-gray-600">
                          <div className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: categoryColors['Television']}}></div>
                          <span>Television leads with {formatPercentage(distributions.mediaData.find(m => m.name === 'Television')?.share || 0)} share, indicating strong focus on mass reach</span>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-100">
                        <div className="flex items-center text-sm text-gray-600">
                          <div className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: categoryColors['Digital']}}></div>
                          <span>Digital represents {formatPercentage(distributions.mediaData.find(m => m.name === 'Digital')?.share || 0)} of total investment</span>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-100">
                        <div className="flex items-center text-sm text-gray-600">
                          <div className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: categoryColors['Audio']}}></div>
                          <span>Audio and Print combined: {formatPercentage((distributions.mediaData.find(m => m.name === 'Audio')?.share || 0) + (distributions.mediaData.find(m => m.name === 'Print')?.share || 0))}</span>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-100">
                        <div className="flex items-center text-sm text-gray-600">
                          <div className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: categoryColors['Outdoor']}}></div>
                          <span>Outdoor and Cinema: {formatPercentage((distributions.mediaData.find(m => m.name === 'Outdoor')?.share || 0) + (distributions.mediaData.find(m => m.name === 'Cinema')?.share || 0))}</span>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-100">
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="text-blue-600 mr-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </span>
                          <span>Traditional media: {formatPercentage(100 - (distributions.mediaData.find(m => m.name === 'Digital')?.share || 0))} of mix</span>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-100">
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="text-purple-600 mr-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                            </svg>
                          </span>
                          <span>Emerging channels (Streaming): {formatPercentage(distributions.mediaData.find(m => m.name === 'Streaming')?.share || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
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
                                style={{backgroundColor: categoryColors[media.name]}}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
                  <ul className="space-y-3 text-sm text-gray-700">
                    <li className="flex items-start bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
                      <div className="bg-blue-100 rounded-full p-2 text-blue-600 mr-3 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div>
                        {distributions.bankData.length > 0 && distributions.bankData[0].name === 'Wells Fargo Bank'
                          ? <span>Wells Fargo leads with a <span className="font-bold text-blue-700">{formatPercentage(distributions.bankData[0].share)}</span> market share, capturing the majority of banking media investments.</span>
                          : <span><span className="font-bold" style={{color: distributions.bankData.length > 0 ? chartColors[distributions.bankData[0].name] : null}}>{distributions.bankData.length > 0 ? distributions.bankData[0].name : ''}</span> leads with {formatPercentage(distributions.bankData.length > 0 ? distributions.bankData[0].share : 0)} market share, surpassing Wells Fargo by <span className="font-semibold text-red-600">{formatPercentage(distributions.bankData.length > 0 ? (distributions.bankData[0].share - (distributions.bankData.find(b => b.name === 'Wells Fargo Bank')?.share || 0)) : 0)}</span>.</span>
                        }
                      </div>
                    </li>
                    <li className="flex items-start bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
                      <div className="bg-blue-100 rounded-full p-2 text-blue-600 mr-3 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                      </div>
                      <div>
                        The top 3 banks control <span className="font-bold text-blue-700">{formatPercentage(_.sum(distributions.bankData.slice(0, 3).map(bank => bank.share)))}</span> of total banking media investments.
                      </div>
                    </li>
                    <li className="flex items-start bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
                      <div className="bg-blue-100 rounded-full p-2 text-blue-600 mr-3 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        {distributions.bankData.find(b => b.name === "Wells Fargo Bank")
                          ? <span>The investment intensity of Wells Fargo (<span style={{color: chartColors['Wells Fargo Bank']}}>{formatPercentage(distributions.bankData.find(b => b.name === "Wells Fargo Bank").share)}</span>) is <span className="font-bold px-2 py-0.5 rounded" style={{
                              color: 'white',
                              backgroundColor: distributions.bankData.find(b => b.name === "Wells Fargo Bank").share > 20 
                                ? '#047857' 
                                : distributions.bankData.find(b => b.name === "Wells Fargo Bank").share > 15 
                                  ? '#0369a1' 
                                  : '#b91c1c'
                            }}>
                              {distributions.bankData.find(b => b.name === "Wells Fargo Bank").share > 20 
                                ? 'strong' 
                                : distributions.bankData.find(b => b.name === "Wells Fargo Bank").share > 15 
                                  ? 'moderate' 
                                  : 'below market leaders'}
                            </span></span>
                          : 'Wells Fargo investment data not available for the selected period.'
                        }
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 py-3 px-5">
                  <h3 className="text-md font-semibold text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Strategic Implications
                  </h3>
                </div>
                <div className="p-5 bg-gradient-to-br from-white to-purple-50">
                  <ul className="space-y-3 text-sm text-gray-700">
                    <li className="flex items-start bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:border-purple-200 transition-colors">
                      <div className="bg-purple-100 rounded-full p-2 text-purple-600 mr-3 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div>
                        {distributions.bankData.findIndex(b => b.name === 'Wells Fargo') <= 1 
                          ? <span>Maintain premium positioning with strategic investments in high ROI media channels.</span>
                          : <span>Consider increasing media investment to improve competitive positioning against market leaders.</span>
                        }
                      </div>
                    </li>
                    <li className="flex items-start bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:border-purple-200 transition-colors">
                      <div className="bg-purple-100 rounded-full p-2 text-purple-600 mr-3 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        {(() => {
                          const leaderShare = distributions.bankData.length > 0 ? distributions.bankData[0].share : 0;
                          const wellsFargoShare = distributions.bankData.find(b => b.name === 'Wells Fargo')?.share || 0;
                          const gapToLeader = leaderShare - wellsFargoShare;
                          const isWellsFargoLeader = distributions.bankData.length > 0 && distributions.bankData[0].name === 'Wells Fargo';
                          
                          if (gapToLeader > 50 && !isWellsFargoLeader) {
                            return <span>A significant <span className="font-bold text-white bg-red-600 px-2 py-0.5 rounded">increase</span> in investment is required to challenge market leadership.</span>;
                          } else if (gapToLeader > 20 && !isWellsFargoLeader) {
                            return <span>A <span className="font-bold text-purple-600">moderate</span> increase in investment could reduce the gap with market leaders.</span>;
                          } else {
                            return <span>Current investment levels are <span className="font-bold text-white bg-green-600 px-2 py-0.5 rounded">competitive</span> with market leaders.</span>;
                          }
                        })()}
                      </div>
                    </li>
                    <li className="flex items-start bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:border-purple-200 transition-colors">
                      <div className="bg-purple-100 rounded-full p-2 text-purple-600 mr-3 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div>
                        Market concentration analysis suggests {
                          _.sum(distributions.bankData.slice(0, 3).map(b => b.share)) > 75
                            ? <span><span className="font-bold text-red-600">highly concentrated</span> market with limited opportunities for smaller players.</span>
                            : <span>opportunities for targeted investments in underserved segments.</span>
                        }
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Wells Fargo Media Mix vs Industry y Media Strategy Insights en grid */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Wells Fargo Media Mix vs Industry Average */}
              <div className="border border-gray-100 rounded-lg p-4 bg-gradient-to-br from-white to-indigo-50" style={{ borderLeft: `4px solid ${chartColors['Wells Fargo Bank']}` }}>
                <h3 className="text-lg font-medium text-indigo-800 mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                  Wells Fargo Media Mix vs Industry Average
                </h3>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={distributions.mediaComparison}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 120, bottom: 30 }}
                    >
                      <defs>
                        <linearGradient id="wellsFargoGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor={chartColors['Wells Fargo Bank']} />
                          <stop offset="100%" stopColor={`${chartColors['Wells Fargo Bank']}99`} />
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
                        formatter={(value, name) => [
                          `${value.toFixed(1)}%`, 
                          name === "wellsFargo" ? "Wells Fargo" : "Industry Avg."
                        ]}
                        labelFormatter={(label) => `${label}`}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          borderRadius: '0.5rem', 
                          padding: '0.75rem', 
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
                          border: `1px solid ${chartColors['Wells Fargo Bank']}` 
                        }}
                      />
                      <Bar 
                        name="Wells Fargo" 
                        dataKey="wellsFargo" 
                        fill="url(#wellsFargoGradient)" 
                        radius={[0, 4, 4, 0]}
                        barSize={24}
                      />
                      <Bar 
                        name="Industry Avg." 
                        dataKey="industry" 
                        fill="url(#industryGradient)" 
                        radius={[0, 4, 4, 0]}
                        barSize={24}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Media Strategy Insights */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-100 shadow-sm">
                <h4 className="font-medium text-indigo-700 mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Media Strategy Insights
                </h4>
                
                <div className="text-sm space-y-3 text-gray-700">
                  <p className="flex items-start">
                    <span className="inline-block bg-indigo-100 text-red-600 p-1 rounded-full mr-2 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                    {(() => {
                      const digitalData = distributions.mediaComparison.find(m => m.name === 'Digital');
                      if (!digitalData) return '';
                      
                      if (digitalData.wellsFargo > digitalData.industry + 5) {
                        return `Wells Fargo shows strong leadership in Digital investment (${formatPercentage(digitalData.wellsFargo)}), exceeding industry average by ${formatPercentage(digitalData.difference)}. This dominant position in digital channels suggests a modern, future-oriented strategy, particularly effective in reaching younger, tech-savvy audiences.`;
                      } else if (digitalData.wellsFargo < digitalData.industry - 5) {
                        return `Wells Fargo's Digital investment (${formatPercentage(digitalData.wellsFargo)}) is ${formatPercentage(Math.abs(digitalData.difference))} below industry average, representing a significant opportunity to increase digital presence. Specific investments in search marketing, social media, and programmatic advertising are recommended to close this gap.`;
                      } else {
                        return `Wells Fargo's Digital investment (${formatPercentage(digitalData.wellsFargo)}) aligns with industry average. To maintain competitiveness, continuous monitoring of emerging digital trends and adjustment of distribution across digital sub-channels based on consumer behavior is suggested.`;
                      }
                    })()}
                  </p>
                  
                  <p className="flex items-start">
                    <span className="inline-block bg-blue-100 text-blue-800 p-1 rounded-full mr-2 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                    {(() => {
                      const tvData = distributions.mediaComparison.find(m => m.name === 'Television');
                      if (!tvData) return '';
                      
                      const tvAnalysis = tvData.wellsFargo > tvData.industry + 15
                        ? `Wells Fargo maintains significant Television investment (${formatPercentage(tvData.wellsFargo)}), ${formatPercentage(tvData.difference)} above industry average. This strong presence in traditional TV reinforces brand positioning and ensures broad coverage across mass audiences. The current strategy effectively leverages television's high emotional impact and credibility.`
                        : tvData.wellsFargo < tvData.industry - 15
                        ? `Television investment (${formatPercentage(tvData.wellsFargo)}) is ${formatPercentage(Math.abs(tvData.difference))} below industry average. This lower TV presence could impact long-term brand building and reach among traditional audiences. Strategic increase in TV spots, especially during prime time and special events, should be evaluated.`
                        : `Television investment (${formatPercentage(tvData.wellsFargo)}) aligns with industry standards, providing balanced presence in mass media. This strategy maintains brand visibility while optimizing resources for other channels.`;
                      
                      return tvAnalysis;
                    })()}
                  </p>
                  
                  <p className="flex items-start">
                    <span className="inline-block bg-fuchsia-100 text-fuchsia-800 p-1 rounded-full mr-2 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                    {(() => {
                      const audioData = distributions.mediaComparison.find(m => m.name === 'Audio');
                      const printData = distributions.mediaComparison.find(m => m.name === 'Print');
                      
                      let mixAnalysis = 'Media mix analysis reveals that ';
                      
                      if (audioData && printData) {
                        mixAnalysis += `the combination of Audio (${formatPercentage(audioData.wellsFargo)}) and Print (${formatPercentage(printData.wellsFargo)}) `;
                        
                        if (audioData.wellsFargo + printData.wellsFargo > (audioData.industry + printData.industry + 10)) {
                          mixAnalysis += 'shows a strong commitment to complementary traditional media, effectively reaching audiences during key moments of the day and building credibility through prestigious print media.';
                        } else if (audioData.wellsFargo + printData.wellsFargo < (audioData.industry + printData.industry - 10)) {
                          mixAnalysis += 'indicates lower reliance on complementary traditional media. This strategy could benefit from greater diversification to ensure additional touchpoints with different audience segments.';
                        } else {
                          mixAnalysis += 'maintains an appropriate balance with industry average, allowing consistent presence across multiple consumer touchpoints.';
                        }
                      }
                      
                      return mixAnalysis;
                    })()}
                  </p>
                  
                  <p className="flex items-start">
                    <span className="inline-block bg-pink-100 text-pink-800 p-1 rounded-full mr-2 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                    {(() => {
                      const totalDeviation = distributions.mediaComparison.reduce((sum, media) => sum + Math.abs(media.difference), 0);
                      const maxDeviation = Math.max(...distributions.mediaComparison.map(m => Math.abs(m.difference)));
                      
                      let strategyAnalysis = '';
                      
                      if (maxDeviation > 15) {
                        strategyAnalysis = `Wells Fargo's media strategy shows significant differentiation from the market, with deviations up to ${formatPercentage(maxDeviation)} in some channels. This distinctive approach suggests a deliberate differentiation strategy that may align with specific brand and segmentation objectives. Maintaining this differentiation in high-impact channels while monitoring effectiveness and ROI is recommended.`;
                      } else if (maxDeviation > 7) {
                        strategyAnalysis = `The media mix shows moderate deviations from industry average, with variations up to ${formatPercentage(maxDeviation)}. This balanced strategy allows some differentiation while maintaining proven sector practices. Evaluating optimization opportunities in specific channels to maximize investment impact is suggested.`;
                      } else {
                        strategyAnalysis = `Media distribution closely follows industry benchmarks, with maximum deviations of ${formatPercentage(maxDeviation)}. While this conservative strategy minimizes risks, it may limit differentiation opportunities. Identifying specific niches where greater differentiation could generate competitive advantages is recommended.`;
                      }
                      
                      return strategyAnalysis;
                    })()}
                  </p>
                  
                  <p className="flex items-start">
                    <span className="inline-block bg-green-100 text-green-800 p-1 rounded-full mr-2 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                    Key optimization recommendations: {(() => {
                      const digitalData = distributions.mediaComparison.find(m => m.name === 'Digital');
                      const tvData = distributions.mediaComparison.find(m => m.name === 'Television');
                      
                      let recommendations = [];
                      
                      if (digitalData && digitalData.wellsFargo < digitalData.industry) {
                        recommendations.push('increase presence in digital channels to align with market trends');
                      }
                      
                      if (tvData && tvData.wellsFargo > tvData.industry + 15) {
                        recommendations.push('evaluate efficiency of high TV investment and consider diversification');
                      }
                      
                      if (recommendations.length === 0) {
                        recommendations.push('maintain current balance while exploring opportunities in emerging media');
                      }
                      
                      return recommendations.join(', ') + '. Continuous optimization of media mix will be key to maintaining competitiveness and efficiency in the market.';
                    })()}
                  </p>
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