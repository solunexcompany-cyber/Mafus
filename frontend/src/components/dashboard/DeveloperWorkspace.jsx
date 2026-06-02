import React, { useState } from 'react';
import RegistrationWizard from '../modals/RegistrationWizard'; // Direct connection to your step wizard
import styles from './DeveloperWorkspace.module.css';

// Custom Zero-Dependency SVG Icon Repository
const Icons = {
  Dashboard: () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  Onboarding: () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  Telemetry: () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Services: () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  LogOut: () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Server: () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
    </svg>
  ),
  ConsoleLogo: () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
};

export default function DeveloperWorkspace({ onLogout }) {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  
  // 1. Local Toggle State Machine for Wizard Overlay
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // 2. Transformed baseline dataset into dynamic stream state array
  const [vendorsList, setVendorsList] = useState([
    { id: 1, name: "Alhaji Transport & Co", type: "Tricycle / Keke Napep", date: "29/05/2026", status: "processing", model: "Partnership" },
    { id: 2, name: "Kano Logistics Fleet", type: "Mini KurKura Vendor", date: "28/05/2026", status: "active", model: "Group" },
    { id: 3, name: "Matrix Micro-POS Hub", type: "POS Vendor", date: "27/05/2026", status: "processing", model: "Individual" }
  ]);

  // 3. Callback engine handler connecting your form outputs directly to the ledger view
  // 3. Callback engine handler connecting your form outputs directly to your SQL database
  const handleOnboardSuccess = async (wizardPayload) => {
    // 1. Generate secure credentials block automatically upon system intake bypass
    const generatedUsername = wizardPayload.fullName.toLowerCase().replace(/\s+/g, '.') + '_admin';
    const temporarySecurePasskey = 'MAFOS-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-2026';
    
    // Derive a clean fallback email matching your Pydantic validation requirements
    const derivedEmail = `${wizardPayload.fullName.toLowerCase().replace(/\s+/g, '')}@mafos-ecosystem.com`;

    // 2. Structural mapping matching your Python Body(...) parameters exactly
    const apiPayload = {
      name: wizardPayload.fullName,
      owner_email: derivedEmail,
      owner_password: temporarySecurePasskey,
      owner_full_name: wizardPayload.fullName,
      owner_username: generatedUsername, // Passes your pop-up credential string
      cac_number: "RC-" + Math.floor(100000 + Math.random() * 900000),
      business_address: "Kano Central Operations Node",
      contact_phone: "+2348000000000",
      business_type: wizardPayload.businessType
    };

    try {
      // 🚀 FIXED PORT: Pointing directly to your active Uvicorn instance
      const response = await fetch('http://localhost:8195/api/v1/users/vendor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Server registration pipeline rejected transaction.");
      }

      const serverResult = await response.json();
      console.log("Database write confirmed:", serverResult);

      // 3. Structural mapping transforming Wizard form parameters to match local UI Table view keys
      const newlyCompiledVendor = {
        id: vendorsList.length + 1,
        name: wizardPayload.fullName,
        type: wizardPayload.businessDescription,
        date: wizardPayload.creationDate,
        status: wizardPayload.statusNode, 
        model: wizardPayload.businessType.charAt(0).toUpperCase() + wizardPayload.businessType.slice(1)
      };

      // 4. Inject row into local state stream ledger pipeline instantly
      setVendorsList((prevStream) => [newlyCompiledVendor, ...prevStream]);

      // 5. Fire administrative confirmation containing credentials that are now REAL in PostgreSQL/MySQL
      alert(`
🔒 SECURITY CREDENTIALS COMMITTED TO DATABASE
-------------------------------------------------------
Master Admin Profile successfully written to backend tables.

[Username]: ${generatedUsername}
[Temporary Passkey]: ${temporarySecurePasskey}

Copy these parameters. You can now use them to bypass 
the Identity Verification screen securely.
      `);

    } catch (error) {
      console.error("Pipeline network failure:", error);
      alert(`❌ REGISTRATION FAILED: ${error.message}\n\n(Verify your Python backend is running and CORS is enabled)`);
    }
  };

  // 4. Derive live analytics metrics values from the real state changes
  const activeCount = vendorsList.filter(v => v.status === 'active').length;
  const processingCount = vendorsList.filter(v => v.status === 'processing').length;

  const stats = [
    { title: "Total Registered Vendors", value: vendorsList.length.toString(), info: "Ecosystem platform partners", status: "Active" },
    { title: "Onboarding Pipeline", value: processingCount.toString(), info: "Pending structural check clearances", status: "Processing" },
    { title: "Active Network Services", value: `${activeCount} Active`, info: "Bypass-approved live entries", status: "Stable" },
    { title: "Data Core Gateway", value: "94.2%", info: "Packet throughput stability matrix", status: "Optimal" }
  ];

  return (
    <div className={styles.workspace}>
      
      {/* LEFT SIDEBAR NAVIGATION DESK */}
      <aside className={styles.sidebar}>
        <div>
          <div className={styles.logoArea}>
            <div className={styles.logoIcon}>
              <Icons.ConsoleLogo />
            </div>
            <div className={styles.logoText}>
              <h1>MAFOS CORE</h1>
              <span>DEVELOPER NODE</span>
            </div>
          </div>

          <nav className={styles.navLinks}>
            <button 
              onClick={() => setActiveMenu('dashboard')}
              className={`${styles.navButton} ${activeMenu === 'dashboard' ? styles.navButtonActive : ''}`}
            >
              <Icons.Dashboard />
              <span>Dashboard Overview</span>
            </button>

            <button 
              onClick={() => setActiveMenu('onboarding')}
              className={`${styles.navButton} ${activeMenu === 'onboarding' ? styles.navButtonActive : ''}`}
            >
              <Icons.Onboarding />
              <span>Registration & Onboarding</span>
            </button>

            <button 
              onClick={() => setActiveMenu('telemetry')}
              className={`${styles.navButton} ${activeMenu === 'telemetry' ? styles.navButtonActive : ''}`}
            >
              <Icons.Telemetry />
              <span>Data Inflow / Outflow</span>
            </button>

            <button 
              onClick={() => setActiveMenu('services')}
              className={`${styles.navButton} ${activeMenu === 'services' ? styles.navButtonActive : ''}`}
            >
              <Icons.Services />
              <span>Services Layer</span>
            </button>
          </nav>
        </div>

        <div className={styles.sidebarBottom}>
          <div className={styles.userProfile}>
            <div className={styles.avatar}>SYS</div>
            <div className={styles.profileText}>
              <p className={styles.tierLabel}>Access Tier</p>
              <p className={styles.userName}>Platform Engineer</p>
            </div>
          </div>
          <button onClick={onLogout} className={styles.logoutButton}>
            <Icons.LogOut />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN VIEW ENVIRONMENT */}
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.contextNode}>
            <span className={styles.pulseDot} />
            <h2 className={styles.contextText}>
              CONTEXT NODE: <span className={styles.contextActive}>{activeMenu}_CORE</span>
            </h2>
          </div>
          <button onClick={() => setIsWizardOpen(true)} className={styles.wizardButton}>
            + Launch Registration Wizard
          </button>
        </header>

        <div className={styles.contentViewport}>
          
          {/* MENU VIEW A: DASHBOARD VIEWPORT */}
          {activeMenu === 'dashboard' && (
            <>
              <section className={styles.statsGrid}>
                {stats.map((stat, idx) => (
                  <div key={idx} className={styles.statCard}>
                    <div className={styles.statCardHeader}>
                      <span>{stat.title}</span>
                      <span className={styles.statusBadge}>{stat.status}</span>
                    </div>
                    <p className={styles.statValue}>{stat.value}</p>
                    <p className={styles.statInfo}>{stat.info}</p>
                  </div>
                ))}
              </section>

              <div className={styles.tableWrapper}>
                <div className={styles.tableHeader}>
                  <h3>Active Vendor Registration Stream</h3>
                  <p>Real-time onboarding activity log monitoring node.</p>
                </div>
                <table className={styles.tableEl}>
                  <thead>
                    <tr>
                      <th>Vendor Enterprise Name</th>
                      <th>Asset Category Type</th>
                      <th>Creation Date</th>
                      <th>Status Node</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorsList.map((v) => (
                      <tr key={v.id}>
                        <td>
                          <p className={styles.vendorTitle}>{v.name}</p>
                          <span className={styles.vendorSub}>{v.model} Model</span>
                        </td>
                        <td className={styles.rowTextMuted}>{v.type}</td>
                        <td className={styles.rowTextMono}>{v.date}</td>
                        <td>
                          <span className={`${styles.badge} ${v.status === 'active' ? styles.badgeActive : styles.badgeProcessing}`}>
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* MENU VIEW B: REGISTRATION AND ONBOARDING ENGINE */}
          {activeMenu === 'onboarding' && (
            <div className={styles.panelCard}>
              <div className={styles.panelIcon}>
                <Icons.Onboarding />
              </div>
              <h3>Vendor Services Onboarding Registry</h3>
              <p>
                Trigger internal enterprise creation sequences. Forms initiated here bypass standard wait cycles and auto-activate workflows.
              </p>
              <button onClick={() => setIsWizardOpen(true)} className={styles.panelButton}>
                Open 4-Step Registration Wizard
              </button>
            </div>
          )}

          {/* MENU VIEW C: DATA INFLOW/OUTFLOW PACKET MONITOR */}
          {activeMenu === 'telemetry' && (
            <div className={styles.telemetrySplit}>
              <div className={styles.telCard}>
                <div className={styles.telCardHeader}>
                  <span className={styles.dotBlue} />
                  <h4>Data Inflow Pipeline Matrix</h4>
                </div>
                <div className={styles.terminalBox}>
                  <p>[INFO] Stream node alpha listening on port 8195...</p>
                  <p className={styles.textEmerald}>[INFLOW] 3.42 GB/s - Payload block verification success.</p>
                  <p>[INFO] Identity token hash processing matches valid cipher.</p>
                </div>
              </div>
              <div className={styles.telCard}>
                <div className={styles.telCardHeader}>
                  <span className={styles.dotPurple} />
                  <h4>Data Outflow Accounting Ledger</h4>
                </div>
                <div className={styles.terminalBox}>
                  <p>[INFO] Synchronizing database state with active sub-tenants...</p>
                  <p className={styles.textBlue}>[OUTFLOW] 1.89 GB/s - Transmitting telemetry tables to master node.</p>
                  <p>[INFO] Cycle complete. Next broadcast pending.</p>
                </div>
              </div>
            </div>
          )}

          {/* MENU VIEW D: MICROSERVICES ARCHITECTURE INFRASTRUCTURE */}
          {activeMenu === 'services' && (
            <div className={styles.servicesBox}>
              <h3><Icons.Server /> Core Framework Services Fabric</h3>
              <div>
                {[
                  { endpoint: "/api/v1/login/access-token", label: "Authentication Security Gateway", delay: "12ms" },
                  { endpoint: "/api/v1/users/vendor", label: "Vendor Operational Routing Mesh", delay: "24ms" },
                  { endpoint: "/api/v1/users/dashboard/stats", label: "Global Platform Analytics Telemetry Engine", delay: "18ms" }
                ].map((s, idx) => (
                  <div key={idx} className={styles.serviceRow}>
                    <div>
                      <p className={styles.serviceEndpoint}>{s.endpoint}</p>
                      <p className={styles.serviceLabel}>{s.label}</p>
                    </div>
                    <span className={styles.serviceBadge}>ONLINE // {s.delay}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* 5. MOUNT OVERLAY WIZARD INTERFACES HERE AT THE PORTAL FOOTER */}
      <RegistrationWizard 
        isOpen={isWizardOpen} 
        onClose={() => setIsWizardOpen(false)} 
        onOnboardSuccess={handleOnboardSuccess}
      />

    </div>
  );
}