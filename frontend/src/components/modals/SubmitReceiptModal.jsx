import React, { useState } from 'react';

function SubmitReceiptModal({ isOpen, onClose, onSubmit, loading }) {
  const [amount, setAmount] = useState('');
  const [depositor, setDepositor] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files;
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ amount, depositor_name: depositor }, file);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Submit Bank Payment Evidence</h3>
          <p>Upload a clear screenshot of your bank transfer receipt for verification.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="photo-upload-zone" style={{ width: '100%', height: '160px' }}>
            {preview ? (
              <img src={preview} alt="Receipt Preview" className="preview-img" />
            ) : (
              <div className="upload-placeholder">
                <span>📄 Upload Bank Receipt Screenshot</span>
                <input type="file" accept="image/*" onChange={handleFileChange} required />
              </div>
            )}
          </div>

          <input 
            type="number" 
            placeholder="Exact Amount Paid (₦)" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            required 
          />
          
          <input 
            type="text" 
            placeholder="Sender / Depositor Full Name" 
            value={depositor} 
            onChange={(e) => setDepositor(e.target.value)} 
            required 
          />

          <div className="modal-actions" style={{ marginTop: '8px' }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Uploading Claim...' : 'Submit Payment Claim'}
            </button>
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SubmitReceiptModal;