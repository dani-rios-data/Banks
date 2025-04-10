import React, { useMemo } from 'react';
import Icons from '../common/Icons';
import { formatCurrency } from '../../utils/formatters';
import { bankColors } from '../../utils/colorSchemes';
import BankMediaMix from './BankMediaMix';
import BankMonthlyTrend from './BankMonthlyTrend';
import BankInsights from './BankInsights';
import { useDashboard } from '../../context/DashboardContext';

/**
 * Main component for the bank-specific dashboard
 * @param {Object} props - Component properties
 * @param {Object} props.bank - Bank data to display
 */
const BankDashboard = ({ bank }) => {
  const { 
    selectedMonths, 
    selectedYears, 
    dashboardData,
    filteredData 
  } = useDashboard();
  
  // Utilizar datos filtrados si están disponibles y hay filtros aplicados
  const bankData = useMemo(() => {
    if (!filteredData || (!selectedMonths.length && !selectedYears.length)) {
      // Si no hay filtros o no hay datos filtrados, usar los datos originales
      return bank;
    }
    
    // Si hay filtros aplicados, buscar el banco en los datos filtrados
    const filteredBank = filteredData.banks.find(b => b.name === bank.name);
    
    if (filteredBank) {
      console.log(`BankDashboard - Usando datos filtrados para ${bank.name}, inversión original: ${formatCurrency(bank.totalInvestment)}, inversión filtrada: ${formatCurrency(filteredBank.totalInvestment)}`);
      return filteredBank;
    }
    
    // Si no se encuentra el banco en los datos filtrados (posiblemente porque no tiene datos en ese período)
    console.log(`BankDashboard - No hay datos filtrados para ${bank.name} en el período seleccionado`);
    return {
      ...bank,
      totalInvestment: 0 // Establecer inversión en cero para el período filtrado
    };
  }, [bank, filteredData, selectedMonths, selectedYears]);

  // Si no hay datos para este banco en el período filtrado, mostrar mensaje
  if (selectedMonths.length > 0 || selectedYears.length > 0) {
    if (bankData.totalInvestment === 0) {
      return (
        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-md p-6 transition duration-300 hover:shadow-lg border border-gray-100">
            <div className="flex items-center pl-4 py-5 bg-blue-50/70 rounded-lg border-l-4 mb-6" style={{borderLeftColor: bankColors[bank.name]}}>
              <div className="w-12 h-12 bg-gray-100 rounded-full mr-4 flex items-center justify-center shadow-sm">
                <span className="text-2xl">🏦</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
                <div>
                  <h3 className="text-xl font-medium" style={{color: bankColors[bank.name]}}>
                    {bank.name} Media Investment
                  </h3>
                  <p className="text-gray-500 text-sm mt-0.5">
                    Sin datos para el período seleccionado
                  </p>
                </div>
                
                <div className="flex gap-2 mt-2 md:mt-0">
                  {selectedMonths.length > 0 && (
                    <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                      {selectedMonths.length} {selectedMonths.length === 1 ? 'Mes' : 'Meses'}
                    </span>
                  )}
                  {selectedYears.length > 0 && (
                    <span className="px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded-full border border-green-200">
                      {selectedYears.length} {selectedYears.length === 1 ? 'Año' : 'Años'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center p-12 text-gray-500">
              No hay datos disponibles para {bank.name} en el período seleccionado
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-md p-6 transition duration-300 hover:shadow-lg border border-gray-100">
        {/* Encabezado para el banco con información de filtros */}
        <div className="flex items-center pl-4 py-5 bg-blue-50/70 rounded-lg border-l-4 mb-6" style={{borderLeftColor: bankColors[bank.name]}}>
          <div 
            className="w-12 h-12 bg-gray-100 rounded-full mr-4 flex items-center justify-center shadow-sm"
          >
            <span className="text-2xl">🏦</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
            <div>
              <h3 className="text-xl font-medium" style={{color: bankColors[bank.name]}}>
                {bank.name} Media Investment
              </h3>
              <p className="text-gray-500 text-sm mt-0.5">
                Total Investment: {formatCurrency(bankData.totalInvestment)}
              </p>
            </div>
            
            {/* Indicadores de filtros */}
            {(selectedMonths.length > 0 || selectedYears.length > 0) && (
              <div className="flex gap-2 mt-2 md:mt-0">
                {selectedMonths.length > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                    {selectedMonths.length} {selectedMonths.length === 1 ? 'Mes' : 'Meses'}
                  </span>
                )}
                {selectedYears.length > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded-full border border-green-200">
                    {selectedYears.length} {selectedYears.length === 1 ? 'Año' : 'Años'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Media Mix & Monthly Trend */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          <BankMediaMix bank={bankData} />
          <BankMonthlyTrend bank={bankData} />
        </div>
        
        {/* Bank Insights */}
        <BankInsights bank={bankData} />
      </div>
    </div>
  );
};

export default BankDashboard;