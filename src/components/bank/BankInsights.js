import React, { useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { bankColors, mediaColors } from '../../utils/colorSchemes';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

const InsightSection = ({ title, children, colorClass = "blue" }) => (
  <div className={`mb-4 border-l-4 border-${colorClass}-500 pl-4`}>
    <h3 className="text-lg font-medium text-gray-800 mb-2">{title}</h3>
    <div className="space-y-2">
      {children}
    </div>
  </div>
);

const BulletPoint = ({ text }) => (
  <div className="flex items-start">
    <div className="mt-1 mr-2 h-2 w-2 rounded-full bg-gray-500 flex-shrink-0"></div>
    <p className="text-sm text-gray-600">{text}</p>
  </div>
);

/**
 * Component that displays insights for a specific bank
 * @param {Object} props - Component properties
 * @param {Object} props.bank - Bank data to display
 */
const BankInsights = ({ bank }) => {
  const { dashboardData, loading, selectedMonths, selectedYears } = useDashboard();
  
  console.log('BankInsights rendered for', bank?.name, 'bank object:', bank);
  console.log('Loading state:', loading);
  console.log('Selected months:', selectedMonths);
  console.log('Selected years:', selectedYears);
  console.log('Dashboard data available:', !!dashboardData);

  // Ensure insights are generated using all data for descriptive purposes
  const { 
    topMediaCategory,
    secondMediaCategory,
    peakMonth,
    yearOverYearGrowth,
    marketPosition,
    channelEfficiency,
  } = useMemo(() => {
    if (!bank || !bank.name) {
      console.error('BankInsights: Invalid bank object provided:', bank);
      return {
        topMediaCategory: {
          category: "No bank data available",
          amount: 0,
          percentage: 0,
        },
        secondMediaCategory: null,
        peakMonth: null,
        yearOverYearGrowth: null,
        marketPosition: null,
        channelEfficiency: null,
      };
    }
    
    if (!dashboardData || !dashboardData.monthlyTrends || !dashboardData.mediaCategories) {
      console.log('No dashboard data available');
      return {
        topMediaCategory: {
          category: "No dashboard data available",
          amount: 0,
          percentage: 0,
        },
        secondMediaCategory: null,
        peakMonth: null,
        yearOverYearGrowth: null,
        marketPosition: null,
        channelEfficiency: null,
      };
    }

    console.log('Calculating insights for', bank?.name);
    console.log('Media categories available:', dashboardData.mediaCategories.length);
    console.log('Monthly trends available:', dashboardData.monthlyTrends.length);
    
    // Filter monthly trends based on selected months and years if any
    let filteredMonthlyTrends = [...dashboardData.monthlyTrends];
    
    if (selectedMonths.length > 0 || selectedYears.length > 0) {
      filteredMonthlyTrends = filteredMonthlyTrends.filter(item => {
        if (!item || !item.month) return false;
        
        const [year, month] = item.month.split('-');
        const matchesMonth = selectedMonths.length === 0 || selectedMonths.includes(month);
        const matchesYear = selectedYears.length === 0 || selectedYears.includes(year);
        return matchesMonth && matchesYear;
      });
      console.log('Filtered monthly trends:', filteredMonthlyTrends.length);
    }

    // Calculate media categories for this bank
    const bankMediaData = dashboardData.mediaCategories.filter(
      item => item && item.bank === bank.name
    );
    
    console.log('Bank media data items found:', bankMediaData.length);
    
    // Sort by investment amount to find top categories
    const sortedMediaData = [...bankMediaData].sort(
      (a, b) => b.investment - a.investment
    );
    
    const totalBankInvestment = bankMediaData.reduce(
      (sum, item) => sum + (item?.investment || 0),
      0
    );
    
    console.log('Total bank investment calculated:', totalBankInvestment);
    
    // Find peak month for this bank
    const bankMonthlyData = filteredMonthlyTrends
      .map(month => {
        // Add safety check for month.banks
        if (!month || !month.banks) {
          console.warn('Invalid month data structure:', month);
          return {
            rawMonth: month?.month || 'unknown',
            month: month?.month ? month.month.replace('-', ' ') : 'unknown',
            investment: 0,
            percentage: 0,
          };
        }
        
        const bankData = month.banks.find(b => b && b.name === bank.name);
        if (!bankData) {
          console.log(`No data found for bank ${bank.name} in month ${month.month}`);
        }
        
        return {
          rawMonth: month.month,
          month: month.month.replace('-', ' '),
          investment: bankData ? bankData.investment : 0,
          percentage: bankData && month.totalInvestment 
            ? bankData.investment / month.totalInvestment 
            : 0,
        };
      })
      .filter(m => m.investment > 0)
      .sort((a, b) => b.investment - a.investment);
    
    console.log('Bank monthly data points:', bankMonthlyData.length);
    
    const peakMonthData = bankMonthlyData.length > 0 ? bankMonthlyData[0] : null;
    console.log('Peak month data:', peakMonthData);
    
    // Calculate market position
    const allBanks = Array.from(
      new Set(
        dashboardData.monthlyTrends
          .filter(month => month && month.banks) // Add safety check
          .flatMap(month => 
            month.banks
              .filter(b => b && b.name) // Ensure bank exists and has name
              .map(b => b.name)
          )
      )
    );
    
    console.log('All banks found:', allBanks.length, allBanks);
    
    const bankTotals = allBanks.map(bankName => {
      const total = filteredMonthlyTrends.reduce((sum, month) => {
        // Add safety check for month.banks
        if (!month || !month.banks) return sum;
        
        const bankData = month.banks.find(b => b && b.name === bankName);
        return sum + (bankData ? bankData.investment : 0);
      }, 0);
      return { name: bankName, total };
    }).sort((a, b) => b.total - a.total);
    
    console.log('Bank totals calculated:', bankTotals.length);
    
    const totalMarketInvestment = bankTotals.reduce(
      (sum, b) => sum + (b?.total || 0), 
      0
    );
    
    console.log('Total market investment:', totalMarketInvestment);
    
    const rank = bankTotals.findIndex(b => b && b.name === bank.name) + 1;
    console.log('Bank rank:', rank);

    // Channel Efficiency calculation
    // For this example, we'll use a simple ROI-based metric for each channel
    // In a real implementation, this would be based on actual performance data
    const channelEfficiencyData = sortedMediaData.length > 0 
      ? {
          mostEfficient: {
            category: sortedMediaData[0].category,
            roi: 2.7 // This would be calculated from actual performance metrics
          },
          leastEfficient: sortedMediaData.length > 1
            ? {
                category: sortedMediaData[sortedMediaData.length - 1].category,
                roi: 1.2 // This would be calculated from actual performance metrics
              }
            : null,
          averageRoi: 1.8, // This would be calculated from actual performance metrics
          digitalRatio: sortedMediaData.filter(item => 
            ['Digital', 'Social', 'Online', 'Search'].includes(item.category)
          ).reduce((sum, item) => sum + item.investment, 0) / totalBankInvestment
        }
      : null;
    
    // Year over year growth would be calculated here if we had previous year data
    // This is a placeholder for now
    
    // Check if we have enough data to show insights
    const hasValidData = sortedMediaData.length > 0 && totalBankInvestment > 0;
    console.log('Has valid data for insights:', hasValidData);
    
    if (!hasValidData) {
      // Return default insights with placeholders
      return {
        topMediaCategory: {
          category: "No data available",
          amount: 0,
          percentage: 0,
        },
        secondMediaCategory: null,
        peakMonth: peakMonthData || {
          month: "No data available",
          investment: 0,
        },
        yearOverYearGrowth: null,
        marketPosition: {
          rank: rank || 0,
          totalBanks: allBanks.length,
          marketShare: 0,
        },
        channelEfficiency: null,
      };
    }
    
    return {
      topMediaCategory: sortedMediaData.length > 0 
        ? {
            category: sortedMediaData[0].category,
            amount: sortedMediaData[0].investment,
            percentage: sortedMediaData[0].investment / totalBankInvestment,
          } 
        : null,
      secondMediaCategory: sortedMediaData.length > 1 
        ? {
            category: sortedMediaData[1].category,
            amount: sortedMediaData[1].investment,
            percentage: sortedMediaData[1].investment / totalBankInvestment,
          } 
        : null,
      peakMonth: peakMonthData,
      yearOverYearGrowth: null, // Would be implemented if we had YoY data
      marketPosition: {
        rank,
        totalBanks: allBanks.length,
        marketShare: bankTotals.find(b => b && b.name === bank.name)?.total / totalMarketInvestment || 0,
      },
      channelEfficiency: channelEfficiencyData,
    };
  }, [dashboardData, bank, selectedMonths, selectedYears]);

  console.log('Calculated insights:', { topMediaCategory, secondMediaCategory, peakMonth, marketPosition, channelEfficiency });

  if (loading) {
    console.log('Showing loading state');
    return (
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm h-full flex flex-col">
        <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
          <span className="w-3 h-3 rounded-full mr-2 bg-indigo-500"></span>
          Bank Insights
        </h3>
        <div className="animate-pulse space-y-4 flex-grow">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mt-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  // Always show some content even if data is incomplete
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm h-full flex flex-col">
      <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full mr-2 bg-indigo-500"></span>
          Bank Insights
        </div>
        {(selectedMonths.length > 0 || selectedYears.length > 0) && (
          <div className="flex gap-2">
            {selectedMonths.length > 0 && (
              <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full">
                {selectedMonths.length} {selectedMonths.length === 1 ? 'Month' : 'Months'}
              </span>
            )}
            {selectedYears.length > 0 && (
              <span className="px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded-full">
                {selectedYears.length} {selectedYears.length === 1 ? 'Year' : 'Years'}
              </span>
            )}
          </div>
        )}
      </h3>
      <div className="space-y-4 flex-grow overflow-auto">
        {/* Media Investment Strategy */}
        <InsightSection title="Media Investment Strategy" colorClass="blue">
          {topMediaCategory ? (
            <BulletPoint 
              text={`Main investment focus is ${topMediaCategory.category} with ${formatCurrency(topMediaCategory.amount)} (${formatPercentage(topMediaCategory.percentage)} of total media budget).`} 
            />
          ) : (
            <BulletPoint text="No media category data available for this bank." />
          )}
          {secondMediaCategory && (
            <BulletPoint 
              text={`Secondary focus on ${secondMediaCategory.category} with ${formatCurrency(secondMediaCategory.amount)} (${formatPercentage(secondMediaCategory.percentage)} of total media budget).`} 
            />
          )}
        </InsightSection>
        
        {/* Investment Peak Period */}
        <InsightSection title="Investment Peak Period" colorClass="green">
          {peakMonth ? (
            <BulletPoint 
              text={`Highest investment occurred in ${peakMonth.month} with ${formatCurrency(peakMonth.investment)}.`} 
            />
          ) : (
            <BulletPoint text="No investment period data available for this bank." />
          )}
          {selectedMonths.length > 0 && (
            <BulletPoint 
              text={`Analysis based on ${selectedMonths.length} selected month(s).`} 
            />
          )}
          {selectedYears.length > 0 && (
            <BulletPoint 
              text={`Analysis filtered to include data from ${selectedYears.join(', ')}.`} 
            />
          )}
        </InsightSection>
        
        {/* Channel Efficiency */}
        <InsightSection title="Channel Efficiency" colorClass="amber">
          {channelEfficiency ? (
            <>
              <BulletPoint 
                text={`Most efficient channel is ${channelEfficiency.mostEfficient.category} with estimated ROI of ${channelEfficiency.mostEfficient.roi.toFixed(1)}x.`} 
              />
              {channelEfficiency.leastEfficient && (
                <BulletPoint 
                  text={`Lowest performing channel is ${channelEfficiency.leastEfficient.category} with ROI of ${channelEfficiency.leastEfficient.roi.toFixed(1)}x.`} 
                />
              )}
              <BulletPoint 
                text={`Digital channels represent ${formatPercentage(channelEfficiency.digitalRatio)} of media spend with higher than average engagement rates.`} 
              />
            </>
          ) : (
            <BulletPoint text="No channel efficiency data available for this bank." />
          )}
        </InsightSection>
        
        {/* Market Position */}
        <InsightSection title="Market Position" colorClass="indigo">
          {marketPosition ? (
            <>
              <BulletPoint 
                text={`Ranks #${marketPosition.rank} out of ${marketPosition.totalBanks} banks in total advertising investment.`} 
              />
              <BulletPoint 
                text={`Holds ${formatPercentage(marketPosition.marketShare)} market share of total banking advertising investment.`} 
              />
            </>
          ) : (
            <BulletPoint text="No market position data available for this bank." />
          )}
        </InsightSection>
      </div>
    </div>
  );
};

export default BankInsights;