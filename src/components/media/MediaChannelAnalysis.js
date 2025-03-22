import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useDashboard } from '../../context/DashboardContext';
import { mediaColors, bankColors } from '../../utils/colorSchemes';
import CustomTooltip from '../common/CustomTooltip';
import Icons from '../common/Icons';
import MediaDetails from './MediaDetails';
import MediaInsights from './MediaInsights';

// Colores mejorados para categorías de medios
const enhancedMediaColors = {
  'Digital': '#3498db',           // Azul digital
  'Television': '#e74c3c',        // Rojo televisión
  'Audio': '#2ecc71',             // Verde audio
  'Print': '#f39c12',             // Naranja impresión
  'Outdoor': '#9b59b6',           // Púrpura exterior
  'Streaming': '#1abc9c',         // Verde azulado streaming
  'Cinema': '#d35400',            // Marrón rojizo cine
  'All': '#34495e',               // Gris azulado para todos
};

// Colores mejorados para los bancos
const enhancedBankColors = {
  'Capital One': '#6D28D9',  // Morado
  'Bank Of America': '#22C55E',  // Verde
  'Wells Fargo Bank': '#DC2626',  // Rojo
  'Pnc Bank': '#2563EB',  // Azul
  'Td Bank': '#EAB308'  // Amarillo
};

/**
 * Media channel analysis component that shows data filtered by selected months
 */
const MediaChannelAnalysis = () => {
  const { 
    selectedMediaCategory, 
    setSelectedMediaCategory, 
    setActiveMediaTab,
    selectedMonths,
    dashboardData,
    loading
  } = useDashboard();

  if (loading || !dashboardData) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="h-96 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading media analysis data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-24 transition duration-300 hover:shadow-lg border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Media Channel Analysis</h2>
          <p className="text-gray-600 mt-1">
            Detailed investment distribution across different media channels
            {selectedMonths.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full">
                Filtered by {selectedMonths.length} {selectedMonths.length === 1 ? 'month' : 'months'}
              </span>
            )}
          </p>
        </div>
      </div>
      
      {/* Media Tabs - Act as main filter */}
      <div className="flex flex-wrap border-b mb-6 pb-1">
        <button
          className={`px-4 py-2 mr-3 font-medium focus:outline-none rounded-lg transition duration-300 flex items-center transform hover:scale-105 hover:shadow-md`}
          onClick={() => {
            setSelectedMediaCategory('All');
          }}
          style={selectedMediaCategory === 'All' ? {
            background: 'linear-gradient(135deg, #3b82f680, #3b82f6)',
            color: '#ffffff',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
          } : {
            color: '#4b5563', 
            borderBottom: '3px solid transparent'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          All Media
        </button>
        
        {Object.keys(mediaColors).filter(k => k !== 'Unknown' && k !== 'All').map(category => (
          <button
            key={category}
            className={`px-4 py-2 mr-3 font-medium focus:outline-none rounded-lg transition duration-300 flex items-center transform hover:scale-105 hover:shadow-md`}
            onClick={() => {
              setActiveMediaTab(category);
              setSelectedMediaCategory(category);
            }}
            style={selectedMediaCategory === category ? {
              background: `linear-gradient(135deg, ${enhancedMediaColors[category] || mediaColors[category]}80, ${enhancedMediaColors[category] || mediaColors[category]})`,
              color: '#ffffff',
              fontWeight: 'bold',
              boxShadow: `0 2px 8px ${enhancedMediaColors[category] || mediaColors[category]}50`
            } : {
              color: '#4b5563',
              borderBottom: '3px solid transparent',
              transition: 'all 0.3s ease-in-out'
            }}
            onMouseOver={(e) => {
              if (selectedMediaCategory !== category) {
                e.currentTarget.style.background = `linear-gradient(135deg, ${enhancedMediaColors[category] || mediaColors[category]}15, ${enhancedMediaColors[category] || mediaColors[category]}30)`;
                e.currentTarget.style.color = enhancedMediaColors[category] || mediaColors[category];
              }
            }}
            onMouseOut={(e) => {
              if (selectedMediaCategory !== category) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#4b5563';
              }
            }}
          >
            <span className="flex items-center justify-center mr-2 h-5 w-5">
              {category === 'Digital' && Icons.digital}
              {category === 'Television' && Icons.television}
              {category === 'Audio' && Icons.audio}
              {category === 'Print' && Icons.print}
              {category === 'Outdoor' && Icons.outdoor}
            </span>
            {category}
          </button>
        ))}
      </div>
      
      {/* Media Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6 min-h-[38rem]">
        <MediaDetails 
          filteredData={dashboardData} 
          enhancedBankColors={enhancedBankColors}
        />
        <MediaInsights />
      </div>
      <div className="h-4"></div>
    </div>
  );
};

export default MediaChannelAnalysis;