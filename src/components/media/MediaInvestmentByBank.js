import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useDashboard } from '../../context/DashboardContext';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import ChartInsights from '../common/ChartInsights';
import CustomTooltip from '../common/CustomTooltip';
import Papa from 'papaparse';

// Enhanced colors for banks
const enhancedBankColors = {
  'Bank of America': '#22C55E',   // Green
  'Wells Fargo': '#DC2626',       // Red
  'TD Bank': '#EAB308',           // Yellow
  'Capital One Bank': '#6D28D9',  // Purple
  'PNC Bank': '#2563EB',          // Blue
  'Chase Bank': '#117ACA',        // Chase Blue
  'US Bank': '#0046AD',           // US Bank Blue
};

// Function to format values in millions with one decimal
const formatValue = (value) => {
  return formatCurrency(value);
};

// Customize tooltip to show formatted values
const CustomTooltipWrapper = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  
  return (
    <div className="bg-white p-3 shadow-md rounded-md border border-gray-200">
      <p className="text-sm font-semibold text-gray-800">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {formatValue(entry.value)}
        </p>
      ))}
    </div>
  );
};

/**
 * Component that shows investment distribution by bank 
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
        <div className="h-96 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading investment data...</div>
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

  return (
    <div className="bg-white rounded-xl shadow-md p-6 transition duration-300 hover:shadow-lg border border-gray-100" onClick={handleClickOutside}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Media Investment by Bank</h2>
          <p className="text-gray-600 mt-1">
            {mediaCategory === 'All' ? 'Overall' : mediaCategory} media investment distribution across banking institutions
          </p>
        </div>
        <div className="flex space-x-2">
          {/* Button removed for simplicity */}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left side - Bar Chart */}
        <div className="lg:col-span-3">
          <div className="h-[400px]">
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
                />
              <YAxis 
                type="category" 
                  dataKey="name" 
                  tick={{ fill: '#4b5563', fontSize: 13 }}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ fill: 'rgba(224, 231, 255, 0.2)' }} 
                />
                <Bar 
                  dataKey="totalInvestment" 
                radius={[0, 4, 4, 0]}
                  onClick={(data) => handleBankSelection(data)}
                  onMouseEnter={(data) => handleBankSelection(data)}
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
        <div className="lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-700 mb-4">
            {mediaCategory === 'All' 
              ? 'Digital Spend Distribution' 
              : `${mediaCategory} Spend Distribution`}
          </h3>
          <div className="h-[350px]">
            {hasMediaData ? (
              <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                    data={chartData.mediaTotalsByBank}
                  cx="50%"
                  cy="50%"
                    outerRadius={130}
                    innerRadius={65}
                    paddingAngle={1}
                  dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  labelLine={false}
                    onClick={(data) => handleBankSelection(data)}
                    onMouseEnter={(data) => handleBankSelection(data)}
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
                />
              </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-gray-500">No data available for {mediaCategory === 'All' ? 'Digital' : mediaCategory} category</div>
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
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <div 
              className="w-4 h-4 rounded-full mr-2" 
              style={{ backgroundColor: selectedBankColor }}
              ></div>
            <h3 className="text-lg font-semibold">{chartData.selectedBankData.name}</h3>
            <span className="ml-2 text-sm text-gray-500">
              {formatPercentage(chartData.selectedBankData.marketShare)} market share
            </span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-md font-medium text-gray-700 mb-3">Media Allocation</h4>
              <div className="space-y-2">
                {chartData.selectedBankData.mediaBreakdown && chartData.selectedBankData.mediaBreakdown.map((media, idx) => {
                  // Handle different property names for category, amount and percentage
                  const category = media.category || media.type || 'Unknown';
                  const amount = media.amount || media.investment || 0;
                  const percentage = media.percentage || media.share || 0;
                  
                  return (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-gray-600">{category}:</span>
                      <div className="flex space-x-3">
                        <span className="font-medium">{formatCurrency(amount)}</span>
                        <span className="text-gray-500">{formatPercentage(percentage)}</span>
                          </div>
                          </div>
                  );
                })}
              </div>
                    </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-md font-medium text-gray-700 mb-3">Investment Summary</h4>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Total Investment:</span>
                <span className="font-semibold">{formatValue(chartData.selectedBankData.totalInvestment)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Market Position:</span>
                <span className="font-semibold">
                  #{enhancedBankData.findIndex(b => b.name === chartData.selectedBankData.name) + 1} of {enhancedBankData.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Market Share:</span>
                <span className="font-semibold">{formatPercentage(chartData.selectedBankData.marketShare)}</span>
              </div>
                        </div>
                    </div>
        </div>
      )}
    </div>
  );
};

export default MediaInvestmentByBank;