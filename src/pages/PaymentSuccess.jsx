import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../scss/payment.scss";

function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId } = location.state || {};

  useEffect(() => {
    const paymentStatus = sessionStorage.getItem(`payment_${orderId}`);
    if (!paymentStatus || paymentStatus !== "completed") {
      navigate("/cryptobit", { replace: true });
    }
  }, [orderId, navigate]);

  if (!orderId || !location.state) {
    return null;
  }

  return (
    <div className="payment-success">
      <div className="payment__container">
        <div className="payment__content">
          <h2>Payment Successful!</h2>
          <p>Your transaction has been processed successfully.</p>
          <p>Order ID: #{orderId}</p>
          <div className="status-message">
            Transaction is being processed. Please wait 10-15 minutes for the
            funds to be credited.
          </div>
          <button
            className="btn-primary mt-4"
            onClick={() => navigate("/cryptobit", { replace: true })}
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;
