import React, { useMemo, useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import Icons from './Icons';

/**
 * Global filters component that includes year and month filters
 */
const GlobalFilters = () => {
  const { 
    dashboardData,
    selectedYears = [],
    setSelectedYears,
    selectedMonths = [], 
    setSelectedMonths,
    showYearFilter,
    setShowYearFilter,
    showMonthFilter, 
    setShowMonthFilter,
    tempSelectedYears = [],
    setTempSelectedYears,
    tempSelectedMonths = [], 
    setTempSelectedMonths 
  } = useDashboard();

  // Depurar formatos de meses al cargar el componente
  useEffect(() => {
    if (dashboardData) {
      console.log("GlobalFilters - Meses disponibles:", {
        mesesDisponibles: dashboardData.monthlyTrends
          ? dashboardData.monthlyTrends.slice(0, 5).map(m => ({ 
              month: m.month,  // Formato interno (ej: "2023-01")
              rawMonth: m.rawMonth  // Formato visible (ej: "January 2023")
            }))
          : [],
        mesesSeleccionados: selectedMonths
      });
    }
  }, [dashboardData, selectedMonths]);

  // Get unique years from the Year column and sort numerically
  const availableYears = useMemo(() => {
    if (!dashboardData || !dashboardData.rawData) return [];
    return [...new Set(dashboardData.rawData.map(row => row.Year) || [])].sort((a, b) => parseInt(a) - parseInt(b));
  }, [dashboardData]);
  
  // Get unique months from the Month column and filter by selected years if any
  const availableMonthsRaw = useMemo(() => {
    if (!dashboardData || !dashboardData.rawData) return [];
    const allMonths = [...new Set(dashboardData.rawData.map(row => row.Month) || [])];
    
    // Si años están seleccionados, filtrar meses para incluir solo esos años
    if (selectedYears.length > 0) {
      return allMonths.filter(month => {
        const yearPart = month.split(' ')[1];
        return selectedYears.includes(yearPart);
      });
    }
    
    return allMonths;
  }, [dashboardData, selectedYears]);
  
  // Sort months chronologically
  const availableMonths = useMemo(() => {
    const sortedMonths = availableMonthsRaw.sort((a, b) => {
      // Parse month strings in format "Month Year"
      const [monthA, yearA] = a.split(' ');
      const [monthB, yearB] = b.split(' ');
      
      // Define month order for sorting
      const monthOrder = {
        'January': 1, 'February': 2, 'March': 3, 'April': 4,
        'May': 5, 'June': 6, 'July': 7, 'August': 8,
        'September': 9, 'October': 10, 'November': 11, 'December': 12
      };
      
      // Compare years first, then months
      if (yearA !== yearB) {
        return parseInt(yearA) - parseInt(yearB);
      }
      return monthOrder[monthA] - monthOrder[monthB];
    });
    
    console.log("GlobalFilters - Meses ordenados disponibles:", sortedMonths);
    return sortedMonths;
  }, [availableMonthsRaw]);

  // Function to format month names
  const formatMonth = (monthStr) => {
    if (!monthStr) return '';
    
    // Si ya está en formato "Month Year", mostrarlo directamente
    if (monthStr.includes(' ')) {
      return monthStr;
    }
    
    // Si está en formato "YYYY-MM", convertirlo a "Month Year"
    if (monthStr.includes('-')) {
      try {
        const [year, month] = monthStr.split('-');
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const monthIndex = parseInt(month, 10) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          return `${monthNames[monthIndex]} ${year}`;
        }
      } catch (error) {
        console.error("Error al formatear mes:", error);
      }
    }
    
    return monthStr; // Devolver el formato original si no se pudo convertir
  };

  // Debug function to log month formats
  const debugMonthFormats = () => {
    console.log("Available Months:", availableMonths);
    console.log("Selected Months:", selectedMonths);
    console.log("Temp Selected Months:", tempSelectedMonths);
  };

  if (!dashboardData) return null;

  return (
    <div className="w-full bg-white border-b">
      <div className="w-full px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="text-gray-700 font-medium flex items-center gap-2">
            {Icons.calendar}
            Global Filters
          </div>
          
          {/* Year Filter */}
          <div className="relative flex items-center">
            <button 
              className="flex items-center px-4 py-2 border rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              onClick={() => {
                setShowYearFilter(!showYearFilter);
                if (showMonthFilter) setShowMonthFilter(false);
                
                // Reset tempSelectedYears if toggling off
                if (showYearFilter) {
                  setTempSelectedYears([...selectedYears]);
                }
              }}
            >
              {selectedYears.length === 0 ? 'All Years' : 
               selectedYears.length === 1 ? `Year: ${selectedYears[0]}` :
               `${selectedYears.length} Years Selected`}
              {Icons.dropdown}
            </button>
            
            {showYearFilter && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white border rounded-md shadow-lg z-50">
                <div className="p-3 border-b">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-700">Filter by Year</h3>
                    <button 
                      className="text-sm text-blue-500 hover:text-blue-700"
                      onClick={() => {
                        if (tempSelectedYears.length === availableYears.length) {
                          setTempSelectedYears([]);
                        } else {
                          setTempSelectedYears([...availableYears]);
                        }
                      }}
                    >
                      {tempSelectedYears.length === availableYears.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {availableYears.map(year => (
                      <div key={year} className="flex items-center">
                        <input 
                          type="checkbox" 
                          id={`year-${year}`}
                          checked={tempSelectedYears.includes(year)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTempSelectedYears([...tempSelectedYears, year]);
                            } else {
                              setTempSelectedYears(tempSelectedYears.filter(y => y !== year));
                            }
                          }}
                          className="mr-2 h-4 w-4 text-blue-600 rounded"
                        />
                        <label htmlFor={`year-${year}`} className="text-sm text-gray-700">
                          {year}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 flex justify-end gap-2 bg-gray-50">
                  <button 
                    className="px-3 py-1 text-sm rounded border text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      setTempSelectedYears([]);
                      setShowYearFilter(false);
                    }}
                  >
                    Clear
                  </button>
                  <button 
                    className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => {
                      // When applying year filter, reset the month filter if needed
                      if (JSON.stringify(selectedYears) !== JSON.stringify(tempSelectedYears)) {
                        // Years changed, reset month filter
                        setSelectedMonths([]);
                        setTempSelectedMonths([]);
                      }
                      
                      setSelectedYears(tempSelectedYears);
                      setShowYearFilter(false);
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
            
            {selectedYears.length > 0 && (
              <div className="flex items-center px-3 py-1 bg-blue-50 text-sm text-blue-700 rounded-full ml-2">
                <span>{selectedYears.length} {selectedYears.length === 1 ? 'year' : 'years'} selected</span>
                <button 
                  className="ml-2 rounded-full p-1 hover:bg-blue-100"
                  onClick={() => {
                    setSelectedYears([]);
                    // Clear month selection as well when clearing years
                    setSelectedMonths([]);
                  }}
                >
                  {Icons.close}
                </button>
              </div>
            )}
          </div>
          
          {/* Month Filter */}
          <div className="relative flex items-center">
            <button 
              className="flex items-center px-4 py-2 border rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              onClick={() => {
                setShowMonthFilter(!showMonthFilter);
                if (showYearFilter) setShowYearFilter(false);
                
                // Reset tempSelectedMonths if toggling off
                if (showMonthFilter) {
                  setTempSelectedMonths([...selectedMonths]);
                }
              }}
            >
              {selectedMonths.length === 0 ? 'All Months' : 
               selectedMonths.length === 1 ? `Month: ${formatMonth(selectedMonths[0])}` :
               `${selectedMonths.length} Months Selected`}
              {Icons.dropdown}
            </button>
            
            {showMonthFilter && (
              <div className="absolute left-0 top-full mt-2 w-72 bg-white border rounded-md shadow-lg z-50">
                <div className="p-3 border-b">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-700">Filter by Month</h3>
                    <button 
                      className="text-sm text-blue-500 hover:text-blue-700"
                      onClick={() => {
                        if (tempSelectedMonths.length === availableMonths.length) {
                          setTempSelectedMonths([]);
                        } else {
                          setTempSelectedMonths([...availableMonths]);
                        }
                      }}
                    >
                      {tempSelectedMonths.length === availableMonths.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                    {availableMonths.map(month => (
                      <div key={month} className="flex items-center">
                        <input 
                          type="checkbox" 
                          id={`month-${month}`}
                          checked={tempSelectedMonths.includes(month)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTempSelectedMonths([...tempSelectedMonths, month]);
                              console.log(`Added month: ${month}`);
                            } else {
                              setTempSelectedMonths(tempSelectedMonths.filter(m => m !== month));
                              console.log(`Removed month: ${month}`);
                            }
                          }}
                          className="mr-2 h-4 w-4 text-blue-600 rounded"
                        />
                        <label htmlFor={`month-${month}`} className="text-sm text-gray-700">
                          {formatMonth(month)}
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
                      // Normalizar formatos de meses si es necesario
                      const normalizedMonths = tempSelectedMonths.map(month => {
                        // Asegurarse de que todos los meses estén en el formato esperado por el CSV
                        // Asumimos que el CSV espera el formato "Month Year" (ej: "January 2023")
                        
                        // Si ya está en formato "Month Year", dejarlo como está
                        if (month.includes(' ') && !month.includes('-')) {
                          return month;
                        }
                        
                        // Si está en formato "YYYY-MM", convertirlo
                        if (month.includes('-')) {
                          try {
                            const [year, monthNum] = month.split('-');
                            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                                              'July', 'August', 'September', 'October', 'November', 'December'];
                            const monthIndex = parseInt(monthNum, 10) - 1;
                            
                            if (monthIndex >= 0 && monthIndex < 12) {
                              return `${monthNames[monthIndex]} ${year}`;
                            }
                          } catch (error) {
                            console.error("Error al normalizar formato de mes:", error, month);
                          }
                        }
                        
                        return month; // Mantener el formato original si no se puede normalizar
                      });
                      
                      console.log("Aplicando filtro de meses:", {
                        mesesOriginal: tempSelectedMonths,
                        mesesNormalizados: normalizedMonths
                      });
                      
                      // Aplicar el filtro con los meses normalizados
                      setSelectedMonths(normalizedMonths);
                      
                      // Depuración
                      debugMonthFormats();
                      console.log("Formatos de meses disponibles en CSV:", 
                        dashboardData?.rawData 
                          ? [...new Set(dashboardData.rawData.slice(0, 50).map(row => row.Month))].slice(0, 10) 
                          : []
                      );
                      
                      // Cerrar el dropdown
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

export default GlobalFilters; 