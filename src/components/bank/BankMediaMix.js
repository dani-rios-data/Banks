import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useDashboard } from '../../context/DashboardContext';
import { mediaColors } from '../../utils/colorSchemes';
import CustomTooltip from '../common/CustomTooltip';
import { formatCurrency } from '../../utils/formatters';

/**
 * Component that displays the media mix for a specific bank
 * @param {Object} props - Component properties
 * @param {Object} props.bank - Bank data to display
 */
const BankMediaMix = ({ bank }) => {
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

  // Prepare data for the chart
  const mediaData = useMemo(() => {
    // Utilizar siempre los datos originales, no los filtrados
    if (!dashboardData) return [];
    
    console.log(`BankMediaMix - Calculando media mix para ${bank.name}`);
    console.log(`Filtros activos: ${selectedMonths.length} meses, ${selectedYears.length} años`);
    
    // Incluso sin filtros, calculamos directamente de los datos crudos para consistencia
    if (dashboardData.rawData) {
      // Filtrar solo por banco si no hay filtros de mes/año
      const relevantRawData = dashboardData.rawData.filter(row => row.Bank === bank.name);
      
      if (!selectedMonths.length && !selectedYears.length) {
        console.log(`BankMediaMix - Calculando media mix desde CSV para ${bank.name} sin filtros`);
      } else {
        console.log(`BankMediaMix - Calculando media mix desde CSV para ${bank.name} con filtros aplicados`);
      }
      
      // Calcular categorías y montos
      const mediaCategoryTotals = {};
      let bankTotal = 0;
      
      // Filtrar por mes/año si hay filtros
      const filteredRawData = relevantRawData.filter(row => {
        // Filtrar por mes si hay selección
        if (selectedMonths.length) {
          const monthMatches = selectedMonths.some(selectedMonth => 
            matchMonth(row.Month, selectedMonth));
          if (!monthMatches) return false;
        }
        
        // Filtrar por año si hay selección
        if (selectedYears.length) {
          if (!selectedYears.includes(row.Year)) return false;
        }
        
        return true;
      });
      
      // Procesar los datos filtrados
      filteredRawData.forEach(row => {
        const category = row['Media Category'];
        const amount = parseFloat(row.dollars || '0');
        
        if (category && !isNaN(amount)) {
          if (!mediaCategoryTotals[category]) {
            mediaCategoryTotals[category] = 0;
          }
          mediaCategoryTotals[category] += amount;
          bankTotal += amount;
        }
      });
      
      console.log(`BankMediaMix - Datos procesados del CSV: ${filteredRawData.length} registros, total: ${formatCurrency(bankTotal)}`);
      console.log(`BankMediaMix - Categorías encontradas:`, Object.keys(mediaCategoryTotals));
      
      // Crear resultado con porcentajes calculados
      const result = Object.entries(mediaCategoryTotals)
        .map(([category, value]) => {
          const percentage = bankTotal > 0 ? (value / bankTotal) * 100 : 0;
          return {
            name: category,
            value,
            percentage,
            formattedValue: formatCurrency(value)
          };
        })
        .filter(entry => entry.value > 0)
        .sort((a, b) => b.value - a.value);
      
      console.log(`BankMediaMix - Media mix calculado desde CSV: ${result.length} categorías`);
      return result;
    }
    
    // Si no hay datos crudos, retornar array vacío
    console.error("BankMediaMix - No hay datos crudos disponibles, no se puede calcular media mix");
    return [];
  }, [dashboardData, bank, selectedMonths, selectedYears]);
  
  // Función personalizada para renderizar la leyenda con porcentajes
  const renderCustomLegend = (props) => {
    const { payload } = props;
    
    return (
      <ul className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry, index) => {
          const dataItem = mediaData.find(item => item.name === entry.value);
          return (
            <li key={`item-${index}`} className="flex items-center">
              <span
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600">
                {entry.value} ({dataItem?.percentage.toFixed(1)}%) - {dataItem?.formattedValue}
              </span>
            </li>
          );
        })}
      </ul>
    );
  };

  if (mediaData.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-medium text-gray-700 mb-4">Media Mix</h3>
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
          <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: mediaColors[mediaData[0]?.name]}}></span>
          Media Mix
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
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={mediaData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              cornerRadius={4}
              stroke="#fff"
              strokeWidth={2}
            >
              {mediaData.map((entry) => (
                <Cell 
                  key={`cell-${entry.name}`}
                  fill={mediaColors[entry.name]}
                />
              ))}
            </Pie>
            <Tooltip 
              content={<CustomTooltip 
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(name) => name}
              />} 
            />
            <Legend 
              content={renderCustomLegend}
              iconType="circle"
              iconSize={8}
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BankMediaMix;