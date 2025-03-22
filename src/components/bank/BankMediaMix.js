import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useDashboard } from '../../context/DashboardContext';
import { mediaColors } from '../../utils/colorSchemes';
import CustomTooltip from '../common/CustomTooltip';

/**
 * Component that displays the media mix for a specific bank
 * @param {Object} props - Component properties
 * @param {Object} props.bank - Bank data to display
 */
const BankMediaMix = ({ bank }) => {
  const { dashboardData, selectedMonths } = useDashboard();

  // Prepare data for the chart
  const getMediaData = () => {
    if (!dashboardData) return [];
    
    if (!selectedMonths.length) {
      // Usar directamente los datos de mediaBreakdown que ya están procesados correctamente
      return bank.mediaBreakdown
        .map(media => ({
          name: media.category,
          value: media.amount,
          percentage: media.percentage
        }))
        .filter(entry => entry.value > 0)
        .sort((a, b) => b.value - a.value);
    }

    // Calcular totales por categoría de media para los meses seleccionados
    const filteredMonths = dashboardData.monthlyTrends
      .filter(trend => selectedMonths.includes(trend.month));

    const bankTotal = filteredMonths.reduce((sum, month) => {
      const bankShare = month.bankShares.find(share => share.bank === bank.name);
      return sum + (bankShare ? bankShare.investment : 0);
    }, 0);

    // Usar los porcentajes del mediaBreakdown para calcular los montos
    return bank.mediaBreakdown
      .map(media => ({
        name: media.category,
        value: Math.round((bankTotal * media.percentage) / 100),
        percentage: media.percentage
      }))
      .filter(entry => entry.value > 0)
      .sort((a, b) => b.value - a.value);
  };

  const mediaData = getMediaData();
  
  // Función personalizada para renderizar la leyenda con porcentajes
  const renderCustomLegend = (props) => {
    const { payload } = props;
    
    return (
      <ul className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry, index) => (
          <li key={`item-${index}`} className="flex items-center">
            <span
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600">
              {entry.value} ({mediaData.find(item => item.name === entry.value)?.percentage.toFixed(1)}%)
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
        <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: mediaColors[mediaData[0]?.name]}}></span>
        Media Mix
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
            <Tooltip content={<CustomTooltip />} />
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