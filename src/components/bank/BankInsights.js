import React, { useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { bankColors, mediaColors } from '../../utils/colorSchemes';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

const InsightSection = ({ title, icon, children }) => (
  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
    <div className="flex items-center mb-4">
      <div className="p-2 rounded-full bg-gray-50 mr-3">
        <span className="text-xl">{icon}</span>
      </div>
      <h4 className="text-lg font-medium text-gray-800">{title}</h4>
    </div>
    <ul className="list-none space-y-3 text-gray-600">
      {children}
    </ul>
  </div>
);

const BulletPoint = ({ children }) => (
  <li className="flex items-start">
    <div className="min-w-[8px] h-2 w-2 rounded-full bg-blue-500 mt-2 mr-3"></div>
    <span className="flex-1">{children}</span>
  </li>
);

/**
 * Component that displays insights for a specific bank
 * @param {Object} props - Component properties
 * @param {Object} props.bank - Bank data to display
 */
const BankInsights = ({ bank }) => {
  const { 
    dashboardData, 
    selectedMonths, 
    selectedYears 
  } = useDashboard();

  // Función auxiliar para comparar meses en diferentes formatos
  const matchMonth = (dataMonth, selectedMonth) => {
    // Comparación directa
    if (dataMonth === selectedMonth) return true;
    
    try {
      // Intentar extraer mes y año de ambos formatos
      let dataMonthName, dataYear, selectedMonthName, selectedYear;

      // Formato "Month Year" (e.g., "January 2023")
      if (dataMonth.includes(' ')) {
        const parts = dataMonth.split(' ');
        dataMonthName = parts[0].toLowerCase();
        dataYear = parts[1];
      }

      if (selectedMonth.includes(' ')) {
        const parts = selectedMonth.split(' ');
        selectedMonthName = parts[0].toLowerCase();
        selectedYear = parts[1];
      }

      // Formato "YYYY-MM" (e.g., "2023-01")
      if (selectedMonth.includes('-')) {
        const parts = selectedMonth.split('-');
        selectedYear = parts[0];
        // Convertir número de mes a nombre
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                           'july', 'august', 'september', 'october', 'november', 'december'];
        const monthNum = parseInt(parts[1], 10);
        if (monthNum >= 1 && monthNum <= 12) {
          selectedMonthName = monthNames[monthNum - 1];
        }
      }

      if (dataMonth.includes('-')) {
        const parts = dataMonth.split('-');
        dataYear = parts[0];
        // Convertir número de mes a nombre
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                           'july', 'august', 'september', 'october', 'november', 'december'];
        const monthNum = parseInt(parts[1], 10);
        if (monthNum >= 1 && monthNum <= 12) {
          dataMonthName = monthNames[monthNum - 1];
        }
      }

      // Si tenemos ambos componentes para ambos formatos, comparar
      if (dataMonthName && dataYear && selectedMonthName && selectedYear) {
        return dataMonthName === selectedMonthName && dataYear === selectedYear;
      }
    } catch (error) {
      console.error("Error al comparar formatos de meses:", error);
    }
    
    return false;
  };

  // Calcular las principales categorías de inversión y mes de mayor inversión
  const {
    topMediaCategory,
    secondMediaCategory,
    peakMonth,
    yearOverYearGrowth,
    marketPosition
  } = useMemo(() => {
    // Ordenar las categorías de medios por inversión
    const sortedMedia = [...bank.mediaBreakdown].sort((a, b) => b.amount - a.amount);
    
    // Utilizar siempre los datos originales, no los filtrados
    if (!dashboardData) {
      return {
        topMediaCategory: sortedMedia[0],
        secondMediaCategory: sortedMedia[1],
        peakMonth: null,
        yearOverYearGrowth: null,
        marketPosition: null
      };
    }

    console.log(`BankInsights - Calculando insights para ${bank.name}`);
    
    // Obtener datos mensuales filtrados directamente
    let monthlyData = [];
    if (dashboardData.monthlyTrends) {
      monthlyData = dashboardData.monthlyTrends
        .filter(trend => {
          // No filtrar si no hay filtros aplicados
          if (!selectedMonths.length && !selectedYears.length) return true;
          
          // Filtrar por mes si hay selección de meses
          if (selectedMonths.length) {
            // Comprobar si este mes coincide con alguno de los meses seleccionados
            const monthMatches = selectedMonths.some(selectedMonth => {
              const matches = matchMonth(trend.rawMonth, selectedMonth) || matchMonth(trend.month, selectedMonth);
              if (matches) {
                console.log(`BankInsights - Mes coincidente encontrado: ${trend.rawMonth} (${trend.month})`);
                const bankData = trend.bankShares.find(share => share.bank === bank.name);
                if (bankData) {
                  console.log(`BankInsights - Datos para ${bank.name} en ${trend.rawMonth}:`, {
                    investment: bankData.investment,
                    formattedInvestment: formatCurrency(bankData.investment),
                    share: bankData.share ? bankData.share.toFixed(2) + '%' : 'N/A'
                  });
                } else {
                  console.log(`BankInsights - No hay datos específicos para ${bank.name} en ${trend.rawMonth}`);
                  // Mostrar todos los bancos disponibles en este mes para verificar
                  console.log(`BankInsights - Bancos disponibles en ${trend.rawMonth}:`, 
                    trend.bankShares.map(share => share.bank).join(', '));
                }
              }
              return matches;
            });
            if (!monthMatches) return false;
          }
          
          // Filtrar por año si hay selección de años
          if (selectedYears.length) {
            const yearFromMonth = trend.month.split('-')[0];
            return selectedYears.includes(yearFromMonth);
          }
          
          return true;
        })
        .map(trend => {
          const bankShare = trend.bankShares.find(share => share.bank === bank.name);
          return {
            month: trend.month,
            rawMonth: trend.rawMonth,
            investment: bankShare ? bankShare.investment : 0,
            percentage: bankShare ? bankShare.share : 0,
            total: trend.total
          };
        });
    }
    
    // Encontrar el mes con mayor inversión
    let peak = null;
    if (monthlyData.length > 0) {
      peak = monthlyData.reduce((max, month) => 
        month.investment > max.investment ? month : max, 
        monthlyData[0]
      );
    }
    
    // Calcular posición en el mercado
    let position = null;
    if (dashboardData.banks) {
      // Ordenar bancos por inversión total
      const sortedBanks = [...dashboardData.banks].sort((a, b) => b.totalInvestment - a.totalInvestment);
      const bankIndex = sortedBanks.findIndex(b => b.name === bank.name);
      
      if (bankIndex >= 0) {
        position = {
          rank: bankIndex + 1,
          totalBanks: sortedBanks.length,
          marketShare: bank.marketShare
        };
      }
    }
    
    // Calcular crecimiento interanual (si hay datos disponibles)
    let yoy = null;
    // Esta implementación requeriría comparación de años, que no implementamos aquí por simplicidad

    return {
      topMediaCategory: sortedMedia[0],
      secondMediaCategory: sortedMedia[1],
      peakMonth: peak,
      yearOverYearGrowth: yoy,
      marketPosition: position
    };
  }, [bank, dashboardData, selectedMonths, selectedYears]);

  if (!topMediaCategory) {
    return (
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Bank Insights</h3>
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-400">No hay suficientes datos para generar insights</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: bankColors[bank.name]}}></span>
          {bank.name} Insights
        </div>
        {(selectedMonths.length > 0 || selectedYears.length > 0) && (
          <div className="flex gap-2">
            {selectedMonths.length > 0 && (
              <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full">
                {selectedMonths.length} {selectedMonths.length === 1 ? 'Mes' : 'Meses'}
              </span>
            )}
            {selectedYears.length > 0 && (
              <span className="px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded-full">
                {selectedYears.length} {selectedYears.length === 1 ? 'Año' : 'Años'}
              </span>
            )}
          </div>
        )}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Insight: Principal categoría de inversión */}
        <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
          <div className="flex items-center mb-2">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
              style={{backgroundColor: mediaColors[topMediaCategory.category] + '30'}}
            >
              <div 
                className="w-4 h-4 rounded-full"
                style={{backgroundColor: mediaColors[topMediaCategory.category]}}
              ></div>
            </div>
            <h4 className="text-sm font-medium text-gray-800">Categoría Principal</h4>
          </div>
          <p className="text-gray-600 text-sm">
            <span className="font-medium" style={{color: mediaColors[topMediaCategory.category]}}>
              {topMediaCategory.category}
            </span>{' '}
            representa{' '}
            <span className="font-medium">
              {formatPercentage(topMediaCategory.percentage)}
            </span>{' '}
            ({formatCurrency(topMediaCategory.amount)}) del presupuesto de medios.
          </p>
        </div>
        
        {/* Insight: Segunda categoría de inversión */}
        {secondMediaCategory && (
          <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-100">
            <div className="flex items-center mb-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                style={{backgroundColor: mediaColors[secondMediaCategory.category] + '30'}}
              >
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{backgroundColor: mediaColors[secondMediaCategory.category]}}
                ></div>
              </div>
              <h4 className="text-sm font-medium text-gray-800">Segunda Categoría</h4>
            </div>
            <p className="text-gray-600 text-sm">
              <span className="font-medium" style={{color: mediaColors[secondMediaCategory.category]}}>
                {secondMediaCategory.category}
              </span>{' '}
              representa{' '}
              <span className="font-medium">
                {formatPercentage(secondMediaCategory.percentage)}
              </span>{' '}
              ({formatCurrency(secondMediaCategory.amount)}) del presupuesto de medios.
            </p>
          </div>
        )}
        
        {/* Insight: Mes pico */}
        {peakMonth && (
          <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-100">
            <div className="flex items-center mb-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                style={{backgroundColor: bankColors[bank.name] + '30'}}
              >
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{backgroundColor: bankColors[bank.name]}}
                ></div>
              </div>
              <h4 className="text-sm font-medium text-gray-800">Mes de Mayor Inversión</h4>
            </div>
            <p className="text-gray-600 text-sm">
              La mayor inversión se realizó en{' '}
              <span className="font-medium">
                {peakMonth.month.replace('-', ' ')}
              </span>{' '}
              con{' '}
              <span className="font-medium" style={{color: bankColors[bank.name]}}>
                {formatCurrency(peakMonth.investment)}
              </span>{' '}
              ({formatPercentage(peakMonth.percentage)} del mercado ese mes).
            </p>
          </div>
        )}
        
        {/* Insight: Posición en el mercado */}
        {marketPosition && (
          <div className="p-4 bg-green-50/50 rounded-lg border border-green-100">
            <div className="flex items-center mb-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                style={{backgroundColor: bankColors[bank.name] + '30'}}
              >
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{backgroundColor: bankColors[bank.name]}}
                ></div>
              </div>
              <h4 className="text-sm font-medium text-gray-800">Posición en el Mercado</h4>
            </div>
            <p className="text-gray-600 text-sm">
              <span className="font-medium" style={{color: bankColors[bank.name]}}>
                {bank.name}
              </span>{' '}
              ocupa la posición{' '}
              <span className="font-medium">
                #{marketPosition.rank} de {marketPosition.totalBanks}
              </span>{' '}
              con una cuota de mercado del{' '}
              <span className="font-medium">
                {formatPercentage(marketPosition.marketShare)}
              </span>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BankInsights;