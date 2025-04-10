import KeyMetrics from '../components/summary/KeyMetrics';
import { useDashboard } from '../context/DashboardContext';

const ExecutiveSummary = () => {
  const { dashboardData, filteredData, selectedMonths, loading } = useDashboard();
  
  return (
    <div className="p-6 h-full bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Executive Summary</h1>
        <p className="text-gray-600">Financial Services Advertising Landscape</p>
      </div>
      
      {/* Bank Performance Metrics */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Bank's Performance Metrics</h2>
        <KeyMetrics filteredData={filteredData} />
      </div>
      
      {/* Rest of your component */}
      // ... existing code ...
    </div>
  );
};

export default ExecutiveSummary; 