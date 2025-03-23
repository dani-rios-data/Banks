import React from 'react';
import { bankColors, bankSecondaryColors } from '../../utils/colorSchemes';

/**
 * Header component for the dashboard
 */
const Header = () => {
  return (
    <div className="w-full bg-white">
      <div className="w-full px-4 sm:px-8 py-3 border-b border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4 sm:space-x-6">
            <div 
              className="flex items-center justify-center rounded-xl overflow-hidden flex-shrink-0" 
              style={{ 
                backgroundColor: '#CD1309',
                width: '90px',
                height: '40px',
                padding: '6px'
              }}
            >
              <img 
                src="/assets/Wells-Fargo-Embleme.svg" 
                alt="Wells Fargo Logo" 
                className="h-full w-auto"
                style={{ 
                  filter: 'brightness(0) saturate(100%) invert(93%) sepia(100%) saturate(1200%) hue-rotate(359deg) brightness(105%) contrast(95%)'
                }}
              />
            </div>
            <p className="text-xs text-gray-600 font-medium whitespace-nowrap">
              January 2024 - February 2025
            </p>
          </div>
          <div className="flex-1 flex justify-center min-w-0 px-4">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 truncate">
              Banking Advertising Investment Analysis
            </h1>
          </div>
          <div className="hidden lg:block w-[90px]"></div>
        </div>
      </div>
      <div 
        className="h-0.5 w-full"
        style={{
          background: `linear-gradient(90deg, 
            ${bankColors['Wells Fargo']}00 0%, 
            ${bankColors['Wells Fargo']}40 25%, 
            ${bankColors['Wells Fargo']}40 75%, 
            ${bankColors['Wells Fargo']}00 100%
          )`
        }}
      ></div>
    </div>
  );
};

export default Header;