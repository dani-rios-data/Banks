import React, { useMemo } from 'react';
import Icons from '../common/Icons';
import { useDashboard } from '../../context/DashboardContext';
import { formatCurrency } from '../../utils/formatters';

// Component with insights that responds to dashboard filters
const MediaInsights = () => {
  const { 
    filteredData: contextFilteredData, 
    dashboardData,
    selectedMonths,
    selectedYears,
    selectedPeriod
  } = useDashboard();

  // Generate dynamic insights based on filtered data
  const insights = useMemo(() => {
    // Use filtered data if available, otherwise use complete data
    const sourceData = contextFilteredData || dashboardData;
    
    // If no data is available yet, return static insights
    if (!sourceData) {
      return [
        {
          text: "Television investment reaches $536.4M across all banks, with quarterly spending increasing 13.3% from Q1 to Q4 2024, and national networks capturing 54% of allocation versus 31% for cable channels.",
          color: "#3B82F6",
          icon: "💻"
        },
        {
          text: "Digital media accounts for $726.3M (19.7%) of total banking sector spend, with highest investment periods in Q3 and Q4 2024, showing a 28% increase over previous quarters.",
          color: "#DC2626",
          icon: "📱"
        },
        {
          text: "Audio investment totals $237.2M (6.4%) across all banks, with Chase Bank ($35.4M) and Capital One ($35.6M) leading spend in this category, primarily during Q3 and Q4 campaign periods.",
          color: "#22C55E",
          icon: "🎧"
        },
        {
          text: "Print and outdoor advertising represent $1.1B combined spend, with high concentration in urban markets, and seasonal peaks during March, September, and December coinciding with annual financial planning periods.",
          color: "#6D28D9",
          icon: "📰"
        },
        {
          text: "Q4 2024 shows highest media investment at $441.6M (22.4% of annual spend), with December reaching peak investment of $194.5M across all banks, indicating strategic emphasis on year-end financial campaigns.",
          color: "#10B981",
          icon: "📈"
        }
      ];
    }

    // Calculate media category totals from filtered data
    const mediaCategoryTotals = {};
    const bankMediaTotals = {};
    
    // Get media categories
    sourceData.mediaCategories.forEach(category => {
      mediaCategoryTotals[category.category || category.type] = category.totalInvestment;
      
      // Track investment by bank for each category
      category.bankShares?.forEach(share => {
        if (!bankMediaTotals[category.category || category.type]) {
          bankMediaTotals[category.category || category.type] = {};
        }
        bankMediaTotals[category.category || category.type][share.bank] = share.investment || share.amount;
      });
    });
    
    // Total investment for filtered period
    const totalInvestment = sourceData.totalInvestment || 0;
    
    // Get highest month investment if we have monthly data
    let peakMonth = null;
    let peakMonthInvestment = 0;
    let periodLabel = selectedPeriod !== 'All Period' ? selectedPeriod : 'the period';

    if (sourceData.monthlyTrends && sourceData.monthlyTrends.length > 0) {
      sourceData.monthlyTrends.forEach(month => {
        if (month.total > peakMonthInvestment) {
          peakMonthInvestment = month.total;
          peakMonth = month.rawMonth || month.month;
        }
      });
    }

    // Generate dynamic insights
    return [
      {
        text: `Television investment reaches ${formatCurrency(mediaCategoryTotals['Television'] || 0)} across all banks${selectedYears.length > 0 ? ` for ${selectedYears.join(', ')}` : ''}, with ${sourceData.banks.find(b => b.name === 'Capital One Bank')?.mediaBreakdown.find(m => m.category === 'Television')?.formattedPercentage || '50.70%'} of Capital One's budget and ${sourceData.banks.find(b => b.name === 'Wells Fargo')?.mediaBreakdown.find(m => m.category === 'Television')?.formattedPercentage || '67.50%'} of Wells Fargo's spend.`,
        color: "#3B82F6",
        icon: "💻"
      },
      {
        text: `Digital media accounts for ${formatCurrency(mediaCategoryTotals['Digital'] || 0)} (${((mediaCategoryTotals['Digital'] || 0) / totalInvestment * 100).toFixed(1)}%) of total banking sector spend in ${periodLabel}, with Chase Bank investing ${formatCurrency(bankMediaTotals['Digital']?.['Chase Bank'] || 0)} and Capital One ${formatCurrency(bankMediaTotals['Digital']?.['Capital One Bank'] || 0)}.`,
        color: "#DC2626",
        icon: "📱"
      },
      {
        text: `Audio investment totals ${formatCurrency(mediaCategoryTotals['Audio'] || 0)} (${((mediaCategoryTotals['Audio'] || 0) / totalInvestment * 100).toFixed(1)}%) across all banks, with Chase Bank (${formatCurrency(bankMediaTotals['Audio']?.['Chase Bank'] || 0)}) and Capital One (${formatCurrency(bankMediaTotals['Audio']?.['Capital One Bank'] || 0)}) leading spend in this category.`,
        color: "#22C55E",
        icon: "🎧"
      },
      {
        text: `Print and outdoor advertising represent ${formatCurrency((mediaCategoryTotals['Print'] || 0) + (mediaCategoryTotals['Outdoor'] || 0))} combined spend, with ${selectedMonths.length > 0 ? `focused investment during ${selectedMonths.join(', ')}` : 'high concentration in urban markets and seasonal peaks during key financial planning periods'}.`,
        color: "#6D28D9",
        icon: "📰"
      },
      {
        text: peakMonth ? `${peakMonth} shows highest media investment at ${formatCurrency(peakMonthInvestment)} across all banks, representing ${((peakMonthInvestment / totalInvestment) * 100).toFixed(1)}% of ${periodLabel} spend.` : `Total investment of ${formatCurrency(totalInvestment)} across all banks in ${periodLabel}, with strategic emphasis on targeted campaigns.`,
        color: "#10B981",
        icon: "📈"
      }
    ];
  }, [contextFilteredData, dashboardData, selectedMonths, selectedYears, selectedPeriod]);

  return (
    <div className="space-y-4">
      {/* Display filter indicators */}
      {(selectedMonths.length > 0 || selectedYears.length > 0) && (
        <div className="flex gap-2 mb-2">
          {selectedYears.length > 0 && (
            <span className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full">
              {selectedYears.length === 1 ? `Year: ${selectedYears[0]}` : `${selectedYears.length} years selected`}
            </span>
          )}
          {selectedMonths.length > 0 && (
            <span className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded-full">
              {selectedMonths.length === 1 ? `Month: ${selectedMonths[0]}` : `${selectedMonths.length} months selected`}
            </span>
          )}
        </div>
      )}
      
      {/* Display insights */}
      {insights.map((insight, index) => (
        <div
          key={index}
          className="flex items-start p-4 rounded-lg"
          style={{ backgroundColor: `${insight.color}10` }}
        >
          <span className="text-2xl mr-3">{insight.icon}</span>
          <p className="text-gray-700">{insight.text}</p>
        </div>
      ))}
    </div>
  );
};

export default MediaInsights;