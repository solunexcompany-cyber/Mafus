import React from 'react';

function Sidebar({ currentTab, setCurrentTab, currentUser, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>KEKE FLEET</h2>
      </div>

      <nav style={{ flexGrow: 1 }}>
        {currentUser?.role === 'admin' ? (
          <>
            <button 
              className={currentTab === 'overview' ? 'active' : ''} 
              onClick={() => setCurrentTab('overview')}
            >
              📊 Fleet Overview
            </button>
            <button 
              className={currentTab === 'intelligence' ? 'active' : ''} 
              onClick={() => setCurrentTab('intelligence')}
            >
              🔍 Search Intelligence
            </button>
            <button 
              className={currentTab === 'assets' ? 'active' : ''} 
              onClick={() => setCurrentTab('assets')}
            >
              🛺 Asset Registry
            </button>
            <button 
              className={currentTab === 'vendors' ? 'active' : ''} 
              onClick={() => setCurrentTab('vendors')}
            >
              🏢 Partner Businesses
            </button>
          </>
        ) : (
          <>
            <button 
              className={currentTab === 'driver_dashboard' ? 'active' : ''} 
              onClick={() => setCurrentTab('driver_dashboard')}
            >
              🛺 My Dashboard
            </button>
            <button 
              className={currentTab === 'driver_payments' ? 'active' : ''} 
              onClick={() => setCurrentTab('driver_payments')}
            >
              💳 Payment Records
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="dev-profile" style={{ marginBottom: '16px' }}>
          <span className="dev-badge">SECURE_NODE</span>
          <span className="user-name">{currentUser?.full_name || 'System User'}</span>
          <span className="user-role">@{currentUser?.role || 'staff'}</span>
        </div>
        <button className="btn-logout" onClick={onLogout}>
          Secure Session Exit
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;