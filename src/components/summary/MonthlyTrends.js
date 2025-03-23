import React, { useMemo, useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ReferenceLine
} from 'recharts';
import { useDashboard } from '../../context/DashboardContext';
import { chartColors } from '../../utils/bankColors';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import CustomTooltip from '../common/CustomTooltip';
import Icons from '../common/Icons';
import _ from 'lodash';

// Function to format months in "Jan 2024" format
const formatMonthLabel = (month) => {
  const [year, monthNum] = month.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[parseInt(monthNum, 10) - 1]} ${year}`;
};

// Function to format values in millions (without decimals)
const formatYAxis = (value) => {
  if (value >= 1000000) {
    return `${Math.round(value / 1000000)}M`;
  } else if (value >= 1000) {
    return `${Math.round(value / 1000)}K`;
  }
  return Math.round(value);
};

/**
 * Component that displays monthly investment trends across all banks
 */
const MonthlyTrends = () => {
  const { dashboardData, loading, selectedMonths, focusedBank } = useDashboard();
  const [wellsFargoData, setWellsFargoData] = useState(null);
  const [isLoadingWfData, setIsLoadingWfData] = useState(true);
  const [marketAverageData, setMarketAverageData] = useState([]);
  const [selectedBanks, setSelectedBanks] = useState([]);
  const [showBankSelector, setShowBankSelector] = useState(false);

  useEffect(() => {
    setIsLoadingWfData(true);
    fetch('/processed/wells-fargo-performance.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setWellsFargoData(data);
        setIsLoadingWfData(false);
      })
      .catch(error => {
        console.error('Error loading Wells Fargo data:', error);
        setIsLoadingWfData(false);
        
        // Always generate fallback data if there is an error
        generateFallbackData();
      });
  }, [dashboardData]);

  // Function to generate fallback data when loading fails
  const generateFallbackData = () => {
    if (dashboardData?.monthlyTrends) {
      const fallbackData = {
        summary: {
          totalInvestment: 0,
          averageMarketShare: 0,
          peakInvestment: { month: '', value: 0 },
          lowestInvestment: { month: '', value: 0 },
          investmentTrend: 0,
          marketShareTrend: 0
        },
        monthlyPerformance: dashboardData.monthlyTrends.map(month => {
          const wfShare = month.bankShares.find(share => share.bank === 'Wells Fargo Bank') || 
                         { bank: 'Wells Fargo Bank', investment: month.total * 0.15 }; // 15% if no data available
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

  // Calculate market average excluding Wells Fargo
  useEffect(() => {
    if (dashboardData?.monthlyTrends && dashboardData?.banks) {
      // Sort data by month
      const sortedMonthlyData = _.orderBy(dashboardData.monthlyTrends, 
        [month => {
          const [year, monthNum] = month.month.split('-');
          return parseInt(year) * 100 + parseInt(monthNum);
        }], 
        ['asc']
      );
      
      // Filter by selected months if any
      const filteredMonthlyData = selectedMonths.length > 0
        ? sortedMonthlyData.filter(month => selectedMonths.includes(month.month))
        : sortedMonthlyData;
      
      // Calculate market average for each month excluding Wells Fargo
      const marketAverageByMonth = filteredMonthlyData.map(month => {
        const otherBanks = month.bankShares.filter(share => share.bank !== 'Wells Fargo Bank');
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
  }, [dashboardData, selectedMonths]);

  // Calculate trends and insights from monthly data
  const { trendsData, wfTrends, bankComparison, insights, wfMonthlyAvg } = useMemo(() => {
    if (!dashboardData?.monthlyTrends) {
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
        wfMonthlyAvg: 0
      };
    }

    // Sort monthly data chronologically
    const sortedMonthlyData = _.orderBy(dashboardData.monthlyTrends, 
      [month => {
        const [year, monthNum] = month.month.split('-');
        return parseInt(year) * 100 + parseInt(monthNum);
      }], 
      ['asc']
    );

    // Filter by selected months if any
    const filteredMonthlyData = selectedMonths.length > 0
      ? sortedMonthlyData.filter(month => selectedMonths.includes(month.month))
      : sortedMonthlyData;

    // Prepare data for the charts
    const trendsData = filteredMonthlyData.map(month => {
      return {
        name: month.month,
        total: month.total,
        ...dashboardData.banks.slice(0, 5).reduce((acc, bank) => {
          const bankShare = month.bankShares.find(share => share.bank === bank.name);
          acc[bank.name] = bankShare ? bankShare.investment : 0;
          return acc;
        }, {})
      };
    });

    // Filter Wells Fargo data based on selected months
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
      
      // Apply selected months filter
      const filteredWfData = selectedMonths.length > 0
        ? sortedWfData.filter(item => selectedMonths.includes(item.month))
        : sortedWfData;
        
      // Calculate month-over-month change if it doesn't exist
      for (let i = 0; i < filteredWfData.length; i++) {
        const current = filteredWfData[i];
        let monthOverMonthChange = current.monthOverMonthChange;
        
        // If there's no change data and previous month data exists, calculate it
        if (monthOverMonthChange === undefined && i > 0) {
          const previous = filteredWfData[i-1];
          monthOverMonthChange = previous.investment > 0
            ? ((current.investment - previous.investment) / previous.investment) * 100
            : 0;
        }
        
        // Find market average for this month
        const marketAvg = marketAverageData.find(m => m.month === current.month);
        
        wfTrends.push({
          ...current,
          monthOverMonthChange: monthOverMonthChange || 0,
          // Add market average data
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
        const wfShare = month.bankShares.find(share => share.bank === 'Wells Fargo Bank') || 
                       { bank: 'Wells Fargo Bank', investment: month.total * 0.15 }; // 15% if no data
        
        let monthOverMonthChange = 0;
        if (i > 0 && wfShare) {
          const prevMonth = filteredMonthlyData[i-1];
          const prevWfShare = prevMonth.bankShares.find(share => share.bank === 'Wells Fargo Bank') || 
                             { bank: 'Wells Fargo Bank', investment: prevMonth.total * 0.15 };
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
    const wfMonthlyAvg = wfTrends.length > 0 
      ? wfTrends.reduce((sum, item) => sum + item.investment, 0) / wfTrends.length 
      : 0;

    // Compare all banks over time for market share
    const bankComparison = filteredMonthlyData.map(month => {
      const total = month.total;
      return {
        name: month.month,
        ...month.bankShares.reduce((acc, share) => {
          acc[share.bank] = (share.investment / total) * 100;
          return acc;
        }, {})
      };
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

    return { trendsData, wfTrends, bankComparison, insights, wfMonthlyAvg };
  }, [dashboardData, selectedMonths, wellsFargoData, marketAverageData]);

  // Helper function to calculate trend
  function calculateTrend(values) {
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
  }

  // Helper function to find seasonal patterns
  function findSeasonalPatterns(trendsData) {
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
  }

  // Helper function to find competitive advantages
  function findCompetitiveAdvantages(bankComparison) {
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
  }

  // Bank selector component for multi-select dropdown
  const BankSelector = () => {
    const availableBanks = dashboardData?.banks?.slice(0, 6) || [];
    
    const toggleBank = (bankName) => {
      if (selectedBanks.includes(bankName)) {
        setSelectedBanks(selectedBanks.filter(b => b !== bankName));
      } else {
        setSelectedBanks([...selectedBanks, bankName]);
      }
    };
    
    const selectAllBanks = () => {
      setSelectedBanks(availableBanks.map(bank => bank.name));
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
          {availableBanks.map(bank => (
            <div key={bank.name} className="flex items-center px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
              <input 
                type="checkbox" 
                id={`bank-${bank.name}`}
                checked={selectedBanks.includes(bank.name)}
                onChange={() => toggleBank(bank.name)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label 
                htmlFor={`bank-${bank.name}`}
                className="ml-2 text-sm text-gray-700 cursor-pointer flex-grow flex items-center"
              >
                <span 
                  className="w-3 h-3 rounded-full inline-block mr-2" 
                  style={{ backgroundColor: chartColors[bank.name] }}
                ></span>
                {bank.name}
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
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{formatMonthLabel(label)}</p>
          {payload.map((p, i) => (
            <p key={i} className="text-sm" style={{ color: p.dataKey === 'total' ? chartColors['Capital One'] : chartColors[p.dataKey] || p.color }}>
              {p.dataKey === 'total' ? 'Total' : p.dataKey}: {formatCurrency(Math.round(p.value))}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render percentage tooltip
  const renderPercentageTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{formatMonthLabel(label)}</p>
          {payload.map((p, i) => (
            <p key={i} className="text-sm" style={{ color: chartColors[p.dataKey] || p.color }}>
              {p.dataKey}: {formatPercentage(p.value)}
            </p>
          ))}
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
            Market: {
              insights.overall.trend === 'increasing' 
                ? `Growing ${Math.abs(Math.round(insights.overall.value))}%` 
                : insights.overall.trend === 'decreasing'
                ? `Declining ${Math.abs(Math.round(insights.overall.value))}%`
                : 'Stable'
            }
          </div>
          
          <div className={`px-3 py-1 rounded-full text-sm ${
            insights.wf.trend === 'increasing' ? 'bg-green-100 text-green-800' :
            insights.wf.trend === 'decreasing' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`} style={{ borderLeft: `3px solid ${chartColors['Wells Fargo Bank']}` }}>
            Wells Fargo: {
              insights.wf.trend === 'increasing' 
                ? `Growing ${Math.abs(Math.round(insights.wf.value))}%` 
                : insights.wf.trend === 'decreasing'
                ? `Declining ${Math.abs(Math.round(insights.wf.value))}%`
                : 'Stable'
            }
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
                  tickFormatter={(value) => `$${Math.round(value / 1000000)}M`} 
                  tick={{ fontSize: 12 }}
                  domain={selectedBanks.length > 0 ? ['auto', 'auto'] : [0, 'dataMax + 500000']}
                />
                <Tooltip content={renderTooltip} />
                {/* Render lines for each bank */}
                {dashboardData?.banks && dashboardData.banks.slice(0, 6).map((bank) => {
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
                      fillOpacity={0.1}
                      strokeWidth={1.5}
                      stackId="1"
                    />
                  );
                })}
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke={chartColors['Capital One']} 
                  fill={`url(#colorTotal)`}
                  activeDot={{ r: 6 }}
                  stackId="2"
                  hide={selectedBanks.length > 0}
                />
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
        <div className="border border-gray-100 rounded-lg p-4" style={{ borderLeft: `4px solid ${chartColors['Wells Fargo Bank']}` }}>
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
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={wfTrends}
                  margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="month" 
                    angle={-45} 
                    textAnchor="end" 
                    tick={{ fontSize: 12 }}
                    height={60}
                    tickFormatter={formatMonthLabel}
                  />
                  <YAxis 
                    yAxisId="left" 
                    tickFormatter={(value) => `$${Math.round(value / 1000000)}M`}
                    orientation="left"
                    domain={[0, 'dataMax + 500000']}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    tickFormatter={(v) => `${Math.round(v)}%`} 
                    orientation="right"
                    domain={[0, 'dataMax + 1']}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    content={({active, payload, label}) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
                            <p className="font-semibold text-gray-800">{formatMonthLabel(label)}</p>
                            {payload.map((p, i) => (
                              <p key={i} className="text-sm" style={{ color: p.name === "Wells Fargo Investment" ? chartColors['Wells Fargo Bank'] : p.name === "Market Avg Investment" ? "#666666" : p.color }}>
                                {p.name === "Wells Fargo Investment" ? "Wells Fargo Investment" : p.name === "Market Avg Investment" ? "Market Avg Investment" : p.name}: 
                                {p.name.includes("Investment") ? ` $${Math.round(p.value / 1000000)}M` : ` ${Math.round(p.value)}`}
                              </p>
                            ))}
                            {/* Add Monthly Average to tooltip */}
                            <p className="text-sm" style={{ color: "#FFB300" }}>
                              Avg Monthly: ${Math.round(wfMonthlyAvg / 1000000)}M
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  {/* Wells Fargo Investment */}
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="investment" 
                    name="Wells Fargo Investment"
                    stroke={chartColors['Wells Fargo Bank']}
                    strokeWidth={2}
                    dot={{ fill: chartColors['Wells Fargo Bank'], stroke: 'white', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: chartColors['Wells Fargo Bank'], stroke: 'white', strokeWidth: 2 }}
                  />
                  {/* Market Average Investment */}
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="marketAvgInvestment" 
                    name="Market Avg Investment"
                    stroke="#666666"
                    strokeWidth={2}
                    dot={{ fill: "#666666", stroke: 'white', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "#666666", stroke: 'white', strokeWidth: 2 }}
                  />
                  {/* Constant line for monthly average */}
                  <ReferenceLine 
                    y={wfMonthlyAvg}
                    yAxisId="left"
                    stroke="#FFB300"
                strokeDasharray="3 3" 
                  />
                </LineChart>
              </ResponsiveContainer>
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
                formatter={(value, name) => [`${Math.round(value)}%`, name]}
                labelFormatter={formatMonthLabel}
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
              {dashboardData?.banks && dashboardData.banks.slice(0, 6).map((bank) => (
                <Area 
                  key={bank.name}
                  type="monotone" 
                  dataKey={bank.name} 
                  stackId="1"
                  stroke={chartColors[bank.name]}
                  fill={chartColors[bank.name]}
                />
              ))}
            </AreaChart>
        </ResponsiveContainer>
        </div>
      </div>
      
      {/* Insights Panel */}
      <div className="mt-10 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-700 mb-3">Trend Analysis Insights</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Market Trends */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Market Trends</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="inline-block mr-2 mt-0.5 h-2 w-2 rounded-full bg-blue-500"></span>
                <span>
                  The overall market is {insights.overall.trend === 'stable' 
                    ? 'showing stable investment levels' 
                    : `${insights.overall.trend} at a rate of ${Math.abs(Math.round(insights.overall.value))}%`}.
                </span>
              </li>
              
              {insights.peakMonth && (
                <li className="flex items-start">
                  <span className="inline-block mr-2 mt-0.5 h-2 w-2 rounded-full bg-green-500"></span>
                  <span>
                    Peak investment occurred in {formatMonthLabel(insights.peakMonth.name)} 
                    with {formatCurrency(insights.peakMonth.total)} total spend.
                  </span>
                </li>
              )}
              
              {insights.seasonal.map((season, i) => (
                <li key={i} className="flex items-start">
                  <span className={`inline-block mr-2 mt-0.5 h-2 w-2 rounded-full ${
                    season.type === 'peak' ? 'bg-yellow-500' : 'bg-indigo-500'
                  }`}></span>
                  <span>
                    {season.type === 'peak' ? 'Highest' : 'Lowest'} seasonal investment typically 
                    occurs in {season.period}.
                  </span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Wells Fargo Competitive Analysis */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Competitive Analysis</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="inline-block mr-2 mt-0.5 h-2 w-2 rounded-full" style={{ backgroundColor: chartColors['Wells Fargo Bank'] }}></span>
                <span>
                  Wells Fargo&apos;s market share is {insights.wf.trend === 'stable' 
                    ? 'remaining stable' 
                    : `${insights.wf.trend} at a rate of ${Math.abs(Math.round(insights.wf.value))}%`} 
                  over the period.
                </span>
              </li>
              
              {insights.competitiveAdv.threats?.map((threat, i) => (
                <li key={i} className="flex items-start">
                  <span className="inline-block mr-2 mt-0.5 h-2 w-2 rounded-full" style={{ backgroundColor: chartColors[threat.bank] }}></span>
                  <span>
                    <strong>{threat.bank}</strong> is growing {threat.advantage.toFixed(1)}% faster than Wells Fargo, 
                    representing a competitive threat.
                  </span>
                </li>
              ))}
              
              {insights.competitiveAdv.opportunities?.map((opp, i) => (
                <li key={i} className="flex items-start">
                  <span className="inline-block mr-2 mt-0.5 h-2 w-2 rounded-full" style={{ backgroundColor: chartColors[opp.bank] }}></span>
                  <span>
                    <strong>{opp.bank}</strong> is declining by {Math.abs(opp.decline).toFixed(1)}%, 
                    representing an opportunity for Wells Fargo to capture market share.
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Metodología section - change to English */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
        <h4 className="font-medium text-gray-700 mb-2">Calculation Methodology</h4>
        <p>
          Comparative growth percentages (such as &ldquo;PNC Bank is growing 842.6% faster than Wells Fargo&rdquo;) 
          are calculated using the <code>findCompetitiveAdvantages</code> function that:
        </p>
        <ol className="list-decimal pl-5 mt-2 space-y-1">
          <li>Calculates growth trend for each bank using simple linear regression</li>
          <li>Compares Wells Fargo&apos;s growth slope with each competitor</li>
          <li>Calculates the percentage difference between both slopes</li>
          <li>Identifies banks growing faster (threats) or declining (opportunities)</li>
        </ol>
        <p className="mt-2">
          This value indicates how much faster a competitor is growing compared to Wells Fargo during the analyzed period.
        </p>
      </div>
    </div>
  );
};

export default MonthlyTrends;