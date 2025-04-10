import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useDashboard } from '../../context/DashboardContext';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import ChartInsights from '../common/ChartInsights';
import CustomTooltip from '../common/CustomTooltip';
import Papa from 'papaparse';

// Enhanced colors for banks with better contrast
const enhancedBankColors = {
  'Bank of America': '#22C55E',   // Green
  'Wells Fargo': '#DC2626',       // Red
  'TD Bank': '#EAB308',           // Yellow
  'Capital One Bank': '#8B5CF6',  // Brighter Purple
  'PNC Bank': '#3B82F6',          // Brighter Blue
  'Chase Bank': '#0284C7',        // Brighter Chase Blue
  'US Bank': '#1D4ED8',           // Brighter US Bank Blue
};

// Function to format values in millions with one decimal
const formatValue = (value) => {
  return formatCurrency(value);
};

// Customize tooltip to show formatted values with enhanced styling
const CustomTooltipWrapper = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  
  return (
    <div className="bg-white p-4 shadow-lg rounded-md border border-gray-200 transition-all duration-200 animate-fadeIn">
      <p className="text-sm font-semibold text-gray-800 mb-2 border-b pb-1">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm flex justify-between items-center py-1" style={{ color: entry.color }}>
          <span>{entry.name}:</span>
          <span className="font-medium ml-3">{formatValue(entry.value)}</span>
        </p>
      ))}
    </div>
  );
};

/**
 * Component that shows investment distribution by bank with enhanced visuals
 */
