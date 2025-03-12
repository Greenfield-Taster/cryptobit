import React from "react";
import "../../scss/admin/_modals.scss";

const UserDetailModal = ({ user, onClose, onEdit }) => {
  return (
    <div className="modal-overlay">
      <div className="admin-modal">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Информация о пользователе</h3>
            <button className="close-btn" onClick={onClose}>
              &times;
            </button>
          </div>

          <div className="modal-body">
            <div className="user-details">
              <div className="detail-row">
                <span className="detail-label">ID:</span>
                <span className="detail-value">{user._id}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Имя:</span>
                <span className="detail-value">{user.name}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{user.email}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Никнейм:</span>
                <span className="detail-value">{user.nickname}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Телефон:</span>
                <span className="detail-value">{user.phone || "-"}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Роль:</span>
                <span className="detail-value">
                  {user.role === "admin" ? "Администратор" : "Пользователь"}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Дата регистрации:</span>
                <span className="detail-value">
                  {new Date(user.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {user.stats && (
              <div className="user-stats-container">
                <h4 className="stats-heading">Статистика</h4>
                <div className="stats-content">
                  <div className="stat-item">
                    <div className="stat-value">{user.stats.ordersCount}</div>
                    <div className="stat-label">Всего заявок</div>
                  </div>

                  <div className="stat-item">
                    <div className="stat-value">
                      {user.stats.completedOrdersCount}
                    </div>
                    <div className="stat-label">Завершенных заявок</div>
                  </div>

                  <div className="stat-item">
                    <div className="stat-value">
                      {user.stats.ordersCount > 0
                        ? Math.round(
                            (user.stats.completedOrdersCount /
                              user.stats.ordersCount) *
                              100
                          )
                        : 0}
                      %
                    </div>
                    <div className="stat-label">Успешность</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-outline" onClick={onClose}>
              Закрыть
            </button>
            <button className="btn btn-primary" onClick={onEdit}>
              Редактировать
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
