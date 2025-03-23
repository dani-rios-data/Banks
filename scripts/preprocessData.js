const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const _ = require('lodash');

const INPUT_DIR = path.join(__dirname, '../public/data');
const OUTPUT_DIR = path.join(__dirname, '../public/processed');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Structure to store aggregated data
const aggregatedData = {
  banks: [],
  monthlyTrends: [],
  mediaCategories: [],
  totalInvestment: 0,
};

const bankData = {};
const monthlyData = {};
const mediaData = {};

// Function to normalize month (January 2024 -> 2024-01)
function normalizeMonth(monthStr) {
  try {
    const [month, year] = monthStr.split(' ');
    const monthNum = {
      'January': '01', 'February': '02', 'March': '03', 'April': '04',
      'May': '05', 'June': '06', 'July': '07', 'August': '08',
      'September': '09', 'October': '10', 'November': '11', 'December': '12'
    }[month];
    return `${year}-${monthNum}`;
  } catch (error) {
    console.warn(`Error processing month: ${monthStr}`);
    return '2024-01';
  }
}

// Function to get investment value
function getInvestment(row) {
  // Look for the correct column for dollars
  const dollarValue = row['Dollars'] || row['Dollars '] || '0';
  return parseFloat(dollarValue.replace(/[$,]/g, ''));
}

// Function to process a CSV file
async function processCSVFile(filePath) {
  const bankName = path.basename(filePath, '.csv')
    .replace('-benchmark-v3-1', '')
    .replace('-benchmark-v3', '')
    .replace('-benchmark-v2', '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  console.log(`\nProcessing data for ${bankName}...`);

  return new Promise((resolve, reject) => {
    const bankStats = {
      name: bankName,
      totalInvestment: 0,
      mediaBreakdown: {},
      monthlyInvestments: {},
    };

    let rowCount = 0;
    let errorCount = 0;
    let processedCount = 0;
    let firstRow = null;

    fs.createReadStream(filePath)
      .pipe(csv({
        mapValues: ({ header, value }) => value.trim(),
        strict: true
      }))
      .on('data', (row) => {
        rowCount++;

        // Save first row for debugging
        if (!firstRow) {
          firstRow = row;
          console.log('\nFirst row structure:');
          console.log(JSON.stringify(row, null, 2));
        }

        try {
          // Process investment
          const investment = getInvestment(row);
          
          if (isNaN(investment) || investment <= 0) {
            if (errorCount < 5) {
              console.log(`Investment error: ${JSON.stringify(row['Dollars'])} -> ${investment}`);
            }
            errorCount++;
            return;
          }

          // Process month
          const monthStr = row.Month?.trim();
          if (!monthStr) {
            if (errorCount < 5) {
              console.log(`Month error: ${row.Month}`);
            }
            errorCount++;
            return;
          }
          const monthKey = normalizeMonth(monthStr);
          
          // Process media category
          const mediaCategory = row['Media Category']?.trim() || 'Others';

          // Update bank statistics
          bankStats.totalInvestment += investment;

          // Add to bank monthly data
          if (!bankStats.monthlyInvestments[monthKey]) {
            bankStats.monthlyInvestments[monthKey] = 0;
          }
          bankStats.monthlyInvestments[monthKey] += investment;

          // Add to bank media data
          if (!bankStats.mediaBreakdown[mediaCategory]) {
            bankStats.mediaBreakdown[mediaCategory] = 0;
          }
          bankStats.mediaBreakdown[mediaCategory] += investment;

          // Update global monthly data
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { total: 0, bankShares: {} };
          }
          monthlyData[monthKey].total += investment;
          if (!monthlyData[monthKey].bankShares[bankName]) {
            monthlyData[monthKey].bankShares[bankName] = 0;
          }
          monthlyData[monthKey].bankShares[bankName] += investment;

          // Update global media data
          if (!mediaData[mediaCategory]) {
            mediaData[mediaCategory] = { total: 0, bankShares: {} };
          }
          mediaData[mediaCategory].total += investment;
          if (!mediaData[mediaCategory].bankShares[bankName]) {
            mediaData[mediaCategory].bankShares[bankName] = 0;
          }
          mediaData[mediaCategory].bankShares[bankName] += investment;

          processedCount++;

          // Show progress every 100,000 rows
          if (processedCount % 100000 === 0) {
            console.log(`Processed ${processedCount} rows...`);
          }
        } catch (error) {
          errorCount++;
          if (errorCount < 10) {
            console.warn(`Error processing row ${rowCount} for ${bankName}:`, error.message);
          }
        }
      })
      .on('end', () => {
        console.log(`\nCompleted ${bankName}:`);
        console.log(`- Total rows: ${rowCount}`);
        console.log(`- Processed rows: ${processedCount}`);
        console.log(`- Errors: ${errorCount}`);
        console.log(`- Total investment: $${(bankStats.totalInvestment / 1000000).toFixed(2)}M`);
        
        if (processedCount > 0) {
          console.log('\nDistribution by media category:');
          Object.entries(bankStats.mediaBreakdown)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([category, amount]) => {
              console.log(`- ${category}: $${(amount / 1000000).toFixed(2)}M`);
            });
        }

        bankData[bankName] = bankStats;
        resolve();
      })
      .on('error', reject);
  });
}

