import React, { useState } from 'react';
import Papa from 'papaparse';

const FileUploader = ({ onDataProcessed }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const processedData = {
        bankData: new Map(),
        totalInvestment: 0,
        monthlyTrends: new Map(),
        mediaCategories: new Map()
      };

      for (const file of files) {
        const fileContent = await readFileAsText(file);
        const bankName = file.name.replace('.csv', '').replace(/-/g, ' ');
        
        const results = await processFile(fileContent, bankName);
        
        processedData.bankData.set(bankName, results);
        processedData.totalInvestment += results.totalInvestment;
        
        // Actualizar tendencias mensuales
        results.monthlyData.forEach((monthData, month) => {
          if (!processedData.monthlyTrends.has(month)) {
            processedData.monthlyTrends.set(month, { total: 0, banks: new Map() });
          }
          const monthTrend = processedData.monthlyTrends.get(month);
          monthTrend.total += monthData.total;
          monthTrend.banks.set(bankName, monthData);
        });
      }

      onDataProcessed(processedData);
    } catch (err) {
      setError('Error al procesar los archivos: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const processFile = async (fileContent, bankName) => {
    return new Promise((resolve, reject) => {
      const results = {
        data: [],
        totalInvestment: 0,
        monthlyData: new Map(),
        mediaTypeData: new Map()
      };

      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        step: (row) => {
          try {
            const investment = parseFloat(row.data['Dollars']?.replace(/[$,]/g, '')) || 0;
            const month = row.data['Month'] || 'Unknown';
            const mediaType = row.data['Media Type'] || 'Unknown';

            results.totalInvestment += investment;

            if (!results.monthlyData.has(month)) {
              results.monthlyData.set(month, { total: 0, mediaTypes: new Map() });
            }
            const monthData = results.monthlyData.get(month);
            monthData.total += investment;

            if (!monthData.mediaTypes.has(mediaType)) {
              monthData.mediaTypes.set(mediaType, 0);
            }
            monthData.mediaTypes.set(mediaType, monthData.mediaTypes.get(mediaType) + investment);

            if (!results.mediaTypeData.has(mediaType)) {
              results.mediaTypeData.set(mediaType, 0);
            }
            results.mediaTypeData.set(mediaType, results.mediaTypeData.get(mediaType) + investment);
          } catch (error) {
            console.error('Error processing row:', error);
          }
        },
        complete: () => resolve(results),
        error: (error) => reject(error)
      });
    });
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Cargar Archivos CSV</h2>
      <div className="space-y-4">
        <input
          type="file"
          multiple
          accept=".csv"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        {isLoading && (
          <div className="text-blue-600">Procesando archivos...</div>
        )}
        {error && (
          <div className="text-red-600">{error}</div>
        )}
      </div>
    </div>
  );
};

export default FileUploader; 