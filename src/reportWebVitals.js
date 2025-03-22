import { processData, loadPaginatedData } from './utils/dataProcessor';

const reportWebVitals = (onPerfEntry) => {
    if (onPerfEntry && onPerfEntry instanceof Function) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(onPerfEntry);
        getFID(onPerfEntry);
        getFCP(onPerfEntry);
        getLCP(onPerfEntry);
        getTTFB(onPerfEntry);
      });
    }
  };
  
  export default reportWebVitals;

// Cargar todos los datos
const allData = await processData();

// O cargar datos paginados
const pageSize = 100;
const page = 1;
const paginatedData = await loadPaginatedData(page, pageSize);