import React, { useState } from 'react';

function DeploymentModal({ isOpen, asset, drivers, onClose, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    client_id: '', plate: '', total_repayment: '', weekly_installment: '',
    bank_name: '', account_number: '', account_name: ''
  });

  if (!isOpen || !asset) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(asset.id, formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content wide">
        <div className="modal-header">
          <h3>Deploy Asset Reference: {asset.internal_id}</h3>
          <p>Bind technical assets to target drivers and configure financing schedules.</p>
        </div>

        <form onSubmit={handleSubmit} className="deployment-form">
          <div className="form-row">
            {/* Operational Left side */}
            <div className="form-section">
              <h4>1. Contract Assignment</h4>
              <select 
                value={formData.client_id} 
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })} 
                required
              >
                <option value="">-- Choose Eligible Driver --</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.full_name} (NIN: {d.nin})</option>
                ))}
              </select>

              <input 
                type="text" 
                placeholder="Assign Vehicle Registration Plate Number" 
                value={formData.plate}
                onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                required 
              />
              <input 
                type="number" 
                placeholder="Total Lease Obligation Amount (₦)" 
                value={formData.total_repayment}
                onChange={(e) => setFormData({ ...formData, total_repayment: e.target.value })}
                required 
              />
              <input 
                type="number" 
                placeholder="Required Weekly Installment (₦)" 
                value={formData.weekly_installment}
                onChange={(e) => setFormData({ ...formData, weekly_installment: e.target.value })}
                required 
              />
            </div>

            {/* Financial Right Side */}
            <div className="form-section">
              <h4>2. Bank Clearance Account</h4>
              <input 
                type="text" 
                placeholder="Target Settlement Bank Name" 
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                required 
              />
              <input 
                type="text" 
                placeholder="Settlement Account Number (10 Digits)" 
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                maxLength="10"
                required 
              />
              <input 
                type="text" 
                placeholder="Account Holder Verified Name" 
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                required 
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn-primary" style={{ background: 'var(--success)' }} disabled={loading}>
              {loading ? 'Activating Deployment...' : 'Commit Operational Deployment'}
            </button>
            <button type="button" className="btn-cancel" onClick={onClose}>
              Abort
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DeploymentModal;