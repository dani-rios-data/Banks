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
                The banking industry total advertising investment was <span className="font-bold">{formatCurrency(metrics.totalInvestment || dashboardData.totalInvestment).replace('M', ' million').replace('B', ' billion')}</span> across all media channels during the {selectedMonthsArray.length > 0 ? 'selected period' : 'period from January 2024 to March 2025'}.
              </p>
              <ul className="space-y-2 text-blue-700">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>The data includes six major banks, with {metrics.leadingBank?.name || 'Capital One'} representing {formatPercentage(metrics.leadingBank?.percentage || 0)} of total advertising spend</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Media spend is distributed across 7 media categories, with Television at {formatPercentage(metrics.mediaDistribution?.find(m => m.name === 'Television')?.percentage || 0)} and Digital at {formatPercentage(metrics.mediaDistribution?.find(m => m.name === 'Digital')?.percentage || 0)}</span>
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
                {selectedMonthsArray.length > 0 
                  ? `The data shows advertising spending across the ${selectedMonthsArray.length} selected month${selectedMonthsArray.length > 1 ? 's' : ''}.`
                  : 'The data shows advertising spending across different months, with spending peaks in December 2024, March 2024, and September 2024.'
                }
              </p>
              <ul className="space-y-2 text-blue-700">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Digital and Television combined represent {formatPercentage(metrics.combinedDigitalTV || 0)} of total spending</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{metrics.peakMonth?.month ? `${metrics.peakMonth.month} had` : 'December 2024 had'} the highest monthly investment at {formatCurrency(metrics.peakMonth?.total || 0)}</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{metrics.peakQuarter?.quarter ? `${metrics.peakQuarter.quarter}` : 'Q4 2024'} total investment was {formatCurrency(metrics.peakQuarter?.amount || 0)}, representing {formatPercentage(metrics.peakQuarter?.percentage || 0)} of the {selectedMonthsArray.length > 0 ? 'period' : 'annual'} total</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-5 border border-teal-200">
              <h4 className="text-md font-semibold text-teal-700 mb-3">Media Channel Distribution</h4>
              <p className="text-teal-700 mb-4">
                Analysis reveals distinct media channel allocation strategies across banking institutions.
              </p>
              <ul className="space-y-3 text-teal-700">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-teal-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Television dominates with {formatPercentage(metrics.mediaDistribution?.find(m => m.name === 'Television')?.percentage || 0)} of total investment across all analyzed banks, representing {formatCurrency(metrics.mediaDistribution?.find(m => m.name === 'Television')?.investment || 0)} in advertising expenditure</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-teal-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Digital channels account for {formatPercentage(metrics.mediaDistribution?.find(m => m.name === 'Digital')?.percentage || 0)} of total investment ({formatCurrency(metrics.mediaDistribution?.find(m => m.name === 'Digital')?.investment || 0)}), showing significant adoption across all banking institutions during {selectedMonthsArray.length > 0 ? 'the selected period' : 'the entire analysis timeframe'}</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-teal-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Supporting channels including Audio ({formatPercentage(metrics.mediaDistribution?.find(m => m.name === 'Audio')?.percentage || 0)}), Print ({formatPercentage(metrics.mediaDistribution?.find(m => m.name === 'Print')?.percentage || 0)}), and Outdoor ({formatPercentage(metrics.mediaDistribution?.find(m => m.name === 'Outdoor')?.percentage || 0)}) complete the integrated media strategy employed by banking advertisers</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-5 border border-teal-200">
              <h4 className="text-md font-semibold text-teal-700 mb-3">Market Share Analysis</h4>
              <ul className="space-y-3 text-teal-700">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-teal-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>The top 3 banks collectively represent {formatPercentage(
                    metrics.banksData && metrics.banksData.length >= 3 ? 
                    (metrics.banksData[0]?.percentage || 0) + 
                    (metrics.banksData[1]?.percentage || 0) + 
                    (metrics.banksData[2]?.percentage || 0) : 83.16
                  )} of total media investment ({formatCurrency(
                    metrics.banksData && metrics.banksData.length >= 3 ?
                    (metrics.banksData[0]?.investment || 0) + 
                    (metrics.banksData[1]?.investment || 0) + 
                    (metrics.banksData[2]?.investment || 0) : 1533000000
                  )}){selectedMonthsArray.length > 0 ? ` during the selected ${selectedMonthsArray.length === 1 ? 'month' : 'period'}` : ''}, demonstrating high market concentration</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-teal-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{metrics.leadingBank?.name || 'Capital One'} leads the market with {formatPercentage(metrics.leadingBank?.share || 0)} share of total media investment ({formatCurrency(metrics.leadingBank?.value || 0)}){selectedMonthsArray.length > 0 ? ` during the selected ${selectedMonthsArray.length === 1 ? 'month' : 'period'}` : ''}</span>. Their media allocation strategy focuses primarily on {metrics.leadingBank?.topCategory || 'Television'} ({formatPercentage(metrics.leadingBank?.topCategoryPercentage || 0)} of their budget), with significant investment also in {metrics.leadingBank?.secondCategory || 'Digital'} channels.
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

      {/* New insights section */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Media Channel Distribution</h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-700">
                <span className="font-medium">Television remains the dominant channel,</span> accounting for approximately {formatPercentage(metrics.topMediaPercentage || 0)} of total banking media investment{selectedMonthsArray.length > 0 ? ` during the selected ${selectedMonthsArray.length === 1 ? 'month' : 'period'}` : ''}. This represents {formatCurrency(metrics.topMediaValue || 0)} in estimated media investment, highlighting the continued importance of traditional broadcast advertising for financial institutions.
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-purple-700">
                <span className="font-medium">Digital channels show significant investment,</span> representing approximately {formatPercentage(metrics.digitalPercentage || 0)} of total banking media investment ({formatCurrency(metrics.digitalValue || 0)}){selectedMonthsArray.length > 0 ? ` during the selected ${selectedMonthsArray.length === 1 ? 'month' : 'period'}` : ''}. This reflects the growing importance of online platforms in reaching target audiences and the industry's ongoing digital transformation.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Market Share Analysis</h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-green-700">
                <span className="font-medium">High market concentration:</span> The top three banks collectively control {formatPercentage(metrics.top3BanksShare || 0)} of total banking media investment ({formatCurrency(metrics.top3BanksValue || 0)}){selectedMonthsArray.length > 0 ? ` during the selected ${selectedMonthsArray.length === 1 ? 'month' : 'months'}` : ''}, indicating a highly concentrated competitive landscape where major players dominate media spending.
              </p>
            </div>
            
            <div className="p-4 bg-amber-50 rounded-lg">
              <p className="text-amber-700">
                <span className="font-medium">{metrics.leadingBank?.name || 'Capital One'} leads the market with {formatPercentage(metrics.leadingBank?.share || 0)} share of total media investment ({formatCurrency(metrics.leadingBank?.value || 0)}){selectedMonthsArray.length > 0 ? ` during the selected ${selectedMonthsArray.length === 1 ? 'month' : 'period'}` : ''}</span>. Their media allocation strategy focuses primarily on {metrics.leadingBank?.topCategory || 'Television'} ({formatPercentage(metrics.leadingBank?.topCategoryPercentage || 0)} of their budget), with significant investment also in {metrics.leadingBank?.secondCategory || 'Digital'} channels.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummary; 