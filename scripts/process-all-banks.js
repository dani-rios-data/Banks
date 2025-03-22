const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');

// Bancos a procesar
const banks = [
  { 
    name: 'Wells Fargo Bank', 
    file: '../public/data/wells-fargo-bank-benchmark-v3-1.csv', 
    output: '../public/processed/wells-fargo-performance.json'
  },
  { 
    name: 'Bank of America', 
    file: '../public/data/bank-of-america-benchmark-v2.csv', 
    output: '../public/processed/bank-of-america-performance.json'
  },
  { 
    name: 'TD Bank', 
    file: '../public/data/td-bank-benchmark-v3.csv', 
    output: '../public/processed/td-bank-performance.json'
  },
  { 
    name: 'Capital One', 
    file: '../public/data/capital-one-benchmark-v3.csv', 
    output: '../public/processed/capital-one-performance.json'
  },
  { 
    name: 'PNC Bank', 
    file: '../public/data/pnc-bank-benchmark-v3.csv', 
    output: '../public/processed/pnc-bank-performance.json'
  }
];

// Asegurarnos de que el directorio de salida existe
const processedDir = path.resolve(__dirname, '../public/processed');
if (!fs.existsSync(processedDir)) {
  fs.mkdirSync(processedDir, { recursive: true });
}

// Procesar cada banco
async function processAllBanks() {
  console.log('Comenzando procesamiento de datos de todos los bancos...');
  
  for (const bank of banks) {
    try {
      await processBank(bank);
      console.log(`✅ Datos de ${bank.name} procesados exitosamente`);
    } catch (error) {
      console.error(`❌ Error al procesar ${bank.name}:`, error.message);
    }
  }
  
  console.log('Procesamiento completado.');
}

// Función para procesar un banco individual
async function processBank(bankConfig) {
  return new Promise((resolve, reject) => {
    console.log(`Procesando ${bankConfig.name}...`);
    
    // Verificar si el archivo de origen existe
    const filePath = path.resolve(__dirname, bankConfig.file);
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`El archivo ${filePath} no existe`));
    }
    
    // Preparar la estructura para los datos agregados
    const monthlyData = {};
    let totalInvestment = 0;
    let totalMarketShare = 0;
    let monthCount = 0;
    let peakInvestment = { month: '', value: 0 };
    let lowestInvestment = { month: '', value: Number.MAX_SAFE_INTEGER };
    
    // Stream para leer el archivo CSV
    const parser = parse({
      delimiter: ',',
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    // Iniciar el procesamiento
    fs.createReadStream(filePath)
      .pipe(parser)
      .on('data', (record) => {
        // Obtener valores de cada registro
        const date = record.date || record.Date || '';
        const investment = parseFloat(record.investment || record.Investment || 0);
        const marketShare = parseFloat(record.market_share || record.marketShare || record['Market Share'] || 0);
        
        // Validar que tengamos datos válidos
        if (!date || isNaN(investment)) return;
        
        // Formatear la fecha como YYYY-MM
        let month;
        try {
          // Intentar diferentes formatos de fecha
          if (date.includes('/')) {
            // Formato MM/DD/YYYY
            const parts = date.split('/');
            month = `${parts[2]}-${parts[0].padStart(2, '0')}`;
          } else if (date.includes('-')) {
            // Formato YYYY-MM-DD
            month = date.substring(0, 7);
          } else {
            // Otros formatos o fallback
            const dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) throw new Error('Invalid date');
            month = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
          }
        } catch (e) {
          console.warn(`Fecha inválida: ${date}, usando fallback`);
          month = '2024-01'; // Fallback por defecto
        }
        
        // Agregar datos al mes correspondiente
        if (!monthlyData[month]) {
          monthlyData[month] = {
            investment: 0,
            marketShare: 0,
            count: 0
          };
        }
        
        monthlyData[month].investment += investment;
        monthlyData[month].marketShare += marketShare;
        monthlyData[month].count++;
        
        // Actualizar totales
        totalInvestment += investment;
        totalMarketShare += marketShare;
        monthCount++;
        
        // Verificar si es pico o valle
        if (monthlyData[month].investment > peakInvestment.value) {
          peakInvestment = { month, value: monthlyData[month].investment };
        }
        if (monthlyData[month].investment < lowestInvestment.value && monthlyData[month].investment > 0) {
          lowestInvestment = { month, value: monthlyData[month].investment };
        }
      })
      .on('error', (error) => {
        reject(error);
      })
      .on('end', () => {
        // Calcular promedios
        const averageMarketShare = monthCount > 0 ? totalMarketShare / monthCount : 0;
        
        // Convertir datos mensuales a array y ordenarlos
        const monthlyPerformance = Object.entries(monthlyData).map(([month, data]) => ({
          month,
          investment: data.investment,
          marketShare: data.count > 0 ? data.marketShare / data.count : 0,
          // Se calculará el cambio mes a mes después
          monthOverMonthChange: 0
        }));
        
        // Ordenar cronológicamente
        monthlyPerformance.sort((a, b) => a.month.localeCompare(b.month));
        
        // Calcular cambio mes a mes
        for (let i = 1; i < monthlyPerformance.length; i++) {
          const current = monthlyPerformance[i];
          const previous = monthlyPerformance[i-1];
          
          if (previous.investment > 0) {
            current.monthOverMonthChange = ((current.investment - previous.investment) / previous.investment) * 100;
          }
        }
        
        // Calcular tendencias
        const firstMonth = monthlyPerformance[0];
        const lastMonth = monthlyPerformance[monthlyPerformance.length - 1];
        
        let investmentTrend = 0;
        let marketShareTrend = 0;
        
        if (firstMonth && lastMonth && firstMonth.investment > 0) {
          investmentTrend = ((lastMonth.investment - firstMonth.investment) / firstMonth.investment) * 100;
        }
        
        if (firstMonth && lastMonth && firstMonth.marketShare > 0) {
          marketShareTrend = ((lastMonth.marketShare - firstMonth.marketShare) / firstMonth.marketShare) * 100;
        }
        
        // Crear objeto final
        const result = {
          summary: {
            totalInvestment,
            averageMarketShare,
            peakInvestment,
            lowestInvestment,
            investmentTrend,
            marketShareTrend
          },
          monthlyPerformance
        };
        
        // Guardar archivo JSON
        const outputPath = path.resolve(__dirname, bankConfig.output);
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        
        resolve();
      });
  });
}

// Ejecutar el procesamiento
processAllBanks().catch(error => {
  console.error('Error en el procesamiento general:', error);
  process.exit(1);
}); 