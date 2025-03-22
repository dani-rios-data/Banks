const fs = require('fs');
const { parse } = require('csv-parse');
const path = require('path');

// Configurar el procesamiento de datos
const monthlyData = {};

// Crear el parser y el stream
const parser = parse({
  columns: true,
  skip_empty_lines: true
});

// Procesar cada registro
parser.on('readable', function() {
  let record;
  while ((record = parser.read()) !== null) {
    const date = new Date(record.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        investment: 0,
        totalMarketInvestment: 0
      };
    }
    
    monthlyData[monthKey].investment += parseFloat(record.investment);
    monthlyData[monthKey].totalMarketInvestment += parseFloat(record.total_market_investment);
  }
});

// Manejar el fin del procesamiento
parser.on('end', function() {
  // Calcular tendencias mensuales
  const monthlyPerformance = Object.entries(monthlyData)
    .map(([month, data]) => {
      const marketShare = (data.investment / data.totalMarketInvestment) * 100;
      return {
        month,
        investment: Math.round(data.investment),
        marketShare: Number(marketShare.toFixed(2)),
        momChange: 0 // Se calculará después
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));

  // Calcular cambios mes a mes
  monthlyPerformance.forEach((month, index) => {
    if (index > 0) {
      const prevMonth = monthlyPerformance[index - 1];
      month.momChange = Number(((month.investment - prevMonth.investment) / prevMonth.investment * 100).toFixed(2));
    }
  });

  // Calcular resumen
  const summary = {
    totalInvestment: monthlyPerformance.reduce((sum, month) => sum + month.investment, 0),
    averageMarketShare: Number((monthlyPerformance.reduce((sum, month) => sum + month.marketShare, 0) / monthlyPerformance.length).toFixed(2)),
    peakInvestment: Math.max(...monthlyPerformance.map(m => m.investment)),
    peakMonth: monthlyPerformance.reduce((max, month) => month.investment > max.investment ? month : max).month,
    lowestInvestment: Math.min(...monthlyPerformance.map(m => m.investment)),
    lowestMonth: monthlyPerformance.reduce((min, month) => month.investment < min.investment ? month : min).month,
    averageMonthlyInvestment: Math.round(monthlyPerformance.reduce((sum, month) => sum + month.investment, 0) / monthlyPerformance.length),
    investmentTrend: calculateTrend(monthlyPerformance.map(m => m.investment)),
    marketShareTrend: calculateTrend(monthlyPerformance.map(m => m.marketShare))
  };

  // Función auxiliar para calcular tendencia
  function calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const xValues = Array.from({ length: values.length }, (_, i) => i);
    const xMean = xValues.reduce((a, b) => a + b, 0) / xValues.length;
    const yMean = values.reduce((a, b) => a + b, 0) / values.length;
    
    const numerator = xValues.reduce((sum, x, i) => sum + (x - xMean) * (values[i] - yMean), 0);
    const denominator = xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0);
    
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const percentage = values[0] !== 0 ? (slope * values.length) / values[0] * 100 : 0;
    
    if (Math.abs(percentage) < 5) return 'stable';
    return percentage > 0 ? 'increasing' : 'decreasing';
  }

  // Guardar resultados
  const output = {
    monthlyPerformance,
    summary
  };

  fs.writeFileSync(
    path.join(__dirname, '../public/processed/wells-fargo-performance.json'),
    JSON.stringify(output, null, 2)
  );

  console.log('Datos de Wells Fargo procesados exitosamente');
});

// Manejar errores
parser.on('error', function(err) {
  console.error('Error al procesar el archivo:', err.message);
});

// Leer el archivo
fs.createReadStream(path.join(__dirname, '../public/data/wells-fargo-bank-benchmark-v3-1.csv')).pipe(parser); 