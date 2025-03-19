import React from "react";
import "../../scss/admin/_modals.scss";

const RequestDetailModal = ({
  request,
  onClose,
  onUpdateStatus,
  onCreateChat,
}) => {
  const getStatusName = (status) => {
    const statusMap = {
      pending: "Ожидает",
      processing: "В обработке",
      completed: "Завершено",
      failed: "Неудача",
    };

    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    return status.toLowerCase();
  };

  return (
    <div className="modal-overlay">
      <div className="admin-modal">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Детали заявки #{request.orderId}</h3>
            <button className="close-btn" onClick={onClose}>
              &times;
            </button>
          </div>

          <div className="modal-body">
            <div className="request-details">
              <div className="status-banner">
                <span
                  className={`status-badge ${getStatusClass(request.status)}`}
                >
                  {getStatusName(request.status)}
                </span>
                {request.adminConfirmed && (
                  <span className="admin-confirmed-badge">
                    <i className="fas fa-check-circle"></i> Подтверждено
                    администратором
                  </span>
                )}
              </div>

              <div className="details-section">
                <h4>Основная информация</h4>

                <div className="detail-row">
                  <span className="detail-label">ID заявки:</span>
                  <span className="detail-value">{request.orderId}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Дата создания:</span>
                  <span className="detail-value">
                    {new Date(request.createdAt).toLocaleString()}
                  </span>
                </div>

                {request.completedAt && (
                  <div className="detail-row">
                    <span className="detail-label">Дата завершения:</span>
                    <span className="detail-value">
                      {new Date(request.completedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="details-section">
                <h4>Информация о пользователе</h4>

                <div className="detail-row">
                  <span className="detail-label">Имя:</span>
                  <span className="detail-value">
                    {request.userId?.name || "-"}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">
                    {request.userId?.email || "-"}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Никнейм:</span>
                  <span className="detail-value">
                    {request.userId?.nickname || "-"}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Телефон:</span>
                  <span className="detail-value">
                    {request.userId?.phone || "-"}
                  </span>
                </div>
              </div>

              <div className="details-section">
                <h4>Детали обмена</h4>

                <div className="exchange-details">
                  <div className="exchange-from">
                    <div className="crypto-label">Отправляет</div>
                    <div className="crypto-value">
                      {request.amount} {request.fromCrypto}
                    </div>
                  </div>

                  <div className="exchange-arrow">
                    <i className="fas fa-arrow-right"></i>
                  </div>

                  <div className="exchange-to">
                    <div className="crypto-label">Получает</div>
                    <div className="crypto-value">
                      {request.calculatedAmount} {request.toCrypto}
                    </div>
                  </div>
                </div>
              </div>

              {request.promoCodeId && (
                <div className="details-section">
                  <h4>Информация о промокоде</h4>

                  <div className="detail-row">
                    <span className="detail-label">ID промокода:</span>
                    <span className="detail-value promo-code">
                      {request.promoCodeId}
                    </span>
                  </div>

                  {request.promoCodeDiscount && (
                    <div className="detail-row">
                      <span className="detail-label">Скидка:</span>
                      <span className="detail-value">
                        {typeof request.promoCodeDiscount === "number"
                          ? `${request.promoCodeDiscount}%`
                          : request.promoCodeDiscount}
                      </span>
                    </div>
                  )}

                  {request.promoCodeApplied && (
                    <div className="detail-row">
                      <span className="detail-label">Статус:</span>
                      <span className="detail-value promo-applied">
                        <i className="fas fa-check-circle"></i> Применен
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="details-section">
                <h4>Информация о кошельках</h4>

                <div className="wallet-info">
                  <div className="detail-row">
                    <span className="detail-label">Кошелек отправителя:</span>
                    <span className="detail-value wallet-address">
                      {request.senderWallet}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Сохранить кошелек:</span>
                    <span className="detail-value">
                      {request.saveFromWallet ? "Да" : "Нет"}
                    </span>
                  </div>
                </div>
              </div>

              {request.adminNote && (
                <div className="details-section">
                  <h4>Примечание администратора</h4>
                  <div className="admin-note">{request.adminNote}</div>
                </div>
              )}

              {request.sentToTelegram && (
                <div className="details-section">
                  <h4>Статус уведомления</h4>
                  <div className="telegram-info">
                    <div className="detail-row">
                      <span className="detail-label">
                        Отправлено в Telegram:
                      </span>
                      <span className="detail-value">
                        <i className="fas fa-check-circle telegram-sent"></i> Да
                      </span>
                    </div>

                    {request.telegramSentAt && (
                      <div className="detail-row">
                        <span className="detail-label">Время отправки:</span>
                        <span className="detail-value">
                          {new Date(request.telegramSentAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-outline" onClick={onClose}>
              Закрыть
            </button>
            <button className="btn btn-primary" onClick={onCreateChat}>
              <i className="fas fa-comments"></i> Создать чат
            </button>
            <button className="btn btn-success" onClick={onUpdateStatus}>
              <i className="fas fa-exchange-alt"></i> Изменить статус
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailModal;
