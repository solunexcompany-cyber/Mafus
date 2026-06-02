import React, { useState, useEffect } from 'react';

// Layout & Framework
import Sidebar from './components/layout/Sidebar';
import MobileHeader from './components/layout/MobileHeader';

// Dashboards & Intelligence Panels
import DeveloperWorkspace from './components/dashboard/DeveloperWorkspace';
import AdminDashboard from './components/dashboard/AdminDashboard'; 
import DriverDashboard from './components/dashboard/DriverDashboard';
import SearchIntelligence from './components/intelligence/SearchIntelligence';
import VendorIntelligence from './components/intelligence/VendorIntelligence';

// ✅ NEW INTEGRATION: Dedicated Dealer Workspace Panel Matrix
import VendorWorkspace from './components/workspace/VendorWorkspace';

// Compliance Modals
import DriverOnboardModal from './components/modals/DriverOnboardModal';
import VendorOnboardModal from './components/modals/VendorOnboardModal';
import AdminCreateModal from './components/modals/AdminCreateModal';
import BulkAssetModal from './components/modals/BulkAssetModal';
import DeploymentModal from './components/modals/DeploymentModal';
import AssignManagerModal from './components/modals/AssignManagerModal';
import SubmitReceiptModal from './components/modals/SubmitReceiptModal';
import ReviewClaimsModal from './components/modals/ReviewClaimsModal';

const API_BASE = 'http://localhost:8195/api/v1';

