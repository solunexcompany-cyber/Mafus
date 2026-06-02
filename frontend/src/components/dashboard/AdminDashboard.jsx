import React from 'react';
import styles from './AdminDashboard.module.css'; // <--- Import as an object called 'styles'

function AdminDashboard({ 
  scope, 
  stats, 
  assets = [], 
  onActionTrigger, 
  onDeploy, 
  onAssignManager, 
  pendingReceiptsCount = 0 
}) {
  
  // Safely extract metrics with reliable fallbacks
  const totalAssets = stats?.total_assets || assets?.length || 0;
  const activeAssets = stats?.active_assets || 0;
  const pendingAssets = stats?.pending_assets || (totalAssets - activeAssets);
  const revenue = stats?.total_revenue || stats?.settled_payments || 0;

  return (
    <div className="dashboard-workspace" style={{ padding: '24px', color: 'var(--text-main, #333)' }}>
      {/* Header Context Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary, #0066cc)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            System Core // {scope} control loop
          </span>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '4px 0 0 0' }}>
            {scope === 'vendor' ? 'Dealership Logistics Workspace' : 'Master Admin Command Control'}
          </h1>
        </div>
        
        {scope === 'manager' && pendingReceiptsCount > 0 && (
          <div style={{ background: '#ffebeb', color: '#cc0000', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #ffcccc' }}>
            🚨 {pendingReceiptsCount} Pending Remittance Claims
          </div>
        )}
      </div>

      {/* Telemetry Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
          <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>Total Tracked Assets</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', color: '#111' }}>{totalAssets}</div>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
          <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>Active Deployments</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', color: '#00aa55' }}>{activeAssets}</div>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
          <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>Available Assets</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', color: '#ff9900' }}>{pendingAssets < 0 ? 0 : pendingAssets}</div>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
          <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>Financial Inflow Accounting</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', color: '#0066cc' }}>
            ₦{Number(revenue).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Role-Specific Operational Command Launchers */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Onboarding Wizards & System Drivers</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '40px' }}>
        {scope === 'vendor' ? (
          <>
            <button className="btn-primary" onClick={() => onActionTrigger('new_manager')} style={{ padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              ➕ Allocate Master Admin Profile
            </button>
            <button className="btn-secondary" onClick={() => onActionTrigger('batch_assets')} style={{ padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', background: '#f0f4f8', border: '1px solid #d0dbe5' }}>
              📦 Inject Asset Sequence Batch
            </button>
          </>
        ) : (
          <>
            <button className="btn-primary" onClick={() => onActionTrigger('new_client')} style={{ padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              👤 Onboard Fleet Driver Node
            </button>
            <button className="btn-secondary" onClick={() => onActionTrigger('review_receipts')} style={{ padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', background: pendingReceiptsCount > 0 ? '#fff0f0' : '#f0f4f8', borderColor: pendingReceiptsCount > 0 ? '#ffcccc' : '#d0dbe5' }}>
              🧾 Audit Remittance Ledgers ({pendingReceiptsCount})
            </button>
          </>
        )}
      </div>

      {/* Asset Infrastructure Registry Table */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #eee', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Managed Logistics Infrastructure</h3>
          <span style={{ fontSize: '0.85rem', color: '#666' }}>{assets.length} items logged</span>
        </div>
        
        {assets.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
            No assets currently registered under this tenant branch database.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f9f9f9', borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '14px 20px', fontSize: '0.85rem', color: '#555' }}>Asset Specs</th>
                <th style={{ padding: '14px 20px', fontSize: '0.85rem', color: '#555' }}>Identification</th>
                <th style={{ padding: '14px 20px', fontSize: '0.85rem', color: '#555' }}>Operational Status</th>
                <th style={{ padding: '14px 20px', fontSize: '0.85rem', color: '#555' }}>Pipeline Directives</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 600 }}>
                    {asset.type || 'Vehicle'} <span style={{ fontWeight: 400, color: '#666', fontSize: '0.9rem' }}>({asset.model || 'Standard'})</span>
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: 'monospace', color: '#555' }}>
                    {asset.plate_number || asset.serial_number || `ID-${asset.id}`}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold',
                      background: asset.status === 'active' || asset.is_deployed ? '#e6f7ed' : '#fff3e6',
                      color: asset.status === 'active' || asset.is_deployed ? '#00aa55' : '#ff9900'
                    }}>
                      {asset.status === 'active' || asset.is_deployed ? 'DEPLOYED ACTIVE' : 'UNASSIGNED STANDBY'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {scope === 'vendor' && !asset.manager_id && onAssignManager && (
                      <button 
                        onClick={() => onAssignManager(asset)}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #0066cc', color: '#0066cc', background: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Delegate to Manager
                      </button>
                    )}
                    {scope === 'manager' && !asset.is_deployed && onDeploy && (
                      <button 
                        onClick={() => onDeploy(asset)}
                        style={{ padding: '6px 12px', borderRadius: '6px', background: '#0066cc', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Deploy to Contract
                      </button>
                    )}
                    {((scope === 'vendor' && asset.manager_id) || (scope === 'manager' && asset.is_deployed)) && (
                      <span style={{ fontSize: '0.85rem', color: '#888', fontStyle: 'italic' }}>Pipeline locked // tracking</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;