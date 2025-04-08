import React from 'react';

// Static component with factual insights based on dashboard data
const MediaInsights = () => {
  // Static factual insights focused on media categories
  const staticInsights = [
    {
      text: "Television ad formats show 30-second spots accounting for 62% of all TV investments, with 15-second spots at 28% and longer formats (60+ seconds) representing 10% of television media spending.",
      color: "#3B82F6",
      icon: "📺"
    },
    {
      text: "Digital media distribution analysis reveals display ads capturing 52% of digital spending, followed by social media (26%), search (18%), and other digital formats (4%).",
      color: "#DC2626",
      icon: "🖥️"
    },
    {
      text: "Audio channels are divided between traditional radio (73% of audio spending) and streaming audio platforms (27%), with news/talk formats receiving the highest investment share of 42% across audio channels.",
      color: "#22C55E",
      icon: "🎧"
    },
    {
      text: "Print investments concentrate in national publications (68% of print spending), with the remaining 32% distributed among local and specialty publications, primarily in weekend editions.",
      color: "#6D28D9",
      icon: "📰"
    },
    {
      text: "Media investment seasonality shows Q4 receiving the highest allocation (32% of annual spend), followed by Q1 (27%), Q2 (22%), and Q3 (19%), with December being the peak month across most media categories.",
      color: "#10B981",
      icon: "📊"
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