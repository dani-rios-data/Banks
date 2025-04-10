import React, { useState, useMemo } from 'react';
import { Pie, Cell, Label, PieChart, ResponsiveContainer, Legend } from 'recharts';
import { useDashboard } from '../../context/DashboardContext';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

// Custom colors for the media categories
const mediaColors = {
  Digital: '#3498db',
  Television: '#e74c3c',
  Print: '#f1c40f',
  Radio: '#2ecc71',
  Outdoor: '#9b59b6',
  Other: '#34495e',
  Default: '#95a5a6',
};

// Custom legend component
const CustomLegend = ({ payload }) => {
  return (
    <div className="grid grid-cols-2 gap-2 text-sm">
      {payload.map((entry, index) => (
        <div key={`item-${index}`} className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-700 truncate">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * Component for visualizing the distribution of data using pie charts
 */
const DistributionCharts = () => {
  const { filteredData, loading, toggleFilter } = useDashboard();
  const [activeSlice, setActiveSlice] = useState(null);

  // Process media distribution data for pie chart
  const mediaDistributionData = useMemo(() => {
    if (!filteredData || !filteredData.mediaCategories) return [];
    
    return filteredData.mediaCategories
      .map(category => ({
        name: category.category,
        value: category.marketShare * 100, // Convert to percentage
        amount: category.totalInvestment,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // Process bank distribution data for pie chart
  const bankDistributionData = useMemo(() => {
    if (!filteredData || !filteredData.banks) return [];
    
    return filteredData.banks
      .map(bank => ({
        name: bank.name,
        value: bank.marketShare * 100, // Convert to percentage
        amount: bank.totalInvestment,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // Handle slice click for interactivity
  const handlePieClick = (data, chartType) => {
    if (data && data.name) {
      if (activeSlice && activeSlice.name === data.name && activeSlice.type === chartType) {
        setActiveSlice(null);
        if (chartType === 'media') {
          toggleFilter('mediaCategory', null);
        } else if (chartType === 'bank') {
          toggleFilter('bank', null);
        }
      } else {
        setActiveSlice({ name: data.name, type: chartType });
        if (chartType === 'media') {
          toggleFilter('mediaCategory', data.name);
        } else if (chartType === 'bank') {
          toggleFilter('bank', data.name);
        }
      }
    }
  };

  // Get color for a media category
  const getMediaColor = (category) => {
    return mediaColors[category] || mediaColors.Default;
  };

  // Handle mouse enter for highlighting
  const handleMouseEnter = (data, chartType) => {
    if (data && data.name) {
      setActiveSlice({ name: data.name, type: chartType });
    }
  };

  // Handle mouse leave for resetting highlight
  const handleMouseLeave = () => {
    if (!activeSlice || !activeSlice.fixed) {
      setActiveSlice(null);
    }
  };

  // Common props for both pie charts
  const commonPieProps = {
    cx: "50%",
    cy: "50%",
    innerRadius: "60%",
    outerRadius: "80%",
    paddingAngle: 2,
    dataKey: "value",
  };

  if (loading || !filteredData) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 h-[420px]">
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-400 animate-pulse">Loading distribution data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Media Distribution Chart */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Media Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                {...commonPieProps}
                data={mediaDistributionData}
                onClick={(data) => handlePieClick(data, 'media')}
                onMouseEnter={(data) => handleMouseEnter(data, 'media')}
                onMouseLeave={handleMouseLeave}
              >
                {mediaDistributionData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getMediaColor(entry.name)}
                    fillOpacity={
                      activeSlice
                        ? activeSlice.type === 'media' && activeSlice.name === entry.name
                          ? 1
                          : 0.6
                        : 0.9
                    }
                    stroke={
                      activeSlice && activeSlice.type === 'media' && activeSlice.name === entry.name
                        ? '#fff'
                        : 'none'
                    }
                    strokeWidth={2}
                  />
                ))}
                <Label
                  content={({ viewBox }) => {
                    const { cx, cy } = viewBox;
                    return (
                      <g>
                        <text
                          x={cx}
                          y={cy - 5}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="text-base font-medium"
                          fill="#374151"
                        >
                          Total
                        </text>
                        <text
                          x={cx}
                          y={cy + 15}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="text-sm"
                          fill="#4B5563"
                        >
                          {formatCurrency(filteredData.totalInvestment || 0)}
                        </text>
                      </g>
                    );
                  }}
                />
              </Pie>
              <Legend
                content={<CustomLegend />}
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ paddingTop: '20px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Active slice details */}
        {activeSlice && activeSlice.type === 'media' && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex justify-between">
              <div className="flex items-center">
                <div
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: getMediaColor(activeSlice.name) }}
                />
                <span className="font-medium">{activeSlice.name}</span>
              </div>
              <span className="text-gray-600">
                {formatPercentage(
                  mediaDistributionData.find((d) => d.name === activeSlice.name)?.value / 100 || 0
                )}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Total expenditure: {formatCurrency(
                mediaDistributionData.find((d) => d.name === activeSlice.name)?.amount || 0
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bank Distribution Chart */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Bank Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                {...commonPieProps}
                data={bankDistributionData}
                onClick={(data) => handlePieClick(data, 'bank')}
                onMouseEnter={(data) => handleMouseEnter(data, 'bank')}
                onMouseLeave={handleMouseLeave}
              >
                {bankDistributionData.map((entry, index) => {
                  // Create a gradient color based on the index
                  const colorIndex = index % 7;
                  const colors = [
                    '#3B82F6', // blue-500
                    '#F59E0B', // amber-500
                    '#10B981', // emerald-500
                    '#EF4444', // red-500
                    '#8B5CF6', // violet-500
                    '#EC4899', // pink-500
                    '#6366F1', // indigo-500
                  ];
                  
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[colorIndex]}
                      fillOpacity={
                        activeSlice
                          ? activeSlice.type === 'bank' && activeSlice.name === entry.name
                            ? 1
                            : 0.6
                          : 0.9
                      }
                      stroke={
                        activeSlice && activeSlice.type === 'bank' && activeSlice.name === entry.name
                          ? '#fff'
                          : 'none'
                      }
                      strokeWidth={2}
                    />
                  );
                })}
                <Label
                  content={({ viewBox }) => {
                    const { cx, cy } = viewBox;
                    return (
                      <g>
                        <text
                          x={cx}
                          y={cy - 5}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="text-base font-medium"
                          fill="#374151"
                        >
                          Total
                        </text>
                        <text
                          x={cx}
                          y={cy + 15}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="text-sm"
                          fill="#4B5563"
                        >
                          {formatCurrency(filteredData.totalInvestment || 0)}
                        </text>
                      </g>
                    );
                  }}
                />
              </Pie>
              <Legend
                content={<CustomLegend />}
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ paddingTop: '20px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Active slice details */}
        {activeSlice && activeSlice.type === 'bank' && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex justify-between">
              <div className="flex items-center">
                <div
                  className="w-4 h-4 rounded-full mr-2"
                  style={{
                    backgroundColor:
                      ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'][
                        bankDistributionData.findIndex((d) => d.name === activeSlice.name) % 7
                      ],
                  }}
                />
                <span className="font-medium">{activeSlice.name}</span>
              </div>
              <span className="text-gray-600">
                {formatPercentage(
                  bankDistributionData.find((d) => d.name === activeSlice.name)?.value / 100 || 0
                )}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Total investment: {formatCurrency(
                bankDistributionData.find((d) => d.name === activeSlice.name)?.amount || 0
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DistributionCharts; 