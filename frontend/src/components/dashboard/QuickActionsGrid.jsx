import React from 'react';

function QuickActionsGrid({ onActionTrigger, pendingReceiptsCount = 0 }) {
  return (
    <div className="quick-actions-section">
      <h3 className="section-title">Command Actions</h3>
      <div className="quick-actions-grid">
        <div className="action-widget" onClick={() => onActionTrigger('new_client')}>
          <span className="icon">👤</span>
          <span className="text">Onboard Driver</span>
        </div>

        <div className="action-widget" onClick={() => onActionTrigger('new_vendor')}>
          <span className="icon">🏢</span>
          <span className="text">Register Vendor</span>
        </div>

        <div className="action-widget" onClick={() => onActionTrigger('new_manager')}>
          <span className="icon">🔑</span>
          <span className="text">Create Admin</span>
        </div>

        <div className="action-widget" onClick={() => onActionTrigger('batch_assets')}>
          <span className="icon">📦</span>
          <span className="text">Bulk Add Assets</span>
        </div>

        <div className="action-widget tracking-widget" onClick={() => onActionTrigger('review_receipts')}>
          <span className="icon">🧾</span>
          <span className="text">Review Claims</span>
          {pendingReceiptsCount > 0 && (
            <span className="action-badge">{pendingReceiptsCount}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuickActionsGrid;