import React, { useMemo } from 'react';
import MediaInvestmentByBank from './MediaInvestmentByBank';
import MediaChannelAnalysis from './MediaChannelAnalysis';
import MediaInsights from './MediaInsights';
import { useDashboard } from '../../context/DashboardContext';
import { mediaColors } from '../../utils/colorSchemes';

// Function to format currency values with exactly 2 decimals without rounding
const formatCurrency = (value) => {
  // Helper function to get exactly 2 decimals without rounding
  const getExactDecimals = (num) => {
    const numStr = num.toString();
    const decimalPos = numStr.indexOf('.');
    
    if (decimalPos === -1) {
      return `${numStr}.00`;
    } else {
      const intPart = numStr.substring(0, decimalPos);
      const decPart = numStr.substring(decimalPos + 1);
      const formattedDecPart = decPart.length >= 2 
        ? decPart.substring(0, 2) 
        : decPart.padEnd(2, '0');
      
      return `${intPart}.${formattedDecPart}`;
    }
  };

  if (value >= 1000000000) {
    return `$${getExactDecimals(value / 1000000000)}B`;
  }
  else if (value >= 1000000) {
    return `$${getExactDecimals(value / 1000000)}M`;
  } else if (value >= 1000) {
    return `$${getExactDecimals(value / 1000)}K`;
  }
  return `$${getExactDecimals(value)}`;
};

// Function to format percentage with exactly 2 decimals without rounding
const formatExactPercentage = (value) => {
  const numStr = value.toString();
  const decimalPos = numStr.indexOf('.');
  
  if (decimalPos === -1) {
    return `${numStr}.00`;
  } else {
    const intPart = numStr.substring(0, decimalPos);
    const decPart = numStr.substring(decimalPos + 1);
    const formattedDecPart = decPart.length >= 2 
      ? decPart.substring(0, 2) 
      : decPart.padEnd(2, '0');
    
    return `${intPart}.${formattedDecPart}`;
  }
};

/**
 * Helper function to find media category data with support for different property names
 * @param {Array} mediaCategories - Array of media categories
 * @param {string} categoryName - Name of the category to find
 * @returns {Object|null} - Found category or null
 */
const findMediaCategory = (mediaCategories, categoryName) => {
  if (!mediaCategories || !Array.isArray(mediaCategories) || mediaCategories.length === 0) {
    console.log("Categoría encontrada: undefined (mediaCategories vacío o no es un array)");
    console.log("Valor de mediaCategories:", mediaCategories);
    
    if (!mediaCategories) {
      console.log("mediaCategories es null o undefined");
    } else if (!Array.isArray(mediaCategories)) {
      console.log("mediaCategories no es un array, es:", typeof mediaCategories);
    } else {
      console.log("mediaCategories es un array vacío");
    }
    
    return null;
  }
  
  console.log("Looking for category:", categoryName, "in", mediaCategories.map(c => c.category || c.type || c.name));
  
  // Intentar encontrar la categoría usando múltiples propiedades posibles
  const category = mediaCategories.find(cat => 
    (cat.category === categoryName) || 
    (cat.type === categoryName) || 
    (cat.name === categoryName)
  );
  
  console.log("Found category:", category);
  return category;
};

/**
 * Helper function to safely access bank shares data with support for different property names
 * @param {Object} categoryData - Media category data
 * @returns {Array} - Bank shares data
 */
const getBankShares = (categoryData) => {
  if (!categoryData) return [];
  
  // Try different property names for bank shares
  const bankSharesProperty = 
    Array.isArray(categoryData.bankShares) ? 'bankShares' : 
    Array.isArray(categoryData.shares) ? 'shares' : null;
  
  if (!bankSharesProperty) return [];
  
  const bankShares = categoryData[bankSharesProperty] || [];
  console.log(`Bank shares property: ${bankSharesProperty} length: ${bankShares.length}`);
  
  return bankShares;
};

/**
 * Helper function to safely access investment value with support for different property names
 * @param {Object} bankShare - Bank share data
 * @returns {number} - Investment value
 */
const getInvestmentValue = (bankShare) => {
  if (!bankShare) return 0;
  
  // Try different property names for investment amount
  return bankShare.investment || bankShare.amount || 0;
};

