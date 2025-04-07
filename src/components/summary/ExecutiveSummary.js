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
      </div>

      {/* Market Overview - Second Part */}
      <div className="mb-8">
        <p className="text-gray-600 mt-2">
          This executive summary provides a comprehensive analysis of banking sector media investments across six major banks from January 2024 to March 2025. The dashboard displays key metrics, market share distribution, investment trends, and media allocation strategies for Capital One, Chase Bank, Bank of America, Wells Fargo, PNC Bank, and TD Bank. Please note that data for March 2025 is not complete.
        </p>
      </div>
      
      {/* Market Insights - MOVED UP */}
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
                The banking industry spent a total of <span className="font-bold">$1.85 billion</span> on advertising across all media channels during the analyzed period (January 2024 - March 2025).
              </p>
              <ul className="space-y-2 text-blue-700">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Six major banks account for the total advertising spend, with Capital One leading at 45.39%</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Investment is distributed across 7 media categories, with Television (51.48%) and Digital (40.24%) dominant</span>
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
                The analysis reveals significant variations in spending across different months, with three notable investment peaks in December 2024, March 2024, and September 2024.
              </p>
              <ul className="space-y-2 text-blue-700">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Digital and Television combine for 91.72% of total spending across all banks</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Significant monthly volatility, with December 2024 showing the highest investment ($194.45M)</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Q4 2024 had the highest quarterly investment at $441.6M (23.93% of total)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Growth Opportunities - MOVED UP */}
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
                Wells Fargo&apos;s media allocation is well aligned with industry standards.
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
                  <span>Television remains the dominant channel at 51.48% of total investment, with Capital One investing 50.74% of their budget in this medium</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-teal-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Digital channels represent 40.24% of total investment, with Chase Bank focusing 58.87% of their budget in this category</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-teal-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Distinct strategies emerge: PNC Bank is heavily television-focused (88.55%), TD Bank is digital-focused (53.33%), while Capital One and Bank of America maintain balanced approaches</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-5 border border-teal-200">
              <h4 className="text-md font-semibold text-teal-700 mb-3">Competitive Differentiation</h4>
              <ul className="space-y-3 text-teal-700">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-teal-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Capital One dominates the market with 45.39% of total investment, more than double Chase Bank (22.26%), the second-largest investor</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-teal-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Capital One leads in Television (47.39%), Digital (44.80%), and Print (52.23%) categories, showing broad market dominance</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-teal-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Wells Fargo ranks fourth overall with 10.64% market share, with its strongest position in Television (14.78% of category)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Key Metrics - NOW AFTER INSIGHTS */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Bank&apos;s Performance Metrics</h2>
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
        <DistributionCharts hideWellsFargoComparison={true} />
      </div>

      {/* Monthly Trends */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Monthly Trends</h2>
          <div className="ml-4 px-3 py-1 bg-amber-50 text-amber-600 text-sm rounded-full">
            Temporal Analysis
          </div>
        </div>
        <MonthlyTrends />
      </div>
    </div>
  );
};

export default ExecutiveSummary; 