import React, { useState } from "react";
import "../../scss/admin/_modals.scss";

const StatusUpdateModal = ({ request, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    status: request.status,
    adminNote: request.adminNote || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

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
            <h3>Изменение статуса заявки #{request.orderId}</h3>
            <button className="close-btn" onClick={onClose}>
              &times;
            </button>
          </div>

          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="request-details">
                <div className="status-banner ">
                  <span className="label">Текущий статус:</span>

                  <span
                    className={`status-badge ${getStatusClass(request.status)}`}
                  >
                    {getStatusName(request.status)}
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="status">Новый статус</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="pending">Ожидает</option>
                    <option value="processing">В обработке</option>
                    <option value="completed">Завершено</option>
                    <option value="failed">Неудача</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="adminNote">Примечание</label>
                  <textarea
                    id="adminNote"
                    name="adminNote"
                    value={formData.adminNote}
                    onChange={handleChange}
                    placeholder="Добавьте примечание к заявке (опционально)"
                  ></textarea>
                </div>

                {formData.status === "completed" && (
                  <div className="status-warning success">
                    <i className="fas fa-info-circle"></i>
                    При установке статуса "Завершено" заявка будет помечена как
                    подтвержденная администратором и будет установлена дата
                    завершения.
                  </div>
                )}

                {formData.status === "failed" && (
                  <div className="status-warning danger">
                    <i className="fas fa-exclamation-triangle"></i>
                    При установке статуса "Неудача" заявка будет помечена как
                    неуспешная. Рекомендуется добавить примечание с причиной
                    отказа.
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
              >
                Отмена
              </button>
              <button type="submit" className="btn btn-primary">
                Сохранить
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StatusUpdateModal;
