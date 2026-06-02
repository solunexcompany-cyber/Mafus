import React, { useState } from 'react';

function ReviewClaimsModal({ isOpen, onClose, receipts, onAccept, onReject, loading }) {
  const [rejectReason, setRejectReason] = useState({});

  if (!isOpen) return null;

  const handleReasonChange = (id, val) => {
    setRejectReason({ ...rejectReason, [id]: val });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content wide" style={{ width: '900px' }}>
        <div className="modal-header">
          <h3>Review Payment Claims</h3>
          <p>Verify bank reference entries and match transaction counts against live data pools.</p>
        </div>

        <div className="scrollable" style={{ maxHeight: '60vh' }}>
          <table>
            <thead>
              <tr>
                <th>Screenshot</th>
                <th>Depositor / Amount</th>
                <th>Submission</th>
                <th>Decision Management Actions</th>
              </tr>
            </thead>
            <tbody>
              {receipts && receipts.length > 0 ? (
                receipts.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.receipt_url ? (
                        <img 
                          src={`http://localhost:8195${r.receipt_url}`} 
                          alt="Receipt Proof" 
                          className="receipt-preview-thumbnail"
                          style={{ width: '100px', height: '80px' }}
                          onClick={() => window.open(`http://localhost:8195${r.receipt_url}`, '_blank')}
                        />
                      ) : (
                        <span>No Image</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{r.depositor_name}</div>
                      <div style={{ color: 'var(--success)', fontWeight: 800 }}>
                        ₦{parseFloat(r.amount).toLocaleString()}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="btn-deploy" 
                            disabled={loading}
                            onClick={() => onAccept(r.id)}
                          >
                            Accept
                          </button>
                          <button 
                            className="btn-logout" 
                            style={{ padding: '6px 12px', margin: 0 }}
                            disabled={loading || !rejectReason[r.id]}
                            onClick={() => onReject(r.id, rejectReason[r.id])}
                          >
                            Reject
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Provide rejection reason..."
                          style={{ padding: '6px', fontSize: '0.8rem', borderRadius: '6px' }}
                          value={rejectReason[r.id] || ''}
                          onChange={(e) => handleReasonChange(r.id, e.target.value)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No payment claims currently awaiting review.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="modal-actions" style={{ marginTop: '24px' }}>
          <button className="btn-cancel" onClick={onClose}>Close panel</button>
        </div>
      </div>
    </div>
  );
}

export default ReviewClaimsModal;