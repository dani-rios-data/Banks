import React from 'react';
import { LineChart, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useDashboard } from '../../context/DashboardContext';
import { bankColors } from '../../utils/colorSchemes';
import CustomTooltip from '../common/CustomTooltip';
import { formatCurrency } from '../../utils/formatters';
import { getFilteredData } from '../../utils/dataProcessor';

// Función para formatear meses en formato "Jan 2024"
const formatMonthLabel = (month) => {
  const [year, monthNum] = month.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[parseInt(monthNum, 10) - 1]} ${year}`;
};

// Función para formatear valores en millones
const formatYAxis = (value) => {
  if (value >= 1000000) {
    return `${Math.round(value / 1000000)}M`;
  } else if (value >= 1000) {
    return `${Math.round(value / 1000)}K`;
  }
  return value;
};

/**
 * Component that displays the monthly trend for a specific bank
 * @param {Object} props - Component properties
 * @param {Object} props.bank - Bank data to display
 */
const BankMonthlyTrend = ({ bank }) => {
  const { dashboardData, selectedMonths } = useDashboard();
  
  // Filter data based on selected months
  const getMonthlyData = () => {
    if (!dashboardData) return [];

    const monthlyData = dashboardData.monthlyTrends
      .sort((a, b) => new Date(a.month) - new Date(b.month))
      .map(trend => {
        const bankShare = trend.bankShares.find(share => share.bank === bank.name);
        return {
          month: trend.month,
          formattedMonth: formatMonthLabel(trend.month),
          [bank.name]: bankShare ? Math.round(bankShare.investment) : 0,
          percentage: bankShare ? bankShare.share : 0,
          total: Math.round(trend.total)
        };
      });

    if (!selectedMonths.length) {
      return monthlyData;
    }

    return monthlyData
      .filter(data => selectedMonths.includes(data.month))
      .map(data => ({
        ...data,
        percentage: data.total > 0 ? (data[bank.name] / data.total) * 100 : 0
      }));
  };

  const monthlyData = getMonthlyData();
  const filteredData = getFilteredData(monthlyData, selectedMonths);
  
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
        <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: bankColors[bank.name]}}></span>
        Monthly Trend
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={filteredData}
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
            <Tooltip content={<CustomTooltip />} />
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