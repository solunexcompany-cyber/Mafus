import React from 'react';

function VendorIntelligence({ vendorDetails, updateVendorStatus, onClose }) {
  if (!vendorDetails) return null;

  return (
    <div className="vendor-control-panel" style={{ marginTop: '40px' }}>
      <div className="nav-header">
        <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>
          Vendor Intelligence: {vendorDetails.vendor?.name}
        </h3>
        <div className="modal-actions" style={{ marginTop: 0 }}>
          {vendorDetails.vendor?.status === 'active' ? (
            <button className="btn-logout" onClick={() => updateVendorStatus('suspended')}>
              Suspend Vendor
            </button>
          ) : (
            <button className="btn-primary" style={{ background: 'var(--success)' }} onClick={() => updateVendorStatus('active')}>
              Activate Vendor
            </button>
          )}
          <button className="btn-cancel" onClick={onClose}>
            Close Intelligence
          </button>
        </div>
      </div>

      <div className="intel-grid" style={{ marginTop: '24px' }}>
        {/* Staff Managers */}
        <div className="intel-card">
          <div className="intel-card-header"><h3>Staff Managers</h3></div>
          <div className="intel-body scrollable" style={{ maxHeight: '300px' }}>
            <table>
              <thead><tr><th>Name</th><th>Email</th></tr></thead>
              <tbody>
                {vendorDetails.managers && vendorDetails.managers.length > 0 ? (
                  vendorDetails.managers.map(m => (
                    <tr key={m.id}><td>{m.name}</td><td>{m.email}</td></tr>
                  ))
                ) : (
                  <tr><td colSpan="2">No Managers Assigned</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Assigned Drivers */}
        <div className="intel-card">
          <div className="intel-card-header"><h3>Assigned Drivers</h3></div>
          <div className="intel-body scrollable" style={{ maxHeight: '300px' }}>
            <table>
              <thead><tr><th>Name</th><th>NIN</th></tr></thead>
              <tbody>
                {vendorDetails.clients && vendorDetails.clients.length > 0 ? (
                  vendorDetails.clients.map(c => (
                    <tr key={c.id}><td>{c.name}</td><td>{c.nin}</td></tr>
                  ))
                ) : (
                  <tr><td colSpan="2">No Drivers Onboarded</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Asset Inventory */}
        <div className="intel-card intel-full-width">
          <div className="intel-card-header"><h3>Asset Inventory</h3></div>
          <div className="intel-body scrollable">
            <table>
              <thead><tr><th>ID</th><th>Plate</th><th>Status</th></tr></thead>
              <tbody>
                {vendorDetails.assets && vendorDetails.assets.length > 0 ? (
                  vendorDetails.assets.map(a => (
                    <tr key={a.id}><td>{a.internal_id}</td><td>{a.plate}</td><td>{a.status}</td></tr>
                  ))
                ) : (
                  <tr><td colSpan="3">No Assets Registered</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorIntelligence;