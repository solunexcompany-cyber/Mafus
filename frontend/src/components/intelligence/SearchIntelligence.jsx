import React from 'react';

function SearchIntelligence({ 
  searchQuery, 
  setSearchQuery, 
  onSearchSubmit, 
  searchResult, 
  loading 
}) {
  return (
    <div className="search-workspace">
      {/* Central Target Input Card */}
      <div className="search-box-container">
        <h2>Driver Intelligence Hub</h2>
        <p>Query National ID numbers or system profiles to verify compliance parameters.</p>
        
        <form onSubmit={onSearchSubmit} className="search-form-wrap">
          <input
            className="search-input-main"
            type="text"
            placeholder="Enter National Identity Number (NIN) or Full Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary search-btn-hero" disabled={loading}>
            {loading ? 'Analyzing...' : 'Execute Intel Search'}
          </button>
        </form>
      </div>

      {/* Target Result Visualizer */}
      {searchResult && (
        <div className="intel-grid">
          {/* Section A: Photo & Vital Identification Info */}
          <div className="intel-card">
            <div className="intel-card-header">
              <h3>Profile Diagnostics</h3>
            </div>
            <div className="intel-body">
              <div className="driver-hero">
                <div className="driver-photo-frame">
                  {searchResult.driver?.photo_url ? (
                    <img 
                      src={`http://localhost:8195${searchResult.driver.photo_url}`} 
                      alt="Compliance Passport" 
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
                      NO PHOTO
                    </div>
                  )}
                </div>
                <h4 style={{ fontSize: '1.4rem', fontWeight: 900 }}>{searchResult.driver?.full_name}</h4>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                  Nickname: {searchResult.driver?.nickname || 'None'}
                </span>
              </div>

              <div className="info-list">
                <div className="info-row">
                  <span>NIN Record</span>
                  <strong>{searchResult.driver?.nin}</strong>
                </div>
                <div className="info-row">
                  <span>Duty Location</span>
                  <strong>{searchResult.driver?.city}</strong>
                </div>
                <div className="info-row">
                  <span>Primary Phone</span>
                  <strong>{searchResult.driver?.phone}</strong>
                </div>
                <div className="info-row" style={{ flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                  <span>Verified Residence</span>
                  <strong style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>{searchResult.driver?.address}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Asset Parameters, Financial Targets, and Guarantors */}
          <div className="intel-card" style={{ height: 'auto' }}>
            <div className="intel-card-header">
              <h3>Operation & Performance Ledger</h3>
            </div>
            <div className="intel-body">
              {searchResult.contract ? (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
                      Accumulated Balance Contributions
                    </span>
                    <div className="finance-badge">
                      ₦{(searchResult.finance?.total_paid || 0).toLocaleString()}
                    </div>
                  </div>

                  <div className="finance-row" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '24px' }}>
                    <div className="finance-stat">
                      <span>Assigned Unit</span>
                      <strong>{searchResult.asset?.internal_id || 'N/A'}</strong>
                    </div>
                    <div className="finance-stat">
                      <span>Remaining Obligation</span>
                      <strong style={{ color: 'var(--danger)' }}>
                        ₦{(searchResult.finance?.balance_remaining || 0).toLocaleString()}
                      </strong>
                    </div>
                    <div className="finance-stat">
                      <span>Weekly Target</span>
                      <strong>₦{(searchResult.contract?.weekly_installment || 0).toLocaleString()}</strong>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center', marginBottom: '24px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  ⚠️ No active rental or ownership contracts registered to this driver profile.
                </div>
              )}

              {/* Multi-Section Contacts Footer */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
                <div>
                  <h5 style={{ fontWeight: 800, color: 'var(--primary)', marginBottom: '8px', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    Next of Kin Contact
                  </h5>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{searchResult.driver?.nok_name}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{searchResult.driver?.nok_phone} ({searchResult.driver?.nok_relation})</p>
                </div>
                <div>
                  <h5 style={{ fontWeight: 800, color: 'var(--primary)', marginBottom: '8px', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    Guarantor Reference
                  </h5>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{searchResult.g_name || searchResult.driver?.g_name || 'N/A'}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{searchResult.g_phone || searchResult.driver?.g_phone}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchIntelligence;