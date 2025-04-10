import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { useDashboard } from '../../context/DashboardContext';
import { mediaColors } from '../../utils/colorSchemes';
import CustomTooltip from '../common/CustomTooltip';
import { formatCurrency } from '../../utils/formatters';

// Colores exactos para los bancos según el diseño
const bankColorScheme = {
  'Capital One Bank': '#3B82F6',   // Azul
  'Bank of America': '#6B7280',    // Gris
  'Wells Fargo': '#EF4444',        // Rojo
  'Chase Bank': '#117ACA',         // Azul Chase
  'TD Bank': '#8B5CF6',            // Morado
  'PNC Bank': '#10B981',           // Verde
  'US Bank': '#0046AD'             // Azul US Bank
};

// Colores mejorados para categorías de medios
const enhancedMediaColors = {
  'Digital': '#3498db',           // Azul digital
  'Television': '#e74c3c',        // Rojo televisión
  'Audio': '#2ecc71',             // Verde audio
  'Print': '#f39c12',             // Naranja impresión
  'Outdoor': '#9b59b6',           // Púrpura exterior
  'Streaming': '#1abc9c',         // Verde azulado streaming
  'Cinema': '#d35400',            // Marrón rojizo cine
  'All': '#34495e',               // Gris azulado para todos
};

// Función para formatear valores en millones con un decimal
const formatValue = (value) => {
  // Usar la función importada de formatters.js para mantener consistencia
  return formatCurrency(value);
};

/**
 * Component that displays details for a specific media channel with filtered data
 */
