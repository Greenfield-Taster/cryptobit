import React from "react";
import "../../scss/admin/_modals.scss";

const PromoCodeDetailModal = ({ promoCode, onClose }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString();
  };

  const isExpired = () => {
    if (!promoCode.expiresAt) return false;
    return new Date(promoCode.expiresAt) < new Date();
  };

  const getStatus = () => {
    if (promoCode.isUsed) return "Использован";
    if (isExpired()) return "Истек";
    return "Активен";
  };

  const getStatusClass = () => {
    if (promoCode.isUsed) return "status-used";
    if (isExpired()) return "status-expired";
    return "status-active";
  };

  return (
    <div className="modal-overlay">
      <div className="admin-modal">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Информация о промокоде</h3>
            <button className="close-btn" onClick={onClose}>
              &times;
            </button>
          </div>

          <div className="modal-body">
            <div className="promo-code-details">
              <div className="promo-code-header">
                <div className="promo-code-value">{promoCode.code}</div>
                <div className={`status-badge ${getStatusClass()}`}>
                  {getStatus()}
                </div>
              </div>

              <div className="detail-row">
                <span className="detail-label">Скидка:</span>
                <span className="detail-value">{promoCode.discount}%</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Пользователь:</span>
                <span className="detail-value">
                  {promoCode.userId ? (
                    <>
                      {promoCode.userId.name} (
                      {promoCode.userId.nickname || promoCode.userId.email})
                    </>
                  ) : (
                    "—"
                  )}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Создан:</span>
                <span className="detail-value">
                  {formatDate(promoCode.createdAt)}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Действителен до:</span>
                <span className="detail-value">
                  {formatDate(promoCode.expiresAt)}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Создан администратором:</span>
                <span className="detail-value">
                  {promoCode.createdBy ? (
                    <>
                      {promoCode.createdBy.name} (
                      {promoCode.createdBy.nickname ||
                        promoCode.createdBy.email}
                      )
                    </>
                  ) : (
                    "—"
                  )}
                </span>
              </div>

              {promoCode.isUsed && (
                <>
                  <div className="detail-row">
                    <span className="detail-label">Использован:</span>
                    <span className="detail-value">
                      {formatDate(promoCode.usedAt)}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Номер заказа:</span>
                    <span className="detail-value">
                      {promoCode.usedInOrderId || "—"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-outline" onClick={onClose}>
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoCodeDetailModal;
