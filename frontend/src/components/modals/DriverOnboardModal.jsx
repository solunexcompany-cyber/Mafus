import React, { useState } from 'react';

function DriverOnboardModal({ isOpen, onClose, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    full_name: '', nickname: '', nin: '', phone: '', city: '', address: '',
    nok_name: '', nok_phone: '', nok_relation: '', g_name: '', g_phone: ''
  });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files;
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData, photo);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content wide">
        <div className="modal-header">
          <h3>Onboard Compliance Driver</h3>
          <p>Register identity credentials and guarantor metadata to the fleet ledger.</p>
        </div>

        <form onSubmit={handleSubmit} className="deployment-form">
          <div className="scrollable" style={{ paddingBottom: '20px' }}>
            
            {/* Passport Frame Zone */}
            <div className="photo-upload-zone">
              {preview ? (
                <img src={preview} alt="Passport Preview" className="preview-img" />
              ) : (
                <div className="upload-placeholder">
                  <span>📸 Upload Photo</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} required />
                </div>
              )}
            </div>

            <div className="form-row">
              {/* Section 1: Demographics */}
              <div className="form-section">
                <h4>1. Core Identity</h4>
                <input type="text" name="full_name" placeholder="Full Legal Name" onChange={handleChange} required />
                <input type="text" name="nickname" placeholder="Nickname / Alias (Optional)" onChange={handleChange} />
                <input type="text" name="nin" placeholder="National Identification Number (NIN)" onChange={handleChange} required />
                <input type="tel" name="phone" placeholder="Active Mobile Phone Number" onChange={handleChange} required />
                <input type="text" name="city" placeholder="Operational City (e.g., Abuja)" onChange={handleChange} required />
                <textarea name="address" placeholder="Verified Residential Address" rows="2" onChange={handleChange} required />
              </div>

              {/* Section 2: Accountability Guards */}
              <div className="form-section">
                <h4>2. Next of Kin & Guarantor</h4>
                <input type="text" name="nok_name" placeholder="Next of Kin Full Name" onChange={handleChange} required />
                <input type="tel" name="nok_phone" placeholder="Next of Kin Phone Number" onChange={handleChange} required />
                <input type="text" name="nok_relation" placeholder="Relationship (e.g., Spouse, Sibling)" onChange={handleChange} required />
                <div style={{ margin: '16px 0 8px', borderTop: '1px solid var(--border)' }} />
                <input type="text" name="g_name" placeholder="Primary Guarantor Full Name" onChange={handleChange} required />
                <input type="tel" name="g_phone" placeholder="Guarantor Active Phone" onChange={handleChange} required />
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Processing Registry...' : 'Authorize Driver Account'}
            </button>
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancel Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DriverOnboardModal;