import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { bankColors } from '../../utils/colorSchemes';
import Icons from '../common/Icons';

/**
 * Component that displays specific insights for a bank
 * @param {Object} props - Component properties
 * @param {Object} props.bank - Bank data to display
 */
const BankInsights = ({ bank }) => {
  const { dashboardData, selectedMonths } = useDashboard();

  // Find the bank's main media category
  const getMainMediaCategory = () => {
    if (!dashboardData || !bank.mediaBreakdown) return 'multiple media channels';

    if (!selectedMonths.length) {
      // Usar directamente mediaBreakdown que ya está procesado
      const maxMedia = bank.mediaBreakdown.reduce((max, media) => 
        media.amount > max.amount ? media : max
      , bank.mediaBreakdown[0]);

      return maxMedia.category;
    }

    // Calcular para los meses seleccionados
    const filteredMonths = dashboardData.monthlyTrends
      .filter(trend => selectedMonths.includes(trend.month));

    const bankTotal = filteredMonths.reduce((sum, month) => {
      const bankShare = month.bankShares.find(share => share.bank === bank.name);
      return sum + (bankShare ? Math.round(bankShare.investment) : 0);
    }, 0);

    // Usar los porcentajes existentes para calcular montos
    const mediaAmounts = bank.mediaBreakdown.map(media => ({
      category: media.category,
      amount: Math.round((bankTotal * media.percentage) / 100)
    }));

    const maxMedia = mediaAmounts.reduce((max, media) => 
      media.amount > max.amount ? media : max
    , mediaAmounts[0]);

    return maxMedia.category;
  };

  const getInvestmentPattern = () => {
    if (!selectedMonths.length) {
      return 'strong investment';
    }

    const filteredMonths = dashboardData.monthlyTrends
      .filter(trend => selectedMonths.includes(trend.month))
      .map(trend => {
        const bankShare = trend.bankShares.find(share => share.bank === bank.name);
        return bankShare ? Math.round(bankShare.investment) : 0;
      })
      .filter(amount => amount > 0);

    if (filteredMonths.length <= 1) return 'strong investment';

    const avg = filteredMonths.reduce((sum, val) => sum + val, 0) / filteredMonths.length;
    const variance = filteredMonths.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / filteredMonths.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / avg;

    // Ajustar umbrales basados en datos reales
    if (coefficientOfVariation < 0.15) return 'very consistent investment patterns';
    if (coefficientOfVariation < 0.30) return 'relatively consistent investment patterns';
    if (coefficientOfVariation < 0.50) return 'varying investment patterns';
    return 'highly variable investment patterns';
  };

  const getMediaStrategy = () => {
    const digital = bank.mediaBreakdown.find(m => m.category === 'Digital');
    const tv = bank.mediaBreakdown.find(m => m.category === 'Television');
    const digitalPercentage = digital ? digital.percentage : 0;
    const tvPercentage = tv ? tv.percentage : 0;

    if (digitalPercentage > 45) return 'digital-first approach with traditional media support';
    if (digitalPercentage > 35) return 'balanced approach between digital and traditional channels';
    if (tvPercentage > 60) return 'television-focused strategy with digital support';
    return 'traditional media focus with growing digital presence';
  };

  const investmentPattern = getInvestmentPattern();
  const mediaStrategy = getMediaStrategy();

  return (
    <div 
      className="mt-6 p-5 rounded-lg" 
      style={{
        backgroundColor: `${bankColors[bank.name]}20`, 
        borderColor: `${bankColors[bank.name]}40`
      }}
    >
      <div className="flex items-center mb-2">
        {Icons.insight}
        <h3 className="text-lg font-medium text-gray-800">Key Insights for {bank.name}</h3>
      </div>
      <ul className="list-disc pl-8 mt-3 space-y-2 text-gray-600">
        <li>{bank.name} primarily invests in {getMainMediaCategory()}</li>
        <li>The bank shows {investmentPattern}</li>
        <li>The media strategy demonstrates {mediaStrategy}</li>
        <li>Investment allocation shows {
          bank.name === 'PNC Bank' || bank.name === 'Capital One' 
            ? 'significant seasonal variations with strategic timing' 
            : 'planned distribution throughout the year with tactical adjustments'
        }</li>
      </ul>
    </div>
  );
};

export default BankInsights;