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
        {/* Nuevo formato de encabezado para todos los bancos */}
        <div className="flex items-center pl-4 py-5 bg-blue-50/70 rounded-lg border-l-4 mb-6" style={{borderLeftColor: bankColors[bank.name]}}>
          <div 
            className="w-12 h-12 bg-gray-100 rounded-full mr-4 flex items-center justify-center shadow-sm"
          >
            <span className="text-2xl">🏦</span>
          </div>
          <div>
            <h3 className="text-xl font-medium" style={{color: bankColors[bank.name]}}>
              {bank.name} Media Investment
            </h3>
            <p className="text-gray-500 text-sm mt-0.5">
              Total Investment: {formatCurrency(bank.totalInvestment)}
            </p>
          </div>
        </div>
        
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