import React, { useMemo } from 'react';
import KeyMetrics from './KeyMetrics';
import DistributionCharts from './DistributionCharts';
import MonthlyTrends from './MonthlyTrends';
import { useDashboard } from '../../context/DashboardContext';
import { formatPercentage, formatCurrency } from '../../utils/formatters';
import _ from 'lodash';

/**
 * Executive Summary component that integrates all summary components
 * Provides a comprehensive overview of all key insights and metrics
 */
const ExecutiveSummary = () => {
  const { loading, filteredData, selectedPeriod } = useDashboard();
  
  // Calculate metrics directly from filteredData
  const metrics = useMemo(() => {
    if (!filteredData) return {};
    
    // Get relevant data
    const relevantMonths = filteredData.monthlyTrends;
    const totalInvestment = filteredData.totalInvestment;
    const banks = filteredData.banks;
    
    // Calculate bank totals and shares
    const banksData = banks.map(bank => {
      // Aseguramos que el porcentaje esté correctamente calculado
      const percentage = totalInvestment > 0 ? (bank.totalInvestment / totalInvestment) * 100 : 0;
      
      return {
        name: bank.name,
        investment: bank.totalInvestment,
        percentage: percentage  // Recalculamos el porcentaje para asegurar consistencia
      };
    }).sort((a, b) => b.investment - a.investment);
    
    // Find leading bank
    const leadingBank = banksData[0] || { name: '', investment: 0, percentage: 0 };
    
    // Calculate media category distribution
    const mediaCategories = filteredData.mediaCategories || [];
    const mediaDistribution = mediaCategories.map(media => {
      // Aseguramos que el porcentaje esté correctamente calculado
      const percentage = totalInvestment > 0 ? (media.totalInvestment / totalInvestment) * 100 : 0;
      
      return {
        name: media.category,
        investment: media.totalInvestment,
        percentage: percentage  // Recalculamos el porcentaje para asegurar consistencia
      };
    }).sort((a, b) => b.investment - a.investment);
    
    // Calculate top media category
    const topMedia = mediaDistribution[0] || { name: '', investment: 0, percentage: 0 };
    
    // Calculate combined Digital + TV
    const digitalTV = mediaDistribution
      .filter(m => m.name === 'Television' || m.name === 'Digital')
      .reduce((sum, m) => sum + m.percentage, 0);
    
    // Find peak month
    const peakMonth = _.maxBy(relevantMonths, 'total') || { month: '', total: 0 };
    
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
  }, [filteredData]);

  if (loading || !filteredData) {
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
        <p className="text-gray-600 text-sm bg-gray-100 p-2 rounded-md inline-block mb-3">Selected Period: {selectedPeriod}</p>
        <h1 className="text-2xl font-bold text-blue-600 mb-2">Banking Advertisement Intelligence Dashboard</h1>
      </div>

      {/* Market Overview - Second Part */}
      <div className="mb-8">
        <p className="text-gray-600 mt-2">
          This executive summary provides a comprehensive analysis of banking sector media investments across major banks. The dashboard displays key metrics, market share distribution, investment trends, and media allocation strategies for each bank. The analysis is based on the data available for the selected period.
        </p>
      </div>
      
      {/* Market Insights - MOVED UP */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Market Insights
          </h2>
          <div className="ml-4 px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-full flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Market Data
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 transition-all duration-300 hover:shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200 transform transition-all duration-300 hover:scale-[1.01] hover:shadow-md">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-blue-700">Banking Advertising Data</h4>
              </div>
              <p className="text-blue-700 mb-4 pl-2 border-l-4 border-blue-400 bg-blue-50 p-2 rounded-r-md">
                The banking industry total advertising investment was <span className="font-bold text-blue-800">{formatCurrency(metrics.totalInvestment)}</span> across all media channels during the selected period.
              </p>
              <ul className="space-y-3 text-blue-700">
                <li className="flex items-start bg-white bg-opacity-60 p-2 rounded-lg border-l-2 border-blue-400 hover:bg-opacity-80 transition-all">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>The data includes {filteredData?.banks?.length || 0} major banks, with {metrics.leadingBank?.name} representing {formatPercentage(metrics.leadingBank?.percentage)} of total advertising spend</span>
                </li>
                <li className="flex items-start bg-white bg-opacity-60 p-2 rounded-lg border-l-2 border-blue-400 hover:bg-opacity-80 transition-all">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  <span>Media spend is distributed across {metrics.mediaDistribution?.length || 0} categories, with {metrics.topMedia?.name} at {formatPercentage(metrics.topMedia?.percentage)} of total spend</span>
                </li>
                <li className="flex items-start bg-white bg-opacity-60 p-2 rounded-lg border-l-2 border-blue-400 hover:bg-opacity-80 transition-all">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Each bank shows different allocation patterns across media categories</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-5 border border-indigo-200 transform transition-all duration-300 hover:scale-[1.01] hover:shadow-md">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-indigo-700">Monthly Investment Data</h4>
              </div>
              <p className="text-indigo-700 mb-4 pl-2 border-l-4 border-indigo-400 bg-indigo-50 p-2 rounded-r-md">
                The data shows advertising spending across different months, with varying spending patterns.
              </p>
              <ul className="space-y-3 text-indigo-700">
                <li className="flex items-start bg-white bg-opacity-60 p-2 rounded-lg border-l-2 border-indigo-400 hover:bg-opacity-80 transition-all">
                  <svg className="h-5 w-5 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                  <span>Digital and Television combined represent {formatPercentage(metrics.combinedDigitalTV)} of total spending</span>
                </li>
                <li className="flex items-start bg-white bg-opacity-60 p-2 rounded-lg border-l-2 border-indigo-400 hover:bg-opacity-80 transition-all">
                  <svg className="h-5 w-5 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span>{metrics.peakMonth?.month ? metrics.peakMonth.month : 'No data'} had the highest monthly investment at {formatCurrency(metrics.peakMonth?.total)}</span>
                </li>
                <li className="flex items-start bg-white bg-opacity-60 p-2 rounded-lg border-l-2 border-indigo-400 hover:bg-opacity-80 transition-all">
                  <svg className="h-5 w-5 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>{metrics.peakQuarter?.quarter ? metrics.peakQuarter.quarter : 'No data'} total investment was {formatCurrency(metrics.peakQuarter?.amount)}, representing {formatPercentage(metrics.peakQuarter?.percentage)} of the total</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border border-green-200 transform transition-all duration-300 hover:scale-[1.01] hover:shadow-md">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-green-700">Media Channel Distribution</h4>
              </div>
              <p className="text-green-700 mb-4 pl-2 border-l-4 border-green-400 bg-green-50 p-2 rounded-r-md">
                Media investment allocation across different channels by banking sector during the selected period.
              </p>
              <ul className="space-y-3 text-green-700">
                {metrics.mediaDistribution?.slice(0, 3).map((media, index) => (
                  <li key={index} className="flex items-start bg-white bg-opacity-60 p-2 rounded-lg border-l-2 border-green-400 hover:bg-opacity-80 transition-all">
                    <svg className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                    <span>{media.name} represents {formatPercentage(media.percentage)} of total investment ({formatCurrency(media.investment)})</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-5 border border-amber-200 transform transition-all duration-300 hover:scale-[1.01] hover:shadow-md">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-amber-700">Market Share Analysis</h4>
              </div>
              <p className="text-amber-700 mb-4 pl-2 border-l-4 border-amber-400 bg-amber-50 p-2 rounded-r-md">
                Distribution of advertising investment across major banking institutions in the selected period.
              </p>
              <ul className="space-y-3 text-amber-700">
                {metrics.banksData?.slice(0, 3).map((bank, index) => (
                  <li key={index} className="flex items-start bg-white bg-opacity-60 p-2 rounded-lg border-l-2 border-amber-400 hover:bg-opacity-80 transition-all">
                    <svg className="h-5 w-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>{bank.name} has {formatPercentage(bank.percentage)} market share ({formatCurrency(bank.investment)})</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Key Metrics Section */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Key Performance Metrics</h2>
          <div className="ml-4 px-3 py-1 bg-indigo-50 text-indigo-600 text-sm rounded-full">
            Market Summary
          </div>
        </div>
        <KeyMetrics filteredData={filteredData} metrics={metrics} />
      </div>
      
      {/* Market Share and Distribution Section - Combined */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Market Distribution Analysis</h2>
          <div className="ml-4 px-3 py-1 bg-green-50 text-green-600 text-sm rounded-full">
            Competitive Positioning
          </div>
        </div>
        <DistributionCharts filteredData={filteredData} />
      </div>
      
      {/* Monthly Trends */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Investment Trends</h2>
          <div className="ml-4 px-3 py-1 bg-red-50 text-red-600 text-sm rounded-full">
            Monthly Analysis
          </div>
        </div>
        <MonthlyTrends filteredData={filteredData} />
      </div>
    </div>
  );
};

export default ExecutiveSummary; 