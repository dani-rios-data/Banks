import React, { useMemo } from 'react';
import _ from 'lodash';
import { useDashboard } from '../../context/DashboardContext';
import Icons from '../common/Icons';
import { bankColors } from '../../utils/colorSchemes';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { getGradient } from '../../utils/colorSchemes';

/**
 * Component that displays key metrics in cards with month filter support
 */
const KeyMetrics = ({ filteredData }) => {
  const { loading } = useDashboard();

  // Helper function to get media colors
  const getMediaColor = (category) => {
    const colors = {
      'Television': '#4C51BF',
      'Digital': '#38A169',
      'Audio': '#D69E2E',
      'Print': '#C53030',
      'Outdoor': '#805AD5',
      'Streaming': '#3182CE',
      'Cinema': '#DD6B20'
    };
    return colors[category] || '#718096';
  };

  // Calculate metrics based on filtered data
  const metrics = useMemo(() => {
    if (!filteredData) {
      return {
        totalInvestment: 0,
        bankTotals: [],
        mediaTotals: [],
        topBank: null,
        topMedia: null,
        wellsFargoPosition: { rank: 0, share: 0, value: 0 },
        yearOverYearGrowth: 0,
        yearOverYearGrowthDescription: '',
        mostRecentMonth: '',
        formattedMostRecentMonth: '',
        averageMonthlyInvestment: 0,
        growthOpportunities: [],
        banksCount: 0,
        mediaCount: 0
      };
    }

    // Total Market Investment = Suma de la columna dollars (totalInvestment)
    const totalInvestment = filteredData.totalInvestment || 0;
    
    // Banks Analyzed = Count distinct de la columna Bank
    const banksCount = filteredData.banks?.length || 0;
    
    // Media Categories = Count distinct de la columna Media Category
    const mediaCount = filteredData.mediaCategories?.length || 0;
    
    // Calcular totales por banco y ordenar para encontrar el banco líder
    const bankTotals = filteredData.banks?.map(bank => ({
      name: bank.name,
      value: bank.totalInvestment,
      share: bank.marketShare
    })).sort((a, b) => b.value - a.value) || [];
    
    // Leading Bank = Banco con mayor suma de dollars
    const topBank = bankTotals[0] || { name: '', value: 0, share: 0 };
    
    // Our Performance = Datos de Wells Fargo
    const wellsFargoBank = bankTotals.find(bank => bank.name === "Wells Fargo" || bank.name === "Wells Fargo Bank") || 
                           { name: "Wells Fargo Bank", value: 0, share: 0 };
    
    // Calcular el ranking de Wells Fargo
    const wellsFargoIndex = bankTotals.findIndex(bank => bank.name === "Wells Fargo" || bank.name === "Wells Fargo Bank");
    const wellsFargoPosition = {
      rank: wellsFargoIndex >= 0 ? wellsFargoIndex + 1 : 0,
      share: wellsFargoBank.share,
      value: wellsFargoBank.value
    };
    
    // Media Totals = Categorías de medios ordenadas por inversión
    const mediaTotals = filteredData.mediaCategories?.map(media => ({
      name: media.category,
      value: media.totalInvestment,
      share: media.marketShare
    })).sort((a, b) => b.value - a.value) || [];
    
    // Leading Media = Categoría de medios con mayor suma
    const topMedia = mediaTotals[0] || { name: '', value: 0, share: 0 };
    
    // Cálculo de Year-over-Year Growth (simplificado para esta versión)
    const yearOverYearGrowth = filteredData.yearOverYearGrowth || 0;
    const yearOverYearGrowthDescription = filteredData.yearOverYearGrowthDescription || 'Year-over-Year growth based on selected data';

    // Calculate YoY based on most recent month data
    let calculatedYoYGrowth = 0;
    let yoyDescription = '';
    let mostRecentMonth = '';
    let formattedMostRecentMonth = '';
    
    if (filteredData.monthlyTrends && filteredData.monthlyTrends.length > 0) {
      // Get months from filteredData - these are already filtered by user selection
      const availableMonths = filteredData.monthlyTrends;
      
      // Sort monthly trends by date to find the most recent month
      const sortedMonths = [...availableMonths].sort((a, b) => {
        // Parse the month strings to get comparable dates
        const [yearA, monthA] = a.month.split('-').map(num => parseInt(num, 10));
        const [yearB, monthB] = b.month.split('-').map(num => parseInt(num, 10));
        
        // Compare years first, then months
        if (yearA !== yearB) {
          return yearB - yearA; // Most recent year first
        }
        return monthB - monthA; // Most recent month first
      });
      
      // Get the most recent month based on the sorted data
      const latestMonth = sortedMonths[0];
      mostRecentMonth = latestMonth.month;
      
      // Format month for display
      const [year, monthNum] = latestMonth.month.split('-').map(num => parseInt(num, 10));
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      formattedMostRecentMonth = `${monthNames[monthNum-1]} ${year}`;
      
      // Use the precalculated YoY data if available
      if (filteredData.yoyData && filteredData.yoyData[mostRecentMonth]) {
        const yoyDataForMonth = filteredData.yoyData[mostRecentMonth];
        calculatedYoYGrowth = yoyDataForMonth.growth;
        yoyDescription = yoyDataForMonth.description;
        
        console.log(`Using precalculated YoY for ${mostRecentMonth}:`, yoyDataForMonth);
      } else {
        // Fallback to previous calculation method if precalculated data not available
        // Find the same month from previous year
        const previousYearMonth = `${year - 1}-${monthNum.toString().padStart(2, '0')}`;
        
        // Search in the COMPLETE dataset (not just filtered)
        const allMonthlyData = filteredData.allMonthlyTrends || [];
        const previousYearData = allMonthlyData.find(m => m.month === previousYearMonth);
        
        if (previousYearData && previousYearData.total > 0) {
          // Calculate YoY growth
          calculatedYoYGrowth = ((latestMonth.total - previousYearData.total) / previousYearData.total) * 100;
          
          // Format the previous year month
          const prevMonthFormatted = `${monthNames[monthNum-1]} ${year-1}`;
          yoyDescription = `${prevMonthFormatted} vs ${formattedMostRecentMonth}`;
          
          console.log(`Fallback YoY calculation for ${mostRecentMonth}:`, calculatedYoYGrowth);
        } else {
          // Try a more flexible approach - find the closest month from previous year
          const previousYearData = allMonthlyData.filter(m => {
            const [dataYear] = m.month.split('-').map(num => parseInt(num, 10));
            return dataYear === year - 1;
          }).sort((a, b) => {
            const [, monthA] = a.month.split('-').map(num => parseInt(num, 10));
            const [, monthB] = b.month.split('-').map(num => parseInt(num, 10));
            // Find the closest month
            return Math.abs(monthA - monthNum) - Math.abs(monthB - monthNum);
          })[0];
          
          if (previousYearData && previousYearData.total > 0) {
            // Calculate YoY growth with closest month
            calculatedYoYGrowth = ((latestMonth.total - previousYearData.total) / previousYearData.total) * 100;
            
            // Format months for description
            const [prevYear, prevMonth] = previousYearData.month.split('-').map(num => parseInt(num, 10));
            const prevMonthFormatted = `${monthNames[prevMonth-1]} ${prevYear}`;
            yoyDescription = `${prevMonthFormatted} vs ${formattedMostRecentMonth} (closest match)`;
            
            console.log(`Using closest month for YoY:`, previousYearData.month);
          } else {
            // If still no previous year data found
            calculatedYoYGrowth = 0;
            yoyDescription = `No historical data available for comparison`;
            
            console.log(`No historical data found for YoY comparison`);
          }
        }
      }
    } else {
      yoyDescription = 'No monthly data available for YoY calculation';
    }

    return {
      totalInvestment,
      bankTotals,
      mediaTotals,
      topBank,
      topMedia,
      wellsFargoPosition,
      yearOverYearGrowth: calculatedYoYGrowth, 
      yearOverYearGrowthDescription: yoyDescription,
      mostRecentMonth,
      formattedMostRecentMonth,
      averageMonthlyInvestment: filteredData.monthlyTrends?.length > 0 ? 
        totalInvestment / filteredData.monthlyTrends.length : 0,
      growthOpportunities: [],
      banksCount,
      mediaCount
    };
  }, [filteredData]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col items-center" style={{ display: "flex", alignItems: "center" }}>
            <div className="h-24 bg-gray-100 rounded-lg mb-2 w-44" style={{ width: "176px", height: "96px" }}></div>
            <div className="h-4 bg-gray-100 rounded w-28 mb-1"></div>
            <div className="h-4 bg-gray-100 rounded w-24"></div>
          </div>
          <div className="flex flex-col items-center" style={{ display: "flex", alignItems: "center" }}>
            <div className="h-24 bg-gray-100 rounded-lg mb-2 w-44" style={{ width: "176px", height: "96px" }}></div>
            <div className="h-4 bg-gray-100 rounded w-28 mb-1"></div>
            <div className="h-4 bg-gray-100 rounded w-24"></div>
          </div>
          <div className="flex flex-col items-center" style={{ display: "flex", alignItems: "center" }}>
            <div className="h-24 bg-gray-100 rounded-lg mb-2 w-44" style={{ width: "176px", height: "96px" }}></div>
            <div className="h-4 bg-gray-100 rounded w-28 mb-1"></div>
            <div className="h-4 bg-gray-100 rounded w-24"></div>
          </div>
        </div>
        <div className="mt-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-gray-100 rounded-lg"></div>
            <div className="h-48 bg-gray-100 rounded-lg"></div>
          </div>
        </div>
        <div className="mt-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
      {/* All metrics in two rows with visual separation */}
      <div className="flex flex-col gap-6">
        {/* First row - Basic metrics */}
        <div className="flex gap-4">
          {/* Total Market Investment */}
          <div className="flex flex-col items-center flex-1">
            <div className="relative w-full">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg px-4 py-3 border border-blue-200 mb-2 flex flex-col" style={{ height: "120px" }}>
                <div className="flex items-center">
                  <div className="bg-blue-500 rounded-full p-2 shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-blue-500 ml-2">Total Market Investment</h3>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-2xl font-bold text-blue-800">
                    {formatCurrency(metrics.totalInvestment).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-800">
                <span 
                  className={metrics.yearOverYearGrowth >= 0 ? 'text-green-500' : 'text-red-500'}
                  title={metrics.yearOverYearGrowthDescription}
                  style={{ cursor: 'help' }}
                >
                  {metrics.yearOverYearGrowth >= 0 ? '↑ ' : '↓ '}
                  {Math.abs(metrics.yearOverYearGrowth).toFixed(2)}% YoY Growth
                </span>
                {metrics.formattedMostRecentMonth && (
                  <div className="text-xs text-gray-500 mt-1">
                    {metrics.yearOverYearGrowthDescription.includes("No data") 
                      ? "No historical data available for comparison" 
                      : metrics.yearOverYearGrowthDescription.includes("closest match") 
                        ? `Comparing ${metrics.yearOverYearGrowthDescription}`
                        : metrics.yearOverYearGrowthDescription}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Banks Analyzed */}
          <div className="flex flex-col items-center flex-1">
            <div className="relative w-full">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg px-4 py-3 border border-blue-200 mb-2 flex flex-col" style={{ height: "120px" }}>
                <div className="flex items-center">
                  <div className="bg-blue-500 rounded-full p-2 shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-blue-500 ml-2">Banks Analyzed</h3>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-2xl font-bold text-blue-800">
                    {metrics.banksCount}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-800 font-semibold">
                Comprehensive market coverage
              </div>
              <div className="text-sm text-gray-800 font-semibold mt-1">
                Major financial institutions
              </div>
            </div>
          </div>

          {/* Media Categories */}
          <div className="flex flex-col items-center flex-1">
            <div className="relative w-full">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg px-4 py-3 border border-blue-200 mb-2 flex flex-col" style={{ height: "120px" }}>
                <div className="flex items-center">
                  <div className="bg-blue-500 rounded-full p-2 shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-blue-500 ml-2">Media Categories</h3>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-2xl font-bold text-blue-800">
                    {metrics.mediaCount}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-800 font-semibold">
                Across all marketing channels
              </div>
              <div className="text-sm text-gray-800 font-semibold mt-1">
                Full market visibility
              </div>
            </div>
          </div>
        </div>

        {/* Second row - Market Leaders */}
        <div className="flex gap-4">
          {/* Leading Bank */}
          <div className="flex-1">
            <div className="relative w-full">
              <div className="bg-white rounded-lg shadow-sm p-4 border border-fuchsia-100" style={{ height: "160px" }}>
                <div className="flex items-center mb-6">
                  <div className="bg-fuchsia-500 rounded-full p-2 shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                  </div>
                  <div className="text-sm text-fuchsia-600 font-medium ml-2">Leading Bank</div>
                </div>
                <div className="flex justify-between items-center h-[72px]">
                  <div>
                    <div className="text-xl font-bold text-fuchsia-700">{metrics.topBank.name}</div>
                    <div className="text-sm text-fuchsia-500">Market leader with {formatPercentage(metrics.topBank.share)} share</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-fuchsia-700">{formatCurrency(metrics.topBank.value)}</div>
                    <div className="text-sm text-fuchsia-500">&nbsp;</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Our Performance */}
          <div className="flex-1">
            <div className="relative w-full">
              <div className="bg-white rounded-lg shadow-sm p-4 border border-pink-100" style={{ height: "160px" }}>
                <div className="flex items-center mb-6">
                  <div className="bg-pink-500 rounded-full p-2 shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-sm text-pink-600 font-medium ml-2">Our Performance</div>
                </div>
                <div className="flex justify-between items-center h-[72px]">
                  <div>
                    <div className="text-xl font-bold text-pink-600">Wells Fargo</div>
                    <div className="text-sm text-pink-500">Rank #{metrics.wellsFargoPosition.rank}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-pink-600">{formatCurrency(metrics.wellsFargoPosition.value)}</div>
                    <div className="text-sm text-pink-500">{formatPercentage(metrics.wellsFargoPosition.share)} share</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Leading Media */}
          <div className="flex-1">
            <div className="relative w-full">
              <div className="bg-white rounded-lg shadow-sm p-4 border border-violet-100" style={{ height: "160px" }}>
                <div className="flex items-center mb-6">
                  <div className="bg-violet-500 rounded-full p-2 shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-sm text-violet-600 font-medium ml-2">Leading Media</div>
                </div>
                <div className="flex justify-between items-center h-[72px]">
                  <div>
                    <div className="text-xl font-bold text-violet-700">{metrics.topMedia?.name || 'Television'}</div>
                    <div className="text-sm text-violet-500">{formatPercentage(metrics.topMedia?.share || 0)} of total spend</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-violet-700">
                      {formatCurrency(metrics.topMedia?.value || 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyMetrics;