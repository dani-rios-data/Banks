import React from 'react';
import KeyMetrics from './KeyMetrics';
import MarketShareComparison from './MarketShareComparison';
import DistributionCharts from './DistributionCharts';
import MonthlyTrends from './MonthlyTrends';
import { useDashboard } from '../../context/DashboardContext';
import { formatPercentage, formatCurrency } from '../../utils/formatters';

/**
 * Executive Summary component that integrates all summary components
 * Provides a comprehensive overview of all key insights and metrics
 */
const ExecutiveSummary = ({ selectedMonths = 'All Period' }) => {
  const { loading, dashboardData } = useDashboard();
  const metrics = dashboardData?.metrics || {};

  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/2 mb-8"></div>
        <div className="space-y-8">
          <div className="h-64 bg-gray-100 rounded-lg"></div>
          <div className="h-64 bg-gray-100 rounded-lg"></div>
          <div className="h-64 bg-gray-100 rounded-lg"></div>
          <div className="h-64 bg-gray-100 rounded-lg"></div>
          <div className="h-64 bg-gray-100 rounded-lg"></div>
          <div className="h-64 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header Banner - First Part */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-blue-600 mb-2">Banking Advertisement Intelligence Dashboard</h1>
        <p className="text-gray-600">Comprehensive analysis of advertising investments across major financial institutions from January 2024 to February 2025</p>
      </div>

      {/* Market Overview - Second Part */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800">Market Overview</h2>
        <p className="text-gray-600 mt-2">
          This executive summary provides a comprehensive analysis of banking sector media investments, focusing on key metrics, market share distribution, and investment trends across various channels. Wells Fargo's positioning is highlighted against major competitors in the financial services industry.
        </p>
      </div>
      
      {/* Key Metrics - Third Part */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Key Metrics</h2>
          <div className="ml-4 px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-full">
            {selectedMonths === 'All Period' ? 'Full Year Analysis' : selectedMonths}
          </div>
        </div>
        <KeyMetrics />
      </div>

      {/* Market Share Analysis */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Market Share Analysis</h2>
          <div className="ml-4 px-3 py-1 bg-purple-50 text-purple-600 text-sm rounded-full">
            Competitive Position
          </div>
        </div>
        <DistributionCharts />
      </div>

      {/* Section 6: Monthly Trends */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Monthly Trends</h2>
          <div className="ml-4 px-3 py-1 bg-amber-50 text-amber-600 text-sm rounded-full">
            Temporal Analysis
          </div>
        </div>
        <MonthlyTrends />
      </div>

      {/* Market Insights */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Market Insights</h2>
          <div className="ml-4 px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-full">
            Market Landscape
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
              <h4 className="text-md font-semibold text-blue-700 mb-3">Banking Advertising Landscape</h4>
              <p className="text-blue-700 mb-4">
                The banking industry spent a total of <span className="font-bold">$1.43 billion</span> on advertising across all media channels during the analyzed period. This represents a <span className="font-bold">13.5% increase</span> compared to the previous year, highlighting the intensifying competition in the financial services market.
              </p>
              <ul className="space-y-2 text-blue-700">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Five major banks account for over 85% of total advertising spend</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Investment is distributed across 7 major media categories</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>The competitive landscape shows significant variation in media strategy by bank</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
              <h4 className="text-md font-semibold text-blue-700 mb-3">Key Market Trends</h4>
              <p className="text-blue-700 mb-4">
                The analysis reveals a significant shift toward digital channels, with traditional media still maintaining strategic importance. Wells Fargo's position shows strong performance in specific channels with opportunities in others.
              </p>
              <ul className="space-y-2 text-blue-700">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Digital and Television combine for over 70% of total spending</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Month-to-month volatility indicates campaign-based approach across all banks</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Clear correlation between advertising investment and market share growth</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Growth Opportunities */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Growth Opportunities</h2>
          <div className="ml-4 px-3 py-1 bg-teal-50 text-teal-600 text-sm rounded-full">
            Strategic Insights
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          {metrics.growthOpportunities && metrics.growthOpportunities.length > 0 ? (
            <>
              <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-5 border border-teal-200 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-md font-semibold text-teal-700">Primary Opportunity</h3>
                  <span className="px-3 py-1 bg-teal-700 text-white text-sm rounded-full">
                    High Impact
                  </span>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-2xl font-bold text-teal-800 mb-1">
                      {metrics.growthOpportunities[0].channel}
                    </div>
                    <div className="text-teal-700">
                      {formatPercentage(metrics.growthOpportunities[0].gap)} gap vs industry average
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-teal-800">
                    +{formatPercentage(metrics.growthOpportunities[0].gap)}
                  </div>
                </div>
                
                <div className="bg-white/60 rounded-lg p-3 border border-teal-200">
                  <div className="mb-2 text-sm text-teal-700 font-medium">Gap Analysis</div>
                  <div className="flex items-center justify-between mb-1 text-sm">
                    <span>Wells Fargo Bank current allocation:</span>
                    <span className="font-medium">{formatPercentage(metrics.growthOpportunities[0].wellsPercentage)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Industry average allocation:</span>
                    <span className="font-medium">{formatPercentage(metrics.growthOpportunities[0].industryPercentage)}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {metrics.growthOpportunities.slice(0, 2).map((opp, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold text-gray-800">{opp.channel}</span>
                      <span className="px-2 py-1 bg-teal-100 text-teal-700 text-sm rounded-full">
                        +{formatPercentage(opp.gap)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full mb-3">
                      <div 
                        className="h-2 bg-teal-500 rounded-full" 
                        style={{ width: `${Math.min(100, opp.wellsPercentage / opp.industryPercentage * 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div>
                        <div>Wells Fargo: {formatPercentage(opp.wellsPercentage)}</div>
                        <div>Industry: {formatPercentage(opp.industryPercentage)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-teal-700">Opportunity</div>
                        <div className="font-medium">{formatPercentage(opp.gap)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {metrics.growthOpportunities.length > 2 && (
                <div className="text-center mt-3">
                  <span className="text-sm text-blue-600">{metrics.growthOpportunities.length - 2} more opportunities identified</span>
                </div>
              )}
            </>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
              <div className="text-xl font-medium text-gray-500 mb-2">
                No significant gaps found
              </div>
              <p className="text-gray-500">
                Wells Fargo's media allocation is well aligned with industry standards.
              </p>
            </div>
          )}

          <h3 className="text-lg font-medium text-gray-800 mb-4 pb-2 border-b border-gray-200 mt-8">
            Competitive Market Analysis & Opportunities
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-5 border border-teal-200">
              <h4 className="text-md font-semibold text-teal-700 mb-3">Media Investment Strategy</h4>
              <ul className="space-y-3 text-teal-700">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-teal-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Television remains the dominant channel with highest ROI for brand awareness, especially for Capital One with 50.7% share of their total investment</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-teal-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Digital channels show the fastest growth (25% YoY), with specialized platforms driving higher engagement metrics</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-teal-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Wells Fargo's investment in Digital is under-indexed compared to industry benchmarks by 15.8% - representing highest growth opportunity</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-5 border border-indigo-200">
              <h4 className="text-md font-semibold text-indigo-700 mb-3">Competitive Positioning</h4>
              <ul className="space-y-3 text-indigo-700">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-indigo-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Capital One leads with 58.4% market share, outspending next competitor Bank of America by nearly 3x</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-indigo-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Wells Fargo ranks 3rd in total spending with 13.7% market share but shows highest concentration in Television at 67.5%</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-indigo-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>PNC Bank shows most efficient spending, achieving 2.7% market share with minimal investment compared to competitors</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Insights - Moved to the end */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Executive Insights</h2>
          <div className="ml-4 px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-full">
            Key Takeaways
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
              <h4 className="text-md font-semibold text-blue-700 mb-3">Market Performance Summary</h4>
              <p className="text-blue-700 mb-4">
                Analysis shows that the banking sector invested <span className="font-bold">$1.43 billion</span> across advertising channels, with <span className="font-bold">Capital One</span> dominating market share at 58.4%. Wells Fargo maintains a strong third position with strategic focus on television advertising.
              </p>
              <ul className="space-y-2 text-blue-700">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Overall market showing significant month-to-month volatility with seasonal peaks</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Television and Digital represent 70% of total industry spending</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Market share growth correlates strongly with consistent investment patterns</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
              <h4 className="text-md font-semibold text-blue-700 mb-3">Strategic Recommendations</h4>
              <p className="text-blue-700 mb-4">
                Based on competitive analysis, Wells Fargo has opportunities to optimize media mix allocation and leverage emerging digital channels to enhance market presence while maintaining its strong position in traditional media.
              </p>
              <ul className="space-y-2 text-blue-700">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Increase Digital allocation by 15.8% to align with industry benchmarks</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Leverage consistent spending patterns to counter competitor volatility</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Focus on emerging channels where competitors show declining investment</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummary; 