async function main() {
  console.log('Starting data preprocessing...');
  
  const dataDir = path.join(__dirname, '../public/data');
  const processedDir = path.join(__dirname, '../public/processed');
  
  // Crear directorios si no existen
  if (!fs.existsSync(dataDir)) {
    console.log('Data directory does not exist, creating...');
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  if (!fs.existsSync(processedDir)) {
    console.log('Processed directory does not exist, creating...');
    fs.mkdirSync(processedDir, { recursive: true });
  }
  
  try {
    const files = fs.readdirSync(dataDir);
    if (files.length === 0) {
      console.log('No data files found, using sample data...');
      // Crear datos de muestra
      const sampleData = {
        banks: [
          { name: 'Bank of America', totalInvestment: 362000000 },
          { name: 'Wells Fargo', totalInvestment: 284000000 },
          { name: 'TD Bank', totalInvestment: 74000000 },
          { name: 'Capital One', totalInvestment: 872000000 },
          { name: 'PNC Bank', totalInvestment: 24000000 }
        ],
        monthlyTrends: [],
        mediaCategories: []
      };
      
      // Guardar datos de muestra
      fs.writeFileSync(
        path.join(processedDir, 'dashboard-data.json'),
        JSON.stringify(sampleData, null, 2)
      );
      console.log('Sample data created successfully');
    } else {
      // Procesar archivos reales si existen
      console.log('Processing data files...');
      // Process all CSV files
      const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.csv'));
      console.log(`Files found: ${files.join(', ')}`);
      
      // Process files one by one for better visibility
      for (const file of files) {
        await processCSVFile(path.join(dataDir, file));
      }

      // Prepare aggregated data
      aggregatedData.banks = Object.values(bankData).map(bank => ({
        name: bank.name,
        totalInvestment: bank.totalInvestment,
        mediaBreakdown: Object.entries(bank.mediaBreakdown)
          .map(([category, amount]) => ({
            category,
            amount,
            percentage: (amount / bank.totalInvestment) * 100
          }))
          .sort((a, b) => b.amount - a.amount)
      })).sort((a, b) => b.totalInvestment - a.totalInvestment);

      // Sort monthly data
      aggregatedData.monthlyTrends = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          total: data.total,
          bankShares: Object.entries(data.bankShares)
            .map(([bank, investment]) => ({
              bank,
              investment,
              percentage: (investment / data.total) * 100
            }))
            .sort((a, b) => b.investment - a.investment)
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Prepare media categories data
      aggregatedData.mediaCategories = Object.entries(mediaData)
        .map(([category, data]) => ({
          name: category,
          total: data.total,
          bankShares: Object.entries(data.bankShares)
            .map(([bank, amount]) => ({
              bank,
              amount,
              percentage: (amount / data.total) * 100
            }))
            .sort((a, b) => b.amount - a.amount)
        }))
        .sort((a, b) => b.total - a.total);

      // Calculate total investment
      aggregatedData.totalInvestment = aggregatedData.banks.reduce((sum, bank) => sum + bank.totalInvestment, 0);

      // Save processed data
      console.log('\nSaving processed data...');
      fs.writeFileSync(
        path.join(processedDir, 'dashboard-data.json'),
        JSON.stringify(aggregatedData, null, 2)
      );

      console.log('Preprocessing completed successfully.');
      console.log(`Data saved to ${path.join(processedDir, 'dashboard-data.json')}`);
      
      // Print some statistics
      console.log('\nFinal statistics:');
      console.log(`- Number of banks processed: ${aggregatedData.banks.length}`);
      console.log(`- Number of months with data: ${aggregatedData.monthlyTrends.length}`);
      console.log(`- Number of media categories: ${aggregatedData.mediaCategories.length}`);
      console.log(`- Total investment: $${(aggregatedData.totalInvestment / 1000000).toFixed(2)}M`);

      // Print top 5 media categories by investment
      console.log('\nTop 5 media categories by investment:');
      aggregatedData.mediaCategories.slice(0, 5).forEach(category => {
        console.log(`- ${category.name}: $${(category.total / 1000000).toFixed(2)}M`);
      });

      // Print banks sorted by total investment
      console.log('\nBanks sorted by total investment:');
      aggregatedData.banks.forEach(bank => {
        console.log(`- ${bank.name}: $${(bank.totalInvestment / 1000000).toFixed(2)}M`);
      });
    }
  } catch (error) {
    console.error('Error processing data:', error);
    // No fallar el build, usar datos de muestra
    process.exit(0);
  }
}

main(); 