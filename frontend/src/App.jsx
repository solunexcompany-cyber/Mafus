import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8195/api/v1';

// Helper to decode JWT (basic)
function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('mafos_token'));
  const [currentTab, setCurrentTab] = useState('dashboard');
  
  // Data States
  const [stats, setStats] = useState({ total_vendors: 0, total_clients: 0, total_admins: 0 });
  const [vendors, setVendors] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [clients, setClients] = useState([]);

  // Modal States
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);

  // Form States
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (token) {
      localStorage.setItem('mafos_token', token);
      fetchAllData();
    } else {
      localStorage.removeItem('mafos_token');
    }
  }, [token, currentTab]);

  const handleLogout = () => {
    setToken(null);
  };

  const fetchWithAuth = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };
    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    if (response.status === 401 || response.status === 403) {
      setToken(null); // Auto logout on invalid token
      throw new Error("Unauthorized");
    }
    return response;
  };

  const fetchAllData = async () => {
    try {
      if (currentTab === 'dashboard') {
        const res = await fetchWithAuth('/users/dashboard/stats');
        setStats(await res.json());
      } else if (currentTab === 'vendors') {
        const res = await fetchWithAuth('/users/vendor');
        setVendors(await res.json());
      } else if (currentTab === 'admins') {
        const res = await fetchWithAuth('/users/master-admin');
        setAdmins(await res.json());
      } else if (currentTab === 'clients') {
        const res = await fetchWithAuth('/users/client');
        setClients(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const data = new URLSearchParams();
    data.append('username', e.target.email.value);
    data.append('password', e.target.password.value);

    try {
      const res = await fetch(`${API_URL}/login/access-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: data
      });
      if (res.ok) {
        const json = await res.json();
        setToken(json.access_token);
      } else {
        alert("Invalid credentials");
      }
    } catch (e) {
      alert("Error connecting to server");
    }
  };

  const submitForm = async (endpoint, data, onSuccess) => {
    try {
      const res = await fetchWithAuth(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (res.ok) {
        alert("Created successfully");
        fetchAllData();
        onSuccess();
        setFormData({});
      } else {
        const err = await res.json();
        alert("Error: " + (err.detail || "Unknown error"));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!token) {
    return (
      <div style={{display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)'}}>
        <div className="card" style={{padding: '40px', width: '100%', maxWidth: '400px'}}>
          <h2 style={{marginBottom: '24px', textAlign: 'center'}}>MAFOS Login</h2>
          <form onSubmit={handleLogin} style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            <div>
              <label style={{display: 'block', marginBottom: '8px', fontSize: '0.875rem'}}>Email</label>
              <input name="email" type="email" required style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)'}} />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '8px', fontSize: '0.875rem'}}>Password</label>
              <input name="password" type="password" required style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)'}} />
            </div>
            <button type="submit" className="btn-primary" style={{justifyContent: 'center', marginTop: '8px'}}>Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  // --- Modals ---
  const Modal = ({ title, children, onClose }) => (
    <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100}}>
      <div className="card" style={{padding: '24px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
          <h3 style={{fontSize: '1.25rem', fontWeight: 600}}>{title}</h3>
          <button onClick={onClose} style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem'}}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  );

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">MAFOS Admin</div>
        <nav className="sidebar-nav">
          <a className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentTab('dashboard')}>
            Dashboard
          </a>
          <a className={`nav-item ${currentTab === 'vendors' ? 'active' : ''}`} onClick={() => setCurrentTab('vendors')}>
            Vendors (Level 2)
          </a>
          <a className={`nav-item ${currentTab === 'admins' ? 'active' : ''}`} onClick={() => setCurrentTab('admins')}>
            Master Admins (Level 3)
          </a>
          <a className={`nav-item ${currentTab === 'clients' ? 'active' : ''}`} onClick={() => setCurrentTab('clients')}>
            Clients (Level 4)
          </a>
        </nav>
      </aside>

      {/* Main Container */}
      <main className="main-wrapper">
        <header className="top-header">
          <div className="search-bar">
            <input type="text" placeholder="Search..." />
          </div>
          <div className="header-actions">
            <button className="btn-primary" onClick={handleLogout} style={{background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)'}}>Logout</button>
          </div>
        </header>

        <div className="content-area">
          <div className="page-header">
            <h1 className="page-title">
              {currentTab === 'dashboard' && 'Overview Dashboard'}
              {currentTab === 'vendors' && 'Vendor Management'}
              {currentTab === 'admins' && 'Master Admins'}
              {currentTab === 'clients' && 'Client Profiles'}
            </h1>
            
            {currentTab === 'vendors' && <button className="btn-primary" onClick={() => setShowVendorModal(true)}>+ Add Vendor</button>}
            {currentTab === 'admins' && <button className="btn-primary" onClick={() => setShowAdminModal(true)}>+ Add Master Admin</button>}
            {currentTab === 'clients' && <button className="btn-primary" onClick={() => setShowClientModal(true)}>+ Add Client</button>}
          </div>

          {currentTab === 'dashboard' && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-header"><h3 className="stat-title">Total Vendors</h3></div>
                <div className="stat-value">{stats.total_vendors}</div>
              </div>
              <div className="stat-card">
                <div className="stat-header"><h3 className="stat-title">Total Admins</h3></div>
                <div className="stat-value">{stats.total_admins}</div>
              </div>
              <div className="stat-card">
                <div className="stat-header"><h3 className="stat-title">Total Clients</h3></div>
                <div className="stat-value">{stats.total_clients}</div>
              </div>
            </div>
          )}

          {currentTab === 'vendors' && (
            <div className="card table-responsive">
              <table>
                <thead><tr><th>ID</th><th>Business Name</th><th>Address</th><th>Owner Email</th><th>Owner Name</th></tr></thead>
                <tbody>
                  {vendors.map(v => (
                    <tr key={v.id}>
                      <td>{v.id}</td><td>{v.name}</td><td>{v.address}</td><td>{v.owner_email}</td><td>{v.owner_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {currentTab === 'admins' && (
            <div className="card table-responsive">
              <table>
                <thead><tr><th>ID</th><th>Full Name</th><th>Email</th><th>Vendor ID</th></tr></thead>
                <tbody>
                  {admins.map(a => (
                    <tr key={a.id}>
                      <td>{a.id}</td><td>{a.full_name}</td><td>{a.email}</td><td>{a.vendor_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {currentTab === 'clients' && (
            <div className="card table-responsive">
              <table>
                <thead><tr><th>ID</th><th>Full Name</th><th>Phone (Login)</th><th>National ID</th><th>Vendor ID</th></tr></thead>
                <tbody>
                  {clients.map(c => (
                    <tr key={c.id}>
                      <td>{c.id}</td><td>{c.full_name}</td><td>{c.phone_number}</td><td>{c.national_id}</td><td>{c.vendor_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </main>

      {/* Modals */}
      {showVendorModal && (
        <Modal title="Create New Vendor (Level 2)" onClose={() => setShowVendorModal(false)}>
          <form onSubmit={(e) => { e.preventDefault(); submitForm('/users/vendor', formData, () => setShowVendorModal(false)); }} style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            <input placeholder="Business Name" required onChange={e => setFormData({...formData, vendor_name: e.target.value})} style={{padding: '10px'}} />
            <input placeholder="Business Address" onChange={e => setFormData({...formData, vendor_address: e.target.value})} style={{padding: '10px'}} />
            <input placeholder="Owner Email" type="email" required onChange={e => setFormData({...formData, owner_email: e.target.value})} style={{padding: '10px'}} />
            <input placeholder="Owner Password" type="password" required onChange={e => setFormData({...formData, owner_password: e.target.value})} style={{padding: '10px'}} />
            <input placeholder="Owner Full Name" required onChange={e => setFormData({...formData, owner_full_name: e.target.value})} style={{padding: '10px'}} />
            <button type="submit" className="btn-primary" style={{marginTop: '10px'}}>Create Vendor</button>
          </form>
        </Modal>
      )}

      {showAdminModal && (
        <Modal title="Create Master Admin (Level 3)" onClose={() => setShowAdminModal(false)}>
          <form onSubmit={(e) => { e.preventDefault(); submitForm('/users/master-admin', formData, () => setShowAdminModal(false)); }} style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            <input placeholder="Email" type="email" required onChange={e => setFormData({...formData, email: e.target.value})} style={{padding: '10px'}} />
            <input placeholder="Password" type="password" required onChange={e => setFormData({...formData, password: e.target.value})} style={{padding: '10px'}} />
            <input placeholder="Full Name" required onChange={e => setFormData({...formData, full_name: e.target.value})} style={{padding: '10px'}} />
            <input placeholder="Vendor ID (Required for Dev Admin)" type="number" onChange={e => setFormData({...formData, vendor_id: parseInt(e.target.value)})} style={{padding: '10px'}} />
            <button type="submit" className="btn-primary" style={{marginTop: '10px'}}>Create Admin</button>
          </form>
        </Modal>
      )}

      {showClientModal && (
        <Modal title="Create Client (Level 4)" onClose={() => setShowClientModal(false)}>
          <form onSubmit={(e) => { e.preventDefault(); submitForm('/users/client', formData, () => setShowClientModal(false)); }} style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            <input placeholder="Full Name" required onChange={e => setFormData({...formData, full_name: e.target.value})} style={{padding: '10px'}} />
            <input placeholder="Phone Number (Login ID)" required onChange={e => setFormData({...formData, phone_number: e.target.value})} style={{padding: '10px'}} />
            <input placeholder="Password" type="password" required onChange={e => setFormData({...formData, password: e.target.value})} style={{padding: '10px'}} />
            <input placeholder="National ID" onChange={e => setFormData({...formData, national_id: e.target.value})} style={{padding: '10px'}} />
            <input placeholder="Address" onChange={e => setFormData({...formData, address: e.target.value})} style={{padding: '10px'}} />
            <input placeholder="Vendor ID" type="number" onChange={e => setFormData({...formData, vendor_id: parseInt(e.target.value)})} style={{padding: '10px'}} />
            <button type="submit" className="btn-primary" style={{marginTop: '10px'}}>Create Client</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default App;
