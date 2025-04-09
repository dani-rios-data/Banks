import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { bankColors } from '../../utils/colorSchemes';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

const InsightSection = ({ title, icon, children }) => (
  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
    <div className="flex items-center mb-4">
      <div className="p-2 rounded-full bg-gray-50 mr-3">
        <span className="text-xl">{icon}</span>
      </div>
      <h4 className="text-lg font-medium text-gray-800">{title}</h4>
    </div>
    <ul className="list-none space-y-3 text-gray-600">
      {children}
    </ul>
  </div>
);

const BulletPoint = ({ children }) => (
  <li className="flex items-start">
    <div className="min-w-[8px] h-2 w-2 rounded-full bg-blue-500 mt-2 mr-3"></div>
    <span className="flex-1">{children}</span>
  </li>
);

/**
 * Component that displays specific insights for a bank
 * @param {Object} props - Component properties
 * @param {Object} props.bank - Bank data to display
 */
const BankInsights = ({ bank }) => {
  const { dashboardData } = useDashboard();

  // Función para obtener datos de medio por categoría
  const getCategoryData = (categoryName) => {
    const category = bank.mediaBreakdown.find(media => media.category === categoryName);
    if (!category) return { amount: 0, percentage: 0 };
    return {
      amount: category.amount,
      percentage: category.percentage
    };
  };

  // Datos de medios por categoría
  const televisionData = getCategoryData('Television');
  const digitalData = getCategoryData('Digital');
  const audioData = getCategoryData('Audio');
  const printData = getCategoryData('Print');
  const outdoorData = getCategoryData('Outdoor');
  const streamingData = getCategoryData('Streaming');
  const cinemaData = getCategoryData('Cinema');

  // Encuentra el mes de mayor inversión
  const getTopMonth = () => {
    if (!dashboardData || !dashboardData.monthlyTrends) return { month: '', amount: 0 };
    
    let highestMonth = { month: '', amount: 0 };
    
    dashboardData.monthlyTrends.forEach(trend => {
      const bankData = trend.bankShares.find(share => share.bank === bank.name);
      if (bankData && bankData.investment > highestMonth.amount) {
        highestMonth = {
          month: trend.month,
          amount: bankData.investment
        };
      }
    });
    
    return highestMonth;
  };

  // Encuentra el mes de menor inversión
  const getLowestMonth = () => {
    if (!dashboardData || !dashboardData.monthlyTrends) return { month: '', amount: 0 };
    
    let lowestMonth = { month: '', amount: Number.MAX_VALUE };
    
    dashboardData.monthlyTrends.forEach(trend => {
      const bankData = trend.bankShares.find(share => share.bank === bank.name);
      if (bankData && bankData.investment > 0 && bankData.investment < lowestMonth.amount) {
        lowestMonth = {
          month: trend.month,
          amount: bankData.investment
        };
      }
    });
    
    return lowestMonth;
  };

  // Calcula datos por trimestre
  const getQuarterlyData = () => {
    if (!dashboardData || !dashboardData.monthlyTrends) return [];
    
    const quarters = {
      'Q1 2024': { months: ['January 2024', 'February 2024', 'March 2024'], total: 0 },
      'Q2 2024': { months: ['April 2024', 'May 2024', 'June 2024'], total: 0 },
      'Q3 2024': { months: ['July 2024', 'August 2024', 'September 2024'], total: 0 },
      'Q4 2024': { months: ['October 2024', 'November 2024', 'December 2024'], total: 0 },
      'Q1 2025': { months: ['January 2025', 'February 2025', 'March 2025'], total: 0 }
    };
    
    dashboardData.monthlyTrends.forEach(trend => {
      const bankData = trend.bankShares.find(share => share.bank === bank.name);
      if (bankData) {
        Object.keys(quarters).forEach(quarter => {
          if (quarters[quarter].months.includes(trend.month)) {
            quarters[quarter].total += bankData.investment;
          }
        });
      }
    });
    
    // Encuentra el trimestre con mayor inversión
    let maxQuarter = { name: '', total: 0, percentage: 0 };
    
    Object.keys(quarters).forEach(quarter => {
      if (quarters[quarter].total > maxQuarter.total) {
        maxQuarter = {
          name: quarter,
          total: quarters[quarter].total,
          percentage: (quarters[quarter].total / bank.totalInvestment) * 100
        };
      }
    });
    
    return { quarters, maxQuarter };
  };

  const topMonth = getTopMonth();
  const lowestMonth = getLowestMonth();
  const { maxQuarter } = getQuarterlyData();

  return (
    <div className="mt-6 space-y-6">
      {/* Insights Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Media Channel Distribution */}
        <InsightSection title="Media Channel Distribution" icon="📊">
          {televisionData.amount > 0 && (
            <BulletPoint>
              Television represents {televisionData.percentage > 35 ? 'the largest' : 'a significant'} media investment at {formatCurrency(televisionData.amount)} ({formatPercentage(televisionData.percentage)} of total spend)
              {digitalData.percentage > 0 ? `, followed by digital media at ${formatCurrency(digitalData.amount)} (${formatPercentage(digitalData.percentage)}).` : '.'}
            </BulletPoint>
          )}
          {audioData.amount > 0 && (
            <BulletPoint>
              Audio spending totals {formatCurrency(audioData.amount)} ({formatPercentage(audioData.percentage)} of total budget)
              {printData.amount > 0 ? `, while print investments account for ${formatCurrency(printData.amount)} (${formatPercentage(printData.percentage)}).` : '.'}
            </BulletPoint>
          )}
          {(outdoorData.amount > 0 || streamingData.amount > 0 || cinemaData.amount > 0) && (
            <BulletPoint>
              Smaller allocations include 
              {outdoorData.amount > 0 ? ` outdoor advertising (${formatCurrency(outdoorData.amount)} or ${formatPercentage(outdoorData.percentage)})` : ''}
              {streamingData.amount > 0 ? `${outdoorData.amount > 0 ? ',' : ''} streaming media (${formatCurrency(streamingData.amount)} or ${formatPercentage(streamingData.percentage)})` : ''}
              {cinemaData.amount > 0 ? `${(outdoorData.amount > 0 || streamingData.amount > 0) ? ' and' : ''} cinema (${formatCurrency(cinemaData.amount)} or ${formatPercentage(cinemaData.percentage)})` : ''}.
            </BulletPoint>
          )}
        </InsightSection>

        {/* Monthly and Quarterly Patterns */}
        <InsightSection title="Monthly and Quarterly Patterns" icon="📅">
          {topMonth.month && (
            <BulletPoint>
              {topMonth.month} shows the highest monthly spend at {formatCurrency(topMonth.amount)}
              {lowestMonth.month ? `, while ${lowestMonth.month} shows the lowest at ${formatCurrency(lowestMonth.amount)}.` : '.'}
            </BulletPoint>
          )}
          {maxQuarter.name && (
            <BulletPoint>
              {maxQuarter.name} represents the peak investment period with {formatCurrency(maxQuarter.total)} in media spending, accounting for {formatPercentage(maxQuarter.percentage)} of the annual total.
            </BulletPoint>
          )}
        </InsightSection>

        {/* Channel-Specific Insights */}
        <InsightSection title="Channel-Specific Insights" icon="📈">
          <BulletPoint>
            {bank.name} allocates {televisionData.percentage > digitalData.percentage ? 
              `a larger portion of its budget to television (${formatPercentage(televisionData.percentage)}) compared to digital (${formatPercentage(digitalData.percentage)})` : 
              `a larger portion of its budget to digital (${formatPercentage(digitalData.percentage)}) compared to television (${formatPercentage(televisionData.percentage)})`}.
          </BulletPoint>
          {audioData.percentage > 3 && (
            <BulletPoint>
              With {formatPercentage(audioData.percentage)} of spend directed to audio channels, this represents a significant investment in this medium compared to industry standards.
            </BulletPoint>
          )}
          {printData.percentage > 0 && (
            <BulletPoint>
              Print media accounts for {formatPercentage(printData.percentage)} of the total budget, showing {printData.percentage > 5 ? 'continued commitment to' : 'selective use of'} traditional print channels.
            </BulletPoint>
          )}
        </InsightSection>
      </div>
    </div>
  );
};

export default BankInsights;