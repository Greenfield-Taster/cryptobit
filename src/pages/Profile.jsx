import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  selectUser,
  logout,
  getUserOrders,
  selectAuthStatus,
  selectUserOrders,
} from "../store/slices/authSlice";
import ProfileSkeleton from "../Skeleton/ProfileSkeleton";
import walletIcon from "../assets/images/wallet.png";
import "../scss/main.scss";

const Profile = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector(selectUser);
  const authStatus = useSelector(selectAuthStatus);
  const userOrders = useSelector(selectUserOrders);

  const [isLoading, setIsLoading] = useState(true);
  const [savedWallets, setSavedWallets] = useState([]);
  const [displayCount, setDisplayCount] = useState(3);
  const [walletDisplayCount, setWalletDisplayCount] = useState(3);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        await dispatch(getUserOrders()).unwrap();
      } catch (error) {
        console.error("Failed to load orders:", error);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      }
    };

    loadData();
  }, [dispatch]);

  useEffect(() => {
    setSavedWallets([]);

    if (
      userOrders &&
      Array.isArray(userOrders) &&
      userOrders.length > 0 &&
      user?.id
    ) {
      const currentUserOrders = userOrders.filter(
        (order) => order.userId === user.id || !order.userId
      );

      if (currentUserOrders.length > 0) {
        const wallets = currentUserOrders
          .filter((order) => order.saveFromWallet && order.senderWallet?.trim())
          .map((order) => ({
            currency: order.toCrypto,
            address: order.senderWallet,
          }));

        const uniqueWallets = Array.from(
          new Map(
            wallets.map((wallet) => [
              `${wallet.currency}:${wallet.address}`,
              wallet,
            ])
          ).values()
        );

        setSavedWallets(uniqueWallets);
      }
    }
  }, [userOrders, user?.id]);

  const getFirstLetter = (email) => {
    return email ? email.charAt(0).toUpperCase() : "U";
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
    window.scrollTo(0, 0);
  };

  const loadMoreTransactions = () => {
    setDisplayCount((prevCount) => prevCount + 4);
  };

  const loadMoreWallets = () => {
    setWalletDisplayCount((prevCount) => prevCount + 3);
  };

  if (isLoading || authStatus === "loading" || !user) {
    return <ProfileSkeleton />;
  }

  const orders = Array.isArray(userOrders)
    ? [...userOrders].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.telegramSentAt || 0);
        const dateB = new Date(b.createdAt || b.telegramSentAt || 0);
        return dateB - dateA;
      })
    : [];

  const displayedOrders = orders.slice(0, displayCount);
  const hasMoreOrders = orders.length > displayCount;

  const displayedWallets = savedWallets.slice(0, walletDisplayCount);
  const hasMoreWallets = savedWallets.length > walletDisplayCount;

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            <span>{getFirstLetter(user?.email)}</span>
          </div>
          <h1 className="profile-title">
            {t("profile.title")} #{user?.nickname}
          </h1>
        </div>

        <div className="profile-content">
          <div className="profile-section">
            <h2 className="profile-section-title">
              {t("profile.personalInfo")}
            </h2>
            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="profile-info-label">{t("profile.email")}</span>
                <span className="profile-info-value">{user.email || "-"}</span>
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
            {savedWallets && savedWallets.length > 0 ? (
              <>
                <div className="wallets-list">
                  {displayedWallets.map((wallet, index) => (
                    <div key={index} className="wallet-item">
                      <div className="wallet-icon">
                        <img
                          src={walletIcon}
                          alt={wallet.currency}
                          onError={(e) => {
                            e.target.src = "/assets/images/wallet.png";
                          }}
                        />
                      </div>
                      <div className="wallet-details">
                        <span className="wallet-currency">
                          {wallet.currency}
                        </span>
                        <span className="wallet-address">{wallet.address}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {hasMoreWallets && (
                  <div className="load-more-container">
                    <button className="load-more-btn" onClick={loadMoreWallets}>
                      {t("profile.loadMore")}
                    </button>
                  </div>
                )}
              </>
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
            {orders && orders.length > 0 ? (
              <>
                <div className="transactions-list">
                  {displayedOrders.map((order) => (
                    <div
                      key={order.orderId || order._id}
                      className="transaction-item"
                    >
                      <div className="transaction-icon">
                        <span
                          className={`status-dot ${
                            order.sentToTelegram ? "processing" : "pending"
                          }`}
                        ></span>
                      </div>
                      <div className="transaction-details">
                        <span className="transaction-id">#{order.orderId}</span>
                        <span className="transaction-date">
                          {new Date(
                            order.createdAt ||
                              order.telegramSentAt ||
                              new Date()
                          ).toLocaleString()}
                        </span>
                        <span className="transaction-description">
                          {order.amount} {order.fromCrypto} →{" "}
                          {order.calculatedAmount} {order.toCrypto}
                        </span>
                      </div>
                      <div className="transaction-status">
                        <div
                          className={`status-badge status-badge--${
                            order.status || "pending"
                          }`}
                        >
                          {t(`profile.statuses.${order.status || "pending"}`)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {hasMoreOrders && (
                  <div className="load-more-container">
                    <button
                      className="load-more-btn"
                      onClick={loadMoreTransactions}
                    >
                      {t("profile.loadMore")}
                    </button>
                  </div>
                )}
              </>
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
