import React from 'react';
import Icons from '../common/Icons';
import { formatCurrency } from '../../utils/formatters';
import { bankColors } from '../../utils/colorSchemes';
import BankMediaMix from './BankMediaMix';
import BankMonthlyTrend from './BankMonthlyTrend';
import BankInsights from './BankInsights';

/**
 * Main component for the bank-specific dashboard
 * @param {Object} props - Component properties
 * @param {Object} props.bank - Bank data to display
 */
const BankDashboard = ({ bank }) => {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-md p-6 transition duration-300 hover:shadow-lg border border-gray-100">
        <div className="flex items-center mb-4">
          <div 
            className="w-12 h-12 rounded-full mr-3 flex items-center justify-center text-white shadow-md" 
            style={{backgroundColor: bankColors[bank.name]}}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold" style={{color: bankColors[bank.name]}}>Analysis of {bank.name}</h2>
        </div>
        <p className="text-lg text-gray-600 mb-6 pb-2 border-b border-gray-100">
          Total investment: {formatCurrency(bank.totalInvestment)}
        </p>
        
        {/* Media Mix & Monthly Trend */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          <BankMediaMix bank={bank} />
          <BankMonthlyTrend bank={bank} />
        </div>
        
        {/* Bank Insights */}
        <BankInsights bank={bank} />
      </div>
    </div>
  );
};

export default BankDashboard;