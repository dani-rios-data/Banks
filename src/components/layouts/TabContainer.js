import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import SummaryDashboard from '../summary/SummaryDashboard';
import MediaDashboard from '../media/MediaDashboard';
import BankDashboard from '../bank/BankDashboard';
import TopContainer from './TopContainer';

/**
 * Container to display the active tab content
 */
const TabContainer = () => {
  const { activeTab, dashboardData, loading } = useDashboard();

  if (loading || !dashboardData) {
    return (
      <div className="w-full max-w-[85vw] mx-auto">
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="animate-pulse flex flex-col space-y-6">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded"></div>
              <div className="h-6 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show the component corresponding to the active tab
  const renderActiveTab = () => {
    if (activeTab === 'summary') {
      return <SummaryDashboard />;
    } else if (activeTab === 'media') {
      return <MediaDashboard />;
    } else {
      // If the active tab is a bank, verify it exists before showing it
      const bankExists = dashboardData.banks.find(bank => bank.name === activeTab);
      if (bankExists) {
        return <BankDashboard bank={bankExists} />;
      }
      // If the tab doesn't exist, show an error message
      return (
        <div className="w-full max-w-[85vw] mx-auto">
          <div className="bg-white rounded-xl shadow-md p-8">
            <p className="text-red-500 text-lg">Error: Tab not found</p>
          </div>
        </div>
      );
    }
  };

  return (
    <>
      <TopContainer />
      <div className="pt-[225px] bg-gray-50">
        <div className="max-w-[85vw] mx-auto mt-8">
          {renderActiveTab()}
        </div>
      </div>
    </>
  );
};

export default TabContainer;