import React, { useState } from 'react';
import ExecutiveSummary from './ExecutiveSummary';
import { useDashboard } from '../../context/DashboardContext';

/**
 * Main component for the executive summary dashboard
 * Integrates all components and provides a unified view
 */
const SummaryDashboard = () => {
  const { dashboardData, selectedMonths, selectedYears, getFilteredData } = useDashboard();

  // Get filtered data
  const filteredData = getFilteredData() || dashboardData;

  // Get filter period for display
  let filterDisplay = 'All Period';
  
  if (selectedYears.length > 0 && selectedMonths.length > 0) {
    filterDisplay = `${selectedMonths.sort()[0]} ${selectedYears.sort()[0]} to ${selectedMonths.sort()[selectedMonths.length - 1]} ${selectedYears.sort()[selectedYears.length - 1]}`;
  } else if (selectedYears.length > 0) {
    filterDisplay = selectedYears.length === 1 ? 
      `Year ${selectedYears[0]}` : 
      `Years ${selectedYears.sort()[0]} to ${selectedYears.sort()[selectedYears.length - 1]}`;
  } else if (selectedMonths.length > 0) {
    filterDisplay = selectedMonths.length === 1 ? 
      `Month ${selectedMonths[0]}` : 
      `Months ${selectedMonths.sort()[0]} to ${selectedMonths.sort()[selectedMonths.length - 1]}`;
  }

  return (
    <div className="space-y-8">
      {/* Executive Summary Components - Integrated View */}
      <ExecutiveSummary selectedPeriod={filterDisplay} filteredData={filteredData} />
    </div>
  );
};

export default SummaryDashboard;