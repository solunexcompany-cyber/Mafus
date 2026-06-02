import React, { useState } from 'react';
function AssignManagerModal({ isOpen, asset, vendors, onClose, onSubmit, loading }) {
  const [vendorId, setVendorId] = useState('');
  if (!isOpen || !asset) return null;
  return (
    <div className="modal-overlay"><div className="modal-content">
      <div className="modal-header"><h3>Delegate Asset to Partner</h3><p>Transfer management of {asset.internal_id} to an external dealer.</p></div>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(asset.id, vendorId); }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} required>
          <option value="">-- Select Managing Partner Entity --</option>
          {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <div className="modal-actions"><button type="submit" className="btn-primary" disabled={loading}>Assign Management</button><button type="button" className="btn-cancel" onClick={onClose}>Abort</button></div>
      </form>
    </div></div>
  );
}
export default AssignManagerModal;