/**
 * Helper function to safely access percentage value with support for different property names
 * @param {Object} bankShare - Bank share data
 * @returns {number} - Percentage value
 */
const getPercentageValue = (bankShare) => {
  if (!bankShare) return 0;
  
  // Try different property names for percentage
  return bankShare.percentage || bankShare.share || 0;
};

/**
 * Main component for the media analysis dashboard
 */
// eslint-disable-next-line react/prop-types
const MediaDashboard = ({ dataSource }) => {
  // DEBUG: Inspeccionar el dataSource recibido
  console.log("===== MEDIA DASHBOARD =====");
  console.log("dataSource recibido:", dataSource);
  
  if (dataSource) {
    console.log("Propiedades disponibles:", Object.keys(dataSource));
    if (dataSource.mediaCategories) {
      console.log("Media categories disponibles:", dataSource.mediaCategories.length);
      console.log("Primer elemento de mediaCategories:", dataSource.mediaCategories[0]);
    }
  }

  const { 
    selectedMediaCategory, 
    selectedMonths,
    selectedYears,
    selectedPeriod,
    filteredData,
    dashboardData
  } = useDashboard();

  // Use filteredData if available, otherwise use dashboardData
  const dataSourceMemo = useMemo(() => {
    return filteredData || dashboardData || {};
  }, [filteredData, dashboardData]);

  // Generate dynamic insights based on filtered data
  const dynamicInsights = useMemo(() => {
    if (!dataSourceMemo || !dataSourceMemo.banks || !dataSourceMemo.mediaCategories) {
      return {
        primaryMediaChannels: [],
        seasonalPatterns: [],
        marketDistribution: []
      };
    }

    // Get top banks data
    const topBanks = [...dataSourceMemo.banks]
      .sort((a, b) => b.totalInvestment - a.totalInvestment)
      .slice(0, 4);

    // Media categories data
    const mediaCategories = dataSourceMemo.mediaCategories || [];
    
    // Get main category data (TV, Digital)
    const televisionData = findMediaCategory(mediaCategories, 'Television');
    const digitalData = findMediaCategory(mediaCategories, 'Digital');
    const audioData = findMediaCategory(mediaCategories, 'Audio');

    // Calculate total investment from all banks
    // Use dataSourceMemo.totalInvestment if available for better precision
    const totalInvestment = dataSourceMemo.totalInvestment || 
      dataSourceMemo.banks.reduce((sum, bank) => sum + bank.totalInvestment, 0);
    
    // Primary Media Channels insights
    const primaryMediaChannels = [];
    
    if (televisionData) {
      const televisionBankShares = getBankShares(televisionData);
      const televisionInsight = {
        color: mediaColors['Television'],
        text: `Television dominates media spending: ${
          televisionBankShares.length > 0 
            ? televisionBankShares.slice(0, 3).map(share => {
                const investment = getInvestmentValue(share);
                const percentage = getPercentageValue(share);
                return `${share.bank} ${formatCurrency(investment)} (${formatExactPercentage(percentage)}%)`;
              }).join(', ')
            : 'Data not available for the selected period'
        }`
      };
      primaryMediaChannels.push(televisionInsight);
    }
    
    if (digitalData) {
      const digitalBankShares = getBankShares(digitalData);
      const digitalInsight = {
        color: mediaColors['Digital'],
        text: `Digital ranks second: ${
          digitalBankShares.length > 0 
            ? digitalBankShares.slice(0, 4).map(share => {
                const investment = getInvestmentValue(share);
                const percentage = getPercentageValue(share);
                return `${share.bank} ${formatCurrency(investment)} (${formatExactPercentage(percentage)}%)`;
              }).join(', ')
            : 'Data not available for the selected period'
        }`
      };
      primaryMediaChannels.push(digitalInsight);
    }
    
    // Seasonal Investment Patterns insights
    const seasonalPatterns = [];
    
    // Insight for seasonal patterns (if month data is available)
    if (selectedMonths.length > 0) {
      const seasonalInsight = {
        color: mediaColors['Television'],
        text: `Seasonal spending in ${selectedMonths.join(', ')}: ${
          topBanks.length > 0 
            ? topBanks.slice(0, 2).map(bank => 
                `${bank.name} ${formatCurrency(bank.totalInvestment)} (${formatExactPercentage((bank.totalInvestment / totalInvestment * 100))}% of selected period)`
              ).join('; ')
            : 'Data not available for the selected period'
        }`
      };
      seasonalPatterns.push(seasonalInsight);
    } else {
      const seasonalInsight = {
        color: mediaColors['Television'],
        text: `Seasonal spending varies significantly across banks: ${
          topBanks.length > 0 
            ? topBanks.slice(0, 2).map(bank => 
                `${bank.name} ${formatCurrency(bank.totalInvestment)}`
              ).join(' vs. ')
            : 'Data not available'
        }`
      };
      seasonalPatterns.push(seasonalInsight);
    }
    
    // Audio investment insight
    if (audioData) {
      const audioBankShares = getBankShares(audioData);
      const audioInsight = {
        color: mediaColors['Audio'],
        text: `Audio investment varies by bank: ${
          audioBankShares.length > 0 
            ? audioBankShares.slice(0, 3).map(share => {
                const investment = getInvestmentValue(share);
                const percentage = getPercentageValue(share);
                return `${share.bank} ${formatCurrency(investment)} (${formatExactPercentage(percentage)}%)`;
              }).join(', ')
            : 'Data not available for the selected period'
        }`
      };
      seasonalPatterns.push(audioInsight);
    }
    
    // Market Distribution insights
    const marketDistribution = [];
    
    if (topBanks.length > 0) {
      const marketShareInsight = {
        color: "#4ade80",
        text: `Bank market share distribution: ${
          topBanks.map(bank => 
            `${bank.name} ${formatExactPercentage(bank.marketShare)}% (${formatCurrency(bank.totalInvestment)})`
          ).join(', ')
        }`
      };
      marketDistribution.push(marketShareInsight);
    }
    
    // Quarterly data insight (for Q4 data)
    const q4Data = selectedPeriod === 'Q4' || selectedPeriod.includes('Q4') || !selectedPeriod;
    const q4Insight = {
      color: "#22c55e",
      text: q4Data
        ? `${selectedPeriod || 'Selected period'} accounts for ${formatExactPercentage(totalInvestment / (dataSourceMemo.totalInvestment || totalInvestment) * 100)}% of ${selectedYears.length ? selectedYears.join('/') : 'annual'} spend (${formatCurrency(totalInvestment)})`
        : `Total investment for ${selectedPeriod || 'selected period'}: ${formatCurrency(totalInvestment)}`
    };
    marketDistribution.push(q4Insight);
    
    return {
      primaryMediaChannels,
      seasonalPatterns,
      marketDistribution
    };
  }, [dataSourceMemo, selectedMonths, selectedYears, selectedPeriod]);

  // Process and normalize the media category before passing it to child components
  const normalizedMediaCategory = useMemo(() => {
    if (selectedMediaCategory === 'All') return 'All';
    
    // Verify the selected category exists in the data
    if (dataSourceMemo && dataSourceMemo.mediaCategories) {
      const categoryExists = dataSourceMemo.mediaCategories.some(cat => 
        (cat.category === selectedMediaCategory) || 
        (cat.type === selectedMediaCategory) || 
        (cat.name === selectedMediaCategory)
      );
      
      if (categoryExists) {
        return selectedMediaCategory;
      }
    }
    
    // Default to 'All' if the category doesn't exist
    return 'All';
  }, [selectedMediaCategory, dataSourceMemo]);

  // Si no hay datos disponibles, mostrar un mensaje
  if (!dataSourceMemo || !dataSourceMemo.mediaCategories || dataSourceMemo.mediaCategories.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-xl text-gray-400 mb-2">No hay datos disponibles</div>
          <p className="text-gray-500">Asegúrese de que el archivo CSV está cargado correctamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Media Strategy Insights - Enhanced panel with better responsiveness */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 transition-shadow duration-300 hover:shadow-lg">
        <div className="flex items-center mb-5">
          <div className="bg-emerald-100 rounded-full p-2.5 mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Media Strategy Insights</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Television and Digital Insights */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200 transition-all duration-300 hover:shadow-md hover:border-blue-300">
            <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
              <span className="bg-blue-200 p-2 rounded-full mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              Primary Media Channels
            </h3>
            <ul className="space-y-4">
              {dynamicInsights.primaryMediaChannels.length > 0 ? (
                dynamicInsights.primaryMediaChannels.map((insight, index) => (
                  <li key={index} className="flex items-start p-3 bg-white bg-opacity-60 rounded-lg border-l-3 border-blue-400 transition-all duration-300 hover:bg-opacity-80">
                    <span className="inline-block w-3 h-3 rounded-full mt-1.5 mr-2.5 flex-shrink-0" style={{backgroundColor: insight.color}}></span>
                    <span className="text-blue-900">{insight.text}</span>
                  </li>
                ))
              ) : (
                <li className="flex items-start p-3 bg-white bg-opacity-60 rounded-lg border-l-3 border-blue-400">
                  <span className="text-blue-900">No data available for the selected filters</span>
                </li>
              )}
            </ul>
          </div>

          {/* Seasonal Investment Patterns */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-5 border border-amber-200 transition-all duration-300 hover:shadow-md hover:border-amber-300">
            <h3 className="text-lg font-semibold text-amber-800 mb-4 flex items-center">
              <span className="bg-amber-200 p-2 rounded-full mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
              Seasonal Investment Patterns
            </h3>
            <ul className="space-y-4">
              {dynamicInsights.seasonalPatterns.length > 0 ? (
                dynamicInsights.seasonalPatterns.map((insight, index) => (
                  <li key={index} className="flex items-start p-3 bg-white bg-opacity-60 rounded-lg border-l-3 border-amber-400 transition-all duration-300 hover:bg-opacity-80">
                    <span className="inline-block w-3 h-3 rounded-full mt-1.5 mr-2.5 flex-shrink-0" style={{backgroundColor: insight.color}}></span>
                    <span className="text-amber-900">{insight.text}</span>
              </li>
                ))
              ) : (
                <li className="flex items-start p-3 bg-white bg-opacity-60 rounded-lg border-l-3 border-amber-400">
                  <span className="text-amber-900">No data available for the selected filters</span>
              </li>
              )}
            </ul>
          </div>

          {/* Market Distribution */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border border-green-200 transition-all duration-300 hover:shadow-md hover:border-green-300">
            <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
              <span className="bg-green-200 p-2 rounded-full mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </span>
              Market Distribution
            </h3>
            <ul className="space-y-4">
              {dynamicInsights.marketDistribution.length > 0 ? (
                dynamicInsights.marketDistribution.map((insight, index) => (
                  <li key={index} className="flex items-start p-3 bg-white bg-opacity-60 rounded-lg border-l-3 border-green-400 transition-all duration-300 hover:bg-opacity-80">
                    <span className="inline-block w-3 h-3 rounded-full mt-1.5 mr-2.5 flex-shrink-0" style={{backgroundColor: insight.color}}></span>
                    <span className="text-green-900">{insight.text}</span>
              </li>
                ))
              ) : (
                <li className="flex items-start p-3 bg-white bg-opacity-60 rounded-lg border-l-3 border-green-400">
                  <span className="text-green-900">No data available for the selected filters</span>
              </li>
              )}
            </ul>
          </div>
        </div>
      </div>
      
      {/* Media Investment Insights */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 transition-shadow duration-300 hover:shadow-lg">
        <div className="flex items-center mb-5">
          <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full p-2.5 mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 relative">
            Media Investment Insights
            <span className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-indigo-300 to-purple-300 rounded"></span>
          </h2>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 rounded-lg p-6 border border-indigo-200 transition-all duration-300 hover:shadow-inner">
          <div className="mb-4">
            <p className="text-indigo-800 text-sm mb-3 font-medium">
              Comprehensive analysis of media investment patterns across banking sector
            </p>
          </div>
          <MediaInsights />
        </div>
      </div>
      
      {/* Media Channel Analysis */}
      <MediaChannelAnalysis />
      
      {/* Media Investment by Bank */}
      <MediaInvestmentByBank activeCategory={normalizedMediaCategory} />
    </div>
  );
};

export default MediaDashboard;