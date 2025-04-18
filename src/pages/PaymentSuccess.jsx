import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../scss/pages/payment.scss";

function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId } = location.state || {};
  const { t } = useTranslation();

  useEffect(() => {
    const paymentStatus = localStorage.getItem(`payment_${orderId}`);
    if (!paymentStatus || paymentStatus !== "processing") {
      navigate("/", { replace: true });
    }
  }, [orderId, navigate]);

  if (!orderId || !location.state) {
    return null;
  }

  return (
    <div className="payment-success">
      <div className="payment__container">
        <div className="payment__content">
          <h2>{t("paymentSuccess.title")}</h2>
          <p>{t("paymentSuccess.description")}</p>
          <p>
            {t("paymentSuccess.orderId")} #{orderId}
          </p>
          <div className="status-message">{t("paymentSuccess.status")}</div>
          <button
            className="btn-primary mt-4"
            onClick={() => navigate("/profile", { replace: true })}
          >
            {t("paymentSuccess.returnProfile")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;
