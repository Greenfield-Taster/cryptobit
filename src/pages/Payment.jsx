import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../scss/payment.scss";
import walletIcon from "../assets/images/wallet.png";
import copyIcon from "../assets/images/copy.png";

function Payment() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [paymentData] = useState(location.state);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const paymentStatus = sessionStorage.getItem(`payment_${orderId}`);
    if (paymentStatus === "completed") {
      navigate("/payment-success", {
        state: {
          orderId,
          fromCrypto: paymentData?.fromCrypto,
          amount: paymentData?.amount,
        },
        replace: true,
      });
    }
  }, [orderId, navigate, paymentData]);

  const handleSubmit = async () => {
    if (!orderId) {
      setError("Order ID is missing");
      return;
    }

    setIsLoading(true);
    setError(null);

    const submissionData = {
      orderId: orderId,
      fromCrypto: paymentData.fromCrypto,
      toCrypto: paymentData.toCrypto,
      amount: paymentData.amount,
      calculatedAmount: paymentData.calculatedAmount,
      senderWallet: paymentData.senderWallet,
      recipientWallet: paymentData.recipientWallet,
      saveFromWallet: paymentData.saveFromWallet,
    };

    try {
      const response = await fetch(
        "https://cryptobit-telegram-bot-hxa2gdhufnhtfbfs.germanywestcentral-01.azurewebsites.net/api/send-form",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submissionData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Network response was not ok");
      }

      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem(`payment_${orderId}`, "completed");

        navigate("/payment-success", {
          state: {
            orderId,
            fromCrypto: paymentData.fromCrypto,
            amount: paymentData.amount,
          },
        });
      } else {
        throw new Error(data.message || "Error sending data");
      }
    } catch (error) {
      setError(error.message);
      console.error("Error submitting form:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!paymentData) {
    return (
      <div className="payment-error-page">
        <h2>{t("payment.titleError")}</h2>
        <p>{t("payment.textError")}</p>
        <button
          className="btn-primary"
          onClick={() => navigate("/cryptobit", { replace: true })}
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <section className="payment">
      <div className="payment__container">
        <div className="payment__content">
          <div className="payment__header">
            <h1>
              {t("payment.title")} #{orderId}
            </h1>
            <p className="processing-info">{t("payment.info")}</p>
            <p className="commission-info">{t("payment.commission")}</p>
          </div>

          <div className="payment__exchange">
            <div className="exchange-item">
              <div className="exchange-icon">
                <img src={walletIcon} alt="Give away" />
              </div>
              <div className="exchange-details">
                <span className="exchange-label">{t("payment.label")}</span>
                <span className="exchange-value">
                  {paymentData.amount} {paymentData.fromCrypto}
                </span>
              </div>
            </div>

            <div className="exchange-item">
              <div className="exchange-icon">
                <img src={walletIcon} alt="You receive" />
              </div>
              <div className="exchange-details">
                <span className="exchange-label">{t("payment.receive")}</span>
                <span className="exchange-value">
                  {paymentData.calculatedAmount} {paymentData.toCrypto}
                </span>
              </div>
            </div>
          </div>

          <div className="payment__form">
            <h2>{t("payment.formTitle")}</h2>

            <div className="form-group">
              <label>{t("payment.formLabel")}</label>
              <div className="form-value">TRC20</div>
            </div>

            <div className="form-group">
              <label>{t("payment.formWallet")}</label>
              <div
                className="form-value"
                onClick={() =>
                  navigator.clipboard.writeText(paymentData.recipientWallet)
                }
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                {paymentData.recipientWallet}
                <img
                  src={copyIcon}
                  alt="copy"
                  style={{
                    width: "16px",
                    height: "16px",
                    marginLeft: "8px",
                  }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>{t("payment.cryptocurrency")}</label>
              <div className="form-value">{paymentData.fromCrypto}</div>
            </div>

            <div className="form-group">
              <label>{t("payment.request")}</label>
              <div className="form-value">#{orderId}</div>
            </div>

            <div className="form-status">
              <h3>{t("payment.status")}</h3>
              <p>{t("payment.formDescription")}</p>
              <div className="status-value">{t("payment.paymentExpected")}</div>
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="form-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  navigate("/cryptobit");
                  window.scrollTo(0, 0);
                }}
              >
                {t("payment.closeRequest")}
              </button>
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? t("payment.processing") : t("payment.paid")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Payment;
