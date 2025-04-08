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
          {/* Television and Digital Insights */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200 transition-transform duration-300 hover:scale-[1.01]">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Primary Media Channels</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="inline-block w-3 h-3 rounded-full mt-1.5 mr-2.5" style={{backgroundColor: mediaColors['Television']}}></span>
                <span className="text-blue-900">Television dominates media spending: Capital One leads with $425,027,359 (50.7% of their budget), Wells Fargo dedicates 67.5% ($132,538,410), and Chase allocates 32.1% ($131,743,559)</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-3 h-3 rounded-full mt-1.5 mr-2.5" style={{backgroundColor: mediaColors['Digital']}}></span>
                <span className="text-blue-900">Digital ranks second: Chase Bank invests $241,834,326 (58.9%), Capital One $350,952,125 (41.9%), Bank of America $115,345,939 (40.3%), and Wells Fargo $49,642,595 (25.3%)</span>
              </li>
            </ul>
          </div>

          {/* Seasonal and Audio Insights */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-5 border border-amber-200 transition-transform duration-300 hover:scale-[1.01]">
            <h3 className="text-lg font-semibold text-amber-800 mb-4">Investment Patterns</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="inline-block w-3 h-3 rounded-full mt-1.5 mr-2.5" style={{backgroundColor: mediaColors['Television']}}></span>
                <span className="text-amber-900">Seasonal spending varies significantly: Capital One peaks at $134,416,688 in December 2024 vs. $6,607,770 in March 2025; Chase Bank peaks at $59,114,811 in September 2024 vs. $3,497,546 in March 2025</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-3 h-3 rounded-full mt-1.5 mr-2.5" style={{backgroundColor: mediaColors['Audio']}}></span>
                <span className="text-amber-900">Audio investment varies by bank: Chase Bank $35,445,205 (8.6%), Capital One $35,619,272 (4.3%), Bank of America $32,453,957 (11.3%), while TD Bank invests only $41,495 (0.1%)</span>
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