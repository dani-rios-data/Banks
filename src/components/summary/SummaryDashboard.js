import React from 'react';
import ExecutiveSummary from './ExecutiveSummary';
import { useDashboard } from '../../context/DashboardContext';
import { formatCurrency } from '../../utils/formatters';

/**
 * Main component for the executive summary dashboard
 * Integrates all components and provides a unified view
 */
const SummaryDashboard = () => {
  const { dashboardData, selectedMonths } = useDashboard();

  // Calculate total investment across all banks
  const totalInvestment = dashboardData?.monthlyTrends
    .filter(month => selectedMonths.length === 0 || selectedMonths.includes(month.month))
    .reduce((sum, month) => sum + month.total, 0) || 0;

  // Get months period for display
  const monthsDisplay = selectedMonths.length > 0 
    ? `${selectedMonths.sort()[0]} to ${selectedMonths.sort()[selectedMonths.length - 1]}`
    : 'All Period';

  return (
    <div className="space-y-8">
      {/* Executive Summary Components - Integrated View */}
      <ExecutiveSummary selectedMonths={monthsDisplay} />
    </div>
  );
};

export default SummaryDashboard;