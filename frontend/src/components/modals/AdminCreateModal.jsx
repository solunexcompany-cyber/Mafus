import React, { useState } from 'react';
function AdminCreateModal({ isOpen, onClose, onSubmit, loading }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  if (!isOpen) return null;
  return (
    <div className="modal-overlay"><div className="modal-content">
      <div className="modal-header"><h3>Provision Administrative Account</h3><p>Authorize additional operational dashboard personnel.</p></div>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <input type="text" placeholder="Staff Full Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
        <input type="email" placeholder="Staff Professional Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
        <input type="password" placeholder="Access Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
        <div className="modal-actions"><button type="submit" className="btn-primary" disabled={loading}>Create Account</button><button type="button" className="btn-cancel" onClick={onClose}>Dismiss</button></div>
      </form>
    </div></div>
  );
}
export default AdminCreateModal;