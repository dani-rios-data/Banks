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
const KeyMetrics = () => {
  const { dashboardData, loading, selectedMonths } = useDashboard();

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

  // Calculate metrics based on selected months
  const metrics = useMemo(() => {
    if (!dashboardData?.monthlyTrends || !dashboardData?.banks) {
      return {
        totalInvestment: 0,
        bankTotals: [],
        mediaTotals: [],
        topBank: null,
        topMedia: null,
        wellsFargoPosition: { rank: 0, share: 0, value: 0 },
        yearOverYearGrowth: 0,
        averageMonthlyInvestment: 0,
        growthOpportunities: [],
        banksCount: 0,
        mediaCount: 0
      };
    }

    // Nombre correcto de Wells Fargo en los datos
    const WELLS_FARGO_NAME = "Wells Fargo Bank";

    // Filter data by selected months
    const relevantMonths = selectedMonths.length > 0
      ? dashboardData.monthlyTrends.filter(month => selectedMonths.includes(month.month))
      : dashboardData.monthlyTrends;

    // Calculate total investment and bank totals
    let totalInvestment = 0;
    const bankInvestments = new Map();

    // Initialize bank investments
    dashboardData.banks.forEach(bank => {
      bankInvestments.set(bank.name, 0);
    });

    // Calculate totals from monthly data
    relevantMonths.forEach(month => {
      totalInvestment += month.total;
      month.bankShares.forEach(share => {
        const currentTotal = bankInvestments.get(share.bank) || 0;
        bankInvestments.set(share.bank, currentTotal + share.investment);
      });
    });

    // Create sorted bank totals array
    const bankTotals = Array.from(bankInvestments.entries())
      .map(([name, value]) => ({
        name,
        value,
        share: totalInvestment > 0 ? (value / totalInvestment) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);

    // Find Wells Fargo's position and top bank
    const topBank = bankTotals[0] || { name: 'Unknown', value: 0, share: 0 };
    const wellsFargoIndex = bankTotals.findIndex(bank => bank.name === WELLS_FARGO_NAME);
    const wellsFargoPosition = {
      rank: wellsFargoIndex >= 0 ? wellsFargoIndex + 1 : 0,
      share: wellsFargoIndex >= 0 ? bankTotals[wellsFargoIndex].share : 0,
      value: wellsFargoIndex >= 0 ? bankTotals[wellsFargoIndex].value : 0
    };

    // Calculate media totals
    const mediaInvestments = new Map();
    dashboardData.banks.forEach(bank => {
      const bankTotal = bankInvestments.get(bank.name) || 0;
      bank.mediaBreakdown.forEach(media => {
        const currentValue = mediaInvestments.get(media.category) || 0;
        const mediaValue = bankTotal * (media.percentage / 100);
        mediaInvestments.set(media.category, currentValue + mediaValue);
      });
    });

    // Create sorted media totals array
    const mediaTotals = Array.from(mediaInvestments.entries())
      .map(([name, value]) => ({
        name,
        value,
        share: totalInvestment > 0 ? (value / totalInvestment) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);

    const topMedia = mediaTotals[0] || { name: 'Unknown', value: 0, share: 0 };

    // Calculate growth opportunities
    const growthOpportunities = [];
    if (wellsFargoIndex >= 0) {
      const wellsFargo = dashboardData.banks.find(bank => bank.name === WELLS_FARGO_NAME);
      const wellsFargoTotal = bankTotals[wellsFargoIndex].value;

      if (wellsFargo) {
        wellsFargo.mediaBreakdown.forEach(media => {
          const industryMedia = mediaTotals.find(m => m.name === media.category);
          if (industryMedia) {
            const wellsFargoMediaValue = wellsFargoTotal * (media.percentage / 100);
            const wellsFargoMediaShare = totalInvestment > 0 ? (wellsFargoMediaValue / totalInvestment) * 100 : 0;
            const gap = industryMedia.share - wellsFargoMediaShare;

            if (gap > 5) {
              growthOpportunities.push({
                channel: media.category,
                wellsPercentage: wellsFargoMediaShare,
                industryPercentage: industryMedia.share,
                gap: gap
              });
            }
          }
        });
      }
    }

    // Calculate year-over-year growth
    let yearOverYearGrowth = 0;
    if (relevantMonths.length > 1) {
      const sortedMonths = _.orderBy(relevantMonths, ['month'], ['asc']);
      const midPoint = Math.floor(sortedMonths.length / 2);
      const firstHalf = sortedMonths.slice(0, midPoint);
      const secondHalf = sortedMonths.slice(midPoint);
      
      const firstHalfAvg = _.meanBy(firstHalf, 'total');
      const secondHalfAvg = _.meanBy(secondHalf, 'total');
      
      yearOverYearGrowth = firstHalfAvg > 0 
        ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
        : 0;
    }

    return {
      totalInvestment,
      bankTotals,
      mediaTotals,
      topBank,
      topMedia,
      wellsFargoPosition,
      yearOverYearGrowth,
      averageMonthlyInvestment: relevantMonths.length > 0 ? totalInvestment / relevantMonths.length : 0,
      growthOpportunities: _.orderBy(growthOpportunities, ['gap'], ['desc']),
      banksCount: dashboardData.banks.length,
      mediaCount: mediaTotals.length
    };
  }, [dashboardData, selectedMonths]);

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
                <span className={metrics.yearOverYearGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {metrics.yearOverYearGrowth >= 0 ? '↑ ' : '↓ '}
                  {Math.abs(metrics.yearOverYearGrowth).toFixed(1)}% growth
                </span>
              </div>
              <div className="text-sm text-gray-800 font-semibold mt-1">
                {formatCurrency(metrics.averageMonthlyInvestment)} monthly avg
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
                    <div className="text-sm text-fuchsia-500">{formatPercentage(metrics.topBank.share)} share</div>
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
                    <div className="text-xl font-bold text-violet-700">Television</div>
                    <div className="text-sm text-violet-500">{formatPercentage(metrics.mediaTotals.find(m => m.name === 'Television')?.share || 0)} of total spend</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-violet-700">
                      {formatCurrency(metrics.mediaTotals.find(m => m.name === 'Television')?.value || 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Channel Allocation Section */}
      <div className="mt-12 mb-6">
        <h3 className="text-base font-semibold text-gray-800 mb-6">Channel Allocation</h3>
        
        <div className="flex gap-4">
          {/* Television and Audio - aligned with Leading Bank */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100" style={{ height: "110px" }}>
              <div className="grid grid-cols-1 gap-3">
                {metrics.mediaTotals.slice(0, 2).map((media, index) => (
                  <div key={index} className="flex items-center">
                    <div 
                      className="w-2.5 h-2.5 rounded-full mr-2" 
                      style={{ backgroundColor: getMediaColor(media.name) }}
                    ></div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">{media.name}</span>
                        <span className="text-sm text-gray-600">{formatPercentage(media.share)}</span>
        </div>
                      <div className="h-1 bg-gray-50 rounded-full mt-1">
                        <div 
                          className="h-1 rounded-full" 
              style={{ 
                            width: `${media.share}%`, 
                            backgroundColor: getMediaColor(media.name) 
              }}
            ></div>
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>
      
          {/* Digital and Print - aligned with Our Performance */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100" style={{ height: "110px" }}>
              <div className="grid grid-cols-1 gap-3">
                {metrics.mediaTotals.slice(2, 4).map((media, index) => (
                  <div key={index} className="flex items-center">
                    <div 
                      className="w-2.5 h-2.5 rounded-full mr-2" 
                      style={{ backgroundColor: getMediaColor(media.name) }}
                    ></div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">{media.name}</span>
                        <span className="text-sm text-gray-600">{formatPercentage(media.share)}</span>
        </div>
                      <div className="h-1 bg-gray-50 rounded-full mt-1">
                        <div 
                          className="h-1 rounded-full" 
              style={{ 
                            width: `${media.share}%`, 
                            backgroundColor: getMediaColor(media.name) 
              }}
            ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key Insights - aligned with Leading Media */}
          <div className="flex-1">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100" style={{ height: "110px" }}>
              <div className="text-sm text-gray-600 leading-relaxed">
                <span className="font-medium text-gray-800">Key Insights:</span> {metrics.mediaTotals[0]?.name || 'N/A'} leads with {formatPercentage(metrics.mediaTotals[0]?.share || 0)} share, while {metrics.mediaTotals[1]?.name || 'N/A'} follows at {formatPercentage(metrics.mediaTotals[1]?.share || 0)}. This {selectedMonths.length > 0 ? 'period shows' : 'overall distribution reflects'} a strategic balance between broad reach and targeted campaigns.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyMetrics;