import React from 'react';

/**
 * Componente para mostrar insights de gráficos de manera visual
 * Recibe un array de insights con title, description e icon
 */
const ChartInsights = ({ insights = [] }) => {
  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {insights.map((insight, index) => (
        <div 
          key={`insight-${index}`} 
          className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start space-x-2"
        >
          <div className="flex-shrink-0 bg-blue-100 p-2 rounded-full">
            <span className="material-icons text-blue-700">{insight.icon || 'insights'}</span>
          </div>
          <div>
            <h4 className="font-medium text-blue-800">{insight.title}</h4>
            <p className="text-sm text-blue-600">{insight.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChartInsights; 