function App() {
  // Session Identity Management
  const [currentUser, setCurrentUser] = useState(null); 
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Nav Views & Layout states
  const [currentTab, setCurrentTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Core Global Domain Arrays
  const [stats, setStats] = useState(null);
  const [assets, setAssets] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [pendingReceipts, setPendingReceipts] = useState([]);
  
  // Specific Lookup States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [selectedVendorNode, setSelectedVendorNode] = useState(null);
  const [selectedAssetContext, setSelectedAssetContext] = useState(null);
  const [driverViewContext, setDriverViewContext] = useState(null);

  // Modal Workspace Toggles
  const [modals, setModals] = useState({
    driverOnboard: false,
    vendorOnboard: false,
    adminCreate: false,
    bulkAsset: false,
    deployment: false,
    assignManager: false,
    submitReceipt: false,
    reviewClaims: false,
  });

  const toggleModal = (modalName, val) => {
    setModals(prev => ({ ...prev, [modalName]: val }));
  };

  // Automated Multi-Tenant Data Polling Loop
  useEffect(() => {
    if (currentUser) {
      syncSystemData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const syncSystemData = async () => {
    if (!currentUser || !currentUser.token) return;
    try {
      const headers = {
        'Authorization': `Bearer ${currentUser.token}`,
        'Content-Type': 'application/json'
      };

      if (currentUser.role === 'developer') {
        const [statsRes, vendorsRes] = await Promise.all([
          fetch(`${API_BASE}/users/dashboard/stats`, { headers }),
          fetch(`${API_BASE}/users/vendor`, { headers })
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (vendorsRes.ok) setVendors(await vendorsRes.json());

      } else if (currentUser.role === 'vendor') {
        const [statsRes, assetsRes] = await Promise.all([
          fetch(`${API_BASE}/users/vendor/${currentUser.vendor_id}/details`, { headers }),
          fetch(`${API_BASE}/api/admin/batch-assets`, { headers })
        ]);
        if (statsRes.ok) {
          const detailData = await statsRes.json();
          setStats(detailData.statistics || detailData);
        }
        if (assetsRes.ok) setAssets(await assetsRes.json());

      } else if (currentUser.role === 'manager') {
        const response = await fetch(`${API_BASE}/users/dashboard/stats`, { headers });
        if (response.ok) setStats(await response.json());
        
      } else if (currentUser.role === 'driver') {
        const response = await fetch(`${API_BASE}/api/users/dashboard/stats`, { headers });
        if (response.ok) {
          setDriverViewContext(await response.json());
        }
      }
    } catch (err) {
      console.error("Multi-tenant synchronization engine fault line:", err);
    }
  };

  // Unified Route-Based Login Execution
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const bodyData = new URLSearchParams();
      bodyData.append('username', identifier); 
      bodyData.append('password', password);

      const res = await fetch(`${API_BASE}/login/access-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: bodyData.toString()
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Identity clearance verification failed.');
      }

      const tokenData = await res.json();

      // Normalize the role string defensively
      const rawRole = tokenData.role ? tokenData.role.toLowerCase().trim() : '';

      // Resolve the workspace role using loose inclusion checks & ID presence
      let calculatedRole = 'manager'; // Default fallback

      if (rawRole.includes('developer') || rawRole.includes('super_admin') || rawRole.includes('super')) {
        calculatedRole = 'developer';
      } 
      // Catch all variations: 'vendor', 'vendor_owner', 'vendor_admin', etc.
      else if (rawRole.includes('vendor') || rawRole.includes('dealer') || rawRole.includes('owner') || (tokenData.vendor_id && !tokenData.manager_id)) {
        calculatedRole = 'vendor';
      } 
      else if (rawRole.includes('manager') || rawRole.includes('master') || rawRole.includes('admin')) {
        calculatedRole = 'manager';
      } 
      else if (rawRole.includes('client') || rawRole.includes('driver')) {
        calculatedRole = 'driver';
      }

      // Commit to state
      setCurrentUser({
        id: tokenData.user_id || 'active-session',
        role: calculatedRole, 
        original_role: tokenData.role,
        vendor_id: tokenData.vendor_id,
        manager_id: tokenData.manager_id,
        token: tokenData.access_token
      });

      setCurrentTab(calculatedRole === 'driver' ? 'driver_dashboard' : 'overview');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setDriverViewContext(null);
    setSearchResult(null);
    setStats(null);
    setAssets([]);
    setVendors([]);
    setIdentifier('');
    setPassword('');
  };

  // Operational Submissions Handlers
  const handleDriverOnboard = async (formData, photoFile) => {
    setLoading(true);
    try {
      const data = new FormData();
      if (photoFile) data.append('photo', photoFile);
      Object.keys(formData).forEach(key => data.append(key, formData[key]));

      const res = await fetch(`${API_BASE}/api/admin/onboard-client`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentUser.token}` },
        body: data
      });
      if (!res.ok) throw new Error('Registry creation rejection.');
      alert('Driver onboarded successfully.');
      toggleModal('driverOnboard', false);
      syncSystemData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVendorOnboard = async (payload) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/vendor`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          name: payload.business_name,
          owner_email: payload.email,
          owner_password: payload.password,
          owner_full_name: payload.full_name,
          cac_number: payload.cac_number,
          business_address: payload.business_address,
          contact_phone: payload.contact_phone,
          business_type: payload.business_type
        })
      });
      if (!res.ok) throw new Error('Partner deployment rejection.');
      alert('Vendor registered successfully.');
      toggleModal('vendorOnboard', false);
      syncSystemData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminCreate = async (payload) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/master-admin`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          email: payload.email,
          password: payload.password,
          full_name: payload.full_name,
          vendor_id: currentUser.role === 'vendor' ? currentUser.vendor_id : payload.vendor_id
        })
      });
      if (!res.ok) throw new Error('Staff allocation rejected.');
      alert('Master Admin account established.');
      toggleModal('adminCreate', false);
      syncSystemData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssetGenerate = async (payload) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/batch-assets`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Sequence injection failed.');
      alert('Asset sequence batch generated.');
      toggleModal('bulkAsset', false);
      syncSystemData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssetDeployment = async (assetId, payload) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/deploy-asset`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ asset_id: assetId, ...payload })
      });
      if (!res.ok) throw new Error('Contract construction error.');
      alert('Asset contract active.');
      toggleModal('deployment', false);
      syncSystemData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignManager = async (assetId, vendorId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/assign-asset-vendor`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ asset_id: assetId, vendor_id: vendorId })
      });
      if (!res.ok) throw new Error('Management delegation failure.');
      alert('Asset successfully assigned to target workspace.');
      toggleModal('assignManager', false);
      syncSystemData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleIntelSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/search-intelligence?q=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
      if (!res.ok) throw new Error('Search target database lookup failure.');
      setSearchResult(await res.json());
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadVendorIntelligence = async (vendorId) => {
    try {
      const res = await fetch(`${API_BASE}/users/vendor/${vendorId}/details`, {
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
      if (res.ok) {
        setSelectedVendorNode(await res.json());
        setCurrentTab('vendor_intelligence');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDriverSubmitReceipt = async (payload, file) => {
    setLoading(true);
    try {
      const data = new FormData();
      data.append('receipt', file);
      data.append('client_id', currentUser.id);
      data.append('amount', payload.amount);
      data.append('depositor_name', payload.depositor_name);

      const res = await fetch(`${API_BASE}/api/client/submit-receipt`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentUser.token}` },
        body: data
      });
      if (!res.ok) throw new Error('Remittance transfer upload error.');
      alert('Payment receipt uploaded successfully.');
      toggleModal('submitReceipt', false);
      syncSystemData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyReceiptClaim = async (receiptId, action, reason = '') => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/receipts/verify`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ receipt_id: receiptId, action, reason })
      });
      if (!res.ok) throw new Error('Verification processing fault line.');
      alert(`Receipt entry marked as [${action}ed].`);
      
      setPendingReceipts(prev => prev.filter(r => r.id !== receiptId));
      if (pendingReceipts.length <= 1) toggleModal('reviewClaims', false);
      syncSystemData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerQuickAction = (action) => {
    if (action === 'new_client') toggleModal('driverOnboard', true);
    if (action === 'new_vendor') toggleModal('vendorOnboard', true);
    if (action === 'new_manager') toggleModal('adminCreate', true);
    if (action === 'batch_assets') toggleModal('bulkAsset', true);
    if (action === 'review_receipts') toggleModal('reviewClaims', true);
  };

  /* Render Layer A: Unified Auth Screen */
  if (!currentUser) {
    return (
      <div className="login-screen mode-unified">
        <div className="login-layout">
          <div className="login-hero">
            <span className="brand-badge">MAFOS LOGISTICS CONSOLE</span>
            <h1 className="hero-title">Unified Architecture Network</h1>
            <p className="hero-description">
              Real-time multi-tenant monitoring node, operational onboarding wizards, and financial accountability ledgers.
            </p>
            <span className="hero-footer">System Instance Node Active // Secured Context</span>
          </div>

          <div className="login-form-container">
            <div className="login-card">
              <h1>Identity Verification</h1>
              <p className="login-subtitle">Enter your system credentials to access your secure workspace.</p>
              
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
                <input 
                  type="text" 
                  placeholder="System Username (Email or National Identity Number)" 
                  value={identifier} 
                  onChange={(e) => setIdentifier(e.target.value)} 
                  required 
                />
                <input 
                  type="password" 
                  placeholder="Secure Access Password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
                
                <button type="submit" className="btn-primary" style={{ marginTop: '8px', padding: '14px' }} disabled={loading}>
                  {loading ? 'Authenticating Cryptographic Identity...' : 'Authorize Workspace Entry'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ FIX: WORKSPACE B - PIVOT ROUTING STRATEGY
  // Intercept vendor roles early to hand over full viewport rights to VendorWorkspace 
  // without creating double sidebar UI artifacts.
  if (currentUser.role === 'vendor') {
    return (
      <VendorWorkspace 
        onLogout={handleLogout} 
        vendorEnterpriseName={stats?.name || stats?.business_name || "Kano Logistics Hub"} 
      />
    );
  }

  /* Render Layer C: Multi-Tenant Standard View Shell Workspace */
  return (
    <div className={currentUser.role === 'driver' ? 'role-client' : ''}>
      
      <MobileHeader 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        currentTab={currentTab}
        user={currentUser} 
      />

      <div style={{ display: 'flex' }}>
        {/* Render Drawer Sidebar for Corporate Profiles & Developers */}
        {currentUser.role !== 'driver' && (
          <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
            <Sidebar 
              currentTab={currentTab} 
              setCurrentTab={(tab) => { setCurrentTab(tab); setSidebarOpen(false); }} 
              currentUser={currentUser} 
              onLogout={handleLogout} 
            />
          </div>
        )}

        {/* Dynamic Inner Workspace Panel Viewports */}
        <main className="main-content" style={{ flexGrow: 1, width: '100%' }}>

          {/* ==========================================================
              WORKSPACE A: DEVELOPER / SUPER ADMIN ENVIRONMENT
              ========================================================== */}
          {currentUser.role === 'developer' && (
            <>
              {currentTab === 'overview' && (
                <AdminDashboard
                  scope="manager"
                  stats={stats}
                  assets={assets}
                  onActionTrigger={(action) => triggerQuickAction(action)}
                  onDeploy={(asset) => { setSelectedAssetContext(asset); toggleModal('deployment', true); }}
                  pendingReceiptsCount={pendingReceipts.length}
                />
              )}
              {currentTab === 'developer_cockpit' && (
                <DeveloperWorkspace 
                  onLogout={handleLogout}
                  onOpenOnboardWizard={() => toggleModal('vendorOnboard', true)}
                />
              )}
              {currentTab === 'intelligence' && (
                <SearchIntelligence
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onSearchSubmit={handleIntelSearch}
                  searchResult={searchResult}
                  loading={loading}
                />
              )}
            </>
          )}

          {/* ==========================================================
              WORKSPACE C: MANAGER ENVIRONMENT (MASTER ADMIN DESKTOP)
              ========================================================== */}
          {currentUser.role === 'manager' && (
            <>
              {currentTab === 'overview' && (
                <AdminDashboard
                  scope="manager"
                  stats={stats}
                  assets={assets}
                  onActionTrigger={(action) => {
                    if (action === 'new_client' || action === 'review_receipts') {
                      triggerQuickAction(action);
                    } else {
                      alert('Action restricted. Requires Vendor or Developer credentials.');
                    }
                  }}
                  onDeploy={(asset) => { setSelectedAssetContext(asset); toggleModal('deployment', true); }}
                  pendingReceiptsCount={pendingReceipts.length}
                />
              )}

              {currentTab === 'intelligence' && (
                <SearchIntelligence
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onSearchSubmit={handleIntelSearch}
                  searchResult={searchResult}
                  loading={loading}
                />
              )}
            </>
          )}

          {/* ==========================================================
              WORKSPACE D: DRIVER ENVIRONMENT (STATIONARY CLIENT BAR HUB)
              ========================================================== */}
          {currentUser.role === 'driver' && (
            <DriverDashboard
              currentTab={currentTab}
              driverData={driverViewContext}
              onTriggerSubmitReceipt={() => toggleModal('submitReceipt', true)}
            />
          )}

        </main>
      </div>

      {/* Global Context Control Modals Initialization Layer */}
      <DriverOnboardModal 
        isOpen={modals.driverOnboard} 
        onClose={() => toggleModal('driverOnboard', false)} 
        onSubmit={handleDriverOnboard} 
        loading={loading} 
      />

      <VendorOnboardModal 
        isOpen={modals.vendorOnboard} 
        onClose={() => toggleModal('vendorOnboard', false)} 
        onSubmit={handleVendorOnboard} 
        loading={loading} 
      />

      <AdminCreateModal 
        isOpen={modals.adminCreate} 
        onClose={() => toggleModal('adminCreate', false)} 
        onSubmit={handleAdminCreate} 
        loading={loading} 
      />

      <BulkAssetModal 
        isOpen={modals.bulkAsset} 
        onClose={() => toggleModal('bulkAsset', false)} 
        onSubmit={handleBulkAssetGenerate} 
        loading={loading} 
      />

      <DeploymentModal 
        isOpen={modals.deployment} 
        asset={selectedAssetContext} 
        drivers={drivers} 
        onClose={() => toggleModal('deployment', false)} 
        onSubmit={handleAssetDeployment} 
        loading={loading} 
      />

      <AssignManagerModal 
        isOpen={modals.assignManager} 
        asset={selectedAssetContext} 
        vendors={vendors} 
        onClose={() => toggleModal('assignManager', false)} 
        onSubmit={handleAssignManager} 
        loading={loading} 
      />

      <SubmitReceiptModal 
        isOpen={modals.submitReceipt} 
        onClose={() => toggleModal('submitReceipt', false)} 
        onSubmit={handleDriverSubmitReceipt} 
        loading={loading} 
      />

      <ReviewClaimsModal 
        isOpen={modals.reviewClaims} 
        receipts={pendingReceipts} 
        onClose={() => toggleModal('reviewClaims', false)} 
        onAccept={(id) => handleVerifyReceiptClaim(id, 'accept')} 
        onReject={(id, reason) => handleVerifyReceiptClaim(id, 'reject', reason)} 
        loading={loading} 
      />
    </div>
  );
}

export default App;