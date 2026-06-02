import React, { useState } from 'react';

function VendorOnboardModal({ isOpen, onClose, onSubmit, loading }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Register Business Partner</h3>
          <p>Provision isolated nodes for partner business operations.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="text"
            placeholder="Enterprise / Business Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Corporate Administrator Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Secure Password Allocation"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />

          <div className="modal-actions" style={{ marginTop: '12px' }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Configuring Enterprise...' : 'Deploy Partner Portal'}
            </button>
            <button type="button" className="btn-cancel" onClick={onClose}>
              Dismiss
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VendorOnboardModal;