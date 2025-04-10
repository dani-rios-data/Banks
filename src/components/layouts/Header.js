import React, { useEffect, useState } from 'react';
import { bankColors } from '../../utils/colorSchemes';
import Papa from 'papaparse';

/**
 * Header component for the dashboard
 */
const Header = () => {
  const [dateRange, setDateRange] = useState('');
  
  useEffect(() => {
    // Función para obtener el rango de fechas del CSV
    const fetchDateRange = async () => {
      try {
        const response = await fetch('consolidated_banks_data.csv');
        if (!response.ok) {
          throw new Error('No se pudo descargar el archivo CSV');
        }
        const csvData = await response.text();
        
        // Parsear CSV
        Papa.parse(csvData, {
          header: true,
          complete: (results) => {
            const months = results.data
              .filter(row => row.Month) // Filtrar filas sin mes
              .map(row => {
                // Extraer año y mes para ordenar correctamente
                const [monthName, year] = row.Month ? row.Month.split(' ') : ['', ''];
                return { 
                  fullMonth: row.Month,
                  year: parseInt(year) || 0,
                  monthOrder: getMonthOrder(monthName)
                };
              });
            
            // Ordenar por año y mes
            months.sort((a, b) => {
              if (a.year !== b.year) return a.year - b.year;
              return a.monthOrder - b.monthOrder;
            });
            
            // Encontrar el mes más antiguo y más reciente
            const firstMonth = months.length > 0 ? months[0].fullMonth : '';
            const lastMonth = months.length > 0 ? months[months.length - 1].fullMonth : '';
            
            if (firstMonth && lastMonth) {
              setDateRange(`${firstMonth} - ${lastMonth}`);
            }
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            setDateRange('February 2023 - March 2025'); // Fallback
          }
        });
      } catch (error) {
        console.error('Error fetching CSV:', error);
        setDateRange('February 2023 - March 2025'); // Fallback
      }
    };
    
    fetchDateRange();
  }, []);
  
  // Función auxiliar para obtener el orden numérico del mes
  const getMonthOrder = (monthName) => {
    const months = {
      'January': 1, 'February': 2, 'March': 3, 'April': 4,
      'May': 5, 'June': 6, 'July': 7, 'August': 8,
      'September': 9, 'October': 10, 'November': 11, 'December': 12
    };
    return months[monthName] || 0;
  };

  return (
    <div className="w-full bg-white">
      <div className="w-full px-8 py-3 border-b border-gray-100">
        <div className="flex items-center">
          <div className="flex items-center space-x-6 min-w-[300px]">
            <div 
              className="p-2 rounded-lg flex items-center justify-center overflow-hidden"
              style={{ 
                backgroundColor: '#CD1309',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                width: '120px',
                height: '40px',
                position: 'relative'
              }}
            >
              <img 
                src="./assets/Wells-Fargo-Embleme.svg" 
                alt="Wells Fargo Logo" 
                className="h-8 w-auto object-contain"
                style={{ 
                  filter: 'brightness(0) saturate(100%) invert(73%) sepia(88%) saturate(1128%) hue-rotate(359deg) brightness(105%) contrast(106%)',
                  transform: 'scale(1.1)',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  display: 'block',
                  position: 'relative',
                  zIndex: 1
                }}
              />
            </div>
            <p className="text-xs text-gray-600 font-medium">
              {dateRange}
            </p>
          </div>
          <div className="flex-1 flex justify-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Banking Advertising Investment Analysis
            </h1>
          </div>
          <div className="min-w-[300px]"></div>
        </div>
      </div>
      <div 
        className="h-0.5 w-full"
        style={{
          background: `linear-gradient(90deg, 
            ${bankColors['Wells Fargo']}00 0%, 
            ${bankColors['Wells Fargo']}40 25%, 
            ${bankColors['Wells Fargo']}40 75%, 
            ${bankColors['Wells Fargo']}00 100%
          )`
        }}
      ></div>
    </div>
  );
};

export default Header;