import React from 'react';
import Header from './Header';
import Navigation from './Navigation';
import MonthFilter from '../common/MonthFilter';

/**
 * Container component that groups Header, Navigation and MonthFilter
 * to ensure uniform appearance and behavior when scrolling
 */
const TopContainer = () => {
  return (
    <div className="fixed top-0 left-0 right-0 w-full z-50 bg-white shadow-lg">
      <div className="w-full">
        <Header />
        <MonthFilter />
        <Navigation />
      </div>
    </div>
  );
};

export default TopContainer; 