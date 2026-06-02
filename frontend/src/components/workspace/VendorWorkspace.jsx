// src/components/workspace/VendorWorkspace.jsx
import React, { useState } from 'react';
import styles from './VendorWorkspace.module.css';

// Custom Zero-Dependency SVG Icons tailored for Section 2 Core Menu Architecture
const VendorIcons = {
  Dashboard: () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.003 9.003 0 1020.945 13H11V3.055z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
    </svg>
  ),
  Managers: () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Assets: () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  ),
  Finance: () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  Drivers: () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 044 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.418.835 2.83 2H8.17c.412-1.165 1.524-2 2.83-2z" />
    </svg>
  ),
  Setup: () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  LogOut: () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
};

export default function VendorWorkspace({ onLogout, vendorEnterpriseName = "Kano Logistics Hub" }) {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  
  // Modals state flags
  const [isManagerWizardOpen, setIsManagerWizardOpen] = useState(false);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);

  // Requirement: Inventory tracking split between distributed items vs stock sitting on ground
  const [inventoryPool, setInventoryPool] = useState({
    distributed: 20,
    onGround: 30 // Initial unassigned stock available for manager assignment allocation
  });

  // Requirement: Pre-loaded Default Profile Shell framework on operational activation
  const [managersList, setManagersList] = useState([
    { 
      id: 1, 
      name: "Default Profile Shell (Pre-loaded)", 
      phone: "+234 803 000 0000", 
      email: "default.admin@mafos.core", 
      occupation: "System Provisioned",
      assignedAssets: 0, 
      status: "active",
      isDefaultShell: true 
    }
  ]);

  // Frontend hard limit threshold monitoring guard (Cap of exactly 3 Master Admins)
  const isCapLimitReached = managersList.length >= 3;

  const handleLaunchRegistration = () => {
    if (isCapLimitReached) {
      alert("Validation Error: Maximum threshold limit of exactly 3 Master Admins reached total per vendor tenant. MAFOS service provider actions are required to expand cap limits.");
      return;
    }
    setIsManagerWizardOpen(true);
  };

  // Callback interface handler mapping new Master Admins into the list state
  const handleManagerSuccess = (newManagerPayload) => {
    // FIX: Look inside index of the array state instead of referencing the raw array container
    const hasUnconfiguredDefault = 
      managersList.length === 1 && 
      managersList?.isDefaultShell && 
      managersList?.name?.includes("Pre-loaded");

    if (hasUnconfiguredDefault) {
      setManagersList([
        {
          id: 1,
          name: newManagerPayload.fullName,
          phone: newManagerPayload.mobilePhone,
          email: newManagerPayload.contactEmail,
          occupation: newManagerPayload.currentOccupation,
          assignedAssets: 0,
          status: "active",
          isDefaultShell: false // Transformed into configured operational instance
        }
      ]);
    } else {
      const newlyCompiledManager = {
        id: managersList.length + 1,
        name: newManagerPayload.fullName,
        phone: newManagerPayload.mobilePhone,
        email: newManagerPayload.contactEmail,
        occupation: newManagerPayload.currentOccupation,
        assignedAssets: 0,
        status: "active",
        isDefaultShell: false
      };
      setManagersList((prev) => [...prev, newlyCompiledManager]);
    }
    setIsManagerWizardOpen(false); // Cleanly shut down portal context on complete loop
  };

  // Mock array mapping for live data presentation stubs (Finance and Drivers oversight grids)
  const fieldDrivers = [
    { id: 1, name: "Musa Ibrahim", asset: "Tricycle - KN-812", status: "In Field", debt: "₦0.00" },
    { id: 2, name: "Sani Umar", asset: "Mini KurKura - KN-043", status: "In Field", debt: "₦4,500.00" }
  ];

  return (
    <div className={styles.workspaceContainer}>
      
      {/* SIDEBAR NAVIGATION DESK */}
      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <div className={styles.avatarEnterprise}>VND</div>
          <div className={styles.brandText}>
            <h2>{vendorEnterpriseName}</h2>
            <span>TENANT CONSOLE</span>
          </div>
        </div>

        <nav className={styles.navLinks}>
          <button onClick={() => setActiveMenu('dashboard')} className={`${styles.navBtn} ${activeMenu === 'dashboard' ? styles.active : ''}`}>
            <VendorIcons.Dashboard /> <span>Dashboard Summary</span>
          </button>
          
          <button onClick={() => setActiveMenu('managers')} className={`${styles.navBtn} ${activeMenu === 'managers' ? styles.active : ''}`}>
            <VendorIcons.Managers /> <span>Master Admins ({managersList.length}/3)</span>
          </button>
          
          <button onClick={() => setActiveMenu('assets')} className={`${styles.navBtn} ${activeMenu === 'assets' ? styles.active : ''}`}>
            <VendorIcons.Assets /> <span>Asset Inventory Control</span>
          </button>
          
          <button onClick={() => setActiveMenu('finance')} className={`${styles.navBtn} ${activeMenu === 'finance' ? styles.active : ''}`}>
            <VendorIcons.Finance /> <span>Corporate Ledger</span>
          </button>
          
          <button onClick={() => setActiveMenu('drivers')} className={`${styles.navBtn} ${activeMenu === 'drivers' ? styles.active : ''}`}>
            <VendorIcons.Drivers /> <span>Drivers Monitoring</span>
          </button>

          <button onClick={() => setActiveMenu('setup')} className={`${styles.navBtn} ${activeMenu === 'setup' ? styles.active : ''}`}>
            <VendorIcons.Setup /> <span>Setup & Parameters</span>
          </button>
        </nav>

        <button onClick={onLogout} className={styles.logoutBtn}>
          <VendorIcons.LogOut /> <span>Exit Session</span>
        </button>
      </aside>

      {/* MAIN MAIN VIEW ENVIRONMENTAL CONTAINER */}
      <main className={styles.mainContent}>
        <header className={styles.topHeader}>
          <div className={styles.contextNode}>
            <span className={styles.pulseDotGreen} />
            <h3>ACTIVE NODE: COMPANY_OWNER_WORKSPACE // {activeMenu.toUpperCase()}</h3>
          </div>
          <div className={styles.headerActions}>
            <button onClick={() => setIsAllocationModalOpen(true)} className={styles.secondaryActionBtn}>
              Assign Warehouse Stock
            </button>
            <button onClick={handleLaunchRegistration} className={styles.primaryActionBtn} disabled={isCapLimitReached}>
              + Register Master Admin
            </button>
          </div>
        </header>

        <div className={styles.contentViewport}>

          {/* VIEW 1: UNIFIED STATISTICAL DASHBOARD */}
          {activeMenu === 'dashboard' && (
            <div className={styles.scrollBlock}>
              <section className={styles.statsMetricsGrid}>
                <div className={styles.metricCard}>
                  <h4>Total Master Admins Cap</h4>
                  <p className={styles.metricVal}>{managersList.length} / 3</p>
                  <span>{isCapLimitReached ? "Hard Limit Enforced" : "Slots Available for Allocation"}</span>
                </div>
                <div className={styles.metricCard}>
                  <h4>Distributed Operational Assets</h4>
                  <p className={`${styles.metricVal} ${styles.textBlue}`}>{inventoryPool.distributed}</p>
                  <span>Active items deployed across field tracking lines</span>
                </div>
                <div className={styles.metricCard}>
                  <h4>Stock Sitting on Ground</h4>
                  <p className={`${styles.metricVal} ${styles.textAmber}`}>{inventoryPool.onGround}</p>
                  <span>Warehouse inventory awaiting management allocation</span>
                </div>
                <div className={styles.metricCard}>
                  <h4>Aggregate Fleet Inventory</h4>
                  <p className={styles.metricVal}>{inventoryPool.distributed + inventoryPool.onGround}</p>
                  <span>Consolidated balance sheet assets</span>
                </div>
              </section>

              <div className={styles.dataGridCard}>
                <h3>Ecosystem Performance Overview</h3>
                <p className={styles.subTextText}>Real-time monitoring metrics aggregation across current corporate tenant instance.</p>
                <div className={styles.placeholderGraphWindow}>
                  [Data Representation Metrics & Grid Insight Matrix Active]
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: MASTER ADMIN MONITORING AND REGISTRATION LEDGER */}
          {activeMenu === 'managers' && (
            <div className={styles.dataGridCard}>
              <div className={styles.cardHeaderFlex}>
                <div>
                  <h3>Operations Management Coordinators</h3>
                  <p className={styles.subTextText}>Frontend Cap Limit Enforcement: Strict threshold maximum of 3 instances total.</p>
                </div>
                {isCapLimitReached && (
                  <div className={styles.errorAlertInline}>
                    Cap Locked: MAFOS Authorization Required to Expand Slots
                  </div>
                )}
              </div>

              <table className={styles.tableElement}>
                <thead>
                  <tr>
                    <th>Manager Profile Identity</th>
                    <th>Contact Phone Matrix</th>
                    <th>Email Communication Link</th>
                    <th>Current Assigned Inventory</th>
                    <th>Operational Status Node</th>
                  </tr>
                </thead>
                <tbody>
                  {managersList.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <strong>{m.name}</strong>
                        {m.isDefaultShell && <span className={styles.shellBadge}>Default Profile Shell</span>}
                      </td>
                      <td className={styles.monoText}>{m.phone}</td>
                      <td>{m.email}</td>
                      <td className={styles.monoText}><strong>{m.assignedAssets}</strong> assets assigned</td>
                      <td>
                        <span className={`${styles.statusPill} ${styles.statusActive}`}>{m.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW 3: ASSET REGISTRATION INVENTORY METRICS PANEL */}
          {activeMenu === 'assets' && (
            <div className={styles.dataGridCard}>
              <h3>Inventory Control & Separation Deck</h3>
              <p className={styles.subTextText}>Mandatory splitting criteria keeping warehouse items separate from field operations.</p>
              
              <div className={styles.inventorySplitFlex}>
                <div className={styles.splitBox}>
                  <h5>DISTRIBUTED POOL (ACTIVE IN FIELD)</h5>
                  <div className={styles.largeSplitNum}>{inventoryPool.distributed}</div>
                  <p>Assets linked to an active driver contract profile shell.</p>
                </div>
                <div className={styles.splitBox}>
                  <h5>SITTING ON THE GROUND (WAREHOUSE STORAGE)</h5>
                  <div className={styles.largeSplitNum}>{inventoryPool.onGround}</div>
                  <p>Unassigned assets ready for Manager Allocation workflows.</p>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: FINANCIAL INSIGHTS AND ACCOUNTABILITY LEDGER */}
          {activeMenu === 'finance' && (
            <div className={styles.dataGridCard}>
              <h3>Corporate Cash Ledger Tracking Workflows</h3>
              <p className={styles.subTextText}>Financial engine monitoring outstanding daily, weekly, and monthly fields assets balances.</p>
              <div className={styles.financeSummaryBox}>
                <p>Balances Remaining in Field: <strong>₦14,500.00</strong></p>
                <p>Safely Settled Vault Values: <strong>₦340,000.00</strong></p>
                <p>Expected Pipeline Incoming (Next Cycle): <strong>₦68,000.00</strong></p>
              </div>
            </div>
          )}

          {/* VIEW 5: CLIENTS / DRIVERS FIELD OVERVIEW GRID */}
          {activeMenu === 'drivers' && (
            <div className={styles.dataGridCard}>
              <h3>Field Operators Oversight Deck</h3>
              <p className={styles.subTextText}>Live tracking registry mapping driver profiles directly bound to corporate assets inventory.</p>
              <table className={styles.tableElement}>
                <thead>
                  <tr>
                    <th>Driver Name Name</th>
                    <th>Assigned Deployment Asset</th>
                    <th>Current Status</th>
                    <th>Outstanding Debt Node</th>
                  </tr>
                </thead>
                <tbody>
                  {fieldDrivers.map((d) => (
                    <tr key={d.id}>
                      <td><strong>{d.name}</strong></td>
                      <td>{d.asset}</td>
                      <td><span className={styles.pulseIndicatorDot} /> {d.status}</td>
                      <td className={styles.monoText}>{d.debt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW 6: SETUP AND PARAMETERS CONFIGURATION */}
          {activeMenu === 'setup' && (
            <div className={styles.dataGridCard}>
              <h3>Local Tenant Parameter Modification Tools</h3>
              <p className={styles.subTextText}>Adjust configuration parameters and secure gateway rules for this tenant domain.</p>
              <div className={styles.inputGroupStub}>
                <label>Corporate Routed Identifier Domain</label>
                <input type="text" value="https://mafos.core/route/kano-logistics-hub" readOnly className={styles.stubInput} />
              </div>
            </div>
          )}

        </div>
      </main>

      {/* UNCOMMENT THESE AS SOON AS YOUR WIZARDS / MODALS ARE IMPORTED AT THE TOP */}
      {/* <MasterAdminWizard 
        isOpen={isManagerWizardOpen} 
        onClose={() => setIsManagerWizardOpen(false)} 
        onSave={handleManagerSuccess} 
      /> 
      */}
      {/* <AssetAllocationModal 
        isOpen={isAllocationModalOpen} 
        onClose={() => setIsAllocationModalOpen(false)} 
        inventoryPool={inventoryPool} 
        setInventoryPool={setInventoryPool} 
        managersList={managersList} 
        setManagersList={setManagersList} 
      /> 
      */}

    </div>
  );
}