import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { selectIsAuthenticated, selectUser } from "../store/slices/authSlice";
import { logout } from "../store/slices/authSlice";
import "../scss/main.scss";

const Profile = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, navigate]);

  const getFirstLetter = (email) => {
    return email ? email.charAt(0).toUpperCase() : "U";
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/cryptobit");
  };

  if (!isAuthenticated || !user) {
    return <div className="profile-loading">{t("profile.loading")}</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            <span>{getFirstLetter(user.email)}</span>
          </div>
          <h1 className="profile-title">{t("profile.title")}</h1>
        </div>

        <div className="profile-content">
          <div className="profile-section">
            <h2 className="profile-section-title">
              {t("profile.personalInfo")}
            </h2>
            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="profile-info-label">{t("profile.email")}</span>
                <span className="profile-info-value">{user.email}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">{t("profile.name")}</span>
                <span className="profile-info-value">
                  {user.name || t("profile.notProvided")}
                </span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">{t("profile.phone")}</span>
                <span className="profile-info-value">
                  {user.phone || t("profile.notProvided")}
                </span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">
                  {t("profile.memberSince")}
                </span>
                <span className="profile-info-value">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h2 className="profile-section-title">
              {t("profile.savedWallets")}
            </h2>
            {user.wallets && user.wallets.length > 0 ? (
              <div className="wallets-list">
                {user.wallets.map((wallet, index) => (
                  <div key={index} className="wallet-item">
                    <div className="wallet-icon">
                      <img
                        src={`/assets/images/crypto-icons/${wallet.currency.toLowerCase()}.png`}
                        alt={wallet.currency}
                        onError={(e) => {
                          e.target.src = "/assets/images/wallet.png";
                        }}
                      />
                    </div>
                    <div className="wallet-details">
                      <span className="wallet-currency">{wallet.currency}</span>
                      <span className="wallet-address">{wallet.address}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-wallets-message">
                {t("profile.noSavedWallets")}
              </div>
            )}
          </div>

          <div className="profile-section">
            <h2 className="profile-section-title">
              {t("profile.recentTransactions")}
            </h2>
            {user.transactions && user.transactions.length > 0 ? (
              <div className="transactions-list">
                {user.transactions.map((transaction, index) => (
                  <div key={index} className="transaction-item">
                    <div className="transaction-icon">
                      <span
                        className={`status-dot ${transaction.status.toLowerCase()}`}
                      ></span>
                    </div>
                    <div className="transaction-details">
                      <span className="transaction-date">
                        {new Date(transaction.date).toLocaleDateString()}
                      </span>
                      <span className="transaction-description">
                        {transaction.fromAmount} {transaction.fromCurrency} →
                        {transaction.toAmount} {transaction.toCurrency}
                      </span>
                    </div>
                    <div className="transaction-status">
                      {t(
                        `profile.statuses.${transaction.status.toLowerCase()}`
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-transactions-message">
                {t("profile.noTransactions")}
              </div>
            )}
          </div>

          <div className="profile-actions">
            <button className="edit-profile-btn">
              {t("profile.editProfile")}
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              {t("profile.logout")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
