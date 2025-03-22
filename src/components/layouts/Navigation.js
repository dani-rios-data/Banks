import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import Icons from '../common/Icons';
import { bankColors } from '../../utils/colorSchemes';

/**
 * Main navigation component
 */
const Navigation = () => {
  const { dashboardData, loading, activeTab, setActiveTab } = useDashboard();

  // Bank icon SVG component
  const BankIcon = () => (
    <svg width="24" height="24" viewBox="0 0 512 512" fill="currentColor">
      <path d="M256 0l256 128v64H0v-64L256 0zM32 256h64v192H32V256zm128 0h64v192h-64V256zm128 0h64v192h-64V256zm128 0h64v192h-64V256zM0 512h512v-32H0v32z"/>
    </svg>
  );

  // If loading, show a loading skeleton
  if (loading) {
    return (
      <div className="bg-white rounded-xl overflow-hidden animate-pulse">
        <div className="flex overflow-x-auto h-12 bg-gray-200"></div>
      </div>
    );
  }

  // Style for tabs
  const getTabStyle = (tabName) => {
    const summaryColor = bankColors['Wells Fargo'];
    
    return activeTab === tabName ? {
      backgroundColor: '#f0f9ff',
      borderBottom: `3px solid ${tabName === 'summary' ? summaryColor : tabName === 'media' ? '#10b981' : bankColors[tabName] || '#3b82f6'}`,
      color: tabName === 'summary' ? summaryColor : tabName === 'media' ? '#10b981' : bankColors[tabName] || '#3b82f6',
      fontWeight: 'bold'
    } : {};
  };

  // Function to format bank name
  const formatBankName = (name) => {
    switch(name) {
      case 'PNC':
      case 'Pnc':
        return 'Pnc Bank';
      case 'TD':
      case 'Td':
        return 'Td Bank';
      case 'Capital One':
        return 'Capital One Bank';
      case 'Bank of America':
        return 'Bank Of America';
      case 'Wells Fargo':
        return 'Wells Fargo Bank';
      default:
        return name;
    }
  };

  return (
    <div className="w-full bg-white border-b">
      <div className="w-full">
        <div className="flex overflow-x-auto px-6">
          <button 
            className="px-8 py-3 text-gray-700 focus:outline-none transition duration-200 flex items-center gap-3 text-lg whitespace-nowrap"
            onClick={() => setActiveTab('summary')}
            style={getTabStyle('summary')}
          >
            {Icons.summary}
            <span>Executive Summary</span>
          </button>
          
          <button 
            className="px-8 py-3 text-gray-700 focus:outline-none transition duration-200 flex items-center gap-3 text-lg whitespace-nowrap"
            onClick={() => setActiveTab('media')}
            style={getTabStyle('media')}
          >
            {Icons.media}
            <span>Media Analysis</span>
          </button>
          
          {dashboardData.banks.map((bank) => (
            <button 
              key={bank.name}
              className="px-8 py-3 text-gray-700 focus:outline-none transition duration-200 flex items-center gap-3 text-lg whitespace-nowrap"
              onClick={() => setActiveTab(bank.name)}
              style={getTabStyle(bank.name)}
            >
              <BankIcon />
              <span>{formatBankName(bank.name)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Navigation;