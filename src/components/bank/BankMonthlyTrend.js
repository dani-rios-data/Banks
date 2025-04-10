import React, { useMemo } from 'react';
import { LineChart, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useDashboard } from '../../context/DashboardContext';
import { bankColors } from '../../utils/colorSchemes';
import CustomTooltip from '../common/CustomTooltip';
import { formatCurrency } from '../../utils/formatters';

// Función para formatear meses en formato "Jan 2024"
const formatMonthLabel = (month) => {
  const [year, monthNum] = month.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[parseInt(monthNum, 10) - 1]} ${year}`;
};

// Función para formatear valores en el eje Y
const formatYAxis = (value) => {
  return formatCurrency(value).replace('$', '');
};

/**
 * Component that displays the monthly trend for a specific bank
 * @param {Object} props - Component properties
 * @param {Object} props.bank - Bank data to display
 */
const BankMonthlyTrend = ({ bank }) => {
  const { dashboardData, selectedMonths, selectedYears } = useDashboard();
  
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
  
  // Filter data based on selected months and years
  const monthlyData = useMemo(() => {
    // Utilizar siempre los datos originales, no los filtrados
    if (!dashboardData) return [];
    
    console.log(`BankMonthlyTrend - Calculando tendencia mensual para ${bank.name}`);
    console.log(`Filtros activos: ${selectedMonths.length} meses, ${selectedYears.length} años`);
    
    // Obtener todos los datos mensuales
    let trendData = [];
    
    if (dashboardData.monthlyTrends) {
      // Ordenar los datos por fecha
      trendData = dashboardData.monthlyTrends
        .sort((a, b) => new Date(a.month) - new Date(b.month))
        .map(trend => {
          const bankShare = trend.bankShares?.find(share => share.bank === bank.name);
          return {
            month: trend.month,
            rawMonth: trend.rawMonth, // Asegurarse de que tengamos acceso al mes en formato texto
            formattedMonth: formatMonthLabel(trend.month),
            [bank.name]: bankShare ? Math.round(bankShare.investment) : 0,
            formattedValue: formatCurrency(bankShare ? bankShare.investment : 0),
            percentage: bankShare ? bankShare.share : 0,
            total: Math.round(trend.total)
          };
        });
    }

    // Si no hay filtros, devolver todos los datos
    if (!selectedMonths.length && !selectedYears.length) {
      console.log(`BankMonthlyTrend - Sin filtros, mostrando ${trendData.length} meses`);
      return trendData;
    }

    // Aplicar filtros directamente
    const filteredTrendData = trendData.filter(data => {
      // Filtrar por mes si hay selección de meses
      if (selectedMonths.length) {
        // Comprobar si este mes coincide con alguno de los meses seleccionados
        const monthMatches = selectedMonths.some(selectedMonth => {
          const matches = matchMonth(data.rawMonth, selectedMonth) || matchMonth(data.month, selectedMonth);
          if (matches) {
            console.log(`BankMonthlyTrend - Mes coincidente encontrado: ${data.rawMonth} (${data.month})`);
            console.log(`BankMonthlyTrend - Datos para ${bank.name} en ${data.month}:`, {
              investment: data[bank.name],
              formattedValue: data.formattedValue,
              percentage: data.percentage ? data.percentage.toFixed(2) + '%' : 'N/A',
              total: data.total
            });
          }
          return matches;
        });
        if (!monthMatches) return false;
      }
      
      // Filtrar por año si hay selección de años
      if (selectedYears.length) {
        const yearFromMonth = data.month.split('-')[0];
        return selectedYears.includes(yearFromMonth);
      }
      
      return true;
    });
    
    console.log(`BankMonthlyTrend - Datos filtrados: ${filteredTrendData.length} meses`);
    
    // Recalcular porcentajes si los datos han sido filtrados
    if (filteredTrendData.length > 0) {
      return filteredTrendData.map(data => ({
        ...data,
        percentage: data.total > 0 ? (data[bank.name] / data.total) * 100 : 0
      }));
    }
    
    return filteredTrendData;
  }, [dashboardData, bank, selectedMonths, selectedYears]);
  
  if (monthlyData.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-medium text-gray-700 mb-4">Monthly Trend</h3>
        <div className="h-80 flex items-center justify-center">
          <div className="text-gray-400">No hay datos disponibles para el período seleccionado</div>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: bankColors[bank.name]}}></span>
          Monthly Trend
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
      
      {/* Chart */}
      <div className="w-full mt-2">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={monthlyData}
            margin={{ top: 5, right: 20, left: 10, bottom: 20 }}
          >
            <defs>
              <linearGradient id="bankLineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={bankColors[bank.name]} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={bankColors[bank.name]} stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="formattedMonth" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#f3f4f6' }}
              tickLine={false}
              dy={10}
            />
            <YAxis 
              tickFormatter={formatYAxis} 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#f3f4f6' }}
              tickLine={false}
            />
            <Tooltip 
              content={<CustomTooltip 
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(label) => `Mes: ${label}`}
              />} 
            />
            <Line 
              type="monotone" 
              dataKey={bank.name} 
              stroke={bankColors[bank.name]} 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: bankColors[bank.name], strokeWidth: 0 }}
            />
            <Area 
              type="monotone"
              dataKey={bank.name}
              fill="url(#bankLineGradient)"
              fillOpacity={0.3}
              stroke="none"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BankMonthlyTrend;