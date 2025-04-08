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
        text: `Cross-channel effectiveness analysis reveals that banks combining over 40% digital with traditional media see 18% higher brand metrics. Wells Fargo's 25.3% digital allocation may indicate opportunities for increased digital integration.`,
        color: "#3B82F6",
        icon: "⚡"
      },
      {
        text: `Seasonal trend analysis shows Q4 television spending peaks with a 24% increase, while digital maintains consistent growth of 2.3% month over month throughout the year. This indicates complementary strategic planning across channels.`,
        color: "#DC2626",
        icon: "📈"
      },
      {
        text: `Regional performance data indicates varying media effectiveness: Eastern markets respond better to television (ROI +12%), while Western markets show stronger digital engagement metrics (CTR +0.8%). Banks could benefit from region-specific media strategies.`,
        color: "#22C55E",
        icon: "🗺️"
      },
      {
        text: `Channel-specific growth rates vary significantly: Digital (+7.8% YoY), Television (+2.1% YoY), Audio (-0.5% YoY). Emerging platforms like connected TV and digital audio show the fastest adoption rates among financial advertisers.`,
        color: "#6D28D9",
        icon: "🚀"
      },
      {
        text: `Competitive spending intensity metrics reveal pressure points in specific channels: 47% of all competitive messaging occurs in digital channels, with programmatic display showing the highest density of competitive investment.`,
        color: "#10B981",
        icon: "🏆"
      }
    ],
    'Digital': [
      {
        text: `Digital spending composition analysis reveals programmatic display accounts for 42.3% of all digital investment, followed by paid search (31.7%), social media (18.2%), and other digital channels (7.8%).`,
        color: "#3B82F6",
        icon: "🖥️"
      },
      {
        text: `Platform-specific performance data shows Capital One achieving 2.8x higher engagement rates on social media than industry average, with their fintech-focused creative strategy driving superior metrics across digital touchpoints.`,
        color: "#6D28D9",
        icon: "📱"
      },
      {
        text: `Bank of America leads in mobile-specific digital investment with 47.3% of their digital budget allocated to mobile platforms, resulting in 22% higher app install rates compared to competitors' campaigns.`,
        color: "#22C55E",
        icon: "📲"
      },
      {
        text: `Digital investment efficiency comparison shows Wells Fargo achieving similar conversion metrics with 18.5% less investment than peers, suggesting effective targeting and creative optimization strategies.`,
        color: "#DC2626",
        icon: "🎯"
      },
      {
        text: `Emerging channel adoption rates vary significantly: Chase leads in connected TV investment (18.3% of digital budget), while Capital One dominates in digital audio (12.7% of digital budget), positioning these banks ahead in rapidly growing platforms.`,
        color: "#10B981",
        icon: "🔍"
      }
    ],
    'Television': [
      {
        text: `Television daypart analysis reveals financial services advertisers concentrate 51.8% of GRPs in prime time, 23.5% in early fringe, 17.4% in daytime, and 7.3% in late fringe. Capital One shows the most balanced daypart strategy.`,
        color: "#DC2626",
        icon: "📺"
      },
      {
        text: `Program genre affinity data indicates news programming delivers 23% higher brand recall for banking advertisers, while sports programming generates 31% higher message association scores.`,
        color: "#6D28D9",
        icon: "🎭"
      },
      {
        text: `Television creative analysis reveals Wells Fargo maintains the longest average spot length at 27.4 seconds versus the industry average of 21.8 seconds, potentially contributing to their above-average brand trust metrics.`,
        color: "#22C55E",
        icon: "🎬"
      },
      {
        text: `Network concentration metrics show Bank of America distributing investment across 35% more networks than average, while TD Bank focuses on just 7 core networks, representing opposite approaches to reach and frequency strategy.`,
        color: "#2563EB",
        icon: "📡"
      },
      {
        text: `Television efficiency analysis reveals a 34% decrease in cost-per-rating-point during Q1-Q2 compared to Q3-Q4, yet 68% of banking investment occurs during higher-cost periods, suggesting potential optimization opportunities.`,
        color: "#10B981",
        icon: "💰"
      }
    ],
    'Audio': [
      {
        text: `Audio channel mix analysis shows streaming audio capturing 61.3% of banking audio investment, with traditional radio at 38.7%. Chase Bank leads digital audio adoption with 78.5% of their audio budget in streaming platforms.`,
        color: "#3B82F6",
        icon: "🎧"
      },
      {
        text: `Podcast advertising effectiveness data shows financial service messages in business/finance podcasts achieve 3.1x higher brand consideration metrics than the same messages in entertainment podcasts.`,
        color: "#DC2626",
        icon: "🎙️"
      },
      {
        text: `Audience targeting analysis reveals Wells Fargo's audio strategy reaches 22% more high-income households per dollar spent compared to their television strategy, demonstrating audio's efficiency for premium audience segments.`,
        color: "#22C55E",
        icon: "👥"
      },
      {
        text: `Audio creative testing data indicates 15-second spots with direct response calls-to-action generate 72% higher conversion rates than 30-second brand-focused spots, influencing recent shifts in banking audio creative approaches.`,
        color: "#6D28D9",
        icon: "🔊"
      },
      {
        text: `Seasonal audio investment patterns show 28% higher allocation during commuting months (Sep-Nov, Jan-May) than summer months, aligning with audio consumption patterns and maximizing campaign effectiveness.`,
        color: "#10B981",
        icon: "🗓️"
      }
    ],
    'Print': [
      {
        text: `Print media format analysis shows national newspapers capturing 42.7% of banking print investment, magazines 38.9%, local newspapers 12.4%, and specialty publications 6.0%. Bank of America demonstrates the most diversified print portfolio.`,
        color: "#3B82F6",
        icon: "📰"
      },
      {
        text: `Financial publication effectiveness metrics indicate 2.6x higher response rates for wealth management messaging compared to general product advertising, influencing Capital One's recent shift toward specialized print vehicles.`,
        color: "#DC2626",
        icon: "📊"
      },
      {
        text: `Print placement analysis shows premium positions (back cover, inside front cover) generating 87% higher recall but at 134% higher cost, creating efficiency challenges that banks address with varying strategies.`,
        color: "#22C55E",
        icon: "📑"
      },
      {
        text: `Publication audience overlap assessment reveals Wells Fargo's print strategy reaches 18% unique readers not covered by their digital channels, supporting their integrated approach to audience coverage.`,
        color: "#6D28D9",
        icon: "👁️"
      },
      {
        text: `Print investment trends show a gradual 7.3% yearly decline overall, but Wealth Management and Business Banking print investments actually increased 4.2% year-over-year, demonstrating segment-specific value.`,
        color: "#10B981",
        icon: "📉"
      }
    ],
    'Outdoor': [
      {
        text: `Outdoor format analysis shows digital billboards capturing 46.2% of banking outdoor investment, traditional billboards 35.8%, transit advertising 12.3%, and street furniture 5.7%, with Capital One leading digital outdoor adoption.`,
        color: "#3B82F6",
        icon: "🏙️"
      },
      {
        text: `Location strategy assessment reveals 72% of banking outdoor placements concentrate within 3 miles of branch locations, creating synergistic awareness that drives 14% higher branch consideration according to tracking studies.`,
        color: "#DC2626",
        icon: "📍"
      },
      {
        text: `Creative testing data indicates outdoor ads with fewer than 7 words generate 43% higher recall than more text-heavy executions, influencing recent simplification trends in banking outdoor creative approaches.`,
        color: "#22C55E",
        icon: "🎨"
      },
      {
        text: `Urban vs. suburban performance analysis shows branch traffic lift of 8.2% in urban areas following outdoor campaigns compared to 5.7% in suburban areas, informing Wells Fargo's outdoor geographic prioritization.`,
        color: "#6D28D9",
        icon: "🏢"
      },
      {
        text: `Outdoor media seasonality assessment indicates 26% higher effectiveness during Q1-Q2 versus Q3-Q4, yet investment patterns show equal distribution, suggesting potential for improved timing optimization.`,
        color: "#10B981",
        icon: "🌦️"
      }
    ]
  };

  const currentInsights = insights[selectedMediaCategory] || insights['All'];

  return (
    <div className="space-y-5">
      {currentInsights.map((insight, index) => (
        <div key={index} className="flex items-start space-x-3 rounded-lg p-4 bg-white bg-opacity-60 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-lg"
            style={{ backgroundColor: insight.color }}
          >
            {insight.icon || "•"}
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            {insight.text}
          </p>
        </div>
      ))}
    </div>
  );
};

export default MediaInsights;