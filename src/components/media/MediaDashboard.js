import React from 'react';
import MediaInvestmentByBank from './MediaInvestmentByBank';
import MediaChannelAnalysis from './MediaChannelAnalysis';
import { useDashboard } from '../../context/DashboardContext';
import { mediaColors } from '../../utils/colorSchemes';

/**
 * Main component for the media analysis dashboard
 */
const MediaDashboard = () => {
  const { selectedMediaCategory } = useDashboard();

  return (
    <div className="space-y-8">
      {/* Media Channel Analysis */}
      <MediaChannelAnalysis />
      
      {/* Strategic Media Insights */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex items-center mb-4">
          <div className="bg-emerald-100 rounded-full p-2 mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Media Investment Insights</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Channel Distribution Insights */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Media Channel Distribution</h3>
            <ul className="space-y-3 text-blue-900">
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 rounded-full mt-2 mr-2" style={{backgroundColor: mediaColors['Television']}}></span>
                <span>Television dominates with 53.3% share, indicating strong focus on mass market reach and brand awareness</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 rounded-full mt-2 mr-2" style={{backgroundColor: mediaColors['Digital']}}></span>
                <span>Digital channels represent 37.8%, showing significant investment in online presence and targeting capabilities</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 rounded-full mt-2 mr-2" style={{backgroundColor: mediaColors['Audio']}}></span>
                <span>Audio and Print combine for 8.8%, providing complementary reach to primary channels</span>
              </li>
            </ul>
          </div>

          {/* Market Share Analysis */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Market Share Analysis</h3>
            <ul className="space-y-3 text-blue-900">
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 rounded-full mt-2 mr-2" style={{backgroundColor: mediaColors['Television']}}></span>
                <span>The top 3 banks collectively represent 83.16% of total media investment ($1.53B), demonstrating high market concentration</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 rounded-full mt-2 mr-2" style={{backgroundColor: mediaColors['Digital']}}></span>
                <span>Capital One leads the market with 45.39% share of total media, with significant investment also in Digital channels</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 rounded-full mt-2 mr-2" style={{backgroundColor: mediaColors['Audio']}}></span>
                <span>Market shows high concentration in traditional media channels, with opportunities in emerging digital platforms</span>
              </li>
            </ul>
          </div>

          {/* Strategic Recommendations */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-5 border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-800 mb-3">Strategic Recommendations</h3>
            <ul className="space-y-3 text-purple-900">
              <li className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center mr-2">
                  <span className="text-purple-700 text-sm">1</span>
                </div>
                <span>Consider increasing digital allocation to align with growing online banking trends and younger demographic preferences</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center mr-2">
                  <span className="text-purple-700 text-sm">2</span>
                </div>
                <span>Evaluate ROI of traditional channels vs digital to optimize media mix efficiency</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center mr-2">
                  <span className="text-purple-700 text-sm">3</span>
                </div>
                <span>Explore emerging channels like streaming platforms to capture evolving consumer attention</span>
              </li>
            </ul>
          </div>

          {/* Future Trends */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-5 border border-emerald-200">
            <h3 className="text-lg font-semibold text-emerald-800 mb-3">Future Trends & Opportunities</h3>
            <ul className="space-y-3 text-emerald-900">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-emerald-600 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Streaming platforms show potential for targeted financial service advertising</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-emerald-600 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Growing importance of integrated cross-channel campaigns</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-emerald-600 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>Digital video expected to see highest growth in next period</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Media Investment by Bank */}
      <MediaInvestmentByBank activeCategory={selectedMediaCategory} />
    </div>
  );
};

export default MediaDashboard;