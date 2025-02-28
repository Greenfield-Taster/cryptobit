import React from "react";
import { useTranslation } from "react-i18next";
import "./_authModal.scss";

const AuthModal = ({ isOpen, onClose, onConfirm }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <div className="auth-modal__header">
          <h3>{t("auth.required")}</h3>
          <button className="auth-modal__close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="auth-modal__body">
          <p>{t("transaction.authRequired")}</p>
        </div>
        <div className="auth-modal__footer">
          <button className="auth-modal__cancel" onClick={onClose}>
            {t("auth.common.cancel")}
          </button>
          <button className="auth-modal__action" onClick={onConfirm}>
            {t("auth.login.title")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
