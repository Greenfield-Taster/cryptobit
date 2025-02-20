import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { selectIsAuthenticated } from "../../store/slices/authSlice";
import {
  setCurrentExchange,
  selectCurrentExchange,
  selectExchangeStatus,
  selectExchangeError,
} from "../../store/slices/exchangeSlice";
import AuthModal from "./components/AuthModal";
import "./CryptoConverter.scss";
import "../media/CryptoConverter.scss";

const CryptoConverter = ({ cryptos, selectedFromList }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentExchange = useSelector(selectCurrentExchange) || null;
  const exchangeStatus = useSelector(selectExchangeStatus) || "idle";
  const exchangeError = useSelector(selectExchangeError) || null;

  // Локальное состояние
  const [formData, setFormData] = useState({
    fromCrypto: null,
    toCrypto: null,
    amount: "1",
    senderWallet: "",
    recipientWallet: "vlad`s-wallet",
    saveFromWallet: true,
    saveToWallet: true,
  });
  const [isFromDropdownOpen, setIsFromDropdownOpen] = useState(false);
  const [isToDropdownOpen, setIsToDropdownOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [errors, setErrors] = useState({
    calculatedAmount: false,
    senderWallet: "",
  });

  const fromDropdownRef = useRef(null);
  const toDropdownRef = useRef(null);
  const authModalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        fromDropdownRef.current &&
        !fromDropdownRef.current.contains(event.target)
      ) {
        setIsFromDropdownOpen(false);
      }
      if (
        toDropdownRef.current &&
        !toDropdownRef.current.contains(event.target)
      ) {
        setIsToDropdownOpen(false);
      }
      if (
        authModalRef.current &&
        !authModalRef.current.contains(event.target)
      ) {
        setShowAuthModal(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (cryptos && cryptos.length > 0) {
      const defaultFromCrypto = selectedFromList || cryptos[0];
      const tether =
        cryptos.find((crypto) => crypto.id === "tether") || cryptos[1];

      const defaultToCrypto =
        defaultFromCrypto.id === (tether?.id || "")
          ? cryptos.find((crypto) => crypto.id !== (tether?.id || "")) ||
            cryptos[0]
          : tether;

      setFormData((prev) => ({
        ...prev,
        fromCrypto: defaultFromCrypto,
        toCrypto: defaultToCrypto,
      }));
    }
  }, [cryptos, selectedFromList]);

  const getAvailableToOptions = () => {
    if (!formData.fromCrypto || !cryptos) return [];
    return cryptos.filter((crypto) => crypto.id !== formData.fromCrypto?.id);
  };

  const handleRedirectToAuth = () => {
    navigate("/auth");
    window.scrollTo(0, 0);
  };

  const handleInputChange = (field, value) => {
    if (field === "fromCrypto" && cryptos?.length > 0) {
      const tether =
        cryptos.find((crypto) => crypto.id === "tether") || cryptos[1];

      const newToCrypto =
        value.id === (tether?.id || "")
          ? cryptos.find((crypto) => crypto.id !== (tether?.id || "")) ||
            cryptos[0]
          : tether;

      setFormData((prev) => ({
        ...prev,
        [field]: value,
        toCrypto: newToCrypto,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const calculateConversion = () => {
    if (!formData.fromCrypto || !formData.toCrypto || !formData.amount)
      return "0";

    const fromPrice = formData.fromCrypto.current_price || 0;
    const toPrice = formData.toCrypto.current_price || 0;

    if (toPrice === 0) return "0";

    const rate = fromPrice / toPrice;
    const amount = parseFloat(formData.amount);

    if (isNaN(amount)) return "0";

    return (amount * rate).toFixed(8);
  };

  const validateCalculatedAmount = (value) => {
    if (!value) return true;
    const calculatedValue = parseFloat(calculateConversion());
    return calculatedValue < 25;
  };

  const validateWallet = (value) => {
    return !value || value.trim() === "" || value.trim().length < 26;
  };

  const handleContinue = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const newErrors = {
      calculatedAmount: validateCalculatedAmount(formData.amount),
      senderWallet: validateWallet(formData.senderWallet),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error)) {
      return;
    }

    const orderId = Math.floor(100000000 + Math.random() * 900000000);

    const exchangeData = {
      fromCrypto: formData.fromCrypto?.name || "",
      toCrypto: formData.toCrypto?.name || "",
      amount: parseFloat(formData.amount),
      calculatedAmount: parseFloat(calculateConversion()),
      senderWallet: formData.senderWallet,
      recipientWallet: formData.recipientWallet,
      saveFromWallet: Boolean(formData.saveFromWallet),
      orderId: orderId.toString(),
    };

    try {
      dispatch(setCurrentExchange(exchangeData));

      navigate(`/payment/${orderId}`, {
        state: exchangeData,
      });
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Error saving exchange data:", error);
    }
  };

  return (
    <div className="crypto-converter">
      <div className="crypto-converter__form">
        <div className="crypto-converter__section">
          <div
            className="crypto-selector"
            ref={fromDropdownRef}
            onClick={() => setIsFromDropdownOpen(!isFromDropdownOpen)}
          >
            <div className="crypto-selector__selected">
              {formData.fromCrypto ? (
                <>
                  <img
                    className="crypto-selector__icon"
                    src={formData.fromCrypto.image}
                    alt={formData.fromCrypto.name}
                  />
                  <span className="crypto-selector__name">
                    {formData.fromCrypto.name}
                  </span>
                  <span className="crypto-selector__arrow">▼</span>
                </>
              ) : (
                <span className="crypto-selector__placeholder">
                  {t("transaction.selectCrypto")}
                </span>
              )}
            </div>

            {isFromDropdownOpen && cryptos && (
              <div className="crypto-selector__dropdown crypto-selector__dropdown--from">
                {cryptos.map((crypto) => (
                  <div
                    key={crypto.id}
                    className="crypto-selector__option"
                    onClick={() => {
                      handleInputChange("fromCrypto", crypto);
                      setIsFromDropdownOpen(false);
                    }}
                  >
                    <img
                      className="crypto-selector__option-icon"
                      src={crypto.image}
                      alt={crypto.name}
                    />
                    <span className="crypto-selector__option-name">
                      {crypto.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="crypto-converter__amount">
            <input
              type="number"
              className="crypto-converter__amount-input"
              value={formData.amount}
              onChange={(e) => handleInputChange("amount", e.target.value)}
              step="any"
            />
            <div
              className={`crypto-converter__min-amount ${
                errors.calculatedAmount
                  ? "crypto-converter__min-amount--error"
                  : ""
              }`}
            >
              {t("transaction.minCount")}: 25$
            </div>
          </div>

          <div className="wallet-input">
            <input
              type="text"
              className={`wallet-input__field ${
                errors.senderWallet ? "wallet-input__field--error" : ""
              }`}
              placeholder={t("transaction.senderWalletPlaceholder")}
              value={formData.senderWallet}
              onChange={(e) =>
                handleInputChange("senderWallet", e.target.value)
              }
            />
            {errors.senderWallet && (
              <div className="wallet-input__error">
                {formData.senderWallet.trim() === ""
                  ? t("transaction.senderWalletRequired")
                  : t("transaction.senderWalletMinLength")}
              </div>
            )}
            <label className="wallet-input__save">
              <input
                type="checkbox"
                className="wallet-input__checkbox"
                checked={formData.saveFromWallet}
                onChange={(e) =>
                  handleInputChange("saveFromWallet", e.target.checked)
                }
              />
              <span className="wallet-input__save-text">
                {t("transaction.saveWallet")}
              </span>
            </label>
          </div>
        </div>

        <div className="crypto-converter__section">
          <div
            className="crypto-selector"
            ref={toDropdownRef}
            onClick={() => setIsToDropdownOpen(!isToDropdownOpen)}
          >
            <div className="crypto-selector__selected">
              {formData.toCrypto ? (
                <>
                  <img
                    className="crypto-selector__icon"
                    src={formData.toCrypto.image}
                    alt={formData.toCrypto.name}
                  />
                  <span className="crypto-selector__name">
                    {formData.toCrypto.name}
                  </span>
                  <span className="crypto-selector__arrow">▼</span>
                </>
              ) : (
                <span className="crypto-selector__placeholder">
                  {t("transaction.selectCrypto")}
                </span>
              )}
            </div>

            {isToDropdownOpen && (
              <div className="crypto-selector__dropdown crypto-selector__dropdown--to">
                {getAvailableToOptions().map((crypto) => (
                  <div
                    key={crypto.id}
                    className="crypto-selector__option"
                    onClick={() => {
                      handleInputChange("toCrypto", crypto);
                      setIsToDropdownOpen(false);
                    }}
                  >
                    <img
                      className="crypto-selector__option-icon"
                      src={crypto.image}
                      alt={crypto.name}
                    />
                    <span className="crypto-selector__option-name">
                      {crypto.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="crypto-converter__amount">
            <input
              type="text"
              className={`crypto-converter__amount-input crypto-converter__amount-input--readonly ${
                errors.calculatedAmount
                  ? "crypto-converter__amount-input--error"
                  : ""
              }`}
              value={calculateConversion()}
              readOnly
            />
          </div>

          <div className="wallet-input">
            <input
              type="text"
              className="wallet-input__field crypto-converter__amount-input--readonly"
              placeholder={t("transaction.recipientWalletPlaceholder")}
              value={formData.recipientWallet}
              readOnly
              onChange={(e) =>
                handleInputChange("recipientWallet", e.target.value)
              }
            />
          </div>
        </div>
      </div>

      <div ref={authModalRef}>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onConfirm={handleRedirectToAuth}
        />
      </div>

      {exchangeError && (
        <div className="crypto-converter__error">{exchangeError}</div>
      )}

      <div className="crypto-converter__footer">
        <button
          className="crypto-converter__submit"
          onClick={handleContinue}
          disabled={exchangeStatus === "loading"}
        >
          {exchangeStatus === "loading"
            ? t("transaction.loading")
            : t("transaction.continue")}
        </button>
      </div>
    </div>
  );
};

export default CryptoConverter;
