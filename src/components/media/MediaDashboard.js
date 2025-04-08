import React from 'react';
import MediaInvestmentByBank from './MediaInvestmentByBank';
import MediaChannelAnalysis from './MediaChannelAnalysis';
import MediaInsights from './MediaInsights';
import { useDashboard } from '../../context/DashboardContext';
import { mediaColors } from '../../utils/colorSchemes';

/**
 * Main component for the media analysis dashboard
 */
const MediaDashboard = () => {
  const { selectedMediaCategory } = useDashboard();

  return (
    <div className="space-y-6">
      {/* Media Strategy Insights - Panel mejorado y más simétrico */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 transition-shadow duration-300 hover:shadow-lg">
        <div className="flex items-center mb-5">
          <div className="bg-emerald-100 rounded-full p-2.5 mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Media Strategy Insights</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Channel Distribution Insights */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200 transition-transform duration-300 hover:scale-[1.01]">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Media Channel Distribution</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="inline-block w-3 h-3 rounded-full mt-1.5 mr-2.5" style={{backgroundColor: mediaColors['Television']}}></span>
                <span className="text-blue-900">Television accounts for 48.60% ($896.91M) of total media investment across all banks, making it the dominant channel in the industry</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-3 h-3 rounded-full mt-1.5 mr-2.5" style={{backgroundColor: mediaColors['Digital']}}></span>
                <span className="text-blue-900">Digital channels represent 42.45% ($783.41M) of total media investment, ranking as the second most utilized media channel</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-3 h-3 rounded-full mt-1.5 mr-2.5" style={{backgroundColor: mediaColors['Audio']}}></span>
                <span className="text-blue-900">Audio (6.32%, $116.71M), Print (1.63%, $30.18M), and Outdoor (0.67%, $12.27M) complete the media mix distribution</span>
              </li>
            </ul>
          </div>

          {/* Market Share Analysis */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-5 border border-amber-200 transition-transform duration-300 hover:scale-[1.01]">
            <h3 className="text-lg font-semibold text-amber-800 mb-4">Market Share Analysis</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="inline-block w-3 h-3 rounded-full mt-1.5 mr-2.5" style={{backgroundColor: mediaColors['Television']}}></span>
                <span className="text-amber-900">The top 3 banks collectively represent 83.16% of total media investment ($1.53B out of $1.85B total)</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-3 h-3 rounded-full mt-1.5 mr-2.5" style={{backgroundColor: mediaColors['Digital']}}></span>
                <span className="text-amber-900">Capital One leads with 45.39% ($837.60M) market share, followed by Chase Bank at 22.26% ($410.79M) and Bank of America at 15.51% ($286.25M)</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-3 h-3 rounded-full mt-1.5 mr-2.5" style={{backgroundColor: mediaColors['Audio']}}></span>
                <span className="text-amber-900">Wells Fargo ranks 4th with 10.63% ($196.28M) of market share, while PNC Bank (4.12%, $76.09M) and TD Bank (2.07%, $38.32M) complete the market</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Media Investment Insights */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 transition-shadow duration-300 hover:shadow-lg">
        <div className="flex items-center mb-5">
          <div className="bg-indigo-100 rounded-full p-2.5 mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Media Investment Insights</h2>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-5 border border-indigo-200 transition-transform duration-300 hover:scale-[1.005]">
          <MediaInsights />
        </div>
      </div>
      
      {/* Media Channel Analysis */}
      <MediaChannelAnalysis />
      
      {/* Media Investment by Bank */}
      <MediaInvestmentByBank activeCategory={selectedMediaCategory} />
    </div>
  );
};

export default MediaDashboard;