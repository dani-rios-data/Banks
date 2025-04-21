import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import { useDashboard } from '../../context/DashboardContext';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import ChartInsights from '../common/ChartInsights';
import CustomTooltip from '../common/CustomTooltip';
import Papa from 'papaparse';
import { mediaColors } from '../../utils/colorSchemes';

// Enhanced colors for banks with better contrast
const enhancedBankColors = {
  'Bank of America': '#22C55E',   // Green
  'Wells Fargo': '#DC2626',       // Red
  'TD Bank': '#EAB308',           // Yellow
  'Capital One Bank': '#8B5CF6',  // Brighter Purple
  'PNC Bank': '#3B82F6',          // Brighter Blue
  'Chase Bank': '#0284C7',        // Brighter Chase Blue
  'US Bank': '#1D4ED8',           // Brighter US Bank Blue
  'Key Bank': '#CC0000',          // Bright Red
};

// Function to format values in millions with one decimal
const formatValue = (value) => {
  return formatCurrency(value);
};

// Customize tooltip to show investment value and percentage when available
const SimpleInvestmentTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  
  // Check if percentage is available in the payload
  const hasPercentage = payload[0].payload && (payload[0].payload.percentage !== undefined);
        
        return (
    <div className="bg-white p-4 shadow-lg rounded-md border border-gray-200 transition-all duration-200 animate-fadeIn">
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold">Investment:</span>
        <span className="font-medium ml-3" style={{ color: payload[0].color || '#333' }}>{formatValue(payload[0].value)}</span>
          </div>
      {hasPercentage && (
        <div className="flex items-center justify-between pt-1 border-t border-gray-100 mt-1">
          <span className="font-semibold">Share:</span>
          <span className="font-medium ml-3 text-blue-600">{formatPercentage(payload[0].payload.percentage)}%</span>
        </div>
      )}
    </div>
  );
};

