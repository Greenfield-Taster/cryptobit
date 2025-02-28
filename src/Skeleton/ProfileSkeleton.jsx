import React from "react";
import "../scss/main.scss";
import "./_profileSkeleton.scss";

const ProfileSkeleton = () => {
  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header skeleton-header">
          <div className="profile-avatar skeleton-avatar">
            <div className="skeleton-pulse"></div>
          </div>
          <div className="skeleton-title">
            <div className="skeleton-pulse"></div>
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-section">
            <div className="skeleton-section-title">
              <div className="skeleton-pulse"></div>
            </div>
            <div className="profile-info-grid">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="profile-info-item">
                  <div className="skeleton-info-label">
                    <div className="skeleton-pulse"></div>
                  </div>
                  <div className="skeleton-info-value">
                    <div className="skeleton-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="profile-section">
            <div className="skeleton-section-title">
              <div className="skeleton-pulse"></div>
            </div>
            <div className="skeleton-wallets-message">
              <div className="skeleton-pulse"></div>
            </div>
          </div>

          <div className="profile-section">
            <div className="skeleton-section-title">
              <div className="skeleton-pulse"></div>
            </div>
            <div className="transactions-list">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="transaction-item skeleton-transaction"
                >
                  <div className="transaction-icon skeleton-transaction-icon">
                    <div className="skeleton-pulse"></div>
                  </div>
                  <div className="transaction-details">
                    <div className="skeleton-transaction-id">
                      <div className="skeleton-pulse"></div>
                    </div>
                    <div className="skeleton-transaction-date">
                      <div className="skeleton-pulse"></div>
                    </div>
                    <div className="skeleton-transaction-description">
                      <div className="skeleton-pulse"></div>
                    </div>
                  </div>
                  <div className="transaction-status">
                    <div className="skeleton-status-badge">
                      <div className="skeleton-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="profile-actions">
            <div className="skeleton-edit-btn">
              <div className="skeleton-pulse"></div>
            </div>
            <div className="skeleton-logout-btn">
              <div className="skeleton-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSkeleton;
