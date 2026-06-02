import React from 'react';

function MobileHeader({ sidebarOpen, setSidebarOpen, currentTab }) {
  // Simple view title mapping helper
  const getTabTitle = (tab) => {
    switch(tab) {
      case 'overview': return 'Fleet Overview';
      case 'intelligence': return 'Search Intel';
      case 'assets': return 'Asset Registry';
      case 'vendors': return 'Partner Businesses';
      case 'driver_dashboard': return 'Driver Panel';
      case 'driver_payments': return 'Payments';
      default: return 'Dashboard';
    }
  };

  return (
    <>
      <header className="mobile-header">
        <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          ☰
        </button>
        <div className="mobile-title">
          {getTabTitle(currentTab).toUpperCase()}
        </div>
      </header>

      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}

export default MobileHeader;