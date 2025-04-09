import React, { useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Legend, CartesianGrid } from 'recharts';
import { useDashboard } from '../../context/DashboardContext';
import { bankColors, mediaColors } from '../../utils/colorSchemes';
import { formatCurrency } from '../../utils/formatters';
import Icons from '../common_copy/Icons';

// Nuevos colores más vibrantes para los bancos
const enhancedBankColors = {
  'Wells Fargo Bank': '#ff6b6b',  // Vibrant red
  'Capital One': '#4d80e4',       // Royal blue
  'Bank Of America': '#2c3e50',   // Elegant dark blue
  'Pnc Bank': '#46c2cb',          // Bright turquoise
  'Td Bank': '#8e44ad',           // Vibrant purple
  'Chase Bank': '#117ACA',        // Chase blue
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
        // Usar el porcentaje que ya ha sido calculado y almacenado en el payload
        const percentage = entry.payload.percentage ? entry.payload.percentage.toFixed(1) : '0.0';
        
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

// Componente para mostrar tooltips personalizados
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip bg-white p-3 rounded shadow-md border border-gray-200">
        <p className="text-sm font-medium" style={{color: payload[0].color}}>
          {payload[0].name}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Investment:</span> {formatCurrency(payload[0].value)}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Share:</span> {payload[0].payload.percentage ? payload[0].payload.percentage.toFixed(1) : '0'}%
        </p>
      </div>
    );
  }
  return null;
};

/**
 * Component that displays media investment by bank with filtered data
 */
