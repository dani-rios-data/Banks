import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import Icons from './Icons';

/**
 * Global month filter component
 */
const MonthFilter = () => {
  const { 
    dashboardData,
    selectedMonths = [], 
    setSelectedMonths, 
    showMonthFilter, 
    setShowMonthFilter,
    tempSelectedMonths = [], 
    setTempSelectedMonths 
  } = useDashboard();

  // Get unique months from dashboard data
  const monthData = dashboardData?.monthlyTrends || [];
  const totalMonths = monthData.length;

  // Function to format date from "YYYY-MM" to "MMM YYYY"
  const formatMonth = (dateStr) => {
    const [year, month] = dateStr.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="w-full bg-white border-b">
      <div className="w-full px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="text-gray-700 font-medium flex items-center gap-2">
            {Icons.calendar}
            Global Month Filter
          </div>
          
          <div className="relative flex items-center">
            <button 
              className="flex items-center px-4 py-2 border rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              onClick={() => setShowMonthFilter(!showMonthFilter)}
            >
              {selectedMonths.length === 0 ? 'All Months' : 
               selectedMonths.length === 1 ? formatMonth(selectedMonths[0]) :
               `${selectedMonths.length} Months Selected`}
              {Icons.dropdown}
            </button>
            
            {showMonthFilter && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-white border rounded-md shadow-lg z-50">
                <div className="p-3 border-b">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-700">Filter by Month</h3>
                    <button 
                      className="text-sm text-blue-500 hover:text-blue-700"
                      onClick={() => {
                        if (tempSelectedMonths.length === totalMonths) {
                          setTempSelectedMonths([]);
                        } else {
                          setTempSelectedMonths(monthData.map(item => item.month));
                        }
                      }}
                    >
                      {tempSelectedMonths.length === totalMonths ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {monthData.map(item => (
                      <div key={item.month} className="flex items-center">
                        <input 
                          type="checkbox" 
                          id={`month-${item.month}`}
                          checked={tempSelectedMonths.includes(item.month)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTempSelectedMonths([...tempSelectedMonths, item.month]);
                            } else {
                              setTempSelectedMonths(tempSelectedMonths.filter(m => m !== item.month));
                            }
                          }}
                          className="mr-2 h-4 w-4 text-blue-600 rounded"
                        />
                        <label htmlFor={`month-${item.month}`} className="text-sm text-gray-700">
                          {formatMonth(item.month)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 flex justify-end gap-2 bg-gray-50">
                  <button 
                    className="px-3 py-1 text-sm rounded border text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      setTempSelectedMonths([]);
                      setShowMonthFilter(false);
                    }}
                  >
                    Clear
                  </button>
                  <button 
                    className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => {
                      setSelectedMonths(tempSelectedMonths);
                      setShowMonthFilter(false);
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
            
            {selectedMonths.length > 0 && (
              <div className="flex items-center px-3 py-1 bg-blue-50 text-sm text-blue-700 rounded-full ml-2">
                <span>{selectedMonths.length} {selectedMonths.length === 1 ? 'month' : 'months'} selected</span>
                <button 
                  className="ml-2 rounded-full p-1 hover:bg-blue-100"
                  onClick={() => setSelectedMonths([])}
                >
                  {Icons.close}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthFilter;