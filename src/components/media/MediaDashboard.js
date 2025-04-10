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
 * Main component for the media analysis dashboard
 */
const MediaDashboard = () => {
  const { 
    selectedMediaCategory, 
    filteredData, 
    dashboardData, 
    selectedMonths, 
    selectedYears,
    selectedPeriod 
  } = useDashboard();

  // Use filteredData if available, otherwise use dashboardData
  const dataSource = useMemo(() => {
    return filteredData || dashboardData || {};
  }, [filteredData, dashboardData]);

  // Genera dinámicamente los insights basados en los datos filtrados
  const dynamicInsights = useMemo(() => {
    if (!dataSource || !dataSource.banks || !dataSource.mediaCategories) {
      return {
        primaryMediaChannels: [],
        seasonalPatterns: [],
        marketDistribution: []
      };
    }

    // Obtener los datos de los bancos principales
    const topBanks = [...dataSource.banks]
      .sort((a, b) => b.totalInvestment - a.totalInvestment)
      .slice(0, 4);

    // Datos de categorías de medios
    const mediaCategories = dataSource.mediaCategories || [];
    
    // Obtener categorías principales (TV, Digital)
    const televisionData = mediaCategories.find(cat => 
      cat.category === 'Television' || cat.type === 'Television'
    );
    
    const digitalData = mediaCategories.find(cat => 
      cat.category === 'Digital' || cat.type === 'Digital'
    );

    // Obtener datos de Audio para los insights estacionales
    const audioData = mediaCategories.find(cat => 
      cat.category === 'Audio' || cat.type === 'Audio'
    );

    // Calcula el total de inversión de todos los bancos, no solo los top banks
    // Se usa dataSource.totalInvestment si está disponible para mayor precisión
    const totalInvestment = dataSource.totalInvestment || 
      dataSource.banks.reduce((sum, bank) => sum + bank.totalInvestment, 0);
    
    // Primary Media Channels insights
    const primaryMediaChannels = [];
    
    if (televisionData) {
      const televisionInsight = {
        color: mediaColors['Television'],
        text: `Television dominates media spending: ${
          televisionData.bankShares?.length > 0 
            ? televisionData.bankShares.slice(0, 3).map(share => 
                `${share.bank} ${
                  share.investment >= 100000000 
                    ? formatCurrency(share.investment) 
                    : formatCurrency(share.investment)
                } (${formatExactPercentage(share.percentage)}%)`
              ).join(', ')
            : 'Data not available for the selected period'
        }`
      };
      primaryMediaChannels.push(televisionInsight);
    }
    
    if (digitalData) {
      const digitalInsight = {
        color: mediaColors['Digital'],
        text: `Digital ranks second: ${
          digitalData.bankShares?.length > 0 
            ? digitalData.bankShares.slice(0, 4).map(share => 
                `${share.bank} ${formatCurrency(share.investment)} (${formatExactPercentage(share.percentage)}%)`
              ).join(', ')
            : 'Data not available for the selected period'
        }`
      };
      primaryMediaChannels.push(digitalInsight);
    }
    
    // Seasonal Investment Patterns insights
    const seasonalPatterns = [];
    
    // Insight para patrones estacionales (si hay datos de meses)
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
      const audioInsight = {
        color: mediaColors['Audio'],
        text: `Audio investment varies by bank: ${
          audioData.bankShares?.length > 0 
            ? audioData.bankShares.slice(0, 3).map(share => 
                `${share.bank} ${formatCurrency(share.investment)} (${formatExactPercentage(share.percentage)}%)`
              ).join(', ')
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
    
    // Quarterly data insight (si tenemos datos de Q4)
    const q4Data = selectedPeriod === 'Q4' || selectedPeriod.includes('Q4') || !selectedPeriod;
    const q4Insight = {
      color: "#22c55e",
      text: q4Data
        ? `${selectedPeriod || 'Selected period'} accounts for ${formatExactPercentage(totalInvestment / (dataSource.totalInvestment || totalInvestment) * 100)}% of ${selectedYears.length ? selectedYears.join('/') : 'annual'} spend (${formatCurrency(totalInvestment)})`
        : `Total investment for ${selectedPeriod || 'selected period'}: ${formatCurrency(totalInvestment)}`
    };
    marketDistribution.push(q4Insight);
    
    return {
      primaryMediaChannels,
      seasonalPatterns,
      marketDistribution
    };
  }, [dataSource, selectedMonths, selectedYears, selectedPeriod]);

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
      <MediaInvestmentByBank activeCategory={selectedMediaCategory} />
    </div>
  );
};

export default MediaDashboard;