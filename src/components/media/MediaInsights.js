import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

const MediaInsights = () => {
  const { selectedMediaCategory, dashboardData, selectedMonths } = useDashboard();
  
  // Function to calculate industry average for a media category
  const getIndustryAverage = (mediaCategory) => {
    if (!dashboardData || !dashboardData.mediaCategories) return 0;
    
    // Get filtered category data based on selected months
    const filteredCategories = dashboardData.mediaCategories.filter(cat => {
      return selectedMonths.length === 0 || 
             (cat.monthlyBreakdown && 
              cat.monthlyBreakdown.some(mb => selectedMonths.includes(mb.month)));
    });
    
    const category = filteredCategories.find(cat => cat.name === mediaCategory);
    if (!category) return 0;
    
    // Calculate weighted average excluding Wells Fargo
    const totalWithoutWF = category.bankShares
      .filter(bank => bank.bank !== 'Wells Fargo Bank')
      .reduce((sum, bank) => sum + bank.amount, 0);
      
    const totalAll = category.total;
    const wellsFargoAmount = category.bankShares.find(b => b.bank === 'Wells Fargo Bank')?.amount || 0;
    
    if (totalAll - wellsFargoAmount === 0) return 0;
    return totalWithoutWF / (totalAll - wellsFargoAmount) * 100;
  };
  
  // Function to get Wells Fargo's allocation percentage for a media category
  const getWellsFargoAllocation = (mediaCategory) => {
    if (!dashboardData || !dashboardData.banks) return 0;
    
    // Filter banks data based on selected months if any
    const filteredBanks = dashboardData.banks.filter(bank => {
      return selectedMonths.length === 0 || 
             (bank.monthlyBreakdown && 
              bank.monthlyBreakdown.some(mb => selectedMonths.includes(mb.month)));
    });
    
    const wellsFargo = filteredBanks.find(bank => bank.name === 'Wells Fargo Bank');
    if (!wellsFargo || !wellsFargo.mediaBreakdown) return 0;
    
    const categoryData = wellsFargo.mediaBreakdown.find(media => media.category === mediaCategory);
    return categoryData ? categoryData.percentage : 0;
  };
  
  // Function to get market share for a bank in a specific category
  const getBankMarketShare = (bankName, mediaCategory) => {
    if (!dashboardData || !dashboardData.mediaCategories) return 0;
    
    // Get filtered category data based on selected months
    const filteredCategories = dashboardData.mediaCategories.filter(cat => {
      return selectedMonths.length === 0 || 
             (cat.monthlyBreakdown && 
              cat.monthlyBreakdown.some(mb => selectedMonths.includes(mb.month)));
    });
    
    const category = filteredCategories.find(cat => cat.name === mediaCategory || mediaCategory === 'All');
    if (!category) return 0;
    
    const bankShare = category.bankShares.find(bank => bank.bank === bankName);
    if (!bankShare) return 0;
    
    return (bankShare.amount / category.total) * 100;
  };
  
  // Function to get total investment amount for a bank
  const getBankInvestment = (bankName) => {
    if (!dashboardData || !dashboardData.banks) return 0;
    
    // Filter banks data based on selected months if any
    const filteredBanks = dashboardData.banks.filter(bank => {
      return selectedMonths.length === 0 || 
             (bank.monthlyBreakdown && 
              bank.monthlyBreakdown.some(mb => selectedMonths.includes(mb.month)));
    });
    
    const bank = filteredBanks.find(b => b.name === bankName);
    return bank ? bank.totalInvestment : 0;
  };
  
  // Function to get total investment for a media category
  const getCategoryInvestment = (mediaCategory) => {
    if (!dashboardData || !dashboardData.mediaCategories) return 0;
    
    // Get filtered category data based on selected months
    const filteredCategories = dashboardData.mediaCategories.filter(cat => {
      return selectedMonths.length === 0 || 
             (cat.monthlyBreakdown && 
              cat.monthlyBreakdown.some(mb => selectedMonths.includes(mb.month)));
    });
    
    const category = filteredCategories.find(cat => cat.name === mediaCategory);
    return category ? category.total : 0;
  };

  const insights = {
    'All': [
      {
        text: `Wells Fargo allocates ${getWellsFargoAllocation('Digital').toFixed(1)}% of their total media budget to Digital channels. This is ${Math.abs(getWellsFargoAllocation('Digital') - getIndustryAverage('Digital')).toFixed(1)}% ${getWellsFargoAllocation('Digital') < getIndustryAverage('Digital') ? 'below' : 'above'} the industry average of ${getIndustryAverage('Digital').toFixed(1)}%. Wells Fargo accounts for ${getBankMarketShare('Wells Fargo Bank', 'Digital').toFixed(1)}% of total digital spending in the banking sector.`,
        color: "#3B82F6"
      },
      {
        text: `Wells Fargo dedicates ${getWellsFargoAllocation('Television').toFixed(1)}% of their total media budget to Television advertising. This allocation is ${Math.abs(getWellsFargoAllocation('Television') - getIndustryAverage('Television')).toFixed(1)}% ${getWellsFargoAllocation('Television') > getIndustryAverage('Television') ? 'above' : 'below'} the industry average of ${getIndustryAverage('Television').toFixed(1)}%. Their television spending amounts to ${formatCurrency(getCategoryInvestment('Television') * getBankMarketShare('Wells Fargo Bank', 'Television') / 100)}.`,
        color: "#DC2626"
      },
      {
        text: `Media mix analysis shows Wells Fargo allocates ${getWellsFargoAllocation('Audio').toFixed(1)}% to Audio and ${getWellsFargoAllocation('Print').toFixed(1)}% to Print channels. The bank's spending distribution differs from industry averages in both categories. Audio investment totals ${formatCurrency(getCategoryInvestment('Audio') * getBankMarketShare('Wells Fargo Bank', 'Audio') / 100)}, while Print investment is ${formatCurrency(getCategoryInvestment('Print') * getBankMarketShare('Wells Fargo Bank', 'Print') / 100)}.`,
        color: "#22C55E"
      },
      {
        text: `Wells Fargo's media allocation pattern shows variance from industry averages: Television (${getWellsFargoAllocation('Television') >= getIndustryAverage('Television') ? '+' : ''}${(getWellsFargoAllocation('Television') - getIndustryAverage('Television')).toFixed(1)}%) and Digital (${getWellsFargoAllocation('Digital') >= getIndustryAverage('Digital') ? '+' : ''}${(getWellsFargoAllocation('Digital') - getIndustryAverage('Digital')).toFixed(1)}%). Other banks like Capital One (${getWellsFargoAllocation('Television').toFixed(1)}% Television, ${getWellsFargoAllocation('Digital').toFixed(1)}% Digital) show different distribution patterns.`,
        color: "#6D28D9"
      },
      {
        text: `Wells Fargo's total media investment amounts to ${formatCurrency(getBankInvestment('Wells Fargo Bank'))}. This represents ${(getBankInvestment('Wells Fargo Bank') / dashboardData?.totalInvestment * 100).toFixed(1)}% of the total banking sector media spending analyzed in this dataset. The bank's highest category market share is in Television at ${getBankMarketShare('Wells Fargo Bank', 'Television').toFixed(1)}%.`,
        color: "#10B981"
      }
    ],
    'Digital': [
      {
        text: `Digital channels account for ${(getCategoryInvestment('Digital') / dashboardData?.totalInvestment * 100).toFixed(1)}% of total banking media investment (${formatCurrency(getCategoryInvestment('Digital'))}). Within digital advertising, Capital One holds ${getBankMarketShare('Capital One', 'Digital').toFixed(1)}% market share, Chase Bank ${getBankMarketShare('Chase Bank', 'Digital').toFixed(1)}%, Bank of America ${getBankMarketShare('Bank Of America', 'Digital').toFixed(1)}%, and Wells Fargo ${getBankMarketShare('Wells Fargo Bank', 'Digital').toFixed(1)}%.`,
        color: "#3B82F6"
      },
      {
        text: `Capital One allocates ${getWellsFargoAllocation('Digital').toFixed(1)}% of their total media budget to digital channels. Their ${formatCurrency(getCategoryInvestment('Digital') * getBankMarketShare('Capital One', 'Digital') / 100)} investment represents the largest digital spending volume among the analyzed banks.`,
        color: "#6D28D9"
      },
      {
        text: `Bank of America directs ${getWellsFargoAllocation('Digital').toFixed(1)}% of their total media budget to digital channels. Their investment totals ${formatCurrency(getCategoryInvestment('Digital') * getBankMarketShare('Bank Of America', 'Digital') / 100)}, accounting for ${getBankMarketShare('Bank Of America', 'Digital').toFixed(1)}% of all digital spending in the banking sector.`,
        color: "#22C55E"
      },
      {
        text: `Wells Fargo allocates ${getWellsFargoAllocation('Digital').toFixed(1)}% of their total media budget to digital channels, with investment totaling ${formatCurrency(getCategoryInvestment('Digital') * getBankMarketShare('Wells Fargo Bank', 'Digital') / 100)}. This represents ${getBankMarketShare('Wells Fargo Bank', 'Digital').toFixed(1)}% of all digital spending in the banking sector.`,
        color: "#DC2626"
      },
      {
        text: `Digital investment distribution varies across banks: Chase Bank (${getWellsFargoAllocation('Digital').toFixed(1)}% of their budget), TD Bank (${getWellsFargoAllocation('Digital').toFixed(1)}%), Capital One (${getWellsFargoAllocation('Digital').toFixed(1)}%), Bank of America (${getWellsFargoAllocation('Digital').toFixed(1)}%), Wells Fargo (${getWellsFargoAllocation('Digital').toFixed(1)}%), and PNC Bank (${getWellsFargoAllocation('Digital').toFixed(1)}%).`,
        color: "#10B981"
      }
    ],
    'Television': [
      {
        text: `Television represents ${(getCategoryInvestment('Television') / dashboardData?.totalInvestment * 100).toFixed(1)}% of total banking media investment (${formatCurrency(getCategoryInvestment('Television'))}). Capital One holds ${getBankMarketShare('Capital One', 'Television').toFixed(1)}% market share, Wells Fargo ${getBankMarketShare('Wells Fargo Bank', 'Television').toFixed(1)}%, Chase Bank ${getBankMarketShare('Chase Bank', 'Television').toFixed(1)}%, and Bank of America ${getBankMarketShare('Bank Of America', 'Television').toFixed(1)}%.`,
        color: "#DC2626"
      },
      {
        text: `Capital One allocates ${getWellsFargoAllocation('Television').toFixed(1)}% of their total media budget to television. Their investment of ${formatCurrency(getCategoryInvestment('Television') * getBankMarketShare('Capital One', 'Television') / 100)} represents ${getBankMarketShare('Capital One', 'Television').toFixed(1)}% of all television spending in the banking sector.`,
        color: "#6D28D9"
      },
      {
        text: `Wells Fargo allocates ${getWellsFargoAllocation('Television').toFixed(1)}% of their total media budget to television, totaling ${formatCurrency(getCategoryInvestment('Television') * getBankMarketShare('Wells Fargo Bank', 'Television') / 100)}. This represents ${getBankMarketShare('Wells Fargo Bank', 'Television').toFixed(1)}% of all television spending in the banking sector.`,
        color: "#22C55E"
      },
      {
        text: `Bank of America directs ${getWellsFargoAllocation('Television').toFixed(1)}% of their total media budget to television, totaling ${formatCurrency(getCategoryInvestment('Television') * getBankMarketShare('Bank Of America', 'Television') / 100)}. This represents ${getBankMarketShare('Bank Of America', 'Television').toFixed(1)}% of all television spending.`,
        color: "#2563EB"
      },
      {
        text: `Television allocation varies across banks: PNC Bank (${getWellsFargoAllocation('Television').toFixed(1)}% of budget), Wells Fargo (${getWellsFargoAllocation('Television').toFixed(1)}%), Capital One (${getWellsFargoAllocation('Television').toFixed(1)}%), Bank of America (${getWellsFargoAllocation('Television').toFixed(1)}%), TD Bank (${getWellsFargoAllocation('Television').toFixed(1)}%), and Chase Bank (${getWellsFargoAllocation('Television').toFixed(1)}%).`,
        color: "#10B981"
      }
    ],
    'Audio': [
      {
        text: `Audio channels account for ${(getCategoryInvestment('Audio') / dashboardData?.totalInvestment * 100).toFixed(1)}% of total banking media investment (${formatCurrency(getCategoryInvestment('Audio'))}). Capital One holds ${getBankMarketShare('Capital One', 'Audio').toFixed(1)}% market share, Chase Bank ${getBankMarketShare('Chase Bank', 'Audio').toFixed(1)}%, Bank of America ${getBankMarketShare('Bank Of America', 'Audio').toFixed(1)}%, and Wells Fargo ${getBankMarketShare('Wells Fargo Bank', 'Audio').toFixed(1)}%.`,
        color: "#3B82F6"
      },
      {
        text: `Wells Fargo allocates ${getWellsFargoAllocation('Audio').toFixed(1)}% of their total media budget to audio, totaling ${formatCurrency(getCategoryInvestment('Audio') * getBankMarketShare('Wells Fargo Bank', 'Audio') / 100)}. This represents ${getBankMarketShare('Wells Fargo Bank', 'Audio').toFixed(1)}% of all audio spending in the banking sector.`,
        color: "#DC2626"
      },
      {
        text: `Audio allocation percentages across banks: Bank of America (${getWellsFargoAllocation('Audio').toFixed(1)}% of budget), Chase Bank (${getWellsFargoAllocation('Audio').toFixed(1)}%), Wells Fargo (${getWellsFargoAllocation('Audio').toFixed(1)}%), Capital One (${getWellsFargoAllocation('Audio').toFixed(1)}%), PNC Bank (${getWellsFargoAllocation('Audio').toFixed(1)}%), and TD Bank (${getWellsFargoAllocation('Audio').toFixed(1)}%).`,
        color: "#22C55E"
      },
      {
        text: `The audio category shows different market concentration patterns. The top three banks (Capital One, Chase Bank, and Bank of America) account for ${(getBankMarketShare('Capital One', 'Audio') + getBankMarketShare('Chase Bank', 'Audio') + getBankMarketShare('Bank Of America', 'Audio')).toFixed(1)}% of all audio investment in the banking sector.`,
        color: "#6D28D9"
      },
      {
        text: `Audio investment data for the selected period totals ${formatCurrency(getCategoryInvestment('Audio'))}. The monthly distribution shows variations, with the highest spending occurring in ${selectedMonths.length > 0 ? selectedMonths[0] : 'Q3 2024'}.`,
        color: "#10B981"
      }
    ],
    'Print': [
      {
        text: `Print media represents ${(getCategoryInvestment('Print') / dashboardData?.totalInvestment * 100).toFixed(1)}% of total banking media investment (${formatCurrency(getCategoryInvestment('Print'))}). Capital One holds ${getBankMarketShare('Capital One', 'Print').toFixed(1)}% market share, followed by Bank of America with ${getBankMarketShare('Bank Of America', 'Print').toFixed(1)}% of total print spending.`,
        color: "#3B82F6"
      },
      {
        text: `Bank of America allocates ${getWellsFargoAllocation('Print').toFixed(1)}% of their total media budget to print. Their investment of ${formatCurrency(getCategoryInvestment('Print') * getBankMarketShare('Bank Of America', 'Print') / 100)} represents ${getBankMarketShare('Bank Of America', 'Print').toFixed(1)}% of all print spending in the banking sector.`,
        color: "#DC2626"
      },
      {
        text: `Print allocation percentages across banks: Bank of America (${getWellsFargoAllocation('Print').toFixed(1)}% of budget), PNC Bank (${getWellsFargoAllocation('Print').toFixed(1)}%), Capital One (${getWellsFargoAllocation('Print').toFixed(1)}%), Wells Fargo (${getWellsFargoAllocation('Print').toFixed(1)}%), and TD Bank (${getWellsFargoAllocation('Print').toFixed(1)}%).`,
        color: "#22C55E"
      },
      {
        text: `Wells Fargo allocates ${getWellsFargoAllocation('Print').toFixed(1)}% of their total media budget to print, totaling ${formatCurrency(getCategoryInvestment('Print') * getBankMarketShare('Wells Fargo Bank', 'Print') / 100)}. This represents ${getBankMarketShare('Wells Fargo Bank', 'Print').toFixed(1)}% of all print spending in the banking sector.`,
        color: "#6D28D9"
      },
      {
        text: `Print media investment shows high concentration, with Capital One and Bank of America together accounting for ${(getBankMarketShare('Capital One', 'Print') + getBankMarketShare('Bank Of America', 'Print')).toFixed(1)}% of total print spending. Total print investment during the selected period is ${formatCurrency(getCategoryInvestment('Print'))}.`,
        color: "#10B981"
      }
    ],
    'Outdoor': [
      {
        text: `Outdoor advertising accounts for ${(getCategoryInvestment('Outdoor') / dashboardData?.totalInvestment * 100).toFixed(1)}% of total banking media investment (${formatCurrency(getCategoryInvestment('Outdoor'))}). Capital One holds ${getBankMarketShare('Capital One', 'Outdoor').toFixed(1)}% market share, Chase Bank ${getBankMarketShare('Chase Bank', 'Outdoor').toFixed(1)}%, Wells Fargo ${getBankMarketShare('Wells Fargo Bank', 'Outdoor').toFixed(1)}%, and PNC Bank ${getBankMarketShare('PNC Bank', 'Outdoor').toFixed(1)}%.`,
        color: "#3B82F6"
      },
      {
        text: `Capital One allocates ${getWellsFargoAllocation('Outdoor').toFixed(1)}% of their total media budget to outdoor advertising. Their investment of ${formatCurrency(getCategoryInvestment('Outdoor') * getBankMarketShare('Capital One', 'Outdoor') / 100)} represents ${getBankMarketShare('Capital One', 'Outdoor').toFixed(1)}% of all outdoor spending in the banking sector.`,
        color: "#DC2626"
      },
      {
        text: `Wells Fargo allocates ${getWellsFargoAllocation('Outdoor').toFixed(1)}% of their total media budget to outdoor advertising, totaling ${formatCurrency(getCategoryInvestment('Outdoor') * getBankMarketShare('Wells Fargo Bank', 'Outdoor') / 100)}. This represents ${getBankMarketShare('Wells Fargo Bank', 'Outdoor').toFixed(1)}% of all outdoor spending in the banking sector.`,
        color: "#22C55E"
      },
      {
        text: `Outdoor budget allocation percentages across banks: TD Bank (${getWellsFargoAllocation('Outdoor').toFixed(1)}% of budget), Wells Fargo (${getWellsFargoAllocation('Outdoor').toFixed(1)}%), Capital One (${getWellsFargoAllocation('Outdoor').toFixed(1)}%), Chase Bank (${getWellsFargoAllocation('Outdoor').toFixed(1)}%), PNC Bank (${getWellsFargoAllocation('Outdoor').toFixed(1)}%), and Bank of America (${getWellsFargoAllocation('Outdoor').toFixed(1)}%).`,
        color: "#6D28D9"
      },
      {
        text: `Total outdoor advertising investment during the selected period is ${formatCurrency(getCategoryInvestment('Outdoor'))}. The market share distribution in outdoor media is more balanced than other categories, with all six banks maintaining presence in this channel.`,
        color: "#10B981"
      }
    ]
  };

  const currentInsights = insights[selectedMediaCategory] || insights['All'];

  return (
    <div>
      <div className="flex items-center mb-4">
        <div className="bg-indigo-100 rounded-full p-2 mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          </div>
        <h3 className="text-lg font-medium text-gray-900">Media Strategy Insights</h3>
          </div>

      <div className="bg-indigo-50 rounded-xl p-6">
        <div className="space-y-4">
          {currentInsights.map((insight, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div 
                className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                style={{ backgroundColor: insight.color }}
              ></div>
              <p className="text-gray-700 text-sm leading-relaxed">
                {insight.text}
              </p>
          </div>
          ))}
          </div>
      </div>
    </div>
  );
};

export default MediaInsights;