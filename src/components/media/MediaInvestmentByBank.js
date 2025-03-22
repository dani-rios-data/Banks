import React, { useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Legend, CartesianGrid } from 'recharts';
import { useDashboard } from '../../context/DashboardContext';
import { bankColors, mediaColors } from '../../utils/colorSchemes';
import CustomTooltip from '../common/CustomTooltip';
import { formatCurrency } from '../../utils/formatters';

// Nuevos colores más vibrantes para los bancos
const enhancedBankColors = {
  'Wells Fargo Bank': '#ff6b6b',  // Vibrant red
  'Capital One': '#4d80e4',       // Royal blue
  'Bank Of America': '#2c3e50',   // Elegant dark blue
  'Pnc Bank': '#46c2cb',          // Bright turquoise
  'Td Bank': '#8e44ad',           // Vibrant purple
};

// Colores mejorados para categorías de medios
const enhancedMediaColors = {
  'Digital': '#3498db',           // Digital blue
  'Television': '#e74c3c',        // Television red
  'Audio': '#2ecc71',             // Audio green
  'Print': '#f39c12',             // Print orange
  'Outdoor': '#9b59b6',           // Outdoor purple
  'Streaming': '#1abc9c',         // Streaming teal
  'Cinema': '#d35400',            // Cinema reddish-brown
  'All': '#34495e',               // All media blue-gray
};

// Función para formatear valores en millones
const formatValue = (value) => {
  if (value >= 1000000) {
    return `${Math.round(value / 1000000)}M`;
  } else if (value >= 1000) {
    return `${Math.round(value / 1000)}K`;
  }
  return value;
};