// Iconos para categorías de medios con SVG personalizado
const mediaCategoryIcons = {
  'Digital': (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeWidth={1.5} d="M12 2v20M2 12h20" />
      <path strokeLinecap="round" strokeWidth={1.5} d="M18.364 5.636a9.002 9.002 0 010 12.728M5.636 5.636a9.002 9.002 0 000 12.728" />
    </svg>
  ),
  'Television': (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="2" y="4" width="20" height="14" rx="2" strokeWidth={1.5} />
      <circle cx="17" cy="15" r="1.5" strokeWidth={1.5} fill="currentColor" />
      <path d="M8 21h8" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  ),
  'Radio': (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path d="M8 8v8a2 2 0 002 2h1a2 2 0 002-2V8a2 2 0 00-2-2h-1a2 2 0 00-2 2z" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeWidth={1.5} d="M15 8.5c1 .685 1.5 1.857 1.5 3.15s-.5 2.465-1.5 3.15M17.5 7c1.5 1 2.5 2.5 2.5 5s-1 4-2.5 5" />
    </svg>
  ),
  'Audio': (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path d="M8 8v8a2 2 0 002 2h1a2 2 0 002-2V8a2 2 0 00-2-2h-1a2 2 0 00-2 2z" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeWidth={1.5} d="M15 8.5c1 .685 1.5 1.857 1.5 3.15s-.5 2.465-1.5 3.15M17.5 7c1.5 1 2.5 2.5 2.5 5s-1 4-2.5 5" />
    </svg>
  ),
  'Print': (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="4" y="9" width="16" height="8" rx="1" strokeWidth={1.5} />
      <path d="M6 9V5a1 1 0 011-1h10a1 1 0 011 1v4" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeWidth={1.5} d="M6 17v3a1 1 0 001 1h10a1 1 0 001-1v-3" />
      <circle cx="16" cy="13" r="1" fill="currentColor" />
    </svg>
  ),
  'Outdoor': (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 22V12h6v10" />
    </svg>
  ),
  'Out of Home': (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 22V12h6v10" />
    </svg>
  ),
  'Streaming': (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="2" y="6" width="16" height="12" rx="2" strokeWidth={1.5} />
      <circle cx="18" cy="9" r="2" strokeWidth={1.5} />
      <rect x="5" y="9" width="2" height="6" rx="0.5" strokeWidth={1.5} />
    </svg>
  ),
  'Cinema': (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path d="M4 4h2v2H4V4zm0 7h2v2H4v-2zm0 7h2v2H4v-2zm14-14h2v2h-2V4zm0 7h2v2h-2v-2zm0 7h2v2h-2v-2z" strokeWidth={1.5} />
      <path d="M7 4h10v16H7V4z" strokeWidth={1.5} />
      <path d="M8 7h8M8 12h8M8 17h8" strokeWidth={1.2} strokeLinecap="round" />
    </svg>
  ),
  'All': (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  'Direct Mail': (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  'Other': (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="6" cy="12" r="1" fill="currentColor" />
      <circle cx="18" cy="12" r="1" fill="currentColor" />
    </svg>
  )
};

// Icono para Banco
const BankIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
  </svg>
);

/**
 * Component that shows investment distribution by media category with enhanced visuals and tabular data
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
  const [selectedMediaType, setSelectedMediaType] = useState(null);
  
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
  }, [loading, processedData, mediaCategory, selectedMediaType]);

  const handleClickOutside = (e) => {
    // Verificar si el clic fue en un botón de categoría o banco
    const isTabClick = e.target.closest('button[data-tab-button="true"]');
    
    // Solo resetear selecciones si no fue un clic en un botón
    if (!isTabClick) {
      if (selectedBank) {
        setSelectedBank(null);
      }
      if (selectedMediaType) {
        setSelectedMediaType(null);
      }
    }
  };

  // Handle media category selection
  const handleMediaSelection = (media) => {
    if (media) {
      setSelectedMediaType(media.category || media.name);
    }
  };

  // Create matrix data for the table (Media Categories x Banks)
  const tableData = useMemo(() => {
    if (!processedData || !processedData.banks || !processedData.mediaCategories) {
      return { headers: [], rows: [] };
    }
    
    // Extract bank names for columns
    const bankNames = processedData.banks
      .sort((a, b) => b.totalInvestment - a.totalInvestment)
      .map(bank => bank.name);
    
    // Create headers with bank names and 'Media Category' as first column
    const headers = ['Media Category', ...bankNames, 'Total'];
    
    // Create rows with media categories and investment amounts
    const rows = processedData.mediaCategories
      .sort((a, b) => b.totalInvestment - a.totalInvestment)
      .map(media => {
        const category = media.category || media.type;
        
        // Find investment amount for each bank
        const bankInvestments = bankNames.map(bankName => {
          // Find this bank's share for the current media category
          const bankShareProperty = media.bankShares ? 'bankShares' : 'shares';
          const bankShares = media[bankShareProperty] || [];
          
          const bankShare = bankShares.find(share => share.bank === bankName);
          
          // Return investment amount or 0 if not found
          const amountProperty = bankShare && (bankShare.amount !== undefined ? 'amount' : 'investment');
          return bankShare ? bankShare[amountProperty] || 0 : 0;
        });
        
        // Create row with media category and bank investments
        return [
          category,
          ...bankInvestments,
          media.totalInvestment || 0
        ];
      });
    
    // Add total row
    const totalRow = [
      'Total',
      ...bankNames.map(bankName => {
        const bank = processedData.banks.find(b => b.name === bankName);
        return bank ? bank.totalInvestment : 0;
      }),
      processedData.totalInvestment || 0
    ];
    
    return { headers, rows: [...rows, totalRow] };
  }, [processedData]);

  // Process data for charts
  const chartData = useMemo(() => {
    if (!processedData || !processedData.banks || !processedData.mediaCategories) {
      console.log("MediaInvestmentByBank: No data available", processedData);
    return {
        mediaCategoryData: [],
        bankSharesByMedia: [],
        selectedMediaData: null
      };
    }
    
    // Format media category data for the chart
    const mediaCategoryData = processedData.mediaCategories.map(media => {
      return {
        name: media.category || media.type,
        totalInvestment: media.totalInvestment,
        marketShare: media.totalInvestment / processedData.totalInvestment * 100
      };
    }).sort((a, b) => b.totalInvestment - a.totalInvestment);
    
    // Calculate bank shares for the selected media category
    let bankSharesByMedia = [];
    
    // Fix the default category to use when in "All" tab
    const categoryToFind = selectedMediaType || (mediaCategory !== 'All' 
      ? mediaCategory 
      : 'All'); // Use 'All' instead of defaulting to 'Digital'
    
    console.log("Looking for category:", categoryToFind);
    
    // Get data for selected or default category
    const selectedMediaData = categoryToFind === 'All'
      ? null  // No specific category when in "All" tab without selection
      : processedData.mediaCategories.find(
          media => (media.category === categoryToFind || media.type === categoryToFind)
        );
    
    if (selectedMediaData) {
      // Find the bank shares property
      const bankSharesProperty = selectedMediaData.bankShares ? 'bankShares' : 'shares';
      const bankShares = selectedMediaData[bankSharesProperty] || [];
      
      // Format bank data for the selected media category
      bankSharesByMedia = bankShares.map(bankShare => {
        const valueProperty = bankShare.amount !== undefined ? 'amount' : 'investment';
        const percentageProperty = bankShare.percentage !== undefined ? 'percentage' : 'share';
          
          return {
          name: bankShare.bank,
          value: bankShare[valueProperty],
          percentage: bankShare[percentageProperty]
        };
      }).sort((a, b) => b.value - a.value);
    } else if (categoryToFind === 'All') {
      // When in All category with no selection, show distribution across all banks
      const allBanks = processedData.banks || [];
      
      // Format all banks data for the pie chart
      bankSharesByMedia = allBanks
        .filter(bank => bank.totalInvestment > 0)
        .map(bank => ({
          name: bank.name,
          value: bank.totalInvestment,
          percentage: bank.marketShare || (bank.totalInvestment / processedData.totalInvestment * 100)
        }))
        .sort((a, b) => b.value - a.value);
    }
    
    // Get data for the selected media category detail view
    let selectedMediaDetailData = null;
    if (selectedMediaType) {
      const media = processedData.mediaCategories.find(
        m => (m.category === selectedMediaType || m.type === selectedMediaType)
      );
      
      if (media) {
        const bankSharesProperty = media.bankShares ? 'bankShares' : 'shares';
        
        selectedMediaDetailData = {
          name: media.category || media.type,
          totalInvestment: media.totalInvestment,
          marketShare: media.totalInvestment / processedData.totalInvestment * 100,
          bankShares: media[bankSharesProperty] || []
        };
      }
    }
    
        return {
      mediaCategoryData,
      bankSharesByMedia,
      selectedMediaData: selectedMediaDetailData
    };
  }, [processedData, mediaCategory, selectedMediaType]);

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
  
  // Get media color
  const getMediaColor = (mediaName) => {
    return mediaColors[mediaName] || '#6B7280'; // Fallback to gray
  };

  // Get bank color
  const getBankColor = (bankName) => {
    return enhancedBankColors[bankName] || '#6B7280'; // Fallback to gray
  };

  // Enhance media category data with color information
  const enhancedMediaData = chartData.mediaCategoryData.map(media => ({
    ...media,
    color: getMediaColor(media.name),
  }));
  
  // Get selected media color
  const selectedMediaColor = selectedMediaType ? getMediaColor(selectedMediaType) : null;
  
  // Highlight the selected media in the chart
  const enhancedBarData = enhancedMediaData.map(media => ({
    ...media,
    color: selectedMediaType === media.name ? selectedMediaColor : getMediaColor(media.name),
    opacity: selectedMediaType ? (selectedMediaType === media.name ? 1 : 0.4) : 1
  }));

  // Generate analysis text based on chart data
  const generateInsights = () => {
    if (!enhancedMediaData.length) return [];
    
    const insights = [];
    
    // Add bank specific insight if media category is selected
    if (selectedMediaType && chartData.bankSharesByMedia.length) {
      const topMediaBank = chartData.bankSharesByMedia[0];
      insights.push({
        title: `${selectedMediaType} Leader`,
        description: `${topMediaBank.name} dominates ${selectedMediaType} with ${formatCurrency(topMediaBank.value)} (${formatPercentage(topMediaBank.percentage)}).`,
        icon: 'tv'
      });
    }
    
    return insights;
  };

  // Check if there's data to display in the pie chart
  const hasBankData = chartData.bankSharesByMedia && chartData.bankSharesByMedia.length > 0;

  // Calculate total investment for this view
  const totalInvestmentValue = processedData.totalInvestment || 0;

  // Obtener icono para una categoría de medios
  const getMediaIcon = (mediaName) => {
    return mediaCategoryIcons[mediaName] || mediaCategoryIcons['Other'];
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg border border-gray-100" onClick={handleClickOutside}>
      {/* Header with total investment badge */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            Media Investment Distribution Overview
            <span className="ml-3 px-3 py-1 bg-blue-50 text-blue-600 text-sm font-medium rounded-full">
              {formatCurrency(totalInvestmentValue)}
            </span>
      </h2>
          <p className="text-gray-600 mt-1">
            Media categories investment distribution across banks
          </p>
        </div>
        <div className="flex space-x-2 mt-3 sm:mt-0">
          {selectedMediaType && (
            <button 
              onClick={(e) => {e.stopPropagation(); setSelectedMediaType(null);}}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded transition-colors"
            >
              Clear Selection
            </button>
              )}
            </div>
          </div>

      {/* Media Category Tabs */}
      <div className="flex flex-wrap border-b mb-6 pb-1">
        <button
          data-tab-button="true"
          className={`px-4 py-2 mr-3 font-medium focus:outline-none rounded-lg transition duration-300 flex items-center transform hover:scale-105 hover:shadow-md`}
          onClick={(e) => {
            e.stopPropagation(); // Prevenir propagación
            setSelectedMediaType(null);
          }}
          style={!selectedMediaType ? {
            background: 'linear-gradient(135deg, #3b82f680, #3b82f6)',
            color: '#ffffff',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
          } : {
            color: '#4b5563', 
            borderBottom: '3px solid transparent'
          }}
        >
          <span className="flex items-center justify-center mr-2">
            {mediaCategoryIcons['All']}
          </span>
          All Media Categories
        </button>
        
        {enhancedMediaData.slice(0, 7).map((media) => (
          <button
            key={media.name}
            data-tab-button="true"
            className={`px-4 py-2 mr-3 font-medium focus:outline-none rounded-lg transition duration-300 flex items-center transform hover:scale-105 hover:shadow-md`}
            onClick={(e) => {
              e.stopPropagation(); // Prevenir propagación
              setSelectedMediaType(media.name);
            }}
            style={selectedMediaType === media.name ? {
              background: `linear-gradient(135deg, ${media.color}80, ${media.color})`,
              color: '#ffffff',
              fontWeight: 'bold',
              boxShadow: `0 2px 8px ${media.color}50`
            } : {
              color: '#4b5563',
              borderBottom: '3px solid transparent',
              transition: 'all 0.3s ease-in-out'
            }}
            onMouseOver={(e) => {
              if (selectedMediaType !== media.name) {
                e.currentTarget.style.background = `linear-gradient(135deg, ${media.color}15, ${media.color}30)`;
                e.currentTarget.style.color = media.color;
              }
            }}
            onMouseOut={(e) => {
              if (selectedMediaType !== media.name) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#4b5563';
              }
            }}
          >
            <span className="flex items-center justify-center mr-2">
              {getMediaIcon(media.name)}
                      </span>
            {media.name}
          </button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Left side - Bar Chart */}
        <div className="bg-white rounded-xl p-4 hover:shadow-md transition-all duration-300 border border-gray-100">
          <h3 className="text-lg font-medium text-gray-700 mb-3">
            Media Categories Investment Distribution
          </h3>
          <div className={`h-[400px] transition-all duration-700 transform ${animateChart ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={enhancedBarData}
                margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                barSize={36}
              layout="vertical"
                animationDuration={1500}
                animationEasing="ease-in-out"
              >
                <defs>
                  {enhancedMediaData.map((entry, index) => (
                    <linearGradient key={`gradient-${index}`} id={`colorGradient-${index}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={entry.color} stopOpacity={0.8} />
                      <stop offset="100%" stopColor={entry.color} stopOpacity={1} />
                    </linearGradient>
                  ))}
                </defs>
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
                  content={<SimpleInvestmentTooltip />}
                  cursor={{ fill: 'rgba(224, 231, 255, 0.1)' }} 
                  animationDuration={300}
                  wrapperStyle={{
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.3s ease'
                  }}
                />
                <Bar 
                  dataKey="totalInvestment" 
                  radius={[0, 6, 6, 0]}
                  onClick={(data) => handleMediaSelection(data)}
                  animationDuration={1500}
                  animationEasing="ease-out"
                >
                  {enhancedBarData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#colorGradient-${index})`}
                      fillOpacity={entry.opacity}
                      stroke={entry.color}
                      strokeWidth={selectedMediaType === entry.name ? 2 : 0}
                    />
                  ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </div>
        </div>
        
        {/* Right side - Donut Chart */}
        <div className="bg-white rounded-xl p-4 hover:shadow-md transition-all duration-300 border border-gray-100">
          <h3 className="text-lg font-medium text-gray-700 mb-3">
            {selectedMediaType 
              ? `${selectedMediaType} Distribution by Bank` 
              : (mediaCategory !== 'All' ? `${mediaCategory} Distribution by Bank` : 'Overall Media Distribution by Bank')
            }
          </h3>
          <div className={`h-[400px] transition-all duration-700 transform ${animateChart ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {hasBankData ? (
              <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                  <defs>
                    {chartData.bankSharesByMedia.map((entry, index) => (
                      <linearGradient key={`bankGradient-${index}`} id={`bankGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={getBankColor(entry.name)} stopOpacity={0.9} />
                        <stop offset="100%" stopColor={getBankColor(entry.name)} stopOpacity={1} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={chartData.bankSharesByMedia}
                  cx="50%"
                  cy="50%"
                    outerRadius={140}
                    innerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                    nameKey="name"
                    label={false}
                  labelLine={false}
                    onClick={(data) => setSelectedBank(data.name)}
                    animationDuration={1800}
                    animationEasing="ease-in-out"
                    animationBegin={300}
                >
                    {chartData.bankSharesByMedia.map((entry, index) => (
                    <Cell 
                        key={`cell-${index}`} 
                        fill={`url(#bankGradient-${index})`}
                        fillOpacity={selectedBank ? (selectedBank === entry.name ? 1 : 0.7) : 0.9}
                        stroke="#ffffff"
                        strokeWidth={3}
                    />
                  ))}
                </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => {
                      // Return both value and name to ensure all data is passed to tooltip
                      return [formatValue(value), 'Investment'];
                    }}
                    content={<SimpleInvestmentTooltip />}
                    animationDuration={300}
                  wrapperStyle={{
                      borderRadius: '8px',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
                      background: 'rgba(255, 255, 255, 0.95)',
                      transition: 'all 0.3s ease'
                    }}
                  />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                    align="right"
                  wrapperStyle={{
                      fontSize: '12px', 
                      paddingLeft: '10px',
                      lineHeight: '1.5em' 
                    }}
                    formatter={(value, entry) => {
                      return (
                        <span style={{ color: getBankColor(value), fontWeight: selectedBank === value ? 'bold' : 'normal' }}>
                          {value}
                        </span>
                      );
                  }}
                />
              </PieChart>
          </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-gray-500 bg-gray-100 p-4 rounded-lg">
                  No data available for {selectedMediaType || 'Digital'} category
                </div>
              </div>
            )}
        </div>
      </div>
      
        {/* Insights Section - Only show if there are insights */}
        {generateInsights().length > 0 && (
          <div className="lg:col-span-2">
            <ChartInsights insights={generateInsights()} />
          </div>
        )}
      </div>
      
      {/* Table View - Media Categories x Banks Matrix - MOVED BELOW CHARTS */}
      <div className="overflow-x-auto bg-white rounded-xl p-4 mb-6 border border-gray-100">
        <h3 className="text-lg font-medium text-gray-700 mb-4">
          Investment Distribution by Media Category and Bank
        </h3>
        <div className="shadow overflow-auto rounded-lg border border-gray-200 mb-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {tableData.headers.map((header, idx) => {
                  // Colorear el encabezado según el banco
                  let style = {};
                  if (idx > 0 && idx < tableData.headers.length - 1) {
                    // Es un banco (no es la primera columna "Media Category" ni la última "Total")
                    const bankName = header;
                    const bankColor = getBankColor(bankName);
                    style = {
                      color: bankColor,
                      borderBottom: `2px solid ${bankColor}`
                    };
                  }
                  
                  return (
                    <th 
                      key={idx}
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider sticky top-0 bg-gray-50
                        ${idx === 0 ? 'text-gray-500' : ''} 
                        ${idx === tableData.headers.length - 1 ? 'text-blue-600 bg-blue-50' : ''}`}
                      style={style}
                    >
                      {header}
                  </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableData.rows.map((row, rowIdx) => {
                // Determinar si es la fila de totales
                const isTotal = rowIdx === tableData.rows.length - 1;
                
                // Obtener el color de la categoría de medios (primera columna)
                const mediaCategory = row[0];
                const mediaCategoryColor = isTotal ? '#1D4ED8' : getMediaColor(mediaCategory);
                const mediaCategoryIcon = !isTotal ? getMediaIcon(mediaCategory) : mediaCategoryIcons['All'];
                
                  return (
                  <tr 
                    key={rowIdx} 
                    className={`
                      ${isTotal ? 'bg-blue-50 font-semibold' : 'hover:bg-gray-50'} 
                      ${selectedMediaType === row[0] && !isTotal ? 'hover:bg-blue-50' : ''}
                    `}
                    onClick={!isTotal ? () => setSelectedMediaType(row[0]) : undefined}
                    style={!isTotal ? { cursor: 'pointer' } : {}}
                  >
                    {row.map((cell, cellIdx) => {
                      // Estilo para la celda
                      let cellStyle = {};
                      
                      // Primera columna con el nombre de la categoría
                      if (cellIdx === 0) {
                        cellStyle = {
                          color: mediaCategoryColor,
                          fontWeight: 'bold'
                        };
                        
                        // Añadir icono solo para la primera columna
                        if (cellIdx === 0) {
                          return (
                            <td 
                              key={cellIdx}
                              className="px-6 py-4 whitespace-nowrap font-medium"
                              style={cellStyle}
                            >
                          <div className="flex items-center">
                                {getMediaIcon(mediaCategory)}
                                <span className="ml-2">{cell}</span>
                        </div>
                      </td>
                          );
                        }
                      } 
                      // Última columna (Total)
                      else if (cellIdx === row.length - 1) {
                        cellStyle = {
                          color: '#1D4ED8',
                          fontWeight: 'bold'
                        };
                      } 
                      // Columnas intermedias (bancos)
                      else {
                        const value = parseFloat(cell) || 0;
                        const bankName = tableData.headers[cellIdx];
                        const bankColor = getBankColor(bankName);
                        
                        // Ajustar opacidad según el valor solo en hover
                        cellStyle = {
                          color: value > 0 ? bankColor : '#CBD5E1'
                        };
                      }
                      
                          return (
                        <td 
                          key={cellIdx}
                          className={`px-6 py-4 whitespace-nowrap transition-colors duration-150
                            ${cellIdx === 0 ? 'font-medium' : ''} 
                            ${cellIdx === row.length - 1 ? 'font-semibold' : ''}`}
                          style={cellStyle}
                        >
                          {cellIdx === 0 ? cell : formatValue(cell)}
                            </td>
                          );
                    })}
                    </tr>
                  );
                })}
            </tbody>
          </table>
                    </div>
      </div>
      
      {/* Selected Media Detail */}
      {chartData.selectedMediaData && (
        <div className={`mt-8 pt-6 border-t border-gray-200 transition-all duration-500 ${selectedMediaType ? 'opacity-100 max-h-[1000px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
          <div className="flex items-center mb-5">
            <div 
              className="w-5 h-5 rounded-full mr-3" 
              style={{ backgroundColor: selectedMediaColor }}
            ></div>
            <h3 className="text-xl font-semibold text-gray-800">{chartData.selectedMediaData.name}</h3>
            <span className="ml-3 px-3 py-1 bg-blue-50 text-blue-600 text-sm font-medium rounded-full">
              {formatPercentage(chartData.selectedMediaData.marketShare)} market share
            </span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                <BankIcon />
                <span className="ml-2">Bank Distribution</span>
              </h4>
              <div className="space-y-3">
                {chartData.selectedMediaData.bankShares && chartData.selectedMediaData.bankShares.map((bank, idx) => {
                  // Handle different property names for bank, amount and percentage
                  const bankName = bank.bank || 'Unknown';
                  const amount = bank.amount || bank.investment || 0;
                  const percentage = bank.percentage || bank.share || 0;
                  const bankColor = getBankColor(bankName);
                    
                    return (
                    <div key={idx} className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <span className="text-gray-700 font-medium" style={{ color: bankColor }}>
                        <BankIcon />
                        <span className="ml-2">{bankName}:</span>
                      </span>
                      <div className="flex space-x-4">
                        <span className="font-semibold text-gray-900">{formatCurrency(amount)}</span>
                        <span className="text-blue-600 bg-blue-50 px-2 rounded">{formatPercentage(percentage)}</span>
                        </div>
                    </div>
                    );
                  })}
                    </div>
        </div>
            
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm9 4a1 1 0 10-2 0v6a1 1 0 102 0V7zm-3 2a1 1 0 10-2 0v4a1 1 0 102 0V9zm-3 3a1 1 0 10-2 0v1a1 1 0 102 0v-1z" clipRule="evenodd" />
                </svg>
                Investment Summary
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-gray-700 font-medium">Total Investment:</span>
                  <span className="font-semibold text-gray-900">{formatValue(chartData.selectedMediaData.totalInvestment)}</span>
      </div>
                <div className="flex justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-gray-700 font-medium">Category Position:</span>
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-900 mr-2">
                      #{enhancedMediaData.findIndex(m => m.name === chartData.selectedMediaData.name) + 1}
                    </span>
                    <span className="text-gray-500">of {enhancedMediaData.length}</span>
                  </div>
                </div>
                <div className="flex justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-gray-700 font-medium">Market Share:</span>
                  <span className="font-semibold text-gray-900">{formatPercentage(chartData.selectedMediaData.marketShare)}</span>
                </div>
                <div className="flex justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-gray-700 font-medium">Banks Served:</span>
                  <span className="font-semibold text-gray-900">
                    {chartData.selectedMediaData.bankShares.length} banks
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