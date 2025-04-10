import React, { useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { formatCurrency } from '../../utils/formatters';

// Función para formatear porcentajes con exactamente 2 decimales sin redondeo
const formatExactPercentage = (value) => {
  // Determinar si el valor ya está en formato porcentual
  const percentValue = value > 1 ? value : value * 100;
  
  const numStr = percentValue.toString();
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
    console.log("Category found: undefined (mediaCategories empty or not an array)");
    return null;
  }
  
  // Normalize category name for case-insensitive comparison
  const normalizedCategoryName = categoryName.toLowerCase();
  
  // Try to find the category using multiple possible property names and case-insensitive comparison
  const category = mediaCategories.find(cat => {
    // Try different property names that might contain the category name
    const categoryNames = [
      cat.category, 
      cat.type, 
      cat.name,
      cat.mediaCategory,
      cat.mediaType,
      cat.categoryName
    ].filter(Boolean); // Remove null/undefined values
    
    // Check if any of the possible category names match (case-insensitive)
    return categoryNames.some(name => 
      name && name.toLowerCase() === normalizedCategoryName
    );
  });
  
  // If we couldn't find an exact match, try partial matching (contains)
  if (!category) {
    const partialMatch = mediaCategories.find(cat => {
      const categoryNames = [
        cat.category, 
        cat.type, 
        cat.name,
        cat.mediaCategory,
        cat.mediaType,
        cat.categoryName
      ].filter(Boolean);
      
      return categoryNames.some(name => 
        name && name.toLowerCase().includes(normalizedCategoryName)
      );
    });
    
    if (partialMatch) {
      return partialMatch;
    }
  }
  
  return category;
};

