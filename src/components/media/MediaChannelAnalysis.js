import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { mediaColors } from '../../utils/colorSchemes';
import MediaDetails from './MediaDetails';

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
  'Bank of America': '#22C55E',   // Verde
  'Wells Fargo': '#DC2626',       // Rojo
  'TD Bank': '#EAB308',           // Amarillo
  'Capital One Bank': '#6D28D9',  // Morado
  'PNC Bank': '#2563EB',          // Azul
  'Chase Bank': '#117ACA',        // Azul Chase
  'US Bank': '#0046AD',           // Azul US Bank
};

/**
 * Media channel analysis component that shows data filtered by selected months
 */
const MediaChannelAnalysis = () => {
  const { 
    selectedMediaCategory, 
    setSelectedMediaCategory, 
    setActiveMediaTab,
    selectedMonths
  } = useDashboard();

  const loading = false;
  const processedDataState = {
    mediaCategories: [],
    banks: []
  };

  if (loading || !processedDataState) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="h-96 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Cargando datos de análisis de medios...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6 transition duration-300 hover:shadow-lg border border-gray-100">
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
          
          {processedDataState.mediaCategories.map(category => (
            <button
              key={category.type}
              className={`px-4 py-2 mr-3 font-medium focus:outline-none rounded-lg transition duration-300 flex items-center transform hover:scale-105 hover:shadow-md`}
              onClick={() => {
                setActiveMediaTab(category.type);
                setSelectedMediaCategory(category.type);
              }}
              style={selectedMediaCategory === category.type ? {
                background: `linear-gradient(135deg, ${enhancedMediaColors[category.type] || mediaColors[category.type]}80, ${enhancedMediaColors[category.type] || mediaColors[category.type]})`,
                color: '#ffffff',
                fontWeight: 'bold',
                boxShadow: `0 2px 8px ${enhancedMediaColors[category.type] || mediaColors[category.type]}50`
              } : {
                color: '#4b5563',
                borderBottom: '3px solid transparent',
                transition: 'all 0.3s ease-in-out'
              }}
            >
              <span className="flex items-center justify-center mr-2">
                {category.type === 'Digital' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
                {category.type === 'Television' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
                {category.type === 'Audio' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.465a5 5 0 010-7.07m-2.829 9.9a9 9 0 010-12.729" />
                  </svg>
                )}
                {category.type === 'Print' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M19 20a2 2 0 002-2V8a2 2 0 00-2-2h-5v5a2 2 0 01-2 2H9a2 2 0 01-2-2V6h1m10 13h-5a2 2 0 01-2-2v-5h7a2 2 0 012 2v5z" />
                  </svg>
                )}
                {category.type === 'Outdoor' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                )}
                {category.type === 'Streaming' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
                {category.type === 'Cinema' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h18M3 16h18" />
                  </svg>
                )}
              </span>
              {category.type}
            </button>
          ))}
        </div>
        
        {/* Media Details */}
        <div>
          <MediaDetails 
            filteredData={processedDataState} 
            enhancedBankColors={enhancedBankColors}
          />
        </div>
      </div>
    </div>
  );
};

export default MediaChannelAnalysis;