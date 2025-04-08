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
      peakQuarter
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
                The banking industry total advertising investment was <span className="font-bold">{formatCurrency(metrics.totalInvestment || dashboardData.totalInvestment).replace('M', ' million').replace('B', ' billion')}</span> across all media channels during the period from January 2024 to March 2025.
              </p>
              <ul className="space-y-2 text-blue-700">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>The data includes six major banks, with Capital One representing {formatPercentage(metrics.leadingBank?.percentage || 0)} of total advertising spend</span>
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
                The data shows advertising spending across different months, with spending peaks in December 2024, March 2024, and September 2024.
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
                  <span>December 2024 had the highest monthly investment at {formatCurrency(metrics.peakMonth?.total || 0)}</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Q4 2024 total investment was {formatCurrency(metrics.peakQuarter?.amount || 0)}, representing {formatPercentage(metrics.peakQuarter?.percentage || 0)} of the annual total</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-5 border border-teal-200">
              <h4 className="text-md font-semibold text-teal-700 mb-3">Media Channel Distribution</h4>
              <p className="text-teal-700 mb-4">
                The data shows varied media channel allocation across banks.
              </p>
              <ul className="space-y-3 text-teal-700">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-teal-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Television represents {formatPercentage(metrics.mediaDistribution?.find(m => m.name === 'Television')?.percentage || 0)} of total investment, with Capital One allocating {formatPercentage(dashboardData.banks?.find(b => b.name === 'Capital One')?.mediaBreakdown?.find(m => m.category === 'Television')?.percentage || 0)} of their budget to this medium</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-teal-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Digital channels account for {formatPercentage(metrics.mediaDistribution?.find(m => m.name === 'Digital')?.percentage || 0)} of total investment, with Chase Bank allocating {formatPercentage(dashboardData.banks?.find(b => b.name === 'Chase Bank')?.mediaBreakdown?.find(m => m.category === 'Digital')?.percentage || 0)} of their budget to digital</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-teal-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>PNC Bank allocates {formatPercentage(dashboardData.banks?.find(b => b.name === 'Pnc Bank')?.mediaBreakdown?.find(m => m.category === 'Television')?.percentage || 0)} to Television, TD Bank allocates {formatPercentage(dashboardData.banks?.find(b => b.name === 'Td Bank')?.mediaBreakdown?.find(m => m.category === 'Digital')?.percentage || 0)} to Digital</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-5 border border-teal-200">
              <h4 className="text-md font-semibold text-teal-700 mb-3">Market Share Data</h4>
              <ul className="space-y-3 text-teal-700">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-teal-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Capital One accounts for 45.39% of total advertising investment, Chase Bank accounts for 22.26%</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-teal-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Capital One's share by media category: Television (47.39%), Digital (44.80%), Print (52.23%)</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-teal-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Wells Fargo accounts for 10.64% of market share, with 14.78% share of Television advertising</span>
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