import React, { useState } from 'react';
function BulkAssetModal({ isOpen, onClose, onSubmit, loading }) {
  const [formData, setFormData] = useState({ prefix: 'ABJ-', type: 'KEKE', count: 5 });
  if (!isOpen) return null;
  return (
    <div className="modal-overlay"><div className="modal-content">
      <div className="modal-header"><h3>Bulk Asset Generator</h3><p>Instantly generate operational inventory sequences.</p></div>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <input type="text" placeholder="ID Code Prefix" value={formData.prefix} onChange={(e) => setFormData({...formData, prefix: e.target.value})} required />
        <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
          <option value="KEKE">Standard Passenger Keke</option>
          <option value="CARGO">Cargo Transport Unit</option>
        </select>
        <input type="number" placeholder="Quantity to Generate" value={formData.count} onChange={(e) => setFormData({...formData, count: parseInt(e.target.value)})} min="1" max="50" required />
        <div className="modal-actions"><button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Generating...' : 'Inject Batch Sequence'}</button><button type="button" className="btn-cancel" onClick={onClose}>Close</button></div>
      </form>
    </div></div>
  );
}
export default BulkAssetModal;