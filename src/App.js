import React from 'react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import TabContainer from './components/layouts/TabContainer';
import Loading from './components/common/Loading';

/**
 * Componente principal del Dashboard
 */
const DashboardContent = () => {
  const { loading } = useDashboard();

  if (loading) {
    return <Loading />;
  }

  return <TabContainer />;
};

/**
 * Componente raíz de la aplicación
 */
function App() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <DashboardProvider>
        <DashboardContent />
      </DashboardProvider>
    </div>
  );
}

export default App;