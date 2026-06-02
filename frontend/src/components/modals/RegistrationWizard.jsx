import React, { useState } from 'react';
import styles from './RegistrationWizard.module.css';

export default function RegistrationWizard({ isOpen, onClose, onOnboardSuccess }) {
  if (!isOpen) return null;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Personal Data
    fullName: '',
    email: '',
    phoneNumber: '',
    residentialAddress: '',
    dob: '',
    // Step 2: Business Registration
    businessDescription: 'Tricycle / Keke Napep',
    businessType: 'individual',
    isRegistered: false,
    businessAddress: '',
    businessPhone: '',
    workersCount: '1-10',
    managersCount: '1-5',
    // Step 3: Documentation
    rcNumber: '',
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Compile payload satisfying the Developer Bypass Privilege rules
    const automatedPayload = {
      fullName: formData.fullName || "Unnamed Enterprise Node",
      businessDescription: formData.businessDescription,
      businessType: formData.businessType,
      creationDate: new Date().toLocaleDateString('en-GB'), // Formats exactly to dd/mm/yyyy
      statusNode: 'active', // Developer administration panel automated bypass activation
    };

    // Forward upstream to the ledger engine
    onOnboardSuccess(automatedPayload);
    
    // Reset state machines and return control back to the core dashboard
    setCurrentStep(1);
    onClose();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard}>
        
        {/* WIZARD TRACKING HEADER */}
        <header className={styles.modalHeader}>
          <div>
            <h3>Vendor Intake Wizard</h3>
            <p className={styles.stepIndicator}>STEP 0{currentStep} OF 04</p>
          </div>
          <button type="button" onClick={onClose} className={styles.closeButton}>&times;</button>
        </header>

        {/* PROGRESS SYSTEM BAR */}
        <div className={styles.progressBarWrapper}>
          <div 
            className={styles.progressBarFill} 
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>

        {/* COMPONENT BODY SCROLL CONTAINER */}
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.scrollableContent}>
            
            {/* STEP 1: PERSONAL DATA */}
            {currentStep === 1 && (
              <div className={styles.stepContainer}>
                <h4>Section A: Personal Data</h4>
                <div className={styles.inputGroup}>
                  <label>Full Legal Name</label>
                  <input 
                    type="text" name="fullName" required
                    placeholder="Enter full legal profile name"
                    value={formData.fullName} onChange={handleInputChange} 
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Mail Address</label>
                  <input 
                    type="email" name="email" required
                    placeholder="name@mafos-node.com"
                    value={formData.email} onChange={handleInputChange} 
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Contact Phone Number</label>
                  <input 
                    type="tel" name="phoneNumber" required
                    placeholder="+234..."
                    value={formData.phoneNumber} onChange={handleInputChange} 
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Full Residential Address</label>
                  <textarea 
                    name="residentialAddress" required rows="2"
                    placeholder="Street, City, State details"
                    value={formData.residentialAddress} onChange={handleInputChange}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Date of Birth</label>
                  <input 
                    type="date" name="dob" required
                    value={formData.dob} onChange={handleInputChange} 
                  />
                </div>
              </div>
            )}

            {/* STEP 2: BUSINESS REGISTRATION */}
            {currentStep === 2 && (
              <div className={styles.stepContainer}>
                <h4>Section B: Business Registration</h4>
                <div className={styles.inputGroup}>
                  <label>Asset Category Description</label>
                  <select name="businessDescription" value={formData.businessDescription} onChange={handleInputChange}>
                    <option value="Tricycle / Keke Napep">Tricycle / Keke Napep</option>
                    <option value="Mini KurKura Vendor">Mini KurKura Vendor</option>
                    <option value="Motorcycle Vendor">Motorcycle Vendor</option>
                    <option value="POS Vendor">POS Vendor</option>
                    <option value="Car Vendor">Car Vendor</option>
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label>Corporate Business Type</label>
                  <select name="businessType" value={formData.businessType} onChange={handleInputChange}>
                    <option value="individual">Individual Model</option>
                    <option value="collaboration">Collaboration Model</option>
                    <option value="partnership">Partnership Model</option>
                    <option value="group">Group Model</option>
                  </select>
                </div>
                <div className={styles.toggleRow}>
                  <label className={styles.checkboxLabel}>
                    <input 
                      type="checkbox" name="isRegistered" 
                      checked={formData.isRegistered} onChange={handleInputChange} 
                    />
                    <span>Entity is Formally Registered with CAC</span>
                  </label>
                </div>
                <div className={styles.inputGroup}>
                  <label>Physical Business Address</label>
                  <input 
                    type="text" name="businessAddress" required
                    placeholder="HQ Operation base address"
                    value={formData.businessAddress} onChange={handleInputChange} 
                  />
                </div>
                <div className={styles.rowSplit}>
                  <div className={styles.inputGroup}>
                    <label>Workers Scale</label>
                    <select name="workersCount" value={formData.workersCount} onChange={handleInputChange}>
                      <option value="1-10">1 - 10 Workers</option>
                      <option value="11-50">11 - 50 Workers</option>
                      <option value="51-500">51 - 500 Workers</option>
                      <option value="501-1000">501 - 1000 Workers</option>
                    </select>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Managers Scale</label>
                    <select name="managersCount" value={formData.managersCount} onChange={handleInputChange}>
                      <option value="1-5">1 - 5 Managers</option>
                      <option value="6-20">6 - 20 Managers</option>
                      <option value="21-100">21 - 100 Managers</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: DOCUMENTATION COMPLIANCE */}
            {currentStep === 3 && (
              <div className={styles.stepContainer}>
                <h4>Section C: Documentation</h4>
                
                {formData.isRegistered ? (
                  <>
                    <div className={styles.notificationAlert}>
                      <span>ℹ️ Registered corporate structures require legal certificate verification data keys.</span>
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Alphanumeric RC Number</label>
                      <input 
                        type="text" name="rcNumber" required
                        placeholder="RC-XXXXXX"
                        value={formData.rcNumber} onChange={handleInputChange} 
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>CAC Certificate File Upload</label>
                      <div className={styles.fileDropZone}>
                        <span className={styles.fileIcon}>📄</span>
                        <p>Click or drag corporate certification papers here</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={styles.inactiveAlert}>
                    <p>CAC documentation checks are bypassed for un-registered individual/informal operators.</p>
                  </div>
                )}

                <div className={styles.inputGroup}>
                  <label>Asset Category Reference Fleet Photo</label>
                  <div className={styles.fileDropZone}>
                    <span className={styles.fileIcon}>📷</span>
                    <p>Upload operational fleet asset pictures</p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW AND SUBMIT DATA CORE */}
            {currentStep === 4 && (
              <div className={styles.stepContainer}>
                <h4>Section D: Review & Deploy Stream</h4>
                <p className={styles.reviewDescription}>
                  Verify parsed system properties prior to committing core transaction records.
                </p>
                
                <div className={styles.reviewLedger}>
                  <div className={styles.reviewRow}>
                    <span>Legal Name:</span>
                    <strong>{formData.fullName || 'Not Configured'}</strong>
                  </div>
                  <div className={styles.reviewRow}>
                    <span>Asset Domain:</span>
                    <strong>{formData.businessDescription}</strong>
                  </div>
                  <div className={styles.reviewRow}>
                    <span>Model Blueprint:</span>
                    <strong style={{textTransform: 'capitalize'}}>{formData.businessType} Model</strong>
                  </div>
                  <div className={styles.reviewRow}>
                    <span>CAC Registration status:</span>
                    <strong>{formData.isRegistered ? `Registered (RC: ${formData.rcNumber})` : 'Unregistered Operator'}</strong>
                  </div>
                  <div className={styles.reviewRow}>
                    <span>Bypass Execution Queue:</span>
                    <strong className={styles.textEmerald}>ENABLED (Auto-Activate Node)</strong>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* ISOLATED MODAL ACTIONS FOOTER DESK */}
          <footer className={styles.modalFooter}>
            {currentStep > 1 ? (
              <button type="button" onClick={handleBack} className={styles.secondaryButton}>
                Back Space
              </button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <button type="button" onClick={handleNext} className={styles.primaryButton}>
                Next Phase
              </button>
            ) : (
              <button type="submit" className={styles.commitButton}>
                Commit Stream & Deploy Row
              </button>
            )}
          </footer>
        </form>

      </div>
    </div>
  );
}