import React from 'react';

// Static component with factual insights based on dashboard data
const MediaInsights = () => {
  // Static factual insights based on actual data in the dashboard
  const staticInsights = [
    {
      text: "Television represents 48.60% ($896.91M) of total media investment across all banks, making it the dominant channel in the banking industry's media mix.",
      color: "#3B82F6",
      icon: "📺"
    },
    {
      text: "Digital channels account for 42.45% ($783.41M) of total media investment, ranking as the second most utilized media channel by banking advertisers.",
      color: "#DC2626",
      icon: "🖥️"
    },
    {
      text: "Capital One has the highest media investment at $837.60M (45.39% market share), followed by Chase Bank at $410.79M (22.26%) and Bank of America at $286.25M (15.51%).",
      color: "#22C55E",
      icon: "🏦"
    },
    {
      text: "The top three banks (Capital One, Chase Bank, Bank of America) collectively represent 83.16% of total media investment ($1.53B out of $1.85B total).",
      color: "#6D28D9",
      icon: "📊"
    },
    {
      text: "Audio channels receive 6.32% ($116.71M) of total media investment, while Print accounts for 1.63% ($30.18M) and Outdoor channels receive 0.67% ($12.27M).",
      color: "#10B981",
      icon: "🎧"
    }
  ];

  return (
    <div className="space-y-5">
      {staticInsights.map((insight, index) => (
        <div key={index} className="flex items-start space-x-3 rounded-lg p-4 bg-white bg-opacity-60 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-lg"
            style={{ backgroundColor: insight.color }}
          >
            {insight.icon || "•"}
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            {insight.text}
          </p>
        </div>
      ))}
    </div>
  );
};

export default MediaInsights;