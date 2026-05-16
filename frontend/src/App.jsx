import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8195/api/v1';

function App() {
  const [token, setToken] = useState(localStorage.getItem('mafos_token'));
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('dashboard');

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
    if (res && res.ok) setUser(await res.json());
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (currentTab === 'dashboard') {
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

        const res = await fetchWithAuth(endpoint);
        if (res) setDataList(await res.json());

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
    };
    const res = await fetchWithAuth('/assignments/', { method: 'POST', body: JSON.stringify(data) });
    if (res && res.ok) {
      alert("Asset Deployed to Driver!");
      setShowModal(null);
      fetchData();
    }
  };

  if (!token) return (
    <div className="login-screen">
      <div className="login-card">
        <h1>MAFOS Pro</h1>
        <form onSubmit={handleLogin}>
          <input name="email" type="email" placeholder="Email" required />
          <input name="password" type="password" placeholder="Password" required />
          <button type="submit" className="btn-primary">Authorized Login</button>
        </form>
      </div>
    </div>
  );

  if (!user) return <div className="loading">Loading Environment...</div>;

  const isSuperAdmin = user.role === 'super_admin';
  const isVendor = user.role === 'vendor_owner';
  const isManager = user.role === 'master_admin';
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
          {isSuperAdmin ? "MAFOS AUTHORITY" : isVendor ? "MAFOS BUSINESS" : "MAFOS TERMINAL"}
        </div>
        <nav>
          <button className={currentTab === 'dashboard' ? 'active' : ''} onClick={() => setCurrentTab('dashboard')}>📊 Dashboard</button>

          {isSuperAdmin && (
            <>
              <button className={currentTab === 'search' ? 'active' : ''} onClick={() => setCurrentTab('search')}>🔍 Global Search</button>
              <button className={currentTab === 'vendors' ? 'active' : ''} onClick={() => setCurrentTab('vendors')}>🏢 Manage Vendors</button>
              <button className={currentTab === 'assets' ? 'active' : ''} onClick={() => setCurrentTab('assets')}>🌍 Global Fleet</button>
              <button className={currentTab === 'assignments' ? 'active' : ''} onClick={() => setCurrentTab('assignments')}>📜 All Contracts</button>
            </>
          )}

          {isVendor && (
            <>
              <button className={currentTab === 'managers' ? 'active' : ''} onClick={() => setCurrentTab('managers')}>👥 Staff Managers</button>
              <button className={currentTab === 'assets' ? 'active' : ''} onClick={() => setCurrentTab('assets')}>🚜 Asset Inventory</button>
              <button className={currentTab === 'clients' ? 'active' : ''} onClick={() => setCurrentTab('clients')}>🪪 Driver Registry</button>
            </>
          )}

          {isManager && (
            <>
              <button className={currentTab === 'assets' ? 'active' : ''} onClick={() => setCurrentTab('assets')}>🛵 Pending Deployment</button>
              <button className={currentTab === 'clients' ? 'active' : ''} onClick={() => setCurrentTab('clients')}>🪪 Drivers List</button>
              <button className={currentTab === 'assignments' ? 'active' : ''} onClick={() => setCurrentTab('assignments')}>📜 Active Routes</button>
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
            <h2>{currentTab.replace('_', ' ').toUpperCase()}</h2>
            {currentTab === 'clients' && <button className="btn-add-large" onClick={() => setShowModal('new_client')}>+ Register Driver</button>}
            {currentTab === 'vendors' && isSuperAdmin && <button className="btn-add-large" onClick={() => setShowModal('new_vendor')}>+ Setup New Vendor</button>}
            {currentTab === 'managers' && isVendor && <button className="btn-add-large" onClick={() => setShowModal('new_manager')}>+ Add New Manager</button>}
            {currentTab === 'assets' && isVendor && <button className="btn-add-large" onClick={() => setShowModal('batch_assets')}>+ Bulk Register Assets</button>}
          </div>
        </header>

        {currentTab === 'dashboard' && (
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

        {currentTab !== 'dashboard' && currentTab !== 'search' && !vendorDetails && (
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
                  </tr>
                ))}
              </tbody>
            </table>
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
                <div className="modal-actions">
                  <button type="submit" className="btn-primary">Activate Deployment</button>
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
