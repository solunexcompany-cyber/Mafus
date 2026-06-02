import React from 'react';

function DriverDashboard({ 
  currentTab, 
  driverData, 
  onTriggerSubmitReceipt 
}) {
  const contract = driverData?.contract;
  const asset = driverData?.asset;
  const finance = driverData?.finance;
  const payments = driverData?.payments || [];

  // Calculate safe ownership progression percentages
  const totalRepayment = contract?.total_repayment || 0;
  const totalPaid = finance?.total_paid || 0;
  const progressPercentage = totalRepayment > 0 
    ? Math.min(Math.round((totalPaid / totalRepayment) * 100), 100) 
    : 0;

  if (currentTab === 'driver_payments') {
    return (
      <div className="data-view">
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Payment History Ledger</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Full record of submitted bank transfer entries.</p>
          </div>
          <button className="btn-add-large" onClick={onTriggerSubmitReceipt}>
            ➕ Submit Payment Receipt
          </button>
        </div>

        <div className="scrollable">
          <table>
            <thead>
              <tr>
                <th>Receipt Doc</th>
                <th>Depositor Name</th>
                <th>Amount Claimed</th>
                <th>Submission Date</th>
                <th>Approval Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.receipt_url ? (
                        <img 
                          src={`http://localhost:8195${p.receipt_url}`} 
                          alt="Receipt Proof" 
                          className="receipt-preview-thumbnail"
                          onClick={() => window.open(`http://localhost:8195${p.receipt_url}`, '_blank')}
                        />
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No Image</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 700 }}>{p.depositor_name}</td>
                    <td style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                      ₦{parseFloat(p.amount).toLocaleString()}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div>
                        <span className={
                          p.status === 'approved' ? 'receipt-badge' : 
                          p.status === 'pending' ? 'badge-pending' : 'badge-rejected'
                        }>
                          {p.status.toUpperCase()}
                        </span>
                        {p.status === 'rejected' && p.rejection_reason && (
                          <p className="rejection-reason-text">
                            Reason: "{p.rejection_reason}"
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No payment claims submitted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Fallback default: My Dashboard view
  return (
    <div className="driver-dashboard-view">
      {/* Lease Ownership Tracker */}
      <div className="ownership-progress-container">
        <div className="ownership-header">
          <h3>Lease Ownership Pathway Progress</h3>
          <span className="percentage">{progressPercentage}%</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }} />
        </div>
        <div className="ownership-footer">
          <span>Contributed: ₦{totalPaid.toLocaleString()}</span>
          <span>Target Obligation: ₦{totalRepayment.toLocaleString()}</span>
        </div>
      </div>

      <div className="hero-stats-row">
        {/* Balance Remaining Panel */}
        <div className="receivable-card" style={{ background: 'var(--primary)' }}>
          <span>Outstanding Contract Balance</span>
          <p className="amount">
            ₦{(finance?.balance_remaining || 0).toLocaleString()}
          </p>
        </div>

        {/* Operational Status Panel */}
        <div className="distribution-card">
          <h4 style={{ fontWeight: 800, marginBottom: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Assigned Asset Context
          </h4>
          <div className="dist-item">
            <span>Asset Code</span>
            <strong>{asset?.internal_id || 'Awaiting Deployment'}</strong>
          </div>
          <div className="dist-item">
            <span>Registration Plate</span>
            <strong>{asset?.plate || 'Pending'}</strong>
          </div>
          <div className="dist-item" style={{ borderBottom: 'none' }}>
            <span>Weekly Schedule</span>
            <strong style={{ color: 'var(--primary)' }}>
              ₦{(contract?.weekly_installment || 0).toLocaleString()} / wk
            </strong>
          </div>
        </div>
      </div>

      {/* Clearing Bank Information Context Card */}
      {contract?.bank_name && (
        <div className="bank-detail-card">
          <div className="bank-detail-header">Official Settlement Bank Account Details</div>
          <div className="bank-detail-row">
            <span>Settlement Bank</span>
            <strong>{contract.bank_name}</strong>
          </div>
          <div className="bank-detail-row">
            <span>Account Number</span>
            <strong style={{ fontSize: '1.2rem', color: 'var(--primary)', letterSpacing: '1px' }}>
              {contract.account_number}
            </strong>
          </div>
          <div className="bank-detail-row">
            <span>Verified Beneficiary Name</span>
            <strong>{contract.account_name}</strong>
          </div>
        </div>
      )}

      {/* Fast Submit Button Widget */}
      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <button 
          className="btn-primary" 
          style={{ width: '100%', padding: '16px', fontSize: '1.1rem', background: 'var(--success)' }}
          onClick={onTriggerSubmitReceipt}
        >
          🚀 Open Remittance Portal: Submit New Payment Receipt
        </button>
      </div>
    </div>
  );
}

export default DriverDashboard;