const MediaInvestmentByBank = ({ activeCategory }) => {
  const { 
    filteredData: contextFilteredData, 
    dashboardData,
    loading: contextLoading, 
    selectedMediaCategory,
    setSelectedBank,
    selectedBank
  } = useDashboard();
  
  const [csvData, setCsvData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processedData, setProcessedData] = useState(null);
  const [animateChart, setAnimateChart] = useState(false);
  
  // Use the activeCategory prop if provided, otherwise use selectedMediaCategory from context
  const mediaCategory = activeCategory || selectedMediaCategory || 'All';
  
  // Load CSV data only if context data is not available
  useEffect(() => {
    // If we have context data, we don't need to load CSV
    if (contextFilteredData || dashboardData) {
      console.log("Using context data instead of loading CSV");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    console.log("Cargando datos del CSV (fallback)...");
    
    Papa.parse('consolidated_banks_data.csv', {
      download: true,
      header: true,
      skipEmptyLines: true,
      delimiter: ",",
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
  
  // Process data to create a format compatible with this component
  useEffect(() => {
    // If we have context data, use that
    if (contextFilteredData || dashboardData) {
      console.log("Processing context data for MediaInvestmentByBank");
      
      // Use the most appropriate data source
      const dataSource = contextFilteredData || dashboardData;
      setProcessedData(dataSource);
      return;
    }
    
    // Process CSV data if available (fallback)
    if (!csvData) return;
    
    console.log("Processing CSV data for MediaInvestmentByBank");
    
    // Convert dollar values to numbers
    const dataWithNumbers = csvData.map(row => ({
      ...row,
      dollars: parseFloat(row.dollars) || 0
    }));
    
    // Get unique list of banks
    const uniqueBanks = [...new Set(dataWithNumbers.map(row => row.Bank))];
    
    // Get unique list of media categories
    const uniqueMediaCategories = [...new Set(dataWithNumbers.map(row => row['Media Category']))];

    // Calculate total investment by bank
    const bankTotals = uniqueBanks.reduce((acc, bank) => {
      acc[bank] = dataWithNumbers
        .filter(row => row.Bank === bank)
        .reduce((sum, row) => sum + row.dollars, 0);
      return acc;
    }, {});

    // Calculate total investment by media category
    const mediaTotals = uniqueMediaCategories.reduce((acc, category) => {
      acc[category] = dataWithNumbers
        .filter(row => row['Media Category'] === category)
        .reduce((sum, row) => sum + row.dollars, 0);
      return acc;
    }, {});

    // Calculate total investment
    const totalInvestment = Object.values(bankTotals).reduce((a, b) => a + b, 0);

    // Create banks structure
    const banks = uniqueBanks.map(bank => {
      // Calculate media distribution for this bank
      const bankData = dataWithNumbers.filter(row => row.Bank === bank);
      const bankTotal = bankTotals[bank];
      
      const mediaDistribution = uniqueMediaCategories.map(category => {
        const categoryTotal = bankData
          .filter(row => row['Media Category'] === category)
          .reduce((sum, row) => sum + row.dollars, 0);
          
          return {
          category,
          percentage: bankTotal > 0 ? (categoryTotal / bankTotal) * 100 : 0,
          amount: categoryTotal
        };
      }).filter(item => item.amount > 0);
      
      return {
        name: bank,
        totalInvestment: bankTotal,
        marketShare: totalInvestment > 0 ? (bankTotal / totalInvestment) * 100 : 0,
        mediaDistribution
      };
    });

    // Create media categories structure
    const mediaCategories = uniqueMediaCategories.map(category => {
      const categoryData = dataWithNumbers.filter(row => row['Media Category'] === category);
      const categoryTotal = mediaTotals[category];
      
      // Calculate distribution by bank for this category
      const bankShares = uniqueBanks.map(bank => {
        const bankCategoryTotal = categoryData
          .filter(row => row.Bank === bank)
          .reduce((sum, row) => sum + row.dollars, 0);
          
        return {
          bank,
          amount: bankCategoryTotal,
          percentage: categoryTotal > 0 ? (bankCategoryTotal / categoryTotal) * 100 : 0
        };
      }).filter(share => share.amount > 0);
      
      return {
        category,
        totalInvestment: categoryTotal,
        bankShares
      };
    });

    const processedCsvData = {
      banks,
      mediaCategories,
      totalInvestment
    };
    
    setProcessedData(processedCsvData);
  }, [contextFilteredData, dashboardData, csvData]);

  // Trigger animation when data changes
  useEffect(() => {
    if (!loading && processedData) {
      setAnimateChart(false);
      setTimeout(() => setAnimateChart(true), 100);
    }
  }, [loading, processedData, mediaCategory]);

  const handleClickOutside = () => {
    if (selectedBank) {
      setSelectedBank(null);
    }
  };

  // Handle bank selection with mouse over
  const handleBankSelection = (bank) => {
    if (bank) {
      setSelectedBank(bank.name);
    }
  };

  // Process data for charts
  const chartData = useMemo(() => {
    if (!processedData || !processedData.banks || !processedData.mediaCategories) {
      console.log("MediaInvestmentByBank: No data available", processedData);
          return {
        mediaByBankData: [],
        mediaTotalsByBank: [],
        selectedBankData: null
      };
    }
    
    // Format bank data for the chart
    const mediaByBankData = processedData.banks.map(bank => {
      // Get media investments for this bank
        return {
        name: bank.name,
        totalInvestment: bank.totalInvestment,
        marketShare: bank.marketShare
      };
    }).sort((a, b) => b.totalInvestment - a.totalInvestment);
    
    // Calculate total by media type for the selected media category or all
    let mediaTotalsByBank = [];
    
    // If 'All', show Digital by default, otherwise show the selected category
    const categoryToFind = mediaCategory === 'All' ? 'Digital' : mediaCategory;
    
    console.log("Looking for category:", categoryToFind, "in", processedData.mediaCategories.map(m => m.category || m.type));
    
    const selectedMediaData = processedData.mediaCategories.find(
      media => (media.category === categoryToFind || media.type === categoryToFind)
    );
    
    console.log("Found category:", selectedMediaData);
    
    if (selectedMediaData) {
      // Find the bank shares property - might be bankShares or shares
      const bankSharesProperty = selectedMediaData.bankShares ? 'bankShares' : 'shares';
      const bankShares = selectedMediaData[bankSharesProperty] || [];
      
      console.log("Bank shares property:", bankSharesProperty, "length:", bankShares.length);
      
      // Add bank data for the selected media type
      mediaTotalsByBank = bankShares.map(bankShare => {
        // Handle different property structures (amount or investment)
        const valueProperty = bankShare.amount !== undefined ? 'amount' : 'investment';
        const percentageProperty = bankShare.percentage !== undefined ? 'percentage' : 'share';
        
        return {
          name: bankShare.bank,
          value: bankShare[valueProperty], 
          percentage: bankShare[percentageProperty]
        };
      }).sort((a, b) => b.value - a.value);
      
      console.log("Media totals by bank:", mediaTotalsByBank);
    }
    
    // Get data for the selected bank detail view
    let selectedBankData = null;
    if (selectedBank) {
      const bank = processedData.banks.find(b => b.name === selectedBank);
      if (bank) {
        // Check different property names that might contain media breakdown
        const mediaBreakdownProperty = 
          bank.mediaDistribution ? 'mediaDistribution' : 
          bank.mediaBreakdown ? 'mediaBreakdown' : 'mediaAllocation';
        
        selectedBankData = {
          name: bank.name,
          totalInvestment: bank.totalInvestment,
          marketShare: bank.marketShare,
          mediaBreakdown: bank[mediaBreakdownProperty] || []
        };
      }
    }
    
    return {
      mediaByBankData,
      mediaTotalsByBank,
      selectedBankData
    };
  }, [processedData, mediaCategory, selectedBank]);

  // Combined loading state
  const isLoading = loading || contextLoading || !processedData;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="h-96 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mb-4"></div>
          <div className="text-gray-500 font-medium">Loading investment data...</div>
        </div>
      </div>
    );
  }
  
  // Lookup color for a bank
  const getBankColor = (bankName) => {
    return enhancedBankColors[bankName] || '#6B7280'; // Fallback to gray
  };

  // Enhance bank data with color information
  const enhancedBankData = chartData.mediaByBankData.map(bank => ({
    ...bank,
    color: getBankColor(bank.name),
  }));
  
  // Get selected bank color
  const selectedBankColor = selectedBank ? getBankColor(selectedBank) : null;
  
  // Highlight the selected bank in the bar chart
  const enhancedBarData = enhancedBankData.map(bank => ({
    ...bank,
    color: selectedBank === bank.name ? selectedBankColor : getBankColor(bank.name),
    opacity: selectedBank ? (selectedBank === bank.name ? 1 : 0.4) : 1
  }));

  // Generate analysis text based on chart data
  const generateInsights = () => {
    if (!enhancedBankData.length) return [];
    
    const topBank = enhancedBankData[0];
    const insights = [
      {
        title: 'Leading Bank',
        description: `${topBank.name} leads with ${formatCurrency(topBank.totalInvestment)} (${formatPercentage(topBank.marketShare)}) of total investment.`,
        icon: 'trending_up'
      }
    ];
    
    // Add media specific insight if available
    if (mediaCategory !== 'All' && chartData.mediaTotalsByBank.length) {
      const topMediaBank = chartData.mediaTotalsByBank[0];
      insights.push({
        title: `${mediaCategory} Leader`,
        description: `${topMediaBank.name} dominates ${mediaCategory} with ${formatCurrency(topMediaBank.value)} (${formatPercentage(topMediaBank.percentage)}).`,
        icon: 'tv'
      });
    }
    
    return insights;
  };

  // Check if there's data to display in the pie chart
  const hasMediaData = chartData.mediaTotalsByBank && chartData.mediaTotalsByBank.length > 0;

  // Calculate total investment for this view
  const totalInvestmentValue = enhancedBankData.reduce((sum, bank) => sum + bank.totalInvestment, 0);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg border border-gray-100" onClick={handleClickOutside}>
      {/* Header with total investment badge */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            Investment by Bank
            <span className="ml-3 px-3 py-1 bg-blue-50 text-blue-600 text-sm font-medium rounded-full">
              {formatCurrency(totalInvestmentValue)}
            </span>
          </h2>
          <p className="text-gray-600 mt-1">
            {mediaCategory === 'All' ? 'Overall' : mediaCategory} media investment distribution across banking institutions
          </p>
        </div>
        <div className="flex space-x-2 mt-3 sm:mt-0">
          {selectedBank && (
            <button 
              onClick={(e) => {e.stopPropagation(); setSelectedBank(null);}}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded transition-colors"
            >
              Clear Selection
            </button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left side - Bar Chart */}
        <div className="lg:col-span-3 bg-gray-50 rounded-xl p-4">
          <h3 className="text-lg font-medium text-gray-700 mb-3">
            Banking Sector Investment Distribution
          </h3>
          <div className={`h-[400px] transition-opacity duration-500 ${animateChart ? 'opacity-100' : 'opacity-0'}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={enhancedBarData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barSize={36}
                layout="vertical"
              >
                <XAxis 
                  type="number" 
                  tickFormatter={(value) => formatValue(value).replace('$', '')}
                  tick={{ fill: '#4b5563', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fill: '#4b5563', fontSize: 13 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                  width={120}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ fill: 'rgba(224, 231, 255, 0.2)' }} 
                  animationDuration={300}
                />
                <Bar 
                  dataKey="totalInvestment" 
                  radius={[0, 4, 4, 0]}
                  onClick={(data) => handleBankSelection(data)}
                  onMouseEnter={(data) => handleBankSelection(data)}
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {enhancedBarData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      fillOpacity={entry.opacity}
                      stroke={entry.color}
                      strokeWidth={selectedBank === entry.name ? 2 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Right side - Pie Chart */}
        <div className="lg:col-span-2 bg-gray-50 rounded-xl p-4">
          <h3 className="text-lg font-medium text-gray-700 mb-3">
            {mediaCategory === 'All' 
              ? 'Digital Spend Distribution' 
              : `${mediaCategory} Spend Distribution`}
          </h3>
          <div className={`h-[350px] transition-opacity duration-500 ${animateChart ? 'opacity-100' : 'opacity-0'}`}>
            {hasMediaData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.mediaTotalsByBank}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    innerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                    onClick={(data) => handleBankSelection(data)}
                    onMouseEnter={(data) => handleBankSelection(data)}
                    animationDuration={1200}
                    animationEasing="ease-in-out"
                  >
                    {chartData.mediaTotalsByBank.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getBankColor(entry.name)}
                        fillOpacity={selectedBank ? (selectedBank === entry.name ? 1 : 0.4) : 1}
                        stroke={selectedBank === entry.name ? getBankColor(entry.name) : ''}
                        strokeWidth={selectedBank === entry.name ? 2 : 0}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [formatValue(value), 'Investment']}
                    content={<CustomTooltipWrapper />}
                    animationDuration={300}
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    wrapperStyle={{ fontSize: '12px', paddingLeft: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-gray-500 bg-gray-100 p-4 rounded-lg">
                  No data available for {mediaCategory === 'All' ? 'Digital' : mediaCategory} category
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Insights Section */}
        <div className="lg:col-span-5">
          <ChartInsights insights={generateInsights()} />
        </div>
      </div>
      
      {/* Selected Bank Detail */}
      {chartData.selectedBankData && (
        <div className={`mt-8 pt-6 border-t border-gray-200 transition-all duration-500 ${selectedBank ? 'opacity-100 max-h-[1000px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
          <div className="flex items-center mb-5">
            <div 
              className="w-5 h-5 rounded-full mr-3" 
              style={{ backgroundColor: selectedBankColor }}
            ></div>
            <h3 className="text-xl font-semibold text-gray-800">{chartData.selectedBankData.name}</h3>
            <span className="ml-3 px-3 py-1 bg-blue-50 text-blue-600 text-sm font-medium rounded-full">
              {formatPercentage(chartData.selectedBankData.marketShare)} market share
            </span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl shadow-sm border border-gray-200">
              <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                Media Allocation
              </h4>
              <div className="space-y-3">
                {chartData.selectedBankData.mediaBreakdown && chartData.selectedBankData.mediaBreakdown.map((media, idx) => {
                  // Handle different property names for category, amount and percentage
                  const category = media.category || media.type || 'Unknown';
                  const amount = media.amount || media.investment || 0;
                  const percentage = media.percentage || media.share || 0;
                  
                  return (
                    <div key={idx} className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-white transition-colors">
                      <span className="text-gray-700 font-medium">{category}:</span>
                      <div className="flex space-x-4">
                        <span className="font-semibold text-gray-900">{formatCurrency(amount)}</span>
                        <span className="text-blue-600 bg-blue-50 px-2 rounded">{formatPercentage(percentage)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl shadow-sm border border-gray-200">
              <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm9 4a1 1 0 10-2 0v6a1 1 0 102 0V7zm-3 2a1 1 0 10-2 0v4a1 1 0 102 0V9zm-3 3a1 1 0 10-2 0v1a1 1 0 102 0v-1z" clipRule="evenodd" />
                </svg>
                Investment Summary
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between py-2 px-3 rounded-lg hover:bg-white transition-colors">
                  <span className="text-gray-700 font-medium">Total Investment:</span>
                  <span className="font-semibold text-gray-900">{formatValue(chartData.selectedBankData.totalInvestment)}</span>
                </div>
                <div className="flex justify-between py-2 px-3 rounded-lg hover:bg-white transition-colors">
                  <span className="text-gray-700 font-medium">Market Position:</span>
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-900 mr-2">
                      #{enhancedBankData.findIndex(b => b.name === chartData.selectedBankData.name) + 1}
                    </span>
                    <span className="text-gray-500">of {enhancedBankData.length}</span>
                  </div>
                </div>
                <div className="flex justify-between py-2 px-3 rounded-lg hover:bg-white transition-colors">
                  <span className="text-gray-700 font-medium">Market Share:</span>
                  <span className="font-semibold text-gray-900">{formatPercentage(chartData.selectedBankData.marketShare)}</span>
                </div>
                <div className="flex justify-between py-2 px-3 rounded-lg hover:bg-white transition-colors">
                  <span className="text-gray-700 font-medium">Avg. Monthly Investment:</span>
                  <span className="font-semibold text-gray-900">
                    {formatValue(chartData.selectedBankData.totalInvestment / 12)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaInvestmentByBank;