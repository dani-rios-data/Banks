import React, { useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { bankColors, mediaColors } from '../../utils/colorSchemes';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

const InsightSection = ({ title, children, colorClass = "blue" }) => (
  <div className={`mb-3 border-l-4 border-${colorClass}-500 pl-3`}>
    <h3 className="text-lg font-medium text-gray-800 mb-1">{title}</h3>
    <div className="space-y-1">
      {children}
    </div>
  </div>
);

const BulletPoint = ({ text }) => (
  <div className="flex items-start">
    <div className="mt-1 mr-2 h-2 w-2 rounded-full bg-gray-500 flex-shrink-0"></div>
    <p className="text-sm text-gray-600 leading-tight">{text}</p>
  </div>
);

/**
 * Component that displays insights for a specific bank
 * @param {Object} props - Component properties
 * @param {Object} props.bank - Bank data to display
 */
const BankInsights = ({ bank }) => {
  const { dashboardData, loading, selectedMonths, selectedYears, filteredData } = useDashboard();
  
  console.log('BankInsights rendered for', bank?.name, 'bank object:', bank);
  console.log('Loading state:', loading);
  console.log('Selected months:', selectedMonths);
  console.log('Selected years:', selectedYears);
  console.log('Dashboard data available:', !!dashboardData);
  console.log('Filtered data available:', !!filteredData);

  // Ensure insights are generated using all data for descriptive purposes
  const {
    topMediaCategory,
    secondMediaCategory,
    peakMonth,
    yearOverYearGrowth,
    marketPosition,
    channelEfficiency,
  } = useMemo(() => {
    if (!bank || !bank.name || !dashboardData) {
      return {
        topMediaCategory: null,
        secondMediaCategory: null,
        peakMonth: null,
        yearOverYearGrowth: null,
        marketPosition: null,
        channelEfficiency: null,
      };
    }

    // Use filteredData if available and filters are applied, otherwise use dashboardData
    const dataToUse = (filteredData && (selectedMonths.length > 0 || selectedYears.length > 0)) 
                      ? filteredData 
                      : dashboardData;
    
    // Filter raw data for the specific bank and apply month/year filters
    const bankRawData = dataToUse.rawData ? dataToUse.rawData.filter(row => 
      row.Bank === bank.name &&
      (selectedYears.length === 0 || selectedYears.includes(row.Year)) &&
      (selectedMonths.length === 0 || selectedMonths.includes(row.Month))
    ) : [];
    
    // Calculate media categories for this bank from raw data
    const bankMediaData = [];
    
    if (bankRawData.length > 0) {
      // Agrupar por categoría de medios
      const mediaByCategory = {};
      
      bankRawData.forEach(row => {
        const category = row['Media Category'];
        if (!category) return;
        
        const amount = parseFloat(row.dollars || '0');
        
        if (!mediaByCategory[category]) {
          mediaByCategory[category] = {
            category,
            investment: 0,
            dataPoints: 0
          };
        }
        
        mediaByCategory[category].investment += amount;
        mediaByCategory[category].dataPoints += 1;
      });
      
      Object.values(mediaByCategory).forEach(item => {
        bankMediaData.push(item);
      });
    }
    
    // Sort by investment amount to find top categories
    const sortedMediaData = [...bankMediaData].sort(
      (a, b) => b.investment - a.investment
    );
    
    const totalBankInvestment = bankMediaData.reduce(
      (sum, item) => sum + (item?.investment || 0),
      0
    );
    
    const effectiveBankInvestment = totalBankInvestment > 0 ? totalBankInvestment : bank.totalInvestment;
    
    // Find peak month for this bank
    const bankMonthlyData = dataToUse.monthlyTrends
      .map(month => {
        if (!month || !month.bankShares) {
          return null;
        }
        
        const bankData = month.bankShares.find(b => b && b.bank === bank.name);
        if (!bankData) return null;
        
        return {
          rawMonth: month.month,
          month: month.month.replace('-', ' '),
          investment: bankData.investment,
          percentage: bankData && month.totalInvestment 
            ? bankData.investment / month.totalInvestment 
            : 0,
        };
      })
      .filter(m => m && m.investment > 0)
      .sort((a, b) => b.investment - a.investment);
    
    const peakMonthData = bankMonthlyData.length > 0 ? bankMonthlyData[0] : null;
    
    // Calculate market position
    const allBanks = Array.from(
      new Set(
        dataToUse.monthlyTrends
          .filter(month => month && month.bankShares)
          .flatMap(month => 
            month.bankShares
              .filter(b => b && b.bank)
              .map(b => b.bank)
          )
      )
    );
    
    const bankTotals = allBanks.map(bankName => {
      const total = dataToUse.monthlyTrends.reduce((sum, month) => {
        if (!month || !month.bankShares) return sum;
        
        const bankData = month.bankShares.find(b => b && b.bank === bankName);
        return sum + (bankData ? bankData.investment : 0);
      }, 0);
      return { name: bankName, total };
    }).sort((a, b) => b.total - a.total);
    
    const totalMarketInvestment = bankTotals.reduce(
      (sum, b) => sum + (b?.total || 0), 
      0
    );
    
    const rank = bankTotals.findIndex(b => b && b.name === bank.name) + 1;
    
    // Calculate Year over Year growth 
    let yearOverYearGrowthData = null;
    
    if (dataToUse.monthlyTrends && dataToUse.monthlyTrends.length > 0) {
      // Ordenar meses cronológicamente para encontrar el más reciente
      const sortedMonths = [...dataToUse.monthlyTrends].sort((a, b) => {
        const [yearA, monthA] = a.month.split('-').map(num => parseInt(num, 10));
        const [yearB, monthB] = b.month.split('-').map(num => parseInt(num, 10));
        
        if (yearA !== yearB) {
          return yearB - yearA;
        }
        return monthB - monthA;
      });
      
      if (sortedMonths.length > 0) {
        const latestMonth = sortedMonths[0];
        const [year, monthNum] = latestMonth.month.split('-').map(num => parseInt(num, 10));
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Buscar el mismo mes del año anterior
        const previousYearMonth = `${year - 1}-${monthNum.toString().padStart(2, '0')}`;
        const allMonthlyData = dataToUse.allMonthlyTrends || [];
        const previousYearData = allMonthlyData.find(m => m.month === previousYearMonth);
        
        if (previousYearData) {
          const bankLatestData = latestMonth.bankShares.find(b => b.bank === bank.name);
          const bankPreviousData = previousYearData.bankShares.find(b => b.bank === bank.name);
          
          if (bankLatestData && bankPreviousData && bankPreviousData.investment > 0) {
            const growthRate = (bankLatestData.investment - bankPreviousData.investment) / bankPreviousData.investment;
            
            yearOverYearGrowthData = {
              currentYear: year.toString(),
              previousYear: (year-1).toString(),
              growthRate: growthRate,
              currentAmount: bankLatestData.investment,
              previousAmount: bankPreviousData.investment
            };
          }
        }
      }
    }
    
    // Calculate channel efficiency metrics from raw data
    const mediaCategories = {};
    bankRawData.forEach(row => {
      const category = row['Media Category'];
      if (!category) return;
      
      const amount = parseFloat(row.dollars || '0');
      
      if (!mediaCategories[category]) {
        mediaCategories[category] = {
          totalInvestment: 0,
          dataPoints: 0
        };
      }
      
      mediaCategories[category].totalInvestment += amount;
      mediaCategories[category].dataPoints += 1;
    });
    
    const mediaCategoriesArray = Object.entries(mediaCategories).map(([category, data]) => ({
      category,
      ...data,
      efficiencyScore: data.dataPoints > 0 ? data.totalInvestment / data.dataPoints : 0
    })).sort((a, b) => b.efficiencyScore - a.efficiencyScore);
    
    const digitalCategories = ['Digital', 'Social', 'Online', 'Search'];
    const digitalInvestment = mediaCategoriesArray
      .filter(item => digitalCategories.includes(item.category))
      .reduce((sum, item) => sum + item.totalInvestment, 0);
    
    const totalCategoryInvestment = mediaCategoriesArray.reduce(
      (sum, item) => sum + item.totalInvestment, 0
    );
    
    const channelEfficiencyData = mediaCategoriesArray.length > 0 
      ? {
          mostEfficient: mediaCategoriesArray[0],
          leastEfficient: mediaCategoriesArray.length > 1 ? 
            mediaCategoriesArray[mediaCategoriesArray.length - 1] : null,
          digitalRatio: totalCategoryInvestment > 0 ? 
            digitalInvestment / totalCategoryInvestment : 0
        }
      : null;
    
    // Check if we have enough data to show insights
    const hasMediaData = sortedMediaData.length > 0;
    const hasMonthlyData = bankMonthlyData.length > 0;
    const hasMarketData = allBanks.length > 0 && bankTotals.length > 0;
    
    if (!hasMediaData && !hasMonthlyData && !hasMarketData) {
      return {
        topMediaCategory: null,
        secondMediaCategory: null,
        peakMonth: null,
        yearOverYearGrowth: null,
        marketPosition: null,
        channelEfficiency: null,
      };
    }

    return {
      topMediaCategory: hasMediaData && sortedMediaData.length > 0 
        ? {
            category: sortedMediaData[0].category,
            amount: sortedMediaData[0].investment,
            percentage: sortedMediaData[0].investment / effectiveBankInvestment,
          } 
        : null,
      secondMediaCategory: hasMediaData && sortedMediaData.length > 1 
        ? {
            category: sortedMediaData[1].category,
            amount: sortedMediaData[1].investment,
            percentage: sortedMediaData[1].investment / effectiveBankInvestment,
          } 
        : null,
      peakMonth: peakMonthData,
      yearOverYearGrowth: yearOverYearGrowthData,
      marketPosition: hasMarketData ? {
        rank,
        totalBanks: allBanks.length,
        marketShare: bankTotals.find(b => b && b.name === bank.name)?.total / totalMarketInvestment || 0,
      } : null,
      channelEfficiency: channelEfficiencyData,
    };
  }, [dashboardData, filteredData, bank, selectedMonths, selectedYears]);

  console.log('Calculated insights:', { topMediaCategory, secondMediaCategory, peakMonth, marketPosition, channelEfficiency, yearOverYearGrowth });

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
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm h-full flex flex-col">
      <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center justify-between">
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
      <div className="space-y-3 flex-grow overflow-auto pr-1">
        {/* Media Investment Strategy - Simplificado */}
        <InsightSection title="Media Investment Strategy" colorClass="blue">
          {topMediaCategory ? (
            <BulletPoint 
              text={`Main investment focus is ${topMediaCategory.category} with ${formatCurrency(topMediaCategory.amount)} (${formatPercentage(topMediaCategory.percentage)} of total).`} 
            />
          ) : (
            <BulletPoint text="No media category data available for this bank." />
          )}
        </InsightSection>
        
        {/* Investment Peak Period - Simplificado */}
        <InsightSection title="Investment Peak Period" colorClass="green">
          {peakMonth ? (
            <BulletPoint 
              text={`Highest investment occurred in ${peakMonth.month} with ${formatCurrency(peakMonth.investment)}.`} 
            />
          ) : (
            <BulletPoint text="No investment period data available for this bank." />
          )}
        </InsightSection>
        
        {/* Year-over-Year Growth - Simplificado */}
        {yearOverYearGrowth && (
          <InsightSection title="Year-over-Year Growth" colorClass="purple">
            <BulletPoint 
              text={`Investment ${yearOverYearGrowth.growthRate >= 0 ? 'increased' : 'decreased'} by ${formatPercentage(Math.abs(yearOverYearGrowth.growthRate))} from ${yearOverYearGrowth.previousYear} to ${yearOverYearGrowth.currentYear} (${formatCurrency(yearOverYearGrowth.previousAmount)} → ${formatCurrency(yearOverYearGrowth.currentAmount)}).`}
            />
          </InsightSection>
        )}
        
        {/* Channel Efficiency - Simplificado */}
        {channelEfficiency && (
          <InsightSection title="Channel Efficiency" colorClass="amber">
            <BulletPoint 
              text={`Most efficient channel is ${channelEfficiency.mostEfficient.category} with ${formatCurrency(channelEfficiency.mostEfficient.totalInvestment)} invested.`} 
            />
            <BulletPoint 
              text={`Digital channels represent ${formatPercentage(channelEfficiency.digitalRatio)} of total media spend.`} 
            />
          </InsightSection>
        )}
        
        {/* Market Position - Simplificado */}
        {marketPosition && (
          <InsightSection title="Market Position" colorClass="indigo">
            <BulletPoint 
              text={`Ranks #${marketPosition.rank} out of ${marketPosition.totalBanks} banks with ${formatPercentage(marketPosition.marketShare)} market share.`} 
            />
          </InsightSection>
        )}
      </div>
    </div>
  );
};

export default BankInsights;