const MediaDetails = ({ filteredData, enhancedBankColors }) => {
  const { 
    selectedMediaCategory,
    selectedMonths,
    loading
  } = useDashboard();

  // Usamos directamente los datos filtrados que nos llegan del componente padre
  const processedData = useMemo(() => {
    // Verificamos si los datos filtrados existen
    if (!filteredData) return null;
    console.log("MediaDetails usando datos filtrados del componente padre:", filteredData);
    return filteredData;
  }, [filteredData]);

  if (loading || !processedData) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading media details...</div>
      </div>
    );
  }

  // For "All" category, show an overview of media category distribution
  if (selectedMediaCategory === 'All') {
    // Prepare data for the overview chart using processed data
    const overviewData = Object.entries(
      processedData.banks.reduce((acc, bank) => {
        acc[bank.name] = bank.totalInvestment;
        return acc;
      }, {})
    )
      .map(([bank, value]) => ({
        name: bank,
        value: value,
        formattedValue: formatCurrency(value),
        // Usar enhancedBankColors si está disponible o fallback a bankColorScheme
        color: enhancedBankColors?.[bank] || bankColorScheme[bank]
      }))
      .sort((a, b) => b.value - a.value);

    // Calculate percentages for each bank
    const totalValue = overviewData.reduce((sum, item) => sum + item.value, 0);
    overviewData.forEach(item => {
      item.percentage = (item.value / totalValue * 100).toFixed(1);
    });

    return (
      <div className="h-full min-h-[25rem] mb-4">
        <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center justify-between">
          <div>Media Investment Distribution Overview</div>
          {selectedMonths.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full">
              Filtered by {selectedMonths.length} {selectedMonths.length === 1 ? 'month' : 'months'}
            </span>
          )}
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-[90%]">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={overviewData}
              layout="vertical"
              margin={{ top: 15, right: 30, left: 20, bottom: 15 }}
              barSize={28}
            >
              <defs>
                {overviewData.map((entry) => (
                  <linearGradient key={`gradient-${entry.name}`} id={`colorGradient-${entry.name}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor={entry.color} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={entry.color} stopOpacity={1}/>
                  </linearGradient>
                ))}
              </defs>
              <XAxis 
                type="number" 
                tickFormatter={formatValue}
                tick={{ fill: '#4b5563', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 500 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{fill: 'rgba(229, 231, 235, 0.2)'}}
              />
              <Bar 
                dataKey="value" 
                radius={[0, 6, 6, 0]}
                animationDuration={1500}
              >
                {overviewData.map((entry) => (
                  <Cell 
                    key={`cell-${entry.name}`}
                    fill={entry.color}
                    stroke={entry.color}
                    strokeWidth={0.5}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          
          <div className="flex flex-col h-full">
            <div className="grid grid-cols-2 gap-2">
              {overviewData.map(item => (
                <div 
                  key={item.name}
                  className="flex flex-col p-3 rounded-lg border transition-all duration-200 hover:shadow-md"
                  style={{ borderColor: item.color + '40', backgroundColor: item.color + '05' }}
                >
                  <div className="flex items-center mb-1">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: item.color }} 
                    />
                    <span className="font-medium text-gray-800">{item.name}</span>
                  </div>
                  <div className="text-lg font-semibold" style={{ color: item.color }}>
                    {formatValue(item.value)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {item.percentage}% of total
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Find the selected media category from processed data
  const mediaCategory = processedData.mediaCategories.find(cat => cat.name === selectedMediaCategory);
  if (!mediaCategory) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-gray-400">No data available for {selectedMediaCategory}</div>
      </div>
    );
  }

  // Prepare data for the chart
  const bankData = mediaCategory.bankShares
    .map(share => ({
      name: share.bank,
      investment: share.amount,
      percentage: share.percentage
    }))
    .sort((a, b) => b.investment - a.investment);

  // Calculate total investment
  const totalInvestment = bankData.reduce((sum, item) => sum + item.investment, 0);
  const formattedTotalInvestment = formatValue(totalInvestment);

  return (
    <div className="h-full min-h-[25rem] mb-4">
      <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center justify-between">
        <div className="flex items-center">
          <span 
            className="w-4 h-4 rounded-full mr-2" 
            style={{
              background: `linear-gradient(135deg, ${enhancedMediaColors[selectedMediaCategory] || mediaColors[selectedMediaCategory]}CC, ${enhancedMediaColors[selectedMediaCategory] || mediaColors[selectedMediaCategory]})`,
              boxShadow: `0 0 6px ${enhancedMediaColors[selectedMediaCategory] || mediaColors[selectedMediaCategory]}80`
            }}
          ></span>
          {selectedMediaCategory === 'All' ? 'Overall Media' : selectedMediaCategory} - Investment by Bank
        </div>
        {selectedMonths.length > 0 && (
          <span className="ml-2 px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full">
            Filtered by {selectedMonths.length} {selectedMonths.length === 1 ? 'month' : 'months'}
          </span>
        )}
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-[90%]">
        <div className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={bankData}
              margin={{ top: 15, right: 30, left: 20, bottom: 5 }}
              barSize={40}
            >
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatValue(value).replace('$', '')} />
              <Tooltip
                formatter={(value) => [formatValue(value), 'Investment']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem'
                }}
              />
              <Bar 
                dataKey="investment" 
                radius={[4, 4, 0, 0]}
              >
                {bankData.map((entry) => (
                  <Cell 
                    key={`cell-${entry.name}`}
                    fill={enhancedBankColors?.[entry.name] || bankColorScheme[entry.name]}
                  />
                ))}
                <LabelList 
                  dataKey="investment" 
                  position="top" 
                  formatter={(value) => formatValue(value).replace('$', '')}
                  style={{ fill: '#374151', fontSize: '12px', fontWeight: '500' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col">
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <span className="text-sm text-blue-700 font-medium">Total Investment</span>
            <div className="text-2xl font-bold text-gray-900">{formattedTotalInvestment}</div>
          </div>

          <h4 className="text-sm font-medium text-gray-700 mb-3">Investment Share by Bank</h4>
          <div className="space-y-2">
            {bankData.map((bank) => (
              <div key={bank.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: enhancedBankColors?.[bank.name] || bankColorScheme[bank.name] }}
                  ></div>
                  <span className="text-sm text-gray-600">{bank.name}</span>
                </div>
                <div className="flex space-x-4">
                  <span className="text-sm font-medium text-gray-900">
                    {formatValue(bank.investment)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {bank.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaDetails;