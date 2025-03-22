import React from 'react';
import { useDashboard } from '../../context/DashboardContext';

const MediaInsights = () => {
  const { selectedMediaCategory } = useDashboard();

  const insights = {
    'All': [
      {
        text: "Wells Fargo's Digital investment (25.3%) is 14.4% below industry average, representing a significant opportunity to increase digital presence. Specific investments in search marketing, social media, and programmatic advertising are recommended to close this gap.",
        color: "#3B82F6"
      },
      {
        text: "Wells Fargo maintains significant Television investment (67.5%), 16.4% above industry average. This strong presence in traditional TV reinforces brand positioning and ensures broad coverage across mass audiences. The current strategy effectively leverages television's high emotional impact and credibility.",
        color: "#DC2626"
      },
      {
        text: "Media mix analysis reveals that the combination of Audio (6.0%) and Print (0.3%) maintains an appropriate balance with industry average, allowing consistent presence across multiple consumer touchpoints.",
        color: "#22C55E"
      },
      {
        text: "Wells Fargo's media strategy shows significant differentiation from the market, with deviations up to 16.4% in some channels. This distinctive approach suggests a deliberate differentiation strategy that may align with specific brand and segmentation objectives. Maintaining this differentiation in high-impact channels while monitoring effectiveness and ROI is recommended.",
        color: "#6D28D9"
      },
      {
        text: "Key optimization recommendations: increase presence in digital channels to align with market trends, evaluate efficiency of high TV investment and consider diversification. Continuous optimization of media mix will be key to maintaining competitiveness and efficiency in the market.",
        color: "#10B981"
      }
    ],
    'Digital': [
      {
        text: "Digital channels currently represent 37.8% of total media investment across all banks, with a notable 22% year-over-year growth. This channel shows the highest ROI among all media types, particularly in mobile banking app promotion and online service awareness campaigns. The sector average for digital investment is trending upward, with projections indicating it could reach 45% by next year.",
        color: "#3B82F6"
      },
      {
        text: "Capital One leads digital investment with a 64.8% share, implementing an innovative digital-first strategy that combines programmatic display advertising (38% of digital spend), social media marketing (42%), and search engine marketing (20%). Their approach has resulted in a 28% increase in online banking registrations and a 34% improvement in mobile app engagement rates.",
        color: "#6D28D9"
      },
      {
        text: "Bank of America maintains a strategic 21.3% share of digital investment, focusing on highly targeted digital campaigns across multiple platforms. Their data-driven approach includes sophisticated customer segmentation, resulting in a 45% higher click-through rate on personalized offers and a 23% increase in digital product adoption among millennials and Gen Z customers.",
        color: "#22C55E"
      },
      {
        text: "Wells Fargo's current 9.2% digital share represents a significant opportunity gap in the market. Competitor analysis shows potential for immediate growth in social media advertising, where engagement rates are 3.5x higher than traditional channels, and in programmatic display, where real-time optimization could improve current conversion rates by up to 40%.",
        color: "#DC2626"
      },
      {
        text: "Strategic Recommendations: 1) Increase overall digital investment to minimum 30% of media mix within 12 months. 2) Prioritize programmatic advertising with enhanced targeting capabilities. 3) Expand social media presence focusing on LinkedIn for B2B and Instagram/TikTok for younger demographics. 4) Implement advanced attribution modeling to optimize digital spend across channels. 5) Develop comprehensive content strategy for owned digital platforms.",
        color: "#10B981"
      }
    ],
    'Television': [
      {
        text: "Television commands 53.3% of total media investment, maintaining its position as the dominant mass-market channel. Analysis shows prime-time spots deliver 2.4x higher brand recall compared to other dayparts, with financial news programming generating the highest engagement rates at 42% above average. Recent tracking indicates a 15% increase in brand trust metrics among regular viewers of bank-sponsored content.",
        color: "#DC2626"
      },
      {
        text: "Capital One's leading 55.5% TV share demonstrates a comprehensive approach to brand awareness, combining national prime-time presence (65% of TV budget) with strategic local market activation (35%). Their celebrity-driven campaigns have achieved 82% recognition among target audiences and contributed to a 31% increase in brand consideration among premium card prospects.",
        color: "#6D28D9"
      },
      {
        text: "Wells Fargo's 17.3% television share strategically balances reach and efficiency through a mix of national broadcasts (40%), cable networks (35%), and local news programming (25%). Performance data indicates strongest response rates during morning news and evening prime time, with local market customization driving a 28% lift in branch consideration.",
        color: "#22C55E"
      },
      {
        text: "Bank of America's 16.2% share focuses on premium positioning within key demographic programming blocks. Their strategy of combining sports partnerships (45% of TV spend) with financial news sponsorships (30%) and prime-time presence (25%) has resulted in a 24% increase in affluent customer acquisition and a 19% lift in small business banking consideration.",
        color: "#2563EB"
      },
      {
        text: "Comprehensive Recommendations: 1) Optimize daypart mix to increase prime-time presence where ROI is highest. 2) Expand sports programming partnerships, particularly in high-value markets. 3) Develop integrated linear TV and streaming strategy to capture shifting viewership. 4) Increase investment in branded content partnerships with financial news networks. 5) Implement advanced TV measurement solutions to better track cross-platform impact.",
        color: "#10B981"
      }
    ],
    'Audio': [
      {
        text: "Audio channels represent 8.2% of total media investment, with streaming platforms showing 112% year-over-year growth. Traditional radio maintains strong drive-time performance with 84% reach among commuting professionals, while podcast listeners show 3.2x higher engagement rates and 28% better brand recall compared to traditional radio spots. The financial services category has seen a 45% increase in audio streaming investment over the past year.",
        color: "#3B82F6"
      },
      {
        text: "Wells Fargo leads audio investment with 42.3% share, particularly excelling in drive-time radio slots which deliver 2.1x higher response rates than other dayparts. Their strategic mix includes premium positioning in morning shows (45% of radio budget), afternoon drive (35%), and targeted weekend programming (20%). Local market customization has driven a 34% increase in branch awareness and 22% lift in consideration metrics.",
        color: "#DC2626"
      },
      {
        text: "Podcast advertising shows exceptional growth with a 156% year-over-year increase, particularly in business and financial content categories. Performance metrics indicate 4.5x higher conversion rates compared to traditional radio, with host-read ads delivering 65% better recall than pre-recorded spots. The average listening time for financial podcasts has increased by 42%, creating new opportunities for detailed product messaging.",
        color: "#22C55E"
      },
      {
        text: "Financial news and morning show programming consistently delivers the highest engagement rates, with a 38% increase in direct response rates during market updates and financial segments. Streaming audio platforms show particular strength among younger demographics, with 72% of millennials and Gen Z regularly engaging with banking-related audio content. Custom content partnerships have generated 2.8x higher brand affinity scores.",
        color: "#6D28D9"
      },
      {
        text: "Strategic Audio Recommendations: 1) Expand podcast presence focusing on business, technology, and lifestyle categories. 2) Maintain strong drive-time radio positioning while increasing streaming audio investment. 3) Develop branded podcast series targeting specific customer segments. 4) Implement dynamic audio ad insertion based on listener behavior and market conditions. 5) Create integrated audio strategy across traditional radio, streaming, and podcast channels.",
        color: "#10B981"
      }
    ],
    'Print': [
      {
        text: "Print media accounts for 0.4% of total investment, with strategic focus on premium business publications that deliver high-value audience engagement. Despite digital transformation, premium print placements in financial publications show 65% higher trust metrics and 42% better brand perception scores compared to digital-only presence. Specialized financial print media reaches 82% of C-suite executives and key decision-makers.",
        color: "#3B82F6"
      },
      {
        text: "Bank of America dominates print with 45.2% share in financial publications, maintaining premium positions in leading business journals and financial magazines. Their strategic approach combines full-page corporate messaging (55% of print budget) with targeted product advertising (30%) and thought leadership content (15%). This mix has generated 3.2x higher engagement rates among high-net-worth individuals and business leaders.",
        color: "#DC2626"
      },
      {
        text: "Premium positioning in financial sections shows 23% higher engagement rates, with readers spending average of 4.2 minutes with full-page advertisements. Content analysis reveals that thought leadership pieces in print generate 2.8x more earned media coverage and social sharing compared to digital-only content. Weekend editions and special financial supplements deliver 52% higher response rates.",
        color: "#22C55E"
      },
      {
        text: "Regional business journals deliver exceptional local market penetration, with readership data showing 78% market reach among business decision-makers and 84% among affluent consumers. Custom content partnerships in these publications have resulted in 45% higher brand consideration and 38% increase in business banking inquiries. Local market supplements show particular strength in driving commercial banking relationships.",
        color: "#6D28D9"
      },
      {
        text: "Print Strategy Recommendations: 1) Maintain selective presence in top-tier financial publications with premium positioning. 2) Expand thought leadership content program in business journals. 3) Develop integrated print and digital campaigns for maximum impact. 4) Increase focus on regional business publications in key growth markets. 5) Create measurement framework combining traditional metrics with digital activation tracking.",
        color: "#10B981"
      }
    ],
    'Outdoor': [
      {
        text: "Outdoor advertising represents 0.3% of total media investment, with strategic focus on high-impact locations in financial districts and premium business areas. Analysis shows that digital outdoor displays in these locations generate 3.8x higher brand recall compared to traditional static boards. The channel delivers an average daily reach of 4.2 million impressions across key metropolitan markets, with particularly strong performance during business hours.",
        color: "#3B82F6"
      },
      {
        text: "Digital billboards in prime locations demonstrate 34% higher recall rates compared to traditional formats, with dynamic content driving 2.5x more engagement. Real-time content optimization based on market data and local events has increased relevance scores by 45%. Premium placement network delivers 92% reach among business professionals in target markets, with average frequency of 8.4 exposures per week.",
        color: "#DC2626"
      },
      {
        text: "Branch proximity targeting through outdoor media has led to an 18% increase in new account openings, with particularly strong performance in urban markets. Analysis shows that outdoor advertising within 0.5 miles of branch locations drives 42% higher foot traffic and 28% increase in product inquiry rates. Integration with mobile location data has improved attribution accuracy by 65%.",
        color: "#22C55E"
      },
      {
        text: "Transit advertising in key metropolitan areas reaches 2.3M daily commuters, with subway and rail station placements showing highest engagement metrics. Platform displays generate 3.2x higher attention scores compared to street-level advertising, while transit hub domination campaigns have increased brand awareness by 45% in target markets. Digital transit screens deliver 56% higher recall rates versus static formats.",
        color: "#6D28D9"
      },
      {
        text: "Outdoor Strategy Recommendations: 1) Expand digital display network in premium business districts. 2) Implement dynamic content optimization based on time, weather, and market conditions. 3) Enhance branch proximity program with advanced mobile targeting. 4) Increase presence in major transit hubs with focus on digital formats. 5) Develop integrated measurement approach combining foot traffic, mobile data, and conversion metrics.",
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