const MediaInvestmentByBank = ({ activeCategory = 'All' }) => {
  const { dashboardData, focusedBank, loading, selectedMonths } = useDashboard();
  const [selectedBanks, setSelectedBanks] = React.useState(['All']);
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  // Cerrar el dropdown cuando se hace click fuera
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Obtener lista de bancos disponibles
  const availableBanks = useMemo(() => {
    if (!dashboardData?.banks) return [];
    return ['All', ...dashboardData.banks.map(bank => bank.name)];
  }, [dashboardData]);

  // Función para manejar cambios en la selección de bancos
  const handleBankSelection = (bank) => {
    if (bank === 'All') {
      setSelectedBanks(['All']);
    } else {
      const newSelection = selectedBanks.includes('All') 
        ? [bank]
        : selectedBanks.includes(bank)
          ? selectedBanks.filter(b => b !== bank)
          : [...selectedBanks, bank];
      
      setSelectedBanks(newSelection.length === 0 ? ['All'] : newSelection);
    }
  };

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

  // Filtrar datos basados en los bancos seleccionados
  const filteredBankData = useMemo(() => {
    if (!categoryFilteredData) return [];
    if (selectedBanks.includes('All')) return categoryFilteredData;

    return {
      ...categoryFilteredData,
      banks: categoryFilteredData.banks.filter(bank => selectedBanks.includes(bank.name)),
      mediaCategories: categoryFilteredData.mediaCategories.map(category => ({
        ...category,
        total: category.bankShares
          .filter(share => selectedBanks.includes(share.bank))
          .reduce((sum, share) => sum + share.investment, 0),
        bankShares: category.bankShares.filter(share => selectedBanks.includes(share.bank))
      })).filter(category => category.total > 0)
    };
  }, [categoryFilteredData, selectedBanks]);

  // Prepare data for the bar chart - filter by active category if needed
  const bankData = useMemo(() => {
    if (!filteredBankData) return [];

    if (activeCategory === 'All') {
      return filteredBankData.banks
        .map(bank => ({
          name: bank.name,
          investment: bank.totalInvestment
        }))
        .sort((a, b) => b.investment - a.investment);
    } else {
      // Calcular inversión por banco solo para la categoría seleccionada usando datos filtrados directamente
      return filteredBankData.banks
        .map(bank => {
          // Encontrar la categoría específica en datos filtrados
          const categoryData = filteredBankData.mediaCategories.find(cat => cat.type === activeCategory);
          
          if (!categoryData) return { name: bank.name, investment: 0 };
          
          // Encontrar la participación de este banco en la categoría
          const bankShare = categoryData.bankShares.find(share => share.bank === bank.name);
          
          return {
            name: bank.name,
            investment: bankShare ? bankShare.investment : 0
          };
        })
        .filter(item => item.investment > 0)
        .sort((a, b) => b.investment - a.investment);
    }
  }, [filteredBankData, activeCategory]);

  // Función para obtener datos para el gráfico de pastel
  const getMediaData = useMemo(() => {
    if (!filteredBankData) return [];

    if (focusedBank === 'All') {
      if (activeCategory === 'All') {
        // Mostrar distribución completa de todas las categorías
        return filteredBankData.mediaCategories.map(category => ({
          name: category.type,
          value: category.total
        }));
      } else {
        // Solo mostrar la categoría seleccionada
        const category = filteredBankData.mediaCategories.find(cat => cat.type === activeCategory);
        return category ? [{ name: category.type, value: category.total }] : [];
      }
    }

    const bank = filteredBankData.banks.find(b => b.name === focusedBank);
    if (!bank) return [];

    if (activeCategory === 'All') {
      // Mostrar distribución de todas las categorías para el banco seleccionado
      return filteredBankData.mediaCategories.map(category => {
        const bankShare = category.bankShares.find(share => share.bank === focusedBank);
        return {
          name: category.type,
          value: bankShare ? bankShare.investment : 0
        };
      });
    } else {
      // Solo mostrar la categoría seleccionada para el banco seleccionado
      const category = filteredBankData.mediaCategories.find(cat => cat.type === activeCategory);
      if (!category) return [];
      
      const bankShare = category.bankShares.find(share => share.bank === focusedBank);
      return bankShare ? [{ name: category.type, value: bankShare.investment }] : [];
    }
  }, [filteredBankData, focusedBank, activeCategory]);

  // Generate the "Selected vs Others" comparison data for pie chart
  const selectedVsOthersData = useMemo(() => {
    if (!filteredBankData) return null;
    
    // Si activeCategory es All, no necesitamos datos de comparación
    if (activeCategory === 'All') return null;
    
    // Forzar Cinema como categoría seleccionada si está presente en los datos
    const forcedCategory = activeCategory === 'Cinema' ? 'Cinema' : activeCategory;
    
    // Calculate total media investment (usando filteredBankData en lugar de filteredData)
    const totalInvestment = filteredBankData.mediaCategories.reduce(
      (sum, category) => sum + category.total, 0
    );
    
    // Find selected category total (Cinema o la que esté activa)
    const selectedCategory = filteredBankData.mediaCategories.find(
      cat => cat.type === forcedCategory
    );
    
    if (!selectedCategory) return null;
    
    const selectedTotal = selectedCategory.total;
    const othersTotal = totalInvestment - selectedTotal;
    
    // Usar el nombre forzado para el primer elemento
    return [
      { 
        name: forcedCategory, 
        value: selectedTotal, 
        color: enhancedMediaColors[forcedCategory], 
        percentage: (selectedTotal / totalInvestment) * 100 
      },
      { 
        name: "Other Media", 
        value: othersTotal, 
        color: "#A0AEC0", // Color gris neutro para "Other Media"
        percentage: (othersTotal / totalInvestment) * 100 
      }
    ];
  }, [filteredBankData, activeCategory]);

  // Filtrar y ordenar los datos de medios y agregar porcentajes recalculados
  const mediaData = useMemo(() => {
    const filteredMedia = getMediaData.filter(data => data.value > 0);
    // Calcular el total para obtener los porcentajes
    const total = filteredMedia.reduce((sum, item) => sum + item.value, 0);
    
    // Agregar porcentajes recalculados a cada categoría
    return filteredMedia
      .map(item => ({
        ...item,
        percentage: total > 0 ? (item.value / total) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);
  }, [getMediaData]);

  if (loading || !filteredBankData) {
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
      <h2 className="text-lg font-medium text-gray-700 mb-6 flex items-center justify-between">
        <div>Investment By Media Category</div>
        {selectedMonths.length > 0 && (
          <span className="ml-2 px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full">
            Filtered by {selectedMonths.length} {selectedMonths.length === 1 ? 'month' : 'months'}
          </span>
        )}
      </h2>
      
      {/* Bank Selector */}
      <div className="mb-6 flex items-start relative" ref={dropdownRef}>
        <div className="w-72 relative">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            Compare Banks
          </label>
          <div 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-200 rounded-lg shadow-sm cursor-pointer hover:border-gray-300 transition-all duration-200 bg-white"
          >
            <div className="flex items-center gap-2 flex-wrap max-w-[calc(100%-24px)]">
              {selectedBanks.includes('All') ? (
                <span className="text-gray-700">All Banks</span>
              ) : (
                selectedBanks.map(bank => (
                  <span
                    key={bank}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${enhancedBankColors[bank]}20`,
                      color: enhancedBankColors[bank]
                    }}
                  >
                    {bank}
                  </span>
                ))
              )}
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
              <div className="max-h-60 overflow-auto py-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#94a3b8 #e2e8f0' }}>
                {availableBanks.map(bank => (
                  <div
                    key={bank}
                    onClick={() => handleBankSelection(bank)}
                    className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="flex items-center flex-1">
                      {bank === 'All' ? (
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      ) : (
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: enhancedBankColors[bank] }}
                        />
                      )}
                      <span
                        style={{
                          color: bank === 'All' ? '#374151' : enhancedBankColors[bank],
                          fontWeight: selectedBanks.includes(bank) ? '600' : '400'
                        }}
                      >
                        {bank === 'All' ? 'All Banks' : bank}
                      </span>
                    </div>
                    {selectedBanks.includes(bank) && (
                      <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Total Investment by Media Category */}
        <div>
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <span className="text-gray-700" style={{
              background: 'linear-gradient(90deg, rgba(255,107,107,0.1) 0%, rgba(77,128,228,0.1) 50%, rgba(44,62,80,0.1) 100%)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontWeight: '600'
            }}>
              Total Investment by Media Category
            </span>
            <div className="ml-2 flex items-center">
              {filteredBankData.mediaCategories.slice(0, 3).map(category => (
                <div
                  key={category.type}
                  className="w-3 h-3 rounded-full ml-1"
                  style={{backgroundColor: enhancedMediaColors[category.type] || mediaColors[category.type]}}
                  title={category.type}
                ></div>
              ))}
            </div>
          </h3>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={filteredBankData.mediaCategories}
              layout="vertical"
              margin={{ top: 15, right: 30, left: 20, bottom: 5 }}
              barSize={30}
            >
              <XAxis type="number" tickFormatter={formatValue} />
              <YAxis 
                type="category" 
                dataKey="type"
                tick={{ fill: '#4b5563', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="total" 
                radius={[0, 4, 4, 0]}
              >
                {filteredBankData.mediaCategories.map((entry) => (
                  <Cell 
                    key={`cell-${entry.type}`} 
                    fill={enhancedMediaColors[entry.type] || mediaColors[entry.type]}
                  />
                ))}
                <LabelList 
                  dataKey="total" 
                  position="right" 
                  formatter={formatValue}
                  style={{ fill: '#666', fontSize: '12px' }}
                />
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
                : `Cinema vs Other Media`}
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
            {filteredBankData.banks.slice(0, 3).map(bank => (
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
                {filteredBankData.banks
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
              {filteredBankData.mediaCategories
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
                    {filteredBankData.banks
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
                  {filteredBankData.banks.map(bank => {
                    // Calcular total según la categoría activa
                    let investment = 0;
                    if (activeCategory === 'All') {
                      investment = bank.totalInvestment;
                    } else {
                      // Para categoría específica, obtener directamente de los datos filtrados
                      const categoryData = filteredBankData.mediaCategories
                        .find(cat => cat.type === activeCategory);
                      
                      if (categoryData) {
                        const bankShare = categoryData.bankShares
                          .find(share => share.bank === bank.name);
                        
                        if (bankShare) {
                          investment = bankShare.investment;
                        }
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
                          ? filteredBankData.banks.reduce((sum, bank) => sum + bank.totalInvestment, 0)
                          : filteredBankData.mediaCategories
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