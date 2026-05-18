import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8195/api/v1';

function App() {
  const [token, setToken] = useState(localStorage.getItem('mafos_token'));
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [loginMode, setLoginMode] = useState('corporate');

  const [stats, setStats] = useState({});
  const [dataList, setDataList] = useState([]);
  const [clients, setClients] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fleetVendor, setFleetVendor] = useState(null);
  const [fleetAssets, setFleetAssets] = useState([]);

  const [showModal, setShowModal] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [vendorDetails, setVendorDetails] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [tempPhotoUrl, setTempPhotoUrl] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [pendingClaims, setPendingClaims] = useState([]);
  const [expandedVendors, setExpandedVendors] = useState({});
  const [expandedManagers, setExpandedManagers] = useState({});
  const [expandedDrivers, setExpandedDrivers] = useState({});
  const [ledgerArchives, setLedgerArchives] = useState([]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('mafos_token', token);
      fetchUser();
    } else {
      localStorage.removeItem('mafos_token');
      setUser(null);
    }
  }, [token]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, currentTab]);

  const fetchWithAuth = async (endpoint, options = {}) => {
    const headers = {
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    if (response.status === 401) {
      setToken(null);
      return null;
    }
    return response;
  };

  const fetchUser = async () => {
    const res = await fetchWithAuth('/users/me');
    if (res && res.ok) {
      const u = await res.json();
      setUser(u);
      if (u.role === 'client') {
        setCurrentTab('dashboard');
      }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Always fetch pending receipts for managers/vendors to hydrate sidebar badge
      if (user && (user.role === 'master_admin' || user.role === 'vendor_owner')) {
        const pRes = await fetchWithAuth('/payments/pending');
        if (pRes && pRes.ok) {
          setPendingClaims(await pRes.json());
        }
      }

      if (user && user.role === 'client') {
        const res = await fetchWithAuth('/users/dashboard/stats');
        if (res) setStats(await res.json());
      } else if (currentTab === 'dashboard') {
        const res = await fetchWithAuth('/users/dashboard/stats');
        if (res) setStats(await res.json());
      } else if (currentTab === 'search') {
        // No auto-fetch for search
      } else {
        let endpoint = '';
        if (currentTab === 'vendors') endpoint = '/users/vendor';
        else if (currentTab === 'managers') endpoint = '/users/master-admin';
        else if (currentTab === 'assets') endpoint = isSuperAdmin ? '/users/vendor' : '/assets/';
        else if (currentTab === 'assignments') endpoint = '/assignments/';
        else if (currentTab === 'collections') endpoint = '/payments/';
        else if (currentTab === 'clients') endpoint = '/clients/';
        else if (currentTab === 'receipts') endpoint = '/payments/pending';

        if (endpoint) {
          const res = await fetchWithAuth(endpoint);
          if (res) {
            const data = await res.json();
            setDataList(data);
            if (currentTab === 'receipts') {
              setPendingClaims(data);
            }
          }
        }

        if (currentTab === 'collections' && user.role === 'super_admin') {
          const archRes = await fetchWithAuth('/payments/archives');
          if (archRes && archRes.ok) {
            setLedgerArchives(await archRes.json());
          }
        }

        if (currentTab === 'assets' && user.role === 'vendor_owner') {
          const mRes = await fetchWithAuth('/users/master-admin');
          if (mRes) setManagers(await mRes.json());
        }
        if (currentTab === 'assets' && user.role === 'master_admin') {
          const cRes = await fetchWithAuth('/clients/');
          if (cRes) setClients(await cRes.json());
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const data = new URLSearchParams();
    data.append('username', e.target.email.value);
    data.append('password', e.target.password.value);
    const res = await fetch(`${API_URL}/login/access-token`, {
      method: 'POST',
      body: data
    });
    if (res.ok) {
      const json = await res.json();
      setToken(json.access_token);
    } else alert("Login failed");
  };

  const handleGlobalSearch = async (e) => {
    e.preventDefault();
    const query = new FormData(e.target).get('query');
    setLoading(true);
    setSearchResult(null);
    const res = await fetchWithAuth(`/assets/search?q=${query}`);
    if (res && res.ok) {
      setSearchResult(await res.json());
    } else {
      alert("No records found for that search query.");
    }
    setLoading(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetchWithAuth('/clients/upload-photo', { method: 'POST', body: formData });
    if (res && res.ok) {
      const json = await res.json();
      setTempPhotoUrl(json.photo_url);
    }
    setUploading(false);
  };

  const submitNewClient = async (e) => {
    e.preventDefault();
    if (!tempPhotoUrl) { alert("Please upload a passport photograph first."); return; }
    const formData = new FormData(e.target);
    const data = {
      full_name: formData.get('full_name'),
      nickname: formData.get('nickname'),
      dob: formData.get('dob'),
      national_id: formData.get('nin'),
      phone_number: formData.get('phone'),
      address: formData.get('address'),
      city_of_duty: formData.get('city'),
      photo_url: tempPhotoUrl,
      next_of_kin: { name: formData.get('nok_name'), phone: formData.get('nok_phone'), relation: formData.get('nok_relation') },
      guarantor_info: { name: formData.get('g_name'), phone: formData.get('g_phone'), address: formData.get('g_address') }
    };
    const res = await fetchWithAuth('/clients/', { method: 'POST', body: JSON.stringify(data) });
    if (res && res.ok) {
      alert("✅ Driver Onboarded Successfully!");
      setShowModal(null);
      setTempPhotoUrl('');
      fetchData();
    } else {
      const err = await res.json();
      alert(`❌ Error: ${err.detail || "Could not register driver"}`);
    }
  };

  const submitNewVendor = async (e) => {
    e.preventDefault();
    const res = await fetchWithAuth('/users/vendor', {
      method: 'POST',
      body: JSON.stringify({
        name: e.target.name.value,
        owner_email: e.target.email.value,
        owner_password: e.target.password.value,
        owner_full_name: e.target.full_name.value,
        cac_number: e.target.cac.value,
        business_type: e.target.type.value
      })
    });
    if (res && res.ok) {
      alert("Vendor Created Successfully!");
      setShowModal(null);
      fetchData();
    }
  };

  const submitNewManager = async (e) => {
    e.preventDefault();
    const res = await fetchWithAuth('/users/master-admin', {
      method: 'POST',
      body: JSON.stringify({
        email: e.target.email.value,
        password: e.target.password.value,
        full_name: e.target.full_name.value,
        vendor_id: user.vendor_id
      })
    });
    if (res && res.ok) {
      alert("Manager Created Successfully!");
      setShowModal(null);
      fetchData();
    }
  };

  const submitBatchAssets = async (e) => {
    e.preventDefault();
    const res = await fetchWithAuth(`/assets/batch?company_prefix=${e.target.prefix.value}&asset_type=${e.target.type.value}&count=${e.target.count.value}`, {
      method: 'POST'
    });
    if (res && res.ok) {
      alert("Assets Created!");
      setShowModal(null);
      fetchData();
    }
  };

  const handleAssignManager = async (e) => {
    e.preventDefault();
    const res = await fetchWithAuth('/assets/assign-manager', {
      method: 'POST',
      body: JSON.stringify({ asset_ids: [selectedItem.id], manager_id: e.target.manager_id.value })
    });
    if (res && res.ok) {
      alert("Asset Assigned to Manager");
      setShowModal(null);
      fetchData();
    }
  };

  const submitPaymentClaim = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const formData = new FormData(e.target);
      formData.append('contract_id', stats.contract.id);
      
      const res = await fetchWithAuth('/payments/claim', {
        method: 'POST',
        body: formData
      });
      
      if (res && res.ok) {
        alert("Receipt Submitted Successfully! Awaiting Manager Verification.");
        setShowModal(null);
        fetchData();
      } else {
        const error = await res.json();
        alert(`Failed to submit: ${error.detail || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  };

  const handleApproveClaim = async (paymentId) => {
    if (!confirm("Are you sure you want to approve and confirm receipt of this money? This will credit the driver's balance immediately.")) return;
    const res = await fetchWithAuth(`/payments/${paymentId}/approve`, { method: 'POST' });
    if (res && res.ok) {
      alert("Claim Approved! Driver balance credited.");
      fetchData();
    }
  };

  const handleRejectClaim = async (paymentId) => {
    const reason = prompt("Enter the reason for rejecting this claim (e.g. 'Money not received', 'Incorrect amount'):");
    if (!reason) return;
    
    const formData = new FormData();
    formData.append('rejection_reason', reason);
    
    const res = await fetchWithAuth(`/payments/${paymentId}/reject`, {
      method: 'POST',
      body: formData
    });
    if (res && res.ok) {
      alert("Claim Declined successfully.");
      fetchData();
    }
  };

  const handleCreateArchive = async () => {
    if (!confirm("Are you sure you want to archive the current system payments ledger? This creates a secure backup downloadable at any time.")) return;
    setUploading(true);
    const res = await fetchWithAuth('/payments/archive', { method: 'POST' });
    if (res && res.ok) {
      alert("Ledger archived successfully!");
      fetchData();
    } else {
      alert("Failed to create archive.");
    }
    setUploading(false);
  };

  const renderManagers = (managersTree) => {
    return Object.keys(managersTree).map(mgr => {
      const isMgrExpanded = !!expandedManagers[mgr];
      const mgrTotal = Object.values(managersTree[mgr]).reduce((sum, drv) => 
        sum + drv.reduce((a, p) => a + (Number(p.amount) || 0), 0)
      , 0);

      return (
        <div key={mgr} style={{background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', marginTop: '10px'}}>
          <div 
            onClick={() => setExpandedManagers(prev => ({ ...prev, [mgr]: !prev[mgr] }))}
            style={{padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isMgrExpanded ? '#f8fafc' : 'transparent'}}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <span style={{fontSize: '1.1rem'}}>{isMgrExpanded ? '📂' : '📁'}</span>
              <strong style={{fontSize: '0.95rem', color: '#334155'}}>{mgr}</strong>
              <span style={{fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '6px', fontWeight: '700', color: '#64748b'}}>Staff Manager</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
              <span style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>Drivers: <strong>{Object.keys(managersTree[mgr]).length}</strong></span>
              <span style={{fontSize: '1rem', color: '#10b981', fontWeight: '800'}}>₦{mgrTotal.toLocaleString()}</span>
            </div>
          </div>

          {isMgrExpanded && (
            <div style={{padding: '10px 20px 15px 20px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid #f1f5f9'}}>
              {renderDrivers(managersTree[mgr])}
            </div>
          )}
        </div>
      );
    });
  };

  const renderDrivers = (driversTree) => {
    return Object.keys(driversTree).map(drv => {
      const isDrvExpanded = !!expandedDrivers[drv];
      const drvTotal = driversTree[drv].reduce((a, p) => a + (Number(p.amount) || 0), 0);

      return (
        <div key={drv} style={{background: '#fafafa', borderRadius: '10px', border: '1px solid #f1f5f9', overflow: 'hidden', marginTop: '10px'}}>
          <div 
            onClick={() => setExpandedDrivers(prev => ({ ...prev, [drv]: !prev[drv] }))}
            style={{padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isDrvExpanded ? '#f8fafc' : 'transparent'}}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <span style={{fontSize: '1rem'}}>{isDrvExpanded ? '👤' : '👥'}</span>
              <strong style={{fontSize: '0.9rem', color: '#475569'}}>{drv}</strong>
              <span style={{fontSize: '0.7rem', background: '#f0fdf4', padding: '2px 6px', borderRadius: '6px', fontWeight: '700', color: '#16a34a'}}>Active Driver</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Payments: <strong>{driversTree[drv].length}</strong></span>
              <span style={{fontSize: '0.95rem', color: '#10b981', fontWeight: '800'}}>₦{drvTotal.toLocaleString()}</span>
            </div>
          </div>

          {isDrvExpanded && (
            <div style={{padding: '10px 18px', borderTop: '1px solid #f1f5f9', overflowX: 'auto'}}>
              <table style={{width: '100%', fontSize: '0.85rem'}}>
                <thead>
                  <tr style={{background: '#f1f5f9'}}>
                    <th>Reference</th>
                    <th>Timestamp</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                    <th>Receipt Upload</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {driversTree[drv].map(p => (
                    <tr key={p.id}>
                      <td><strong style={{color: 'var(--text-muted)', fontSize: '0.75rem'}}>{p.id.substring(0,8).toUpperCase()}</strong></td>
                      <td>{new Date(p.timestamp).toLocaleString()}</td>
                      <td><span className="tag-badge" style={{background: '#e2e8f0', color: '#475569', textTransform: 'uppercase'}}>{p.payment_method}</span></td>
                      <td>
                        {p.status?.toLowerCase() === 'pending' ? (
                          <span className="badge-pending">⏳ PENDING</span>
                        ) : p.status?.toLowerCase() === 'rejected' ? (
                          <span className="badge-rejected">❌ REJECTED</span>
                        ) : (
                          <span className="badge-pending" style={{background: '#d1fae5', color: '#065f46'}}>🟢 APPROVED</span>
                        )}
                      </td>
                      <td>
                        {p.receipt_url ? (
                          <a href={`http://localhost:8195${p.receipt_url}`} target="_blank" rel="noreferrer">
                            <img src={`http://localhost:8195${p.receipt_url}`} alt="Receipt" className="receipt-preview-thumbnail" style={{height: '35px', borderRadius: '5px'}} />
                          </a>
                        ) : (
                          <span style={{color: 'var(--text-muted)', fontSize: '0.8rem'}}>No File</span>
                        )}
                      </td>
                      <td><strong style={{color: '#10b981', fontSize: '1rem'}}>₦{p.amount.toLocaleString()}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    });
  };

  const submitDeployment = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      client_id: formData.get('client_id'),
      asset_id: selectedItem.id,
      plate_number: formData.get('plate_number'),
      chassis_number: formData.get('chassis_number'),
      engine_number: formData.get('engine_number'),
      karota_number: formData.get('karota_number'),
      total_value: parseFloat(formData.get('total_value')),
      weekly_installment: parseFloat(formData.get('weekly')),
      payment_account_number: formData.get('payment_account_number'),
      payment_bank_name: formData.get('payment_bank_name'),
      payment_account_name: formData.get('payment_account_name'),
    };
    const res = await fetchWithAuth('/assignments/', { method: 'POST', body: JSON.stringify(data) });
    if (res && res.ok) {
      alert("Asset Deployed to Driver!");
      setShowModal(null);
      fetchData();
    }
  };

  if (!token) return (
    <div className={`login-screen mode-${loginMode}`}>
      <div className="login-card">
        <h1>{loginMode === 'corporate' ? "MAFOS Pro" : "MAFOS Driver"}</h1>
        <p className="login-subtitle">
          {loginMode === 'corporate' ? "Management & Admin Portal" : "Secure Tricycle Lease Registry"}
        </p>

        {/* Toggle Toggles */}
        <div className="login-toggle-container">
          <button 
            type="button" 
            className={`toggle-btn ${loginMode === 'corporate' ? 'active' : ''}`}
            onClick={() => setLoginMode('corporate')}
          >
            🏢 Corporate Access
          </button>
          <button 
            type="button" 
            className={`toggle-btn ${loginMode === 'driver' ? 'active' : ''}`}
            onClick={() => setLoginMode('driver')}
          >
            🛵 Driver Portal
          </button>
        </div>

        <form onSubmit={handleLogin}>
          <input 
            name="email" 
            type={loginMode === 'corporate' ? 'email' : 'text'} 
            placeholder={loginMode === 'corporate' ? 'Email Address' : 'Registered Phone Number'} 
            required 
          />
          <input 
            name="password" 
            type="password" 
            placeholder={loginMode === 'corporate' ? 'Password' : 'Password (defaults to Phone Number)'} 
            required 
          />
          <button type="submit" className="btn-primary">
            {loginMode === 'corporate' ? 'Authorized Login' : 'Secure Driver Login'}
          </button>
        </form>
      </div>
    </div>
  );

  if (!user) return <div className="loading">Loading Environment...</div>;

  const isSuperAdmin = user.role === 'super_admin';
  const isVendor = user.role === 'vendor_owner';
  const isManager = user.role === 'master_admin';
  const isClient = user.role === 'client';
  const openVendorDetails = async (v) => {
    setLoading(true);
    const res = await fetchWithAuth(`/users/vendor/${v.id}/details`);
    if (res && res.ok) {
      setVendorDetails(await res.json());
      setSelectedItem(v);
    }
    setLoading(false);
  };

  const updateVendorStatus = async (status) => {
    if (!confirm(`Are you sure you want to ${status} this vendor?`)) return;
    const res = await fetchWithAuth(`/users/vendor/${selectedItem.id}/status?status=${status}`, { method: 'POST' });
    if (res && res.ok) {
      alert("Vendor status updated");
      openVendorDetails(selectedItem);
      fetchData();
    }
  };

  const handleDelete = async (type, id) => {
    if (!confirm("Are you sure you want to delete this record? This cannot be undone.")) return;
    let endpoint = type === 'managers' ? `/users/master-admin/${id}` : `/clients/${id}`;
    const res = await fetchWithAuth(endpoint, { method: 'DELETE' });
    if (res && res.ok) {
      alert("Deleted successfully");
      fetchData();
    }
  };

  const openFleetVendor = async (v) => {
    setLoading(true);
    const res = await fetchWithAuth(`/users/vendor/${v.id}/details`);
    if (res && res.ok) {
        const details = await res.json();
        setFleetAssets(details.assets);
        setFleetVendor(v);
    }
    setLoading(false);
  };
  return (
    <div className={`dashboard-container role-${user.role}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          {isSuperAdmin ? "MAFOS AUTHORITY" : isVendor ? "MAFOS BUSINESS" : isClient ? "MAFOS DRIVER" : "MAFOS TERMINAL"}
        </div>
        <nav>
          {!isClient && (
            <button className={currentTab === 'dashboard' ? 'active' : ''} onClick={() => setCurrentTab('dashboard')}>📊 Dashboard</button>
          )}

          {isClient && (
            <>
              <button className={currentTab === 'dashboard' ? 'active' : ''} onClick={() => setCurrentTab('dashboard')}>📊 My Overview</button>
              <button className={currentTab === 'payments' ? 'active' : ''} onClick={() => setCurrentTab('payments')}>📜 Installment History</button>
              <button className={currentTab === 'kyc' ? 'active' : ''} onClick={() => setCurrentTab('kyc')}>🪪 KYC Profile</button>
            </>
          )}

          {isSuperAdmin && (
            <>
              <button className={currentTab === 'search' ? 'active' : ''} onClick={() => setCurrentTab('search')}>🔍 Global Search</button>
              <button className={currentTab === 'vendors' ? 'active' : ''} onClick={() => setCurrentTab('vendors')}>🏢 Manage Vendors</button>
              <button className={currentTab === 'assets' ? 'active' : ''} onClick={() => setCurrentTab('assets')}>🌍 Global Fleet</button>
              <button className={currentTab === 'assignments' ? 'active' : ''} onClick={() => setCurrentTab('assignments')}>📜 All Contracts</button>
              <button className={currentTab === 'collections' ? 'active' : ''} onClick={() => setCurrentTab('collections')}>💰 Installments Ledger</button>
            </>
          )}

          {isVendor && (
            <>
              <button className={currentTab === 'managers' ? 'active' : ''} onClick={() => setCurrentTab('managers')}>👥 Staff Managers</button>
              <button className={currentTab === 'assets' ? 'active' : ''} onClick={() => setCurrentTab('assets')}>🚜 Asset Inventory</button>
              <button className={currentTab === 'clients' ? 'active' : ''} onClick={() => setCurrentTab('clients')}>🪪 Driver Registry</button>
              <button className={currentTab === 'collections' ? 'active' : ''} onClick={() => setCurrentTab('collections')}>💰 Installments Ledger</button>
              <button 
                className={currentTab === 'receipts' ? 'active' : ''} 
                onClick={() => setCurrentTab('receipts')}
                style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}
              >
                <span>⏳ Receipt Claims</span>
                {pendingClaims.length > 0 && (
                  <span className="badge-notification">{pendingClaims.length}</span>
                )}
              </button>
            </>
          )}

          {isManager && (
            <>
              <button className={currentTab === 'assets' ? 'active' : ''} onClick={() => setCurrentTab('assets')}>🛵 Pending Deployment</button>
              <button className={currentTab === 'clients' ? 'active' : ''} onClick={() => setCurrentTab('clients')}>🪪 Drivers List</button>
              <button className={currentTab === 'assignments' ? 'active' : ''} onClick={() => setCurrentTab('assignments')}>📜 Active Routes</button>
              <button className={currentTab === 'collections' ? 'active' : ''} onClick={() => setCurrentTab('collections')}>💰 Installments Ledger</button>
              <button 
                className={currentTab === 'receipts' ? 'active' : ''} 
                onClick={() => setCurrentTab('receipts')}
                style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}
              >
                <span>⏳ Receipt Claims</span>
                {pendingClaims.length > 0 && (
                  <span className="badge-notification">{pendingClaims.length}</span>
                )}
              </button>
            </>
          )}
        </nav>
        <div className="sidebar-footer">
          {isSuperAdmin ? (
            <div className="dev-profile">
                <div className="dev-badge">DEV_MODE</div>
                <div className="user-info">
                    <span className="user-name">{user.full_name.toUpperCase()}</span>
                    <span className="user-role">CORE_DEVELOPER</span>
                </div>
                <button className="btn-logout" style={{marginTop: '15px', background: '#334155', color: '#94a3b8', borderColor: '#475569'}} onClick={() => setToken('')}>Terminate Session</button>
            </div>
          ) : (
            <div className="user-profile">
                <div className="user-info">
                    <span className="user-name">{user.full_name}</span>
                    <span className="user-role">{user.role.replace('_', ' ').toUpperCase()}</span>
                </div>
                <button className="btn-logout" onClick={() => setToken('')}>Sign Out</button>
            </div>
          )}
        </div>
      </aside>

      <main className="main-content">
        <header className="top-nav">
          <div className="nav-header">
            <h2>
              {isClient ? (
                currentTab === 'dashboard' ? 'MY FINANCING DOSSIER' :
                currentTab === 'payments' ? 'MY INSTALLMENT RECEIPTS' : 'MY VERIFIED KYC PROFILE'
              ) : currentTab.replace('_', ' ').toUpperCase()}
            </h2>
            {currentTab === 'clients' && <button className="btn-add-large" onClick={() => setShowModal('new_client')}>+ Register Driver</button>}
            {currentTab === 'vendors' && isSuperAdmin && <button className="btn-add-large" onClick={() => setShowModal('new_vendor')}>+ Setup New Vendor</button>}
            {currentTab === 'managers' && isVendor && <button className="btn-add-large" onClick={() => setShowModal('new_manager')}>+ Add New Manager</button>}
            {currentTab === 'assets' && isVendor && <button className="btn-add-large" onClick={() => setShowModal('batch_assets')}>+ Bulk Register Assets</button>}
          </div>
        </header>

        {currentTab === 'dashboard' && !isClient && (
          <div className="overview-grid">
            <div className="hero-stats-row">
              {!isSuperAdmin ? (
                <div className="receivable-card">
                  <h3>{isVendor ? "Company Receivable" : "Platform Receivable"}</h3>
                  <div className="amount">₦{stats.total_receivable?.toLocaleString()}</div>
                </div>
              ) : (
                <div className="receivable-card" style={{background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white'}}>
                  <h3 style={{color: '#94a3b8'}}>System Monitor Status</h3>
                  <div className="amount" style={{fontSize: '1.8rem', color: '#38bdf8'}}>OPERATIONAL</div>
                  <div style={{marginTop: '12px', fontSize: '0.8rem', color: '#64748b'}}>Cluster: AF-WEST-1 | Nodes: 04</div>
                </div>
              )}
              <div className="distribution-card">
                <h4>{isSuperAdmin ? "Global Platform Distribution" : "System Distribution"}</h4>
                <div className="dist-item">
                    <span>{isSuperAdmin ? "Global STOCK Pool" : "Available STOCK"}</span>
                    <strong>{stats.stock_assets}</strong>
                </div>
                <div className="dist-item">
                    <span>{isSuperAdmin ? "Assets with Managers" : "With Managers"}</span>
                    <strong>{stats.managed_assets}</strong>
                </div>
                <div className="dist-item">
                    <span>{isSuperAdmin ? "Global Active Fleet" : "On Road (Active)"}</span>
                    <strong>{stats.assigned_assets}</strong>
                </div>
              </div>
            </div>

            <div className="secondary-stats-row">
              <div className="mini-stat-card">
                <h3>Total Assets</h3>
                <p>{stats.total_assets}</p>
              </div>
              <div className="mini-stat-card">
                <h3>Verified Drivers</h3>
                <p>{stats.total_clients}</p>
              </div>
              {isSuperAdmin && (
                <div className="mini-stat-card">
                  <h3>Active Partners</h3>
                  <p>{stats.total_vendors}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'dashboard' && isClient && (
          <div className="overview-grid" style={{display: 'flex', flexDirection: 'column', gap: '30px'}}>
            {/* Ownership progress gamification bar */}
            <div className="ownership-progress-container">
              <div className="ownership-header">
                <h3>Tricycle Ownership Progress</h3>
                <span className="percentage">
                  {stats.contract ? `${stats.contract.ownership_percentage}%` : '0%'}
                </span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: stats.contract ? `${stats.contract.ownership_percentage}%` : '0%' }}
                ></div>
              </div>
              <div className="ownership-footer">
                <span>Total Value: ₦{stats.contract?.total_value?.toLocaleString() || 0}</span>
                <span>Remaining: ₦{stats.contract?.remaining_balance?.toLocaleString() || 0}</span>
              </div>
            </div>

            {stats.contract && (
              <div className="bank-detail-card">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'}}>
                  <div>
                    <h3 style={{fontSize: '1.2rem', fontWeight: '900', color: 'var(--text-main)', margin: 0}}>🏦 Make a Bank Transfer</h3>
                    <p style={{fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px'}}>Pay your weekly installment directly to the account details below, then click Submit Receipt.</p>
                  </div>
                  <button 
                    className="btn-primary animate-hover" 
                    style={{
                      background: '#10b981', 
                      color: 'white', 
                      padding: '12px 24px', 
                      borderRadius: '12px', 
                      fontWeight: '800', 
                      border: 'none', 
                      cursor: 'pointer', 
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onClick={() => setShowModal('submit_receipt')}
                  >
                    <span>🛵</span> Submit Transfer Receipt
                  </button>
                </div>
                <div className="info-list" style={{marginTop: '20px'}}>
                  <div className="bank-detail-row"><span>Bank Name:</span> <strong>{stats.contract.payment_bank_name || 'Unity Bank PLC (Default)'}</strong></div>
                  <div className="bank-detail-row"><span>Account Number:</span> <strong style={{fontSize: '1.25rem', color: '#10b981', letterSpacing: '0.5px'}}>{stats.contract.payment_account_number || '1023485764'}</strong></div>
                  <div className="bank-detail-row"><span>Account Name:</span> <strong>{stats.contract.payment_account_name || 'MAFOS Tricycle Logistics Ltd'}</strong></div>
                </div>
              </div>
            )}

            <div className="hero-stats-row">
              <div className="receivable-card" style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white'}}>
                <h3 style={{color: '#a7f3d0'}}>Total Paid (Installments)</h3>
                <div className="amount">₦{stats.contract?.total_paid?.toLocaleString() || 0}</div>
                <div style={{marginTop: '12px', fontSize: '0.85rem', color: '#ecfdf5'}}>Keep up the good work!</div>
              </div>

              <div className="receivable-card" style={{background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white'}}>
                <h3 style={{color: '#fde68a'}}>Weekly Due Amount</h3>
                <div className="amount">₦{stats.contract?.weekly_installment?.toLocaleString() || 0}</div>
                <div style={{marginTop: '12px', fontSize: '0.85rem', color: '#fffbeb'}}>Due every Sunday evening</div>
              </div>
            </div>

            <div className="intel-grid" style={{marginTop: '0px'}}>
              {/* Profile Dossier card */}
              <div className="intel-card">
                <div className="intel-card-header">
                  <h3>👤 Driver Credentials</h3>
                </div>
                <div className="intel-body">
                  <div className="driver-hero">
                    <div className="driver-photo-frame" style={{width: '120px', height: '120px'}}>
                      {stats.driver_profile?.photo_url ? (
                        <img src={`http://localhost:8195${stats.driver_profile.photo_url}`} alt="Driver" />
                      ) : (
                        <div className="no-photo">NO PHOTO</div>
                      )}
                    </div>
                    <h4 style={{fontSize: '1.4rem', fontWeight: 900, marginTop: '10px'}}>{stats.driver_profile?.full_name}</h4>
                    <p className="tag-badge" style={{marginTop: '8px', background: 'var(--primary-light)', color: 'var(--primary)'}}>
                      {stats.driver_profile?.nickname || 'No Nickname'}
                    </p>
                  </div>
                  <div className="info-list" style={{marginTop: '20px'}}>
                    <div className="info-row"><span>NIN Number:</span> <strong>{stats.driver_profile?.national_id}</strong></div>
                    <div className="info-row"><span>Primary Contact:</span> <strong>{stats.driver_profile?.phone_number}</strong></div>
                    <div className="info-row"><span>City of Duty:</span> <strong>{stats.driver_profile?.city_of_duty}</strong></div>
                  </div>
                </div>
              </div>

              {/* Tricycle Machine details card */}
              <div className="intel-card">
                <div className="intel-card-header">
                  <h3>🛵 Assigned Machine Specs</h3>
                </div>
                <div className="intel-body">
                  {stats.asset ? (
                    <div className="info-list">
                      <div className="info-row"><span>Internal ID:</span> <strong className="tag-badge" style={{background: 'var(--primary-light)', color: 'var(--primary)'}}>{stats.asset.internal_id}</strong></div>
                      <div className="info-row"><span>Machine Model:</span> <strong>{stats.asset.model || 'Bajaj Napep'}</strong></div>
                      <div className="info-row"><span>Plate Number:</span> <strong>{stats.asset.plate_number || 'N/A'}</strong></div>
                      <div className="info-row"><span>KAROTA ID:</span> <strong>{stats.asset.karota_number || 'N/A'}</strong></div>
                      <div className="info-row"><span>Engine Number:</span> <strong>{stats.asset.engine_number || 'N/A'}</strong></div>
                      <div className="info-row"><span>Chassis Number:</span> <strong>{stats.asset.chassis_number || 'N/A'}</strong></div>
                    </div>
                  ) : (
                    <div className="no-photo" style={{height: '200px'}}>NO ACTIVE MACHINE ASSIGNED</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'search' && (
          <div className="search-view">
            <div className="search-box-container">
              <h2>Global Intelligence</h2>
              <p>Search across assets, drivers, and contracts for real-time telemetry.</p>
              <form onSubmit={handleGlobalSearch} className="search-form-wrap">
                <input name="query" className="search-input-main" placeholder="Search Plate, KAROTA, NIN, Name..." required />
                <button type="submit" className="btn-primary search-btn-hero">Execute Search</button>
              </form>
            </div>

            {searchResult && (
              <div className="intel-grid">
                <div className="intel-card">
                  <div className="intel-card-header">
                    <h3>👤 Driver Dossier</h3>
                  </div>
                  <div className="intel-body">
                    <div className="driver-hero">
                      <div className="driver-photo-frame">
                        {searchResult.driver?.photo ? (
                          <img src={`http://localhost:8195${searchResult.driver.photo}`} alt="Driver" />
                        ) : (
                          <div className="no-photo">NO PHOTO</div>
                        )}
                      </div>
                      <h4 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{searchResult.driver?.name}</h4>
                      <p className="tag-badge" style={{ marginTop: '8px' }}>{searchResult.driver?.nickname || 'NO NICKNAME'}</p>
                    </div>
                    <div className="info-list">
                      <div className="info-row"><span>NIN Number:</span> <strong>{searchResult.driver?.nin}</strong></div>
                      <div className="info-row"><span>Primary Contact:</span> <strong>{searchResult.driver?.phone}</strong></div>
                      <div className="info-row"><span>Residential:</span> <strong style={{ maxWidth: '180px', textAlign: 'right' }}>{searchResult.driver?.address}</strong></div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  <div className="intel-card">
                    <div className="intel-card-header">
                      <h3>🚜 Machine Intelligence</h3>
                    </div>
                    <div className="intel-body">
                      <div className="info-list" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div className="info-row"><span>Internal ID:</span> <strong>{searchResult.asset.internal_id}</strong></div>
                        <div className="info-row"><span>Plate Number:</span> <strong style={{ color: 'var(--primary)' }}>{searchResult.asset.plate}</strong></div>
                        <div className="info-row"><span>KAROTA No:</span> <strong>{searchResult.asset.karota}</strong></div>
                        <div className="info-row"><span>Chassis No:</span> <strong>{searchResult.asset.chassis}</strong></div>
                        <div className="info-row"><span>Engine No:</span> <strong>{searchResult.asset.engine}</strong></div>
                        <div className="info-row"><span>Machine Model:</span> <strong>{searchResult.asset.model}</strong></div>
                      </div>
                    </div>
                  </div>

                  <div className="intel-card">
                    <div className="intel-card-header">
                      <h3>💰 Financial Ledger</h3>
                    </div>
                    <div className="intel-body">
                      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Current Outstanding Balance</span>
                        <div className="finance-badge">₦{searchResult.finance?.balance?.toLocaleString() || '0'}</div>
                      </div>
                      <div className="finance-row">
                        <div className="finance-stat">
                          <span>Weekly Pay</span>
                          <strong>₦{searchResult.finance?.weekly?.toLocaleString() || '0'}</strong>
                        </div>
                        <div className="finance-stat">
                          <span>Total Value</span>
                          <strong>₦{searchResult.finance?.total_value?.toLocaleString() || '0'}</strong>
                        </div>
                        <div className="finance-stat">
                          <span>Contract Status</span>
                          <strong style={{ color: 'var(--success)' }}>{searchResult.finance?.status.toUpperCase() || 'N/A'}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="intel-card">
                    <div className="intel-card-header">
                      <h3>🏢 Management & Ownership</h3>
                    </div>
                    <div className="intel-body">
                      <div className="info-list" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div className="info-row"><span>Vendor:</span> <strong>{searchResult.management.vendor_name}</strong></div>
                        <div className="info-row"><span>Vendor Contact:</span> <strong>{searchResult.management.vendor_phone}</strong></div>
                        <div className="info-row"><span>Staff Manager:</span> <strong>{searchResult.management.manager_name}</strong></div>
                        <div className="info-row"><span>Staff Contact:</span> <strong>{searchResult.management.manager_phone}</strong></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentTab === 'payments' && isClient && (
          <div className="data-view" style={{padding: '30px', background: 'white', borderRadius: '20px', boxShadow: 'var(--shadow)', border: '1px solid var(--border)'}}>
            <h3 style={{fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text-main)'}}>Installment Payment Receipts Ledger</h3>
            {stats.payments && stats.payments.length > 0 ? (
              <table className="receipt-table">
                <thead>
                  <tr>
                    <th>Receipt Reference</th>
                    <th>Payment Date & Time</th>
                    <th>Payment Method</th>
                    <th>Amount Paid</th>
                    <th>Collected By</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.payments.map((p, idx) => (
                    <tr key={p.id} className="receipt-row">
                      <td><strong style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>{p.id.substring(0, 8).toUpperCase()}</strong></td>
                      <td>{p.timestamp ? new Date(p.timestamp).toLocaleString() : 'N/A'}</td>
                      <td><span className="tag-badge" style={{background: '#f1f5f9', color: '#475569', textTransform: 'uppercase'}}>{p.payment_method}</span></td>
                      <td><strong style={{color: 'var(--primary)', fontSize: '1.05rem'}}>₦{p.amount.toLocaleString()}</strong></td>
                      <td>{p.collected_by}</td>
                      <td>
                        {p.status?.toLowerCase() === 'pending' ? (
                          <span className="badge-pending">⏳ PENDING VERIFICATION</span>
                        ) : p.status?.toLowerCase() === 'rejected' ? (
                          <div style={{display: 'flex', flexDirection: 'column'}}>
                            <span className="badge-rejected">❌ DECLINED</span>
                            {p.rejection_reason && (
                              <span className="rejection-reason-text">"{p.rejection_reason}"</span>
                            )}
                          </div>
                        ) : (
                          <span className="receipt-badge">🟢 SUCCESS</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-photo" style={{height: '200px'}}>NO INSTALLMENT PAYMENTS RECORDED YET</div>
            )}
          </div>
        )}

        {currentTab === 'kyc' && isClient && (
          <div className="overview-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px'}}>
            <div className="intel-card">
              <div className="intel-card-header">
                <h3>📋 Verified Personal KYC Profile</h3>
              </div>
              <div className="intel-body">
                <div className="info-list">
                  <div className="info-row"><span>Full Legal Name:</span> <strong>{stats.driver_profile?.full_name}</strong></div>
                  <div className="info-row"><span>Driver Nickname:</span> <strong>{stats.driver_profile?.nickname || 'N/A'}</strong></div>
                  <div className="info-row"><span>Date of Birth:</span> <strong>{stats.driver_profile?.dob || 'N/A'}</strong></div>
                  <div className="info-row"><span>National ID (NIN):</span> <strong>{stats.driver_profile?.national_id}</strong></div>
                  <div className="info-row"><span>Phone Contact:</span> <strong>{stats.driver_profile?.phone_number}</strong></div>
                  <div className="info-row"><span>Residential Address:</span> <strong style={{maxWidth: '220px', textAlign: 'right'}}>{stats.driver_profile?.address}</strong></div>
                  <div className="info-row"><span>Duty City:</span> <strong>{stats.driver_profile?.city_of_duty}</strong></div>
                </div>
              </div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '30px'}}>
              <div className="intel-card">
                <div className="intel-card-header">
                  <h3>👥 Next of Kin Contact</h3>
                </div>
                <div className="intel-body">
                  <div className="info-list">
                    <div className="info-row"><span>Kin Name:</span> <strong>{stats.driver_profile?.next_of_kin?.name || 'N/A'}</strong></div>
                    <div className="info-row"><span>Relationship:</span> <strong>{stats.driver_profile?.next_of_kin?.relation || 'N/A'}</strong></div>
                    <div className="info-row"><span>Kin Phone:</span> <strong>{stats.driver_profile?.next_of_kin?.phone || 'N/A'}</strong></div>
                  </div>
                </div>
              </div>

              <div className="intel-card">
                <div className="intel-card-header">
                  <h3>🛡️ Verified Legal Guarantor</h3>
                </div>
                <div className="intel-body">
                  <div className="info-list">
                    <div className="info-row"><span>Guarantor Name:</span> <strong>{stats.driver_profile?.guarantor_info?.name || 'N/A'}</strong></div>
                    <div className="info-row"><span>Guarantor Phone:</span> <strong>{stats.driver_profile?.guarantor_info?.phone || 'N/A'}</strong></div>
                    <div className="info-row"><span>Residential Address:</span> <strong style={{maxWidth: '220px', textAlign: 'right'}}>{stats.driver_profile?.guarantor_info?.address || 'N/A'}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentTab !== 'dashboard' && currentTab !== 'search' && currentTab !== 'collections' && !isClient && !vendorDetails && (
          <div className="data-view">
            {currentTab === 'assets' && isSuperAdmin && fleetVendor && (
                <div className="nav-header" style={{marginBottom: '20px'}}>
                    <h3 style={{fontSize: '1.2rem', fontWeight: 800}}>📍 Fleet Explorer: {fleetVendor.name}</h3>
                    <button className="btn-cancel" onClick={() => setFleetVendor(null)}>Back to Vendors</button>
                </div>
            )}
            <table>
              <thead>
                <tr>
                  {currentTab === 'clients' && <><th>Photo</th><th>Name</th><th>Nickname</th><th>NIN</th><th>City</th><th>Actions</th></>}
                  {currentTab === 'vendors' && <><th>Tag</th><th>Company</th><th>Owner</th><th>Status</th></>}
                  {currentTab === 'managers' && <><th>Full Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></>}
                  {currentTab === 'assets' && (
                      isSuperAdmin && !fleetVendor ? 
                      <><th>Tag</th><th>Company</th><th>Owner</th><th>Actions</th></> :
                      <><th>Internal ID</th><th>Type</th><th>Plate</th><th>Status</th><th>Action</th></>
                  )}
                  {currentTab === 'assignments' && <><th>Driver</th><th>Asset ID</th><th>Plate</th><th>Balance</th></>}
                  {currentTab === 'receipts' && <><th>Date Claimed</th><th>Sender / Driver</th><th>Amount Paid</th><th>Receipt Upload</th><th>Actions</th></>}
                </tr>
              </thead>
              <tbody>
                {(currentTab === 'assets' && isSuperAdmin && fleetVendor ? fleetAssets : dataList).map((item, idx) => (
                  <tr key={idx} 
                      onClick={() => currentTab === 'vendors' && isSuperAdmin && openVendorDetails(item)} 
                      style={{cursor: (currentTab === 'vendors' && isSuperAdmin) ? 'pointer' : 'default'}}>
                    {currentTab === 'clients' && (
                      <>
                        <td><img src={`http://localhost:8195${item.photo}`} alt="DP" className="driver-thumb" /></td>
                        <td>{item.full_name}</td>
                        <td>{item.nickname || 'N/A'}</td>
                        <td>{item.nin}</td>
                        <td>{item.city}</td>
                        <td>
                          <button className="btn-pay" onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setShowModal('edit_client') }}>Edit</button>
                          <button className="btn-logout" style={{width: 'auto', padding: '6px 12px', marginLeft: '8px'}} onClick={(e) => { e.stopPropagation(); handleDelete('clients', item.id) }}>Delete</button>
                        </td>
                      </>
                    )}
                    {currentTab === 'vendors' && (
                      <>
                        <td><span className="tag-badge">{item.vendor_tag}</span></td>
                        <td>{item.name}</td>
                        <td>{item.owner_full_name}</td>
                        <td><span className={`status-${item.status}`}>{item.status}</span></td>
                      </>
                    )}
                    {currentTab === 'managers' && (
                      <>
                        <td>{item.full_name}</td>
                        <td>{item.email}</td>
                        <td><span className="tag-badge">MANAGER</span></td>
                        <td><span className="status-ASSIGNED">ACTIVE</span></td>
                        <td>
                          <button className="btn-pay" onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setShowModal('edit_manager') }}>Edit</button>
                          <button className="btn-logout" style={{width: 'auto', padding: '6px 12px', marginLeft: '8px'}} onClick={(e) => { e.stopPropagation(); handleDelete('managers', item.id) }}>Delete</button>
                        </td>
                      </>
                    )}
                    {currentTab === 'assets' && (
                      <>
                        {isSuperAdmin && !fleetVendor ? (
                            <>
                                <td><span className="tag-badge">{item.vendor_tag}</span></td>
                                <td style={{fontWeight: 800}}>{item.name}</td>
                                <td>{item.owner_full_name}</td>
                                <td><button className="btn-pay" onClick={() => openFleetVendor(item)}>Explore Fleet</button></td>
                            </>
                        ) : (
                            <>
                                <td><span className="tag-badge">{item.internal_id}</span></td>
                                <td>{item.type}</td>
                                <td>{item.plate || 'N/A'}</td>
                                <td><span className={`status-${item.status}`}>{item.status}</span></td>
                                <td>
                                {isManager && item.status === 'MANAGED' && (
                                    <button className="btn-deploy" onClick={() => { setSelectedItem(item); setShowModal('deploy') }}>Deploy</button>
                                )}
                                {isVendor && item.status === 'STOCK' && (
                                    <button className="btn-pay" onClick={() => { setSelectedItem(item); setShowModal('assign_manager') }}>Assign Manager</button>
                                )}
                                </td>
                            </>
                        )}
                      </>
                    )}
                    {currentTab === 'assignments' && (
                      <>
                        <td>{item.driver_name}</td>
                        <td>{item.asset_id}</td>
                        <td>{item.plate}</td>
                        <td className="balance-cell">₦{item.balance?.toLocaleString()}</td>
                      </>
                    )}
                    {currentTab === 'receipts' && (
                      <>
                        <td>{item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}</td>
                        <td>
                          <strong style={{color: 'var(--text-main)'}}>{item.sender_name}</strong>
                          <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Contract: {item.contract_id?.substring(0,8).toUpperCase()}</div>
                        </td>
                        <td><strong style={{color: '#10b981', fontSize: '1.1rem'}}>₦{item.amount?.toLocaleString()}</strong></td>
                        <td>
                          {item.receipt_url ? (
                            <a href={`http://localhost:8195${item.receipt_url}`} target="_blank" rel="noreferrer">
                              <img src={`http://localhost:8195${item.receipt_url}`} alt="Receipt" className="receipt-preview-thumbnail" />
                            </a>
                          ) : (
                            'No File'
                          )}
                        </td>
                        <td>
                          <button 
                            className="btn-primary animate-hover" 
                            style={{background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '0.85rem'}}
                            onClick={(e) => { e.stopPropagation(); handleApproveClaim(item.id); }}
                          >
                            Confirm & Credit
                          </button>
                          <button 
                            className="btn-logout animate-hover" 
                            style={{width: 'auto', padding: '8px 16px', marginLeft: '8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '0.85rem'}}
                            onClick={(e) => { e.stopPropagation(); handleRejectClaim(item.id); }}
                          >
                            Decline
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {currentTab === 'collections' && !isClient && (
          <div className="collections-drilldown-container" style={{display: 'flex', flexDirection: 'column', gap: '30px', marginTop: '20px'}}>
            
            {/* Header with Developer Archive actions */}
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '25px 30px', borderRadius: '20px', boxShadow: 'var(--shadow)', border: '1px solid var(--border)'}}>
              <div>
                <h2 style={{fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', margin: 0}}>💰 Interactive Installments Ledger</h2>
                <p style={{fontSize: '0.9rem', color: 'var(--text-muted)', margin: '5px 0 0 0'}}>
                  {isSuperAdmin ? "Global system audit across all active vendors, managers and driver routes." : 
                   isVendor ? "Corporate balance audit for staff managers and registered driver fleets." :
                   "Route installment ledgers for your registered active drivers."}
                </p>
              </div>

              {isSuperAdmin && (
                <button 
                  className="btn-primary animate-hover" 
                  style={{background: '#6366f1', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', color: 'white'}}
                  onClick={handleCreateArchive}
                >
                  📦 Archive System Ledger
                </button>
              )}
            </div>

            {/* Drilldown accordion view */}
            <div style={{padding: '30px', background: 'white', borderRadius: '20px', boxShadow: 'var(--shadow)', border: '1px solid var(--border)'}}>
              <h3 style={{fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text-main)', marginTop: 0}}>Lineage Drill-Down Explorer</h3>
              
              {dataList.length === 0 ? (
                <div className="no-photo" style={{height: '150px'}}>NO PAYMENTS RECORDED YET IN THE SYSTEM</div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                  {(() => {
                    const tree = {};
                    dataList.forEach(p => {
                      const vName = p.vendor_name || "Unknown Vendor";
                      const mName = p.manager_name || "Self-Reported Claim (No Manager)";
                      const dName = p.driver_name || "Unknown Driver";
                      
                      if (!tree[vName]) tree[vName] = {};
                      if (!tree[vName][mName]) tree[vName][mName] = {};
                      if (!tree[vName][mName][dName]) tree[vName][mName][dName] = [];
                      
                      tree[vName][mName][dName].push(p);
                    });

                    if (isSuperAdmin) {
                      return Object.keys(tree).map(vendor => {
                        const isVendExpanded = !!expandedVendors[vendor];
                        const vendorTotal = Object.values(tree[vendor]).reduce((sum, mgr) => 
                          sum + Object.values(mgr).reduce((s, drv) => s + drv.reduce((a, p) => a + (Number(p.amount) || 0), 0), 0)
                        , 0);

                        return (
                          <div key={vendor} style={{background: '#f8fafc', borderRadius: '15px', border: '1px solid #e2e8f0', overflow: 'hidden', marginTop: '10px'}}>
                            <div 
                              onClick={() => setExpandedVendors(prev => ({ ...prev, [vendor]: !prev[vendor] }))}
                              style={{padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isVendExpanded ? '#f1f5f9' : 'transparent', transition: 'background 0.2s'}}
                            >
                              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                                <span style={{fontSize: '1.2rem'}}>{isVendExpanded ? '📂' : '📁'}</span>
                                <strong style={{fontSize: '1.05rem', color: '#1e293b'}}>{vendor}</strong>
                                <span style={{fontSize: '0.8rem', background: '#e2e8f0', padding: '3px 8px', borderRadius: '8px', fontWeight: '700', color: '#475569'}}>Vendor Owner</span>
                              </div>
                              <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                                <span style={{fontSize: '0.95rem', color: 'var(--text-muted)'}}>Managers: <strong>{Object.keys(tree[vendor]).length}</strong></span>
                                <span style={{fontSize: '1.1rem', color: '#10b981', fontWeight: '800'}}>₦{vendorTotal.toLocaleString()}</span>
                              </div>
                            </div>

                            {isVendExpanded && (
                              <div style={{padding: '10px 24px 20px 24px', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #e2e8f0'}}>
                                {renderManagers(tree[vendor])}
                              </div>
                            )}
                          </div>
                        );
                      });
                    }

                    if (isVendor) {
                      const myVendorBranch = Object.values(tree)[0] || {};
                      return renderManagers(myVendorBranch);
                    }

                    if (isManager) {
                      const myManagerDrivers = {};
                      Object.values(tree).forEach(mgrs => {
                        Object.keys(mgrs).forEach(mgr => {
                          if (mgr.toLowerCase().includes(user.full_name.toLowerCase()) || Object.keys(mgrs).length === 1) {
                            Object.assign(myManagerDrivers, mgrs[mgr]);
                          }
                        });
                      });
                      return renderDrivers(myManagerDrivers);
                    }
                  })()}
                </div>
              )}
            </div>

            {/* Developer Archiving Ledger packages list */}
            {isSuperAdmin && (
              <div style={{padding: '30px', background: 'white', borderRadius: '20px', boxShadow: 'var(--shadow)', border: '1px solid var(--border)'}}>
                <h3 style={{fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text-main)', marginTop: 0}}>📦 Archived Ledger Packages</h3>
                {ledgerArchives.length === 0 ? (
                  <div className="no-photo" style={{height: '100px'}}>NO LEDGER ARCHIVES CREATED YET</div>
                ) : (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                    {ledgerArchives.map(arch => (
                      <div key={arch.filename} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '15px 24px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
                        <div>
                          <strong style={{color: '#1e293b', fontSize: '0.95rem'}}>{arch.filename}</strong>
                          <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px'}}>
                            Saved: {new Date(arch.created_at).toLocaleString()} | Size: {(arch.size_bytes / 1024).toFixed(2)} KB
                          </div>
                        </div>
                        <a 
                          href={`http://localhost:8195/api/v1/payments/archives/${arch.filename}`} 
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="btn-primary animate-hover" 
                          style={{background: '#10b981', display: 'inline-block', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', color: 'white', fontSize: '0.85rem', textDecoration: 'none'}}
                        >
                          ⬇️ Download Package
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}


        {currentTab === 'vendors' && vendorDetails && (
          <div className="vendor-control-panel" style={{marginTop: '40px'}}>
            <div className="nav-header">
                <h3 style={{fontSize: '1.5rem', fontWeight: 900}}>Vendor Intelligence: {vendorDetails.vendor.name}</h3>
                <div className="modal-actions" style={{marginTop: 0}}>
                    {vendorDetails.vendor.status === 'active' ? 
                        <button className="btn-logout" onClick={() => updateVendorStatus('suspended')}>Suspend Vendor</button> :
                        <button className="btn-primary" style={{background: 'var(--success)'}} onClick={() => updateVendorStatus('active')}>Activate Vendor</button>
                    }
                    <button className="btn-cancel" onClick={() => setVendorDetails(null)}>Close Intelligence</button>
                </div>
            </div>

            <div className="intel-grid" style={{marginTop: '24px'}}>
                <div className="intel-card">
                    <div className="intel-card-header"><h3>Staff Managers</h3></div>
                    <div className="intel-body scrollable" style={{maxHeight: '300px'}}>
                        <table>
                            <thead><tr><th>Name</th><th>Email</th></tr></thead>
                            <tbody>
                                {vendorDetails.managers.map(m => <tr key={m.id}><td>{m.name}</td><td>{m.email}</td></tr>) || <tr><td colSpan="2">No Managers</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="intel-card">
                    <div className="intel-card-header"><h3>Assigned Drivers</h3></div>
                    <div className="intel-body scrollable" style={{maxHeight: '300px'}}>
                         <table>
                            <thead><tr><th>Name</th><th>NIN</th></tr></thead>
                            <tbody>
                                {vendorDetails.clients.map(c => <tr key={c.id}><td>{c.name}</td><td>{c.nin}</td></tr>) || <tr><td colSpan="2">No Drivers</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="intel-card intel-full-width">
                    <div className="intel-card-header"><h3>Asset Inventory</h3></div>
                    <div className="intel-body scrollable">
                         <table>
                            <thead><tr><th>ID</th><th>Plate</th><th>Status</th></tr></thead>
                            <tbody>
                                {vendorDetails.assets.map(a => <tr key={a.id}><td>{a.internal_id}</td><td>{a.plate}</td><td>{a.status}</td></tr>) || <tr><td colSpan="3">No Assets</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* ... Modals ... */}
        {showModal === 'new_client' && (
          <div className="modal-overlay">
            <div className="modal-content wide">
              <div className="modal-header">
                <h3>Onboard Professional Driver</h3>
                <p>Complete the full KYC profile to verify the driver.</p>
              </div>
              <form onSubmit={submitNewClient} className="deployment-form scrollable">
                <div className="form-row">
                  <div className="form-section">
                    <h4>1. Personal Profile</h4>
                    <div className="photo-upload-zone">
                      {tempPhotoUrl ? (
                        <img src={`http://localhost:8195${tempPhotoUrl}`} alt="Passport" className="preview-img" />
                      ) : (
                        <div className="upload-placeholder">
                          <input type="file" onChange={handlePhotoUpload} accept="image/*" />
                          <span>{uploading ? "Uploading..." : "Click to Upload Passport"}</span>
                        </div>
                      )}
                    </div>
                    <input name="full_name" placeholder="Full Name" required />
                    <input name="nickname" placeholder="Nickname (Kunyawa)" />
                    <input name="dob" type="date" placeholder="Date of Birth" required />
                    <input name="phone" placeholder="Primary Phone Number" required />
                  </div>
                  <div className="form-section">
                    <h4>2. Identification & Operation</h4>
                    <input name="nin" placeholder="NIN (National ID Number)" required />
                    <input name="city" placeholder="City of Duty (e.g. Kano, Kaduna)" required />
                    <textarea name="address" placeholder="Residential Full Address" required rows="3"></textarea>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-section">
                    <h4>3. Next of Kin</h4>
                    <input name="nok_name" placeholder="Next of Kin Name" required />
                    <input name="nok_phone" placeholder="Next of Kin Phone" required />
                    <input name="nok_relation" placeholder="Relationship" required />
                  </div>
                  <div className="form-section">
                    <h4>4. Guarantor Info</h4>
                    <input name="g_name" placeholder="Guarantor Name" required />
                    <input name="g_phone" placeholder="Guarantor Phone" required />
                    <textarea name="g_address" placeholder="Guarantor Address" required rows="2"></textarea>
                  </div>
                </div>

                <div className="modal-actions sticky-footer">
                  <button type="submit" className="btn-primary" disabled={uploading}>Register & Verify Driver</button>
                  <button type="button" className="btn-cancel" onClick={() => { setShowModal(null); setTempPhotoUrl(''); }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showModal === 'new_vendor' && (
          <div className="modal-overlay">
            <div className="modal-content wide">
              <div className="modal-header">
                <h3>Onboard New Vendor</h3>
                <p>Register a new partner business and provision their owner account.</p>
              </div>
              <form onSubmit={submitNewVendor} className="deployment-form">
                <div className="form-row">
                    <div className="form-section">
                        <h4>Business Info</h4>
                        <input name="name" placeholder="Business Name" required />
                        <input name="cac" placeholder="CAC Number" required />
                        <input name="type" placeholder="Business Type" required />
                    </div>
                    <div className="form-section">
                        <h4>Owner Access</h4>
                        <input name="full_name" placeholder="Owner Full Name" required />
                        <input name="email" type="email" placeholder="Owner Email" required />
                        <input name="password" type="password" placeholder="System Password" required />
                    </div>
                </div>
                <div className="modal-actions">
                  <button type="submit" className="btn-primary">Provision Vendor Account</button>
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(null)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showModal === 'new_manager' && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Create Master Admin</h3>
              <p>Setup a new staff account to manage your fleet.</p>
              <form onSubmit={submitNewManager} style={{ marginTop: '20px' }}>
                <input name="full_name" placeholder="Staff Full Name" required />
                <input name="email" type="email" placeholder="Login Email" required />
                <input name="password" type="password" placeholder="Temporary Password" required />
                <div className="modal-actions">
                  <button type="submit" className="btn-primary">Create Account</button>
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(null)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showModal === 'batch_assets' && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Bulk Asset Creation</h3>
              <form onSubmit={submitBatchAssets}>
                <input name="prefix" placeholder="Company Prefix (e.g. AB)" required />
                <input name="type" placeholder="Asset Type (e.g. Napep)" required />
                <input name="count" type="number" placeholder="Quantity" required />
                <div className="modal-actions">
                  <button type="submit" className="btn-primary">Generate Assets</button>
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(null)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showModal === 'assign_manager' && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Assign Asset to Manager</h3>
              <p>Asset: {selectedItem.internal_id}</p>
              <form onSubmit={handleAssignManager} style={{ marginTop: '20px' }}>
                <select name="manager_id">
                  {managers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
                <div className="modal-actions">
                  <button type="submit" className="btn-primary">Confirm Assignment</button>
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(null)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showModal === 'deploy' && (
          <div className="modal-overlay">
            <div className="modal-content wide">
              <div className="modal-header">
                <h3>Deploy Asset: {selectedItem.internal_id}</h3>
                <p>Register the technical numbers and assign to a driver.</p>
              </div>
              <form onSubmit={submitDeployment} className="deployment-form">
                <div className="form-row">
                    <div className="form-section">
                        <h4>Driver & Finance</h4>
                        <select name="client_id" required>
                            <option value="">Select Verified Driver...</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.nin})</option>)}
                        </select>
                        <input name="total_value" type="number" placeholder="Total Contract Value (₦)" required />
                        <input name="weekly" type="number" placeholder="Weekly Installment (₦)" required />
                    </div>
                    <div className="form-section">
                        <h4>Technical Specs</h4>
                        <input name="plate_number" placeholder="Plate Number" required />
                        <input name="karota_number" placeholder="KAROTA Number" required />
                        <input name="chassis_number" placeholder="Chassis Number" required />
                        <input name="engine_number" placeholder="Engine Number" required />
                    </div>
                </div>
                <div className="form-row" style={{marginTop: '15px'}}>
                    <div className="form-section" style={{flex: 1}}>
                        <h4>Bank Account Details (For Driver Transfer Payments)</h4>
                        <div style={{display: 'flex', gap: '12px'}}>
                            <input name="payment_bank_name" placeholder="Bank Name (e.g. Access Bank)" required style={{flex: 1}} />
                            <input name="payment_account_number" placeholder="Account Number" required style={{flex: 1}} />
                        </div>
                        <input name="payment_account_name" placeholder="Account Name (e.g. Solunex Enterprise)" required style={{marginTop: '12px'}} />
                    </div>
                </div>
                <div className="modal-actions" style={{marginTop: '20px'}}>
                  <button type="submit" className="btn-primary">Activate Deployment</button>
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(null)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showModal === 'submit_receipt' && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Submit Bank Transfer Receipt</h3>
              <p style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>Upload a screenshot or photo of your payment receipt.</p>
              <form onSubmit={submitPaymentClaim} style={{ marginTop: '20px' }} className="deployment-form">
                <div className="form-section">
                  <label style={{fontWeight: '800', fontSize: '0.85rem', color: 'var(--text-muted)'}}>Amount Paid (₦)</label>
                  <input 
                    name="amount" 
                    type="number" 
                    placeholder="e.g. 15000" 
                    required 
                    defaultValue={stats.contract?.weekly_installment || ''}
                    style={{marginTop: '4px'}}
                  />
                  
                  <label style={{fontWeight: '800', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginTop: '12px'}}>Sender Account Holder Name</label>
                  <input name="sender_name" placeholder="e.g. Abubakar Shuaibu" required style={{marginTop: '4px'}} />
                  
                  <label style={{fontWeight: '800', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginTop: '12px'}}>Upload Screenshot (PNG/JPG)</label>
                  <input 
                    name="file" 
                    type="file" 
                    accept="image/*" 
                    required 
                    style={{
                      marginTop: '4px',
                      padding: '12px',
                      border: '2px dashed var(--border)',
                      borderRadius: '8px',
                      background: '#f8fafc',
                      cursor: 'pointer',
                      width: '100%',
                      boxSizing: 'border-box'
                    }} 
                  />
                </div>
                
                <div className="modal-actions" style={{marginTop: '24px'}}>
                  <button type="submit" className="btn-primary" disabled={uploading} style={{background: '#10b981'}}>
                    {uploading ? "Uploading Claim..." : "Submit Receipt Claim"}
                  </button>
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(null)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
