const fs = require('fs');
const readline = require('readline');
const path = require('path');

// File paths
const inputFile = path.join(__dirname, '../public/data/chase-bank-benchmark-v3.csv');
const outputFile = path.join(__dirname, '../public/processed/chase-bank-performance.json');

// Initialize data structure
const performanceData = {
  totalInvestment: 0,
  totalImpressions: 0,
  totalClicks: 0,
  totalEngagement: 0,
  mediaDistribution: {
    Digital: 0,
    Television: 0,
    Audio: 0,
    Print: 0,
    Outdoor: 0
  }
};

// Create read stream and interface
const fileStream = fs.createReadStream(inputFile, { encoding: 'utf8' });
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

let isFirstLine = true;
let headers = null;

// Process the file line by line
rl.on('line', (line) => {
  if (isFirstLine) {
    headers = line.split(',').map(header => header.trim());
    isFirstLine = false;
    return;
  }

  const values = line.split(',').map(value => value.trim());
  const row = {};
  headers.forEach((header, index) => {
    row[header] = values[index];
  });

  // Update totals
  performanceData.totalInvestment += parseFloat(row.Investment) || 0;
  performanceData.totalImpressions += parseInt(row.Impressions) || 0;
  performanceData.totalClicks += parseInt(row.Clicks) || 0;
  performanceData.totalEngagement += parseInt(row.Engagement) || 0;

  // Update media distribution
  const mediaCategory = row['Media Category'];
  if (Object.prototype.hasOwnProperty.call(performanceData.mediaDistribution, mediaCategory)) {
    performanceData.mediaDistribution[mediaCategory] += parseFloat(row.Investment) || 0;
  }
});

// Handle end of file
rl.on('close', () => {
  // Calculate percentages for media distribution
  const totalInvestment = performanceData.totalInvestment;
  Object.keys(performanceData.mediaDistribution).forEach(media => {
    performanceData.mediaDistribution[media] = 
      (performanceData.mediaDistribution[media] / totalInvestment * 100).toFixed(2);
  });

  // Save processed data
  fs.writeFileSync(outputFile, JSON.stringify(performanceData, null, 2));
  console.log('Chase Bank performance data processed successfully!');
}); 