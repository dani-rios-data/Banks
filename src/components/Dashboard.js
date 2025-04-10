import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Dashboard = ({ data }) => {
  // Preparar datos para los gráficos
  const monthlyData = Array.from(data.monthlyTrends.entries()).map(([month, data]) => ({
    month,
    total: data.total,
    ...Object.fromEntries(data.banks)
  }));

  const mediaTypeData = Array.from(data.mediaCategories.entries()).map(([category, value]) => ({
    name: category,
    value
  }));

  const bankData = Array.from(data.bankData.entries()).map(([bank, data]) => ({
    name: bank,
    investment: data.totalInvestment
  }));

  return (
    <div className="space-y-8">
      {/* Gráfico de Inversión Total por Banco */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Inversión Total por Banco</h2>
        <BarChart width={800} height={300} data={bankData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="investment" fill="#8884d8" />
        </BarChart>
      </div>

      {/* Gráfico de Tendencias Mensuales */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Tendencias Mensuales</h2>
        <LineChart width={800} height={300} data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="total" stroke="#8884d8" />
        </LineChart>
      </div>

      {/* Gráfico de Distribución por Tipo de Medio */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Distribución por Tipo de Medio</h2>
        <PieChart width={400} height={300}>
          <Pie
            data={mediaTypeData}
            cx={200}
            cy={150}
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {mediaTypeData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </div>
    </div>
  );
};

export default Dashboard;
