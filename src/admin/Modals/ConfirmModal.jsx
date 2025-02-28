import React, { useState } from "react";
import "../../scss/admin/_modals.scss";

const ConfirmModal = ({
  title,
  message,
  confirmText = "Подтвердить",
  cancelText = "Отмена",
  promptInput = false,
  promptLabel = "Сообщение",
  onConfirm,
  onCancel,
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleConfirm = () => {
    if (promptInput) {
      onConfirm(inputValue);
    } else {
      onConfirm();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="confirm-modal">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onCancel}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          <p>{message}</p>

          {promptInput && (
            <div className="form-group">
              <label>{promptLabel}</label>
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                rows={4}
                placeholder={`Введите ${promptLabel.toLowerCase()}...`}
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className="btn-danger"
            onClick={handleConfirm}
            disabled={promptInput && !inputValue.trim()}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
