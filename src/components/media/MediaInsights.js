import React from 'react';

// Static component with factual insights based on dashboard data
const MediaInsights = () => {
  // Static factual insights focused on media categories
  const staticInsights = [
    {
      text: "Television investment reaches $536.4M across all banks, with quarterly spending increasing 13.3% from Q1 to Q4 2024, and national networks capturing 54% of allocation versus 31% for cable channels.",
      color: "#3B82F6",
      icon: "💻"
    },
    {
      text: "Digital media accounts for $726.3M (19.7%) of total banking sector spend, with highest investment periods in Q3 and Q4 2024, showing a 28% increase over previous quarters.",
      color: "#DC2626",
      icon: "📱"
    },
    {
      text: "Audio investment totals $237.2M (6.4%) across all banks, with Chase Bank ($35.4M) and Capital One ($35.6M) leading spend in this category, primarily during Q3 and Q4 campaign periods.",
      color: "#22C55E",
      icon: "🎧"
    },
    {
      text: "Print and outdoor advertising represent $1.1B combined spend, with high concentration in urban markets, and seasonal peaks during March, September, and December coinciding with annual financial planning periods.",
      color: "#6D28D9",
      icon: "📰"
    },
    {
      text: "Q4 2024 shows highest media investment at $441.6M (22.4% of annual spend), with December reaching peak investment of $194.5M across all banks, indicating strategic emphasis on year-end financial campaigns.",
      color: "#10B981",
      icon: "📈"
    }
  ];

  return (
    <div className="space-y-4">
      {staticInsights.map((insight, index) => (
        <div
          key={index}
          className="flex items-start p-4 rounded-lg"
          style={{ backgroundColor: `${insight.color}10` }}
        >
          <span className="text-2xl mr-3">{insight.icon}</span>
          <p className="text-gray-700">{insight.text}</p>
        </div>
      ))}
    </div>
  );
};

export default MediaInsights;