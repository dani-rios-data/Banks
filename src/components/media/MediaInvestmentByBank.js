import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Legend, LineChart, Line, Area } from 'recharts';
import { useDashboard } from '../../context/DashboardContext';
import { bankColors, mediaColors } from '../../utils/colorSchemes';
import { formatCurrency } from '../../utils/formatters';
import CustomTooltip from '../common/CustomTooltip';
import Papa from 'papaparse';

// Nuevos colores más vibrantes para los bancos
const enhancedBankColors = {
  'Wells Fargo': '#ff6b6b',        // Vibrant red
  'Capital One Bank': '#4d80e4',   // Royal blue
  'Bank of America': '#2c3e50',    // Elegant dark blue
  'PNC Bank': '#46c2cb',           // Bright turquoise
  'TD Bank': '#8e44ad',            // Vibrant purple
  'Chase Bank': '#117ACA',         // Chase blue
  'US Bank': '#0046AD',            // US Bank blue
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
  return formatCurrency(value);
};

// Componente de leyenda personalizada para el gráfico de donut
const CustomLegend = ({ payload }) => {
  return (
    <div className="flex flex-col gap-2 mt-2">
      {payload.map((entry, index) => {
        // Usar el porcentaje que ya ha sido calculado y almacenado en el payload
        const percentage = entry.payload && entry.payload.percentage !== undefined 
          ? entry.payload.percentage.toFixed(1) 
          : '0.0';
        
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

/**
 * Component that displays media investment by bank with filtered data
 */
const MediaInvestmentByBank = ({ activeCategory = 'All' }) => {
  const { 
    dashboardData, 
    filteredData: contextFilteredData, 
    loading, 
    selectedMonths,
    selectedYears,
    selectedPeriod 
  } = useDashboard();
  
  const [selectedBanks, setSelectedBanks] = React.useState(['All']);
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  // Log para depuración de filtros globales
  React.useEffect(() => {
    console.log("MediaInvestmentByBank - Filtros globales actualizados:", {
      selectedMonths,
      selectedYears,
      selectedPeriod,
      hayDatosFiltrados: !!contextFilteredData
    });
  }, [selectedMonths, selectedYears, selectedPeriod, contextFilteredData]);

  // Obtener lista de bancos disponibles
  const availableBanks = useMemo(() => {
    // Usar filteredData si está disponible, de lo contrario usar dashboardData
    const data = contextFilteredData || dashboardData;
    if (!data?.banks) return [];
    return ['All', ...data.banks.map(bank => bank.name)];
  }, [dashboardData, contextFilteredData]);

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

  // Obtener datos procesados
  const processedData = useMemo(() => {
    // Preparar categorías en función de la selección y filtros
    const filteredData = contextFilteredData || dashboardData;
    if (!filteredData) return null;
    
    // Variable para almacenar los datos que mostraremos
    const data = {
      banks: filteredData.banks || [],
      mediaCategories: filteredData.mediaCategories || [],
      totalInvestment: filteredData.totalInvestment || 0
    };
    
    // Ajustar los datos si hay filtro por años o meses
    if (selectedMonths.length > 0 || selectedYears.length > 0) {
      console.log(`MediaInvestmentByBank - Aplicando filtros: ${selectedMonths.length} meses, ${selectedYears.length} años`);
    } else {
      console.log(`MediaInvestmentByBank - Usando datos completos sin filtros adicionales`);
    }
    
    return data;
  }, [dashboardData, contextFilteredData, selectedMonths, selectedYears]);

  // Función para filtrar los datos basados en la categoría de medios activa
  const categoryFilteredData = useMemo(() => {
    if (!processedData) return null;
    
    console.log("Procesando filtro por categoría:", activeCategory);
    console.log("Estructura de processedData:", processedData);
    
    if (activeCategory === 'All') return processedData;

    // Filtrar las categorías de medios para mostrar solo la categoría activa
    // Verificar si las categorías usan 'type' o 'category' como nombre de la propiedad
    const hasTypeProperty = processedData.mediaCategories && 
                            processedData.mediaCategories.length > 0 && 
                            'type' in processedData.mediaCategories[0];
    
    const categoryProperty = hasTypeProperty ? 'type' : 'category';
    console.log(`Usando propiedad "${categoryProperty}" para filtrar categorías`);
    
    const filteredMedia = {
      ...processedData,
      mediaCategories: processedData.mediaCategories ? processedData.mediaCategories.filter(
        category => category[categoryProperty] === activeCategory
      ) : []
    };

    console.log("Datos filtrados por categoría:", activeCategory, filteredMedia);
    return filteredMedia;
  }, [processedData, activeCategory]);

  // Filtrar datos basados en los bancos seleccionados
  const filteredBankData = useMemo(() => {
    if (!categoryFilteredData) return null;
    if (selectedBanks.includes('All')) return categoryFilteredData;

    // Log para depuración
    console.log("Filtrando por bancos seleccionados:", selectedBanks);

    return {
      ...categoryFilteredData,
      banks: categoryFilteredData.banks ? categoryFilteredData.banks.filter(bank => selectedBanks.includes(bank.name)) : [],
      mediaCategories: categoryFilteredData.mediaCategories ? categoryFilteredData.mediaCategories.map(category => ({
        ...category,
        total: category.bankShares
          ? category.bankShares
              .filter(share => selectedBanks.includes(share.bank))
              .reduce((sum, share) => sum + share.investment, 0)
          : 0,
        bankShares: category.bankShares 
          ? category.bankShares.filter(share => selectedBanks.includes(share.bank))
          : []
      })).filter(category => category.total > 0) : []
    };
  }, [categoryFilteredData, selectedBanks]);

  // Prepare data for the bar chart - filter by active category if needed
  const bankData = useMemo(() => {
    if (!filteredBankData || !filteredBankData.banks) return [];
    
    console.log("Preparando datos para gráfico de barras 'Total Investment by Media Category'");
    console.log("Categoría activa:", activeCategory);
    console.log("Bancos disponibles:", filteredBankData.banks.map(b => b.name));
    console.log("Categorías disponibles:", filteredBankData.mediaCategories.map(cat => cat.type || cat.category));

    if (activeCategory === 'All') {
      // Para 'All', mostrar inversión total por banco
      return filteredBankData.banks
        .map(bank => ({
          name: bank.name,
          investment: bank.totalInvestment
        }))
        .sort((a, b) => b.investment - a.investment);
    } else {
      // Para categoría específica, calcular inversión por banco solo para esa categoría
      // Determinar qué propiedades usar para identificar la categoría
      const categoryData = filteredBankData.mediaCategories.find(cat => 
        (cat.type === activeCategory) || (cat.category === activeCategory)
      );
      
      if (!categoryData) {
        console.log(`No se encontró la categoría ${activeCategory} en los datos filtrados`);
        return [];
      }
      
      console.log("Datos de la categoría encontrada:", categoryData);
      
      // Determinar qué propiedad usar para bankShares
      const bankShares = categoryData.bankShares || [];
      
      // Crear datos para el gráfico con la inversión de cada banco en esta categoría
      const result = filteredBankData.banks
        .map(bank => {
          const bankShare = bankShares.find(share => share.bank === bank.name);
          const investment = bankShare ? (bankShare.investment || bankShare.amount || 0) : 0;
          
          console.log(`Banco: ${bank.name}, Inversión en ${activeCategory}: ${investment}`);
          
          return {
            name: bank.name,
            investment: investment
          };
        })
        .filter(item => item.investment > 0)
        .sort((a, b) => b.investment - a.investment);
      
      console.log("Resultado final para gráfico:", result);
      return result;
    }
  }, [filteredBankData, activeCategory]);

  // Función para obtener datos para el gráfico de pastel
  const getMediaData = useMemo(() => {
    if (!filteredBankData || !filteredBankData.mediaCategories) return [];

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
  }, [filteredBankData, activeCategory]);

  // Generate the "Selected vs Others" comparison data for pie chart
  const selectedVsOthersData = useMemo(() => {
    if (!filteredBankData || !filteredBankData.mediaCategories) return [];
    
    console.log("Generando datos para gráfico de comparación de categorías");
    console.log("Categoría activa:", activeCategory);
    console.log("Categorías disponibles:", filteredBankData.mediaCategories.map(cat => cat.type || cat.category));
    
    // Si la categoría activa no es 'All', mostrar la comparación de la categoría seleccionada vs. todas las demás
    if (activeCategory !== 'All') {
      // Calcular el total de inversión en medios
      const totalInvestment = filteredBankData.mediaCategories.reduce(
        (sum, category) => sum + category.total, 0
      );
      
      console.log("Total de inversión en todos los medios:", totalInvestment);
      
      // Buscar la categoría seleccionada
      const selectedCategory = filteredBankData.mediaCategories.find(
        cat => (cat.type === activeCategory) || (cat.category === activeCategory)
      );
      
      if (!selectedCategory) {
        console.log("¡Advertencia! No se encontró la categoría:", activeCategory);
        return [];
      }
      
      const selectedTotal = selectedCategory.total;
      const othersTotal = totalInvestment - selectedTotal;
      
      console.log("Total de la categoría seleccionada:", selectedTotal);
      console.log("Total de otras categorías:", othersTotal);
      
      return [
        { 
          name: activeCategory, 
          value: selectedTotal, 
          color: enhancedMediaColors[activeCategory], 
          percentage: (selectedTotal / totalInvestment) * 100 
        },
        { 
          name: "Other Media", 
          value: othersTotal, 
          color: "#A0AEC0", // Color gris neutro para "Other Media"
          percentage: (othersTotal / totalInvestment) * 100 
        }
      ];
    } else {
      // Para 'All', mostrar un desglose completo de todas las categorías
      return filteredBankData.mediaCategories.map(category => {
        const categoryName = category.type || category.category;
        return {
          name: categoryName,
          value: category.total,
          color: enhancedMediaColors[categoryName] || mediaColors[categoryName],
          percentage: (category.total / filteredBankData.mediaCategories.reduce((sum, cat) => sum + cat.total, 0)) * 100
        };
      }).sort((a, b) => b.value - a.value);
    }
  }, [filteredBankData, activeCategory, enhancedMediaColors, mediaColors]);

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
        <div className="flex gap-2">
          {selectedMonths && selectedMonths.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full">
              {selectedMonths.length} {selectedMonths.length === 1 ? 'Month' : 'Months'}
            </span>
          )}
          {selectedYears && selectedYears.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded-full">
              {selectedYears.length} {selectedYears.length === 1 ? 'Year' : 'Years'}
            </span>
          )}
          {selectedPeriod && selectedPeriod !== 'All Period' && (
            <span className="px-2 py-0.5 text-xs bg-purple-50 text-purple-700 rounded-full">
              {selectedPeriod}
            </span>
          )}
        </div>
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
              {filteredBankData.mediaCategories && filteredBankData.mediaCategories.slice(0, 3).map(category => {
                const categoryName = category.type || category.category;
                return (
                  <div
                    key={categoryName}
                    className="w-3 h-3 rounded-full ml-1"
                    style={{backgroundColor: enhancedMediaColors[categoryName] || mediaColors[categoryName]}}
                    title={categoryName}
                  ></div>
                );
              })}
            </div>
          </h3>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={filteredBankData.mediaCategories || []}
              layout="vertical"
              margin={{ top: 15, right: 30, left: 20, bottom: 5 }}
              barSize={30}
            >
              <XAxis type="number" tickFormatter={formatValue} />
              <YAxis 
                type="category" 
                dataKey={(data) => data.type || data.category}
                tick={{ fill: '#4b5563', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="total" 
                radius={[0, 4, 4, 0]}
              >
                {(filteredBankData.mediaCategories || []).map((entry) => {
                  const categoryName = entry.type || entry.category;
                  return (
                    <Cell 
                      key={`cell-${categoryName}`} 
                      fill={enhancedMediaColors[categoryName] || mediaColors[categoryName]}
                    />
                  );
                })}
                <LabelList 
                  dataKey="total" 
                  position="right" 
                  formatter={(value) => formatCurrency(value)}
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
                : `${activeCategory} vs Other Media`}
            </span>
          </h3>
          <ResponsiveContainer width="100%" height="85%">
            {activeCategory === 'All' ? (
              <PieChart>
                <Pie
                  data={mediaData || []}
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
                  {(mediaData || []).map((entry) => (
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
                  data={selectedVsOthersData || []}
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
                  {(selectedVsOthersData || []).map((entry, index) => (
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
        </h3>
        <div className="overflow-x-auto rounded-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Media Category
                </th>
                {filteredBankData.banks
                  .filter(bank => activeCategory === 'All' || bank.name === activeCategory)
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
                {activeCategory === 'All' && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b bg-gray-100">
                    Total
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBankData.mediaCategories
                .filter(category => activeCategory === 'All' || (category.type === activeCategory || category.category === activeCategory))
                .sort((a, b) => b.total - a.total)
                .map((category, index) => {
                  const categoryName = category.type || category.category;
                  return (
                    <tr key={categoryName} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                            style={{backgroundColor: enhancedMediaColors[categoryName] || mediaColors[categoryName]}}
                            ></div>
                          <div className="text-sm font-medium text-gray-900">{categoryName}</div>
                        </div>
                      </td>
                      {filteredBankData.banks
                        .filter(bank => activeCategory === 'All' || bank.name === activeCategory)
                        .map(bank => {
                          const bankShare = category.bankShares.find(
                            share => share.bank === bank.name
                          );
                          return (
                            <td key={`${categoryName}-${bank.name}`} className="px-6 py-4 whitespace-nowrap">
                              {bankShare ? (
                                <>
                                  <div className="text-sm font-medium" style={{color: enhancedBankColors[bank.name] || bankColors[bank.name]}}>
                                    {formatCurrency(bankShare.investment)}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {(bankShare.share !== undefined && bankShare.share !== null) ? bankShare.share.toFixed(1) : '0'}%
                                  </div>
                                </>
                              ) : (
                                <div className="text-sm text-gray-400">—</div>
                              )}
                            </td>
                          );
                        })
                      }
                      {activeCategory === 'All' && (
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
                  );
                })}
              {/* Fila de Total general si se muestran todos los bancos */}
              {activeCategory === 'All' && (
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
                        .find(cat => cat.type === activeCategory || cat.category === activeCategory);
                      
                      if (categoryData) {
                        const bankSharesProperty = categoryData.bankShares ? 'bankShares' : 'shares';
                        const bankShares = categoryData[bankSharesProperty] || [];
                        
                        const bankShare = bankShares.find(share => share.bank === bank.name);
                        
                        if (bankShare) {
                          investment = bankShare.investment || bankShare.amount || 0;
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
                              .filter(cat => cat.type === activeCategory || cat.category === activeCategory)
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