// Enhanced component with more responsive design and filter support
const MediaInsights = () => {
  const { 
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
  
  // Calcular insights dinámicamente basados en los datos filtrados
  const insights = useMemo(() => {
    if (!dataSource || !dataSource.mediaCategories || !dataSource.banks) {
      return [];
    }
    
    // Encontrar categorías principales
    const sortedCategories = [...(dataSource.mediaCategories || [])]
      .sort((a, b) => (b.totalInvestment || 0) - (a.totalInvestment || 0));
    
    // Calcular el total de inversión
    const totalInvestment = dataSource.banks
      .reduce((sum, bank) => sum + (bank.totalInvestment || 0), 0);
    
    // Ordenar bancos por inversión total
    const sortedBanks = [...dataSource.banks]
      .sort((a, b) => (b.totalInvestment || 0) - (a.totalInvestment || 0));
    
    // Información de televisión
    const televisionData = findMediaCategory(sortedCategories, 'Television');
    const televisionInsight = {
      text: televisionData 
        ? `Television investment reaches ${formatCurrency(televisionData.totalInvestment)} across all banks${selectedPeriod !== 'All Period' ? ` in ${selectedPeriod}` : ''}, representing ${formatExactPercentage(televisionData.totalInvestment / totalInvestment * 100)}% of total spend, with ${televisionData.bankShares?.[0]?.bank || 'Capital One'} leading with ${formatCurrency(televisionData.bankShares?.[0]?.investment || 0)}.`
        : "Television data not available for the selected period.",
      color: "#3B82F6",
      icon: "📺",
      category: "Television"
    };
    
    // Información de medios digitales
    const digitalData = findMediaCategory(sortedCategories, 'Digital');
    const digitalInsight = {
      text: digitalData 
        ? `Digital media accounts for ${formatCurrency(digitalData.totalInvestment)} (${formatExactPercentage(digitalData.totalInvestment / totalInvestment * 100)}%) of total banking sector spend${selectedMonths.length > 0 ? ` during the selected ${selectedMonths.length} month(s)` : ''}, with ${digitalData.bankShares?.[0]?.bank || 'Chase Bank'} leading digital investment.`
        : "Digital media data not available for the selected period.",
      color: "#DC2626",
      icon: "📱",
      category: "Digital"
    };
    
    // Información de audio
    const audioData = findMediaCategory(sortedCategories, 'Audio');
    const audioInsight = {
      text: audioData 
        ? `Audio investment totals ${formatCurrency(audioData.totalInvestment)} (${formatExactPercentage(audioData.totalInvestment / totalInvestment * 100)}%) across ${dataSource.banks.length} banks${selectedYears.length > 0 ? ` in ${selectedYears.join(', ')}` : ''}, with ${audioData.bankShares?.[0]?.bank || 'Chase Bank'} (${formatCurrency(audioData.bankShares?.[0]?.investment || 0)}) leading spend in this category.`
        : "Audio data not available for the selected period.",
      color: "#22C55E",
      icon: "🎧",
      category: "Audio"
    };
    
    // Información de print y outdoor combinados
    const printData = findMediaCategory(sortedCategories, 'Print');
    const outdoorData = findMediaCategory(sortedCategories, 'Outdoor');
    const combinedInvestment = (printData?.totalInvestment || 0) + (outdoorData?.totalInvestment || 0);
    
    const printOutdoorInsight = {
      text: (printData || outdoorData) 
        ? `Print and outdoor advertising represent ${formatCurrency(combinedInvestment)} combined spend${selectedPeriod !== 'All Period' ? ` in ${selectedPeriod}` : ''}, with ${formatExactPercentage(combinedInvestment / totalInvestment * 100)}% of total media investment, primarily distributed among ${printData?.bankShares?.length || outdoorData?.bankShares?.length || 'major'} banks.`
        : "Print and outdoor data not available for the selected period.",
      color: "#6D28D9",
      icon: "📰",
      category: "Print/Outdoor"
    };
    
    // Insight estacional basado en los filtros aplicados
    const seasonalInsight = {
      text: selectedMonths.length > 0 
        ? `The selected period shows a total investment of ${formatCurrency(totalInvestment)} across all media categories, with ${dataSource.banks[0]?.name || 'the leading bank'} representing ${formatExactPercentage(dataSource.banks[0]?.marketShare || 0)}% market share.`
        : `Total media investment across all periods is ${formatCurrency(totalInvestment)}, with seasonal variations and ${dataSource.banks[0]?.name || 'the leading bank'} maintaining ${formatExactPercentage(dataSource.banks[0]?.marketShare || 0)}% average market share.`,
      color: "#10B981",
      icon: "📈",
      category: "Seasonal"
    };
    
    // Nuevo insight sobre concentración del mercado
    const marketConcentrationInsight = {
      text: sortedBanks.length > 0 
        ? `Market concentration shows top ${Math.min(3, sortedBanks.length)} banks representing ${formatExactPercentage(sortedBanks.slice(0, 3).reduce((sum, bank) => sum + (bank.marketShare || 0), 0))}% of total media investment. ${sortedBanks[0]?.name || 'Leading bank'} commands ${formatExactPercentage(sortedBanks[0]?.marketShare || 0)}% share, followed by ${sortedBanks[1]?.name || 'second bank'} with ${formatExactPercentage(sortedBanks[1]?.marketShare || 0)}%.`
        : "Market concentration data not available for the selected period.",
      color: "#8B5CF6",
      icon: "📊",
      category: "Market Concentration"
    };
    
    return [
      televisionInsight,
      digitalInsight,
      audioInsight,
      printOutdoorInsight,
      seasonalInsight,
      marketConcentrationInsight
    ];
  }, [dataSource, selectedMonths, selectedYears, selectedPeriod]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {insights.map((insight, index) => (
        <div
          key={index}
          className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full"
        >
          {/* Encabezado con gradiente de color */}
          <div 
            className="py-3 px-4 flex items-center" 
            style={{ 
              background: `linear-gradient(135deg, ${insight.color}30, ${insight.color}15)`,
              borderBottom: `1px solid ${insight.color}20`
            }}
          >
            <div 
              className="h-10 w-10 rounded-full flex items-center justify-center text-xl bg-white mr-3"
              style={{ 
                boxShadow: `0 0 8px ${insight.color}40`,
                border: `1px solid ${insight.color}30`
              }}
            >
              {insight.icon}
            </div>
            <h4 className="font-semibold text-lg" style={{ color: insight.color }}>
              {insight.category}
            </h4>
          </div>
          
          {/* Contenido principal */}
          <div className="flex-grow px-4 py-4">
            <div 
              className="bg-gray-50 rounded-lg p-4 h-full" 
              style={{ 
                borderLeft: `3px solid ${insight.color}`, 
                boxShadow: `inset 0 0 6px rgba(0,0,0,0.05)`
              }}
            >
              <p className="text-gray-700 text-sm leading-relaxed">{insight.text}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MediaInsights;