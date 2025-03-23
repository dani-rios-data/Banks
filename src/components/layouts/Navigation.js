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
    const isActive = activeTab === tabName;
    
    const baseStyle = {
      backgroundColor: isActive ? '#f8fafc' : 'transparent',
      color: isActive 
        ? (tabName === 'summary' ? summaryColor : tabName === 'media' ? '#10b981' : bankColors[tabName] || '#3b82f6')
        : '#64748b',
      borderBottom: isActive 
        ? `3px solid ${tabName === 'summary' ? summaryColor : tabName === 'media' ? '#10b981' : bankColors[tabName] || '#3b82f6'}`
        : '3px solid transparent',
      fontWeight: isActive ? '600' : '500',
      transition: 'all 0.2s ease-in-out'
    };

    return baseStyle;
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
    <div className="w-full bg-white border-b border-gray-200">
      <div className="w-full">
        <div className="flex overflow-x-auto px-6">
          <button 
            className="px-6 py-4 focus:outline-none transition-all duration-200 ease-in-out flex items-center gap-2 text-base whitespace-nowrap hover:bg-gray-50"
            onClick={() => setActiveTab('summary')}
            style={getTabStyle('summary')}
          >
            {Icons.summary}
            <span>Executive Summary</span>
          </button>
          
          <button 
            className="px-6 py-4 focus:outline-none transition-all duration-200 ease-in-out flex items-center gap-2 text-base whitespace-nowrap hover:bg-gray-50"
            onClick={() => setActiveTab('media')}
            style={getTabStyle('media')}
          >
            {Icons.media}
            <span>Media Analysis</span>
          </button>
          
          {dashboardData.banks.map((bank) => (
            <button 
              key={bank.name}
              className="px-6 py-4 focus:outline-none transition-all duration-200 ease-in-out flex items-center gap-2 text-base whitespace-nowrap hover:bg-gray-50"
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