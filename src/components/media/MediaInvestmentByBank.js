import React, { useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDashboard } from '../../context/DashboardContext';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import ChartInsights from '../common/ChartInsights';
import CustomTooltip from '../common/CustomTooltip';

// Colores mejorados para categorías de medios
const enhancedMediaColors = {
  'Digital': '#3498db',           // Azul digital
  'Television': '#e74c3c',        // Rojo televisión
  'Audio': '#2ecc71',             // Verde audio
  'Print': '#f39c12',             // Naranja impresión
  'Outdoor': '#9b59b6',           // Púrpura exterior
  'Streaming': '#1abc9c',         // Verde azulado streaming
  'Cinema': '#d35400',            // Marrón rojizo cine
  'All': '#34495e',               // Gris azulado para todos
};

// Colores mejorados para los bancos
const enhancedBankColors = {
  'Bank of America': '#22C55E',   // Verde
  'Wells Fargo': '#DC2626',       // Rojo
  'TD Bank': '#EAB308',           // Amarillo
  'Capital One Bank': '#6D28D9',  // Morado
  'PNC Bank': '#2563EB',          // Azul
  'Chase Bank': '#117ACA',        // Azul Chase
  'US Bank': '#0046AD',           // Azul US Bank
};

// Función para formatear valores en millones con un decimal
const formatValue = (value) => {
  return formatCurrency(value);
};

// Personalizar el tooltip para mostrar valores formateados
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
const MediaInvestmentByBank = ({ activeCategory = 'All' }) => {
  const { 
    filteredData, 
    loading, 
    selectedMediaCategory,
    setSelectedBank,
    selectedBank
  } = useDashboard();
  
    const handleClickOutside = (event) => {
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
    if (!filteredData || !filteredData.banks || !filteredData.mediaCategories) {
          return {
        mediaByBankData: [],
        mediaTotalsByBank: [],
        selectedBankData: null
      };
    }
    
    // Format bank data for the chart
    const mediaByBankData = filteredData.banks.map(bank => {
      // Get media investments for this bank
      return {
          name: bank.name,
          totalInvestment: bank.totalInvestment,
        marketShare: bank.marketShare
      };
    }).sort((a, b) => b.totalInvestment - a.totalInvestment);
    
    // Calculate total by media type for the selected media category or all
    const mediaTotalsByBank = [];
    const selectedMediaData = filteredData.mediaCategories.find(
      media => media.category === (selectedMediaCategory === 'All' ? 'Digital' : selectedMediaCategory)
    );
    
    if (selectedMediaData) {
      // Add bank data for the selected media type
      selectedMediaData.bankShares.forEach(bankShare => {
        mediaTotalsByBank.push({
          name: bankShare.bank,
          value: bankShare.amount,
          percentage: bankShare.percentage
        });
      });
    }
    
    // Sort data by investment
    mediaTotalsByBank.sort((a, b) => b.value - a.value);
    
    // Get data for the selected bank detail view
    let selectedBankData = null;
    if (selectedBank) {
      const bank = filteredData.banks.find(b => b.name === selectedBank);
      if (bank) {
        // Get media distribution for this bank
        selectedBankData = {
          name: bank.name,
          totalInvestment: bank.totalInvestment,
          marketShare: bank.marketShare,
          mediaDistribution: bank.mediaDistribution || []
        };
      }
    }
    
        return {
      mediaByBankData,
      mediaTotalsByBank,
      selectedBankData
    };
  }, [filteredData, selectedMediaCategory, selectedBank]);

  if (loading || !filteredData) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="h-80 flex items-center justify-center">
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
  
  // Calculate total for the pie chart
  const totalPieValue = chartData.mediaTotalsByBank.reduce((sum, item) => sum + item.value, 0);

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
    if (selectedMediaCategory !== 'All' && chartData.mediaTotalsByBank.length) {
      const topMediaBank = chartData.mediaTotalsByBank[0];
      insights.push({
        title: `${selectedMediaCategory} Leader`,
        description: `${topMediaBank.name} dominates ${selectedMediaCategory} with ${formatCurrency(topMediaBank.value)} (${formatPercentage(topMediaBank.percentage)}).`,
        icon: 'tv'
      });
    }
    
    return insights;
  };
  
  // Get media category color
  const getMediaColor = (mediaType) => {
    return enhancedMediaColors[mediaType] || '#6B7280'; // Fallback to gray
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 transition duration-300 hover:shadow-lg border border-gray-100" onClick={handleClickOutside}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Media Investment by Bank</h2>
          <p className="text-gray-600 mt-1">
            {selectedMediaCategory === 'All' ? 'Overall' : selectedMediaCategory} media investment distribution across banking institutions
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
            {selectedMediaCategory === 'All' 
              ? 'Digital Spend Distribution' 
              : `${selectedMediaCategory} Spend Distribution`}
          </h3>
          <div className="h-[350px]">
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
                      fill={selectedBank === entry.name ? getBankColor(entry.name) : getBankColor(entry.name)}
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
              {/* Media distribution details would go here */}
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