import React from 'react';
import { bankColors, bankSecondaryColors } from '../../utils/colorSchemes';

/**
 * Header component for the dashboard
 */
const Header = () => {
  return (
    <div className="w-full bg-white">
      <div className="w-full px-8 py-3 border-b border-gray-100">
        <div className="flex items-center">
          <div className="flex items-center space-x-6 min-w-[300px]">
            <div 
              className="p-2 rounded-lg flex items-center justify-center overflow-hidden"
              style={{ 
                backgroundColor: '#CD1309',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                width: '140px',
                height: '45px',
                position: 'relative'
              }}
            >
              <img 
                src="./assets/Wells-Fargo-Embleme.svg" 
                alt="Wells Fargo Logo" 
                className="h-10 w-auto object-contain"
                style={{ 
                  filter: 'brightness(0) saturate(100%) invert(73%) sepia(88%) saturate(1128%) hue-rotate(359deg) brightness(105%) contrast(106%)',
                  transform: 'scale(1.2)',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  display: 'block',
                  position: 'relative',
                  zIndex: 1
                }}
              />
            </div>
            <p className="text-xs text-gray-600 font-medium">
              January 2024 - February 2025
            </p>
          </div>
          <div className="flex-1 flex justify-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Banking Advertising Investment Analysis
            </h1>
          </div>
          <div className="min-w-[300px]"></div>
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