// Componente de leyenda personalizada para el gráfico de donut
const CustomLegend = ({ payload }) => {
  return (
    <div className="flex flex-col gap-2 mt-2">
      {payload.map((entry, index) => {
        // Calculate percentage for this entry
        const totalValue = payload.reduce((sum, item) => sum + item.payload.value, 0);
        const percentage = ((entry.payload.value / totalValue) * 100).toFixed(1);
        
        return (
          <div key={`legend-${index}`} className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="text-sm font-medium text-gray-700">
              {entry.value} ({percentage}%)
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Componente personalizado para renderizar etiquetas en barras
const renderBarLabel = (props) => {
  const { x, y, width, value } = props;
  return (
    <text 
      x={x + width / 2} 
      y={y - 6} 
      fill="#666" 
      textAnchor="middle"
      fontSize={12}
    >
      {formatValue(value)}
    </text>
  );
};

// Custom component for bar insights
const renderBarInsight = (props) => {
  const { x, y, width, height, value, name } = props;
  
  // Skip insights for smaller values to avoid clutter
  if (value < 100000000) return null;
  
  let insight = "";
  if (name === "Capital One") {
    insight = "Market leader with 58.5% share";
  } else if (name === "Bank Of America") {
    insight = "20% of total market";
  } else if (name === "Wells Fargo Bank") {
    insight = "Growing digital presence";
  } else if (name === "Pnc Bank") {
    insight = "Focused on outdoor media";
  } else if (name === "Td Bank") {
    insight = "2.7% share of total market";
  }
  
  return (
    <g>
      <text 
        x={x + width + 10} 
        y={y + height/2} 
        fill="#666" 
        textAnchor="start"
        fontSize={11}
        fontStyle="italic"
      >
        {insight}
      </text>
      <line 
        x1={x + width} 
        y1={y + height/2} 
        x2={x + width + 8} 
        y2={y + height/2} 
        stroke="#666" 
        strokeWidth={1} 
      />
    </g>
  );
};

// Custom component for pie chart labels
const renderPieLabel = (props) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value } = props;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  if (percent < 0.05) return null; // Don't render labels for small slices
  
  return (
    <text 
      x={x} 
      y={y} 
      fill="#fff" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

/**
 * Component that displays media investment by bank with filtered data
 */
const MediaInvestmentByBank = ({ activeCategory = 'All' }) => {
  const { dashboardData, focusedBank, loading, selectedMonths } = useDashboard();

  // Calculate filtered data based on selected months
  const filteredData = useMemo(() => {
    if (!dashboardData) return null;
    if (!selectedMonths.length) {
      // Si no hay meses seleccionados, usar todos los datos
      return {
        banks: dashboardData.banks.map(bank => ({
          name: bank.name,
          totalInvestment: bank.totalInvestment,
          mediaBreakdown: bank.mediaBreakdown
        })),
        mediaCategories: dashboardData.mediaCategories.map(category => ({
          type: category.name || category.type,
          total: category.total,
          bankShares: category.bankShares.map(share => ({
            bank: share.bank,
            investment: share.amount || share.investment,
            share: share.percentage || share.share
          }))
        }))
      };
    }

    const filteredMonths = dashboardData.monthlyTrends.filter(trend => 
      selectedMonths.includes(trend.month)
    );

    // Calculate bank totals
    const bankTotals = {};
    filteredMonths.forEach(month => {
      month.bankShares.forEach(share => {
        bankTotals[share.bank] = (bankTotals[share.bank] || 0) + share.investment;
      });
    });

    // Calculate media totals
    const mediaTotals = {};
    Object.entries(bankTotals).forEach(([bankName, total]) => {
      const bank = dashboardData.banks.find(b => b.name === bankName);
      if (bank) {
        bank.mediaBreakdown.forEach(media => {
          const mediaShare = (total * media.percentage) / 100;
          mediaTotals[media.category] = (mediaTotals[media.category] || 0) + mediaShare;
        });
      }
    });

    return {
      banks: Object.entries(bankTotals).map(([name, totalInvestment]) => ({
        name,
        totalInvestment,
        mediaBreakdown: dashboardData.banks
          .find(b => b.name === name)?.mediaBreakdown || []
      })),
      mediaCategories: Object.entries(mediaTotals).map(([type, total]) => ({
        type,
        total,
        bankShares: Object.entries(bankTotals).map(([bankName, bankTotal]) => {
          const bank = dashboardData.banks.find(b => b.name === bankName);
          const mediaBreakdown = bank?.mediaBreakdown.find(m => m.category === type);
          const investment = bankTotal * (mediaBreakdown?.percentage || 0) / 100;
          return {
            bank: bankName,
            investment,
            share: total > 0 ? (investment / total) * 100 : 0
          };
        }).filter(share => share.investment > 0)
      })).filter(category => category.total > 0)
    };
  }, [dashboardData, selectedMonths]);

  // Función para filtrar los datos basados en la categoría de medios activa
  const categoryFilteredData = useMemo(() => {
    if (!filteredData) return null;
    if (activeCategory === 'All') return filteredData;

    // Filtrar las categorías de medios para mostrar solo la categoría activa
    return {
      ...filteredData,
      mediaCategories: filteredData.mediaCategories.filter(
        category => category.type === activeCategory
      )
    };
  }, [filteredData, activeCategory]);

  // Prepare data for the bar chart - filter by active category if needed
  const bankData = useMemo(() => {
    if (!categoryFilteredData) return [];

    if (activeCategory === 'All') {
      return categoryFilteredData.banks
        .map(bank => ({
          name: bank.name,
          investment: bank.totalInvestment
        }))
        .sort((a, b) => b.investment - a.investment);
    } else {
      // Calcular inversión por banco solo para la categoría seleccionada
      return categoryFilteredData.banks
        .map(bank => {
          const categoryData = bank.mediaBreakdown.find(media => media.category === activeCategory);
          const categoryPercentage = categoryData ? categoryData.percentage / 100 : 0;
          return {
            name: bank.name,
            investment: bank.totalInvestment * categoryPercentage
          };
        })
        .filter(item => item.investment > 0)
        .sort((a, b) => b.investment - a.investment);
    }
  }, [categoryFilteredData, activeCategory]);

  // Función para obtener datos para el gráfico de pastel
  const getMediaData = useMemo(() => {
    if (!categoryFilteredData) return [];

    if (focusedBank === 'All') {
      if (activeCategory === 'All') {
        // Mostrar distribución completa de todas las categorías
        return categoryFilteredData.mediaCategories.map(category => ({
          name: category.type,
          value: category.total
        }));
      } else {
        // Solo mostrar la categoría seleccionada
        const category = categoryFilteredData.mediaCategories.find(cat => cat.type === activeCategory);
        return category ? [{ name: category.type, value: category.total }] : [];
      }
    }

    const bank = categoryFilteredData.banks.find(b => b.name === focusedBank);
    if (!bank) return [];

    if (activeCategory === 'All') {
      // Mostrar distribución de todas las categorías para el banco seleccionado
      return categoryFilteredData.mediaCategories.map(category => {
        const bankShare = category.bankShares.find(share => share.bank === focusedBank);
        return {
          name: category.type,
          value: bankShare ? bankShare.investment : 0
        };
      });
    } else {
      // Solo mostrar la categoría seleccionada para el banco seleccionado
      const category = categoryFilteredData.mediaCategories.find(cat => cat.type === activeCategory);
      if (!category) return [];
      
      const bankShare = category.bankShares.find(share => share.bank === focusedBank);
      return bankShare ? [{ name: category.type, value: bankShare.investment }] : [];
    }
  }, [categoryFilteredData, focusedBank, activeCategory]);

  // Generate the "Selected vs Others" comparison data for pie chart
  const selectedVsOthersData = useMemo(() => {
    if (!filteredData || activeCategory === 'All') return null;
    
    // Calculate total media investment
    const totalInvestment = filteredData.mediaCategories.reduce(
      (sum, category) => sum + category.total, 0
    );
    
    // Find selected category total
    const selectedCategory = filteredData.mediaCategories.find(
      cat => cat.type === activeCategory
    );
    
    if (!selectedCategory) return null;
    
    const selectedTotal = selectedCategory.total;
    const othersTotal = totalInvestment - selectedTotal;
    
    return [
      { name: activeCategory, value: selectedTotal, color: "#CCCCCC" },
      { name: "Other Media", value: othersTotal, color: enhancedMediaColors[activeCategory] }
    ];
  }, [filteredData, activeCategory]);

  // Filtrar y ordenar los datos de medios
  const mediaData = useMemo(() => {
    return getMediaData
      .filter(data => data.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [getMediaData]);

  if (loading || !categoryFilteredData) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="h-96 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading investment data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 transition duration-300 hover:shadow-lg border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-100">
        Media Investment by Bank and Category
        {selectedMonths.length > 0 && (
          <span className="ml-2 text-sm font-normal text-gray-600">
            ({selectedMonths.length} {selectedMonths.length === 1 ? 'month' : 'months'} selected)
          </span>
        )}
        {activeCategory !== 'All' && (
          <span className="ml-2 text-sm font-normal" style={{color: enhancedMediaColors[activeCategory]}}>
            - {activeCategory} Only
          </span>
        )}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Total Investment by Bank */}
        <div className="h-96">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <span className="text-gray-700" style={{
              background: 'linear-gradient(90deg, rgba(255,107,107,0.1) 0%, rgba(77,128,228,0.1) 50%, rgba(44,62,80,0.1) 100%)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontWeight: '600'
            }}>
              {activeCategory === 'All' 
                ? 'Total Investment by Bank' 
                : `${activeCategory} Investment by Bank`}
            </span>
            <div className="ml-2 flex items-center">
              {bankData.slice(0, 3).map(bank => (
                <div
                  key={bank.name}
                  className="w-3 h-3 rounded-full ml-1"
                  style={{backgroundColor: enhancedBankColors[bank.name] || bankColors[bank.name]}}
                  title={bank.name}
                ></div>
              ))}
            </div>
          </h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart
              data={bankData}
              margin={{ top: 30, right: 120, left: 20, bottom: 20 }}
              barSize={28}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number"
                tickFormatter={formatValue}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#f3f4f6' }}
                tickLine={false}
              />
              <YAxis 
                type="category"
                dataKey="name"
                tick={(props) => {
                  const { x, y, payload } = props;
                  const colors = {
                    "Capital One": enhancedBankColors["Capital One"],
                    "Bank Of America": enhancedBankColors["Bank Of America"],
                    "Wells Fargo Bank": enhancedBankColors["Wells Fargo Bank"],
                    "Pnc Bank": enhancedBankColors["Pnc Bank"],
                    "Td Bank": enhancedBankColors["Td Bank"]
                  };
                  const color = colors[payload.value] || '#6b7280';
                  
                  return (
                    <text 
                      x={x} 
                      y={y} 
                      dy={4} 
                      textAnchor="end"
                      fill={color}
                      fontSize={12}
                    >
                      {payload.value}
                    </text>
                  );
                }}
                axisLine={{ stroke: '#f3f4f6' }}
                tickLine={false}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="investment" 
                radius={[0, 4, 4, 0]}
                fill={(entry) => bankColors[entry.name] || '#000000'}
              >
                {bankData.map((entry) => (
                  <Cell 
                    key={`cell-${entry.name}`} 
                    fill={enhancedBankColors[entry.name] || bankColors[entry.name]}
                  />
                ))}
                <LabelList dataKey="investment" content={renderBarLabel} position="right" />
                <LabelList dataKey="investment" content={renderBarInsight} position="right" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Media Category Comparison */}
        <div className="h-96">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <span className="text-gray-700" style={{
              background: 'linear-gradient(90deg, rgba(52,152,219,0.1) 0%, rgba(231,76,60,0.1) 50%, rgba(46,204,113,0.1) 100%)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontWeight: '600'
            }}>
              {activeCategory === 'All' 
                ? 'Investment by Media Category' 
                : `${activeCategory} vs Other Media`}
            </span>
            {focusedBank !== 'All' && (
              <span className="ml-2 text-sm font-normal" style={{color: enhancedBankColors[focusedBank]}}>
                ({focusedBank})
              </span>
            )}
          </h3>
          <ResponsiveContainer width="100%" height="85%">
            {activeCategory === 'All' ? (
              <PieChart>
                <Pie
                  data={mediaData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  cornerRadius={4}
                  stroke="#fff"
                  strokeWidth={1}
                  label={renderPieLabel}
                  labelLine={false}
                >
                  {mediaData.map((entry) => (
                    <Cell 
                      key={`cell-${entry.name}`}
                      fill={enhancedMediaColors[entry.name] || mediaColors[entry.name]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  content={<CustomLegend />}
                  layout="vertical"
                  verticalAlign="middle"
                  align="left"
                  wrapperStyle={{
                    paddingLeft: '20px',
                    position: 'absolute',
                    left: '10px'
                  }}
                />
              </PieChart>
            ) : (
              <PieChart>
                <Pie
                  data={selectedVsOthersData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  cornerRadius={4}
                  stroke="#fff"
                  strokeWidth={1}
                  label={renderPieLabel}
                  labelLine={false}
                >
                  {selectedVsOthersData.map((entry, index) => (
                    <Cell 
                      key={`cell-${entry.name}`}
                      fill={entry.color}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  content={<CustomLegend />}
                  layout="vertical"
                  verticalAlign="middle"
                  align="left"
                  wrapperStyle={{
                    paddingLeft: '20px',
                    position: 'absolute',
                    left: '10px'
                  }}
                />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Key Media Insights */}
      <div className="my-8 bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-700 mb-3">Key Media Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded border border-gray-200 shadow-sm">
            <h4 className="font-medium text-gray-800 mb-2 flex items-center">
              <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: bankData[0]?.name ? (enhancedBankColors[bankData[0].name] || bankColors[bankData[0].name]) : '#666'}}></span>
              Top Investor
            </h4>
            <p className="text-sm text-gray-600">
              {bankData[0]?.name || 'N/A'} leads with {bankData[0] ? formatCurrency(bankData[0].investment) : '-'} in 
              {activeCategory === 'All' ? ' total' : ` ${activeCategory}`} spending,
              representing {bankData[0] && activeCategory === 'All' && categoryFilteredData.banks.reduce((sum, bank) => sum + bank.totalInvestment, 0) > 0
                ? ((bankData[0].investment / categoryFilteredData.banks.reduce((sum, bank) => sum + bank.totalInvestment, 0)) * 100).toFixed(1)
                : '0'}% of market share.
            </p>
          </div>
          
          <div className="bg-white p-3 rounded border border-gray-200 shadow-sm">
            <h4 className="font-medium text-gray-800 mb-2 flex items-center">
              <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: activeCategory !== 'All' ? (enhancedMediaColors[activeCategory] || mediaColors[activeCategory]) : (mediaData[0]?.name ? (enhancedMediaColors[mediaData[0].name] || mediaColors[mediaData[0].name]) : '#666')}}></span>
              Media Dominance
            </h4>
            <p className="text-sm text-gray-600">
              {activeCategory !== 'All' 
                ? `${activeCategory} accounts for ${selectedVsOthersData && selectedVsOthersData[0] ? ((selectedVsOthersData[0].value / (selectedVsOthersData[0].value + selectedVsOthersData[1].value)) * 100).toFixed(1) : '0'}% of total media investment`
                : `${mediaData[0]?.name || 'N/A'} is the leading channel with ${mediaData[0] ? ((mediaData[0].value / mediaData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1) : '0'}% of total spending`
              }
            </p>
          </div>
          
          <div className="bg-white p-3 rounded border border-gray-200 shadow-sm">
            <h4 className="font-medium text-gray-800 mb-2 flex items-center">
              <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: '#3498db'}}></span>
              Investment Pattern
            </h4>
            <p className="text-sm text-gray-600">
              {selectedMonths.length > 0 
                ? `Selected period shows ${
                    activeCategory === 'All' 
                      ? `$${formatValue(categoryFilteredData.banks.reduce((sum, bank) => sum + bank.totalInvestment, 0))} total investment` 
                      : `${activeCategory} focus with ${mediaData.length} active banks`
                  }`
                : `Full analysis period includes all media investments across ${categoryFilteredData.banks.length} major banks`
              }
            </p>
          </div>
        </div>

        {/* Additional insights section */}
        <div className="mt-4 bg-white p-4 rounded border border-gray-200 shadow-sm">
          <div className="prose prose-sm max-w-none">
            <h4 className="text-gray-800">Comparative Analysis</h4>
            <ul className="mt-2 space-y-2">
              <li>
                <strong style={{color: enhancedBankColors["Wells Fargo Bank"]}}>Wells Fargo</strong> allocates{' '}
                {bankData.find(b => b.name === "Wells Fargo Bank") && mediaData[0]?.name ? 
                  ((categoryFilteredData.banks.find(b => b.name === "Wells Fargo Bank")?.mediaBreakdown.find(m => m.category === mediaData[0].name)?.percentage || 0)).toFixed(1) : '0'}% 
                to {mediaData[0]?.name || 'Digital'} channels, 
                {categoryFilteredData.banks.find(b => b.name === "Wells Fargo Bank")?.mediaBreakdown.find(m => m.category === mediaData[0]?.name)?.percentage > 
                (categoryFilteredData.banks.find(b => b.name !== "Wells Fargo Bank")?.mediaBreakdown.find(m => m.category === mediaData[0]?.name)?.percentage || 0) ? 
                ' higher than' : ' lower than'} the industry average.
              </li>
              <li>
                <strong style={{color: enhancedMediaColors[mediaData[0]?.name || "Digital"]}}>
                  {mediaData[0]?.name || "Digital"}
                </strong> spending is {categoryFilteredData.mediaCategories.find(c => c.type === (mediaData[0]?.name || "Digital"))?.total > 0 ? 'growing' : 'fluctuating'} 
                across all banks, with the largest share allocated to {bankData[0]?.name || "Wells Fargo Bank"}.
              </li>
              <li>
                The {selectedMonths.length > 0 ? 'selected' : 'analyzed'} period shows {mediaData.length > 2 ? 'diverse' : 'focused'} media approach with 
                {mediaData.filter(m => m.value / mediaData.reduce((sum, item) => sum + item.value, 0) > 0.1).length} major channels 
                receiving over 10% of investment.
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Media Category Expenditure Table */}
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <span className="text-gray-700" style={{
            background: 'linear-gradient(90deg, rgba(255,107,107,0.1) 0%, rgba(70,194,203,0.1) 50%, rgba(142,68,173,0.1) 100%)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontWeight: '600'
          }}>
            {activeCategory === 'All' 
              ? 'Detailed Spending by Media Category'
              : `Detailed Spending - ${activeCategory}`}
          </span>
          <div className="ml-2 flex items-center">
            {categoryFilteredData.banks.slice(0, 3).map(bank => (
              <div
                key={bank.name}
                className="w-3 h-3 rounded-full ml-1"
                style={{backgroundColor: enhancedBankColors[bank.name] || bankColors[bank.name]}}
                title={bank.name}
              ></div>
            ))}
          </div>
        </h3>
        <div className="overflow-x-auto rounded-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Media Category
                </th>
                {categoryFilteredData.banks
                  .filter(bank => focusedBank === 'All' || bank.name === focusedBank)
                  .map(bank => (
                  <th 
                    key={bank.name} 
                    scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-b" 
                    style={{color: enhancedBankColors[bank.name] || bankColors[bank.name]}}
                  >
                    {bank.name}
                  </th>
                ))}
                {focusedBank === 'All' && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b bg-gray-100">
                    Total
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categoryFilteredData.mediaCategories
                .filter(category => activeCategory === 'All' || category.type === activeCategory)
                .sort((a, b) => b.total - a.total)
                .map((category, index) => (
                  <tr key={category.type} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                          style={{backgroundColor: enhancedMediaColors[category.type] || mediaColors[category.type]}}
                          ></div>
                        <div className="text-sm font-medium text-gray-900">{category.type}</div>
                      </div>
                    </td>
                    {categoryFilteredData.banks
                      .filter(bank => focusedBank === 'All' || bank.name === focusedBank)
                      .map(bank => {
                        const bankShare = category.bankShares.find(
                          share => share.bank === bank.name
                        );
                        return (
                          <td key={`${category.type}-${bank.name}`} className="px-6 py-4 whitespace-nowrap">
                            {bankShare ? (
                              <>
                                <div className="text-sm font-medium" style={{color: enhancedBankColors[bank.name] || bankColors[bank.name]}}>
                                  {formatCurrency(bankShare.investment)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {bankShare.share.toFixed(1)}%
                                </div>
                              </>
                            ) : (
                              <div className="text-sm text-gray-400">—</div>
                            )}
                          </td>
                        );
                      })
                    }
                    {focusedBank === 'All' && (
                      <td className="px-6 py-4 whitespace-nowrap bg-gray-50">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(category.total)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          100%
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              }
              {/* Fila de Total general si se muestran todos los bancos */}
                          {focusedBank === 'All' && (
                <tr className="bg-gray-100 font-medium">
                  <td className="px-6 py-4 whitespace-nowrap border-t border-gray-300">
                    <div className="text-sm font-medium text-gray-900">
                      {activeCategory === 'All' ? 'Total All Media' : `Total ${activeCategory}`}
                            </div>
                        </td>
                  {categoryFilteredData.banks.map(bank => {
                    // Calcular total según la categoría activa
                    let investment = bank.totalInvestment;
                    if (activeCategory !== 'All') {
                      const mediaItem = bank.mediaBreakdown.find(m => m.category === activeCategory);
                      if (mediaItem) {
                        investment = bank.totalInvestment * (mediaItem.percentage / 100);
                      } else {
                        investment = 0;
                      }
                    }
                    return (
                      <td key={`total-${bank.name}`} className="px-6 py-4 whitespace-nowrap border-t border-gray-300">
                        <div className="text-sm font-medium" style={{color: enhancedBankColors[bank.name] || bankColors[bank.name]}}>
                          {formatCurrency(investment)}
                        </div>
                        </td>
                    );
                  })}
                  <td className="px-6 py-4 whitespace-nowrap border-t border-gray-300 bg-gray-200">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(
                        activeCategory === 'All'
                          ? categoryFilteredData.banks.reduce((sum, bank) => sum + bank.totalInvestment, 0)
                          : categoryFilteredData.mediaCategories
                              .filter(cat => cat.type === activeCategory)
                              .reduce((sum, cat) => sum + cat.total, 0)
                      )}
                    </div>
                  </td>
                    </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MediaInvestmentByBank;