import KeyMetrics from '../components/summary/KeyMetrics';
import ExecutiveSummaryComp from '../components/summary/ExecutiveSummary';
import { useDashboard } from '../context/DashboardContext';

const ExecutiveSummary = () => {
  const { dashboardData, filteredData, selectedMonths, loading } = useDashboard();
  
  return (
    <div className="p-6 h-full bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Executive Summary</h1>
        <p className="text-gray-600">Financial Services Advertising Landscape</p>
      </div>
      
      {/* Component from summary folder with correct calculations */}
      <ExecutiveSummaryComp filteredData={filteredData} />
    </div>
  );
};

export default ExecutiveSummary; 