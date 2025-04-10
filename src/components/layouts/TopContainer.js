import React from 'react';
import Header from './Header';
import Navigation from './Navigation';
import GlobalFilters from '../common/GlobalFilters';

/**
 * Container component that groups Header, Navigation and GlobalFilters
 * to ensure uniform appearance and behavior when scrolling
 */
const TopContainer = () => {
  return (
    <div className="fixed top-0 left-0 right-0 w-full z-50 bg-white shadow-lg">
      <div className="w-full">
        <Header />
        <GlobalFilters />
        <Navigation />
      </div>
    </div>
  );
};

export default TopContainer; 