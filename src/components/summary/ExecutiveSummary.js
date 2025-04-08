import React, { useMemo } from 'react';
import KeyMetrics from './KeyMetrics';
import MarketShareComparison from './MarketShareComparison';
import DistributionCharts from './DistributionCharts';
import MonthlyTrends from './MonthlyTrends';
import { useDashboard } from '../../context/DashboardContext';
import { formatPercentage, formatCurrency } from '../../utils/formatters';
import _ from 'lodash';

/**
 * Executive Summary component that integrates all summary components
 * Provides a comprehensive overview of all key insights and metrics
 */
const ExecutiveSummary = ({ selectedMonths = 'All Period' }) => {
  const { loading, dashboardData, selectedMonths: selectedMonthsArray } = useDashboard();
  
  // Calculate metrics directly from dashboardData
  const metrics = useMemo(() => {
    if (!dashboardData) return {};
    
    // Filter months if needed
    const relevantMonths = selectedMonthsArray.length > 0
      ? dashboardData.monthlyTrends.filter(month => selectedMonthsArray.includes(month.month))
      : dashboardData.monthlyTrends;
    
    // Calculate total investment
    const totalInvestment = relevantMonths.reduce((sum, month) => sum + month.total, 0);
    
    // Calculate bank totals and shares
    const bankTotals = {};
    relevantMonths.forEach(month => {
      month.bankShares.forEach(share => {
        bankTotals[share.bank] = (bankTotals[share.bank] || 0) + share.investment;
      });
    });
    
    const banksData = Object.entries(bankTotals).map(([name, value]) => ({
      name,
      investment: value,
      percentage: totalInvestment > 0 ? (value / totalInvestment) * 100 : 0
    })).sort((a, b) => b.investment - a.investment);
    
    // Find leading bank
    const leadingBank = banksData[0] || { name: '', investment: 0, percentage: 0 };
    
    // Calculate media category distribution
    const mediaTotals = {};
    Object.entries(bankTotals).forEach(([bankName, total]) => {
      const bank = dashboardData.banks.find(b => b.name === bankName);
      if (bank) {
        bank.mediaBreakdown.forEach(media => {
          const mediaAmount = (total * media.percentage) / 100;
          mediaTotals[media.category] = (mediaTotals[media.category] || 0) + mediaAmount;
        });
      }
    });
    
    const mediaDistribution = Object.entries(mediaTotals).map(([name, value]) => ({
      name,
      investment: value,
      percentage: totalInvestment > 0 ? (value / totalInvestment) * 100 : 0
    })).sort((a, b) => b.investment - a.investment);
    
    // Calculate top media category
    const topMedia = mediaDistribution[0] || { name: '', investment: 0, percentage: 0 };
    
    // Calculate combined Digital + TV
    const digitalTV = mediaDistribution
      .filter(m => m.name === 'Television' || m.name === 'Digital')
      .reduce((sum, m) => sum + m.percentage, 0);
    
    // Find peak month
    const peakMonth = _.maxBy(relevantMonths, 'total') || { month: '', investment: 0 };
    
    // Calculate quarterly totals
    const quarterlyData = {};
    relevantMonths.forEach(month => {
      const [year, monthNum] = month.month.split('-');
      const quarter = Math.ceil(parseInt(monthNum) / 3);
      const quarterKey = `${year}-Q${quarter}`;
      quarterlyData[quarterKey] = (quarterlyData[quarterKey] || 0) + month.total;
    });
    
    const quarters = Object.entries(quarterlyData).map(([quarter, amount]) => ({
      quarter,
      amount,
      percentage: totalInvestment > 0 ? (amount / totalInvestment) * 100 : 0
    })).sort((a, b) => b.amount - a.amount);
    
    const peakQuarter = quarters[0] || { quarter: '', amount: 0, percentage: 0 };
    
    return {
      totalInvestment,
      leadingBank,
      mediaDistribution,
      topMedia,
      combinedDigitalTV: digitalTV,
      peakMonth,
      peakQuarter,
      banksData
    };
  }, [dashboardData, selectedMonthsArray]);

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
            Market Data
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
              <h4 className="text-md font-semibold text-blue-700 mb-3">Banking Advertising Data</h4>
              <p className="text-blue-700 mb-4">
                The banking industry total advertising investment was <span className="font-bold">$1.84 billion</span> across all media channels during the period from January 2024 to March 2025.
              </p>
              <ul className="space-y-2 text-blue-700">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>The data includes six major banks, with Capital One representing 45.39% of total advertising spend</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Media spend is distributed across 7 media categories, with Television at 48.60% and Digital at 42.45%</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Each bank shows different allocation patterns across media categories</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
              <h4 className="text-md font-semibold text-blue-700 mb-3">Monthly Investment Data</h4>
              <p className="text-blue-700 mb-4">
                The data shows advertising spending across different months, with spending peaks in December 2024, March 2024, and September 2024.
              </p>
              <ul className="space-y-2 text-blue-700">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Digital and Television combined represent 91.05% of total spending</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>2024-12 had the highest monthly investment at $194.45M</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>2024-Q4 total investment was $441.58M, representing 23.92% of the annual total</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border border-green-200">
              <h4 className="text-md font-semibold text-green-700 mb-3">Media Channel Distribution</h4>
              <p className="text-green-700 mb-4">
                Analysis reveals distinct media channel allocation strategies across banking institutions.
              </p>
              <ul className="space-y-2 text-green-700">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Television dominates with 48.60% of total investment across all analyzed banks, representing $896.90M in advertising expenditure</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Digital channels account for 42.45% of total investment ($783.41M), showing significant adoption across all banking institutions during the entire analysis timeframe</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Supporting channels including Audio (6.32%), Print (1.63%), and Outdoor (0.75%) complete the integrated media strategy employed by banking advertisers</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-5 border border-amber-200">
              <h4 className="text-md font-semibold text-amber-700 mb-3">Market Share Analysis</h4>
              <p className="text-amber-700 mb-4">
                Analysis of market share reveals concentration patterns and strategic positioning of major banks.
              </p>
              <ul className="space-y-2 text-amber-700">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-amber-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>The top 3 banks collectively represent 83.16% of total media investment ($1.53B out of $1.84B total), demonstrating high market concentration</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-amber-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Capital One leads the market with 45.39% share of total media. Their media allocation strategy focuses primarily on Television and Digital channels, with additional investments in Streaming and Cinema</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-amber-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Chase Bank and Bank of America follow with 22.26% and 15.51% market share respectively, while Wells Fargo ranks 4th with 10.63% of the market</span>
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