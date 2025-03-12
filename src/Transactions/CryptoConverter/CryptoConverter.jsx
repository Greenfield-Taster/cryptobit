import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import {
  selectIsAuthenticated,
  selectUserOrders,
  selectUser,
  getUserOrders,
} from "../../store/slices/authSlice";
import {
  setCurrentExchange,
  selectCurrentExchange,
  selectExchangeStatus,
  selectExchangeError,
  getUserPromoCodes,
  selectUserPromoCodes,
  selectUserPromoCodesStatus,
} from "../../store/slices/exchangeSlice";
import AuthModal from "./components/AuthModal";
import "./CryptoConverter.scss";
import "../media/CryptoConverter.scss";
import PromoCodeField from "./components/PromoCodeField";

const CryptoConverter = ({ cryptos, selectedFromList }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const exchangeStatus = useSelector(selectExchangeStatus) || "idle";
  const exchangeError = useSelector(selectExchangeError) || null;
  const userOrders = useSelector(selectUserOrders) || [];
  const user = useSelector(selectUser);
  const userPromoCodes = useSelector(selectUserPromoCodes);
  const userPromoCodesStatus = useSelector(selectUserPromoCodesStatus);

  // Проверяем, есть ли у пользователя доступные промокоды
  const hasAvailablePromoCodes = userPromoCodes && userPromoCodes.length > 0;

  const [formData, setFormData] = useState({
    fromCrypto: null,
    toCrypto: null,
    amount: "1",
    senderWallet: "",
    saveFromWallet: true,
  });

  const [isFromDropdownOpen, setIsFromDropdownOpen] = useState(false);
  const [isToDropdownOpen, setIsToDropdownOpen] = useState(false);
  const [isSavedWalletsDropdownOpen, setIsSavedWalletsDropdownOpen] =
    useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [savedWallets, setSavedWallets] = useState([]);
  const [errors, setErrors] = useState({
    calculatedAmount: false,
    senderWallet: "",
  });
  const [appliedPromoCode, setAppliedPromoCode] = useState(null);

  const fromDropdownRef = useRef(null);
  const toDropdownRef = useRef(null);
  const authModalRef = useRef(null);
  const savedWalletsRef = useRef(null);

  const { fromCrypto, toCrypto, amount, senderWallet, saveFromWallet } =
    formData;

  useEffect(() => {
    if (isAuthenticated) {
      console.log("PromoCode status:", userPromoCodesStatus);
      console.log("PromoCode count:", userPromoCodes?.length || 0);
    }
  }, [isAuthenticated, userPromoCodesStatus, userPromoCodes]);

  useEffect(() => {
    if (
      isAuthenticated &&
      Array.isArray(userOrders) &&
      userOrders.length > 0 &&
      user?.id
    ) {
      const wallets = userOrders
        .filter(
          (order) =>
            (order.userId === user.id || !order.userId) &&
            order.saveFromWallet &&
            order.senderWallet?.trim()
        )
        .map((order) => ({
          currency: order.toCrypto,
          address: order.senderWallet,
        }));

      const uniqueWallets = Array.from(
        new Map(
          wallets.map((wallet) => [
            `${wallet.currency}:${wallet.address}`,
            wallet,
          ])
        ).values()
      );

      setSavedWallets(uniqueWallets);
    }
  }, [userOrders, user?.id, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getUserOrders());
      dispatch(getUserPromoCodes());
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (cryptos?.length > 0) {
      const defaultFromCrypto = selectedFromList || cryptos[0];
      const tether =
        cryptos.find((crypto) => crypto.id === "tether") || cryptos[1];
      const defaultToCrypto =
        defaultFromCrypto.id === tether?.id
          ? cryptos.find((crypto) => crypto.id !== tether?.id) || cryptos[0]
          : tether;

      setFormData((prev) => ({
        ...prev,
        fromCrypto: defaultFromCrypto,
        toCrypto: defaultToCrypto,
      }));
    }
  }, [cryptos, selectedFromList]);

  useEffect(() => {
    if (toCrypto) {
      setFormData((prev) => ({ ...prev, senderWallet: "" }));

      if (savedWallets.length > 0 && isAuthenticated) {
        const matchingWallet = savedWallets.find(
          (wallet) => wallet.currency === toCrypto.name
        );

        if (matchingWallet) {
          setFormData((prev) => ({
            ...prev,
            senderWallet: matchingWallet.address,
          }));
        }
      }
    }
  }, [toCrypto, savedWallets, isAuthenticated]);

  const filteredWallets = useMemo(() => {
    if (!toCrypto || !savedWallets.length) return [];
    return savedWallets.filter((wallet) => wallet.currency === toCrypto.name);
  }, [toCrypto, savedWallets]);

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
      if (
        savedWalletsRef.current &&
        !savedWalletsRef.current.contains(event.target)
      ) {
        setIsSavedWalletsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getAvailableToOptions = useCallback(() => {
    if (!fromCrypto || !cryptos) return [];
    return cryptos.filter((crypto) => crypto.id !== fromCrypto?.id);
  }, [fromCrypto, cryptos]);

  const calculateConversion = useCallback(() => {
    if (!fromCrypto || !toCrypto || !amount) return "0";

    const fromPrice = fromCrypto.current_price || 0;
    const toPrice = toCrypto.current_price || 0;

    if (toPrice === 0) return "0";

    const rate = fromPrice / toPrice;
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount)) return "0";

    let result = parsedAmount * rate;

    if (appliedPromoCode && appliedPromoCode.discount) {
      result = result * (1 + appliedPromoCode.discount / 100);
    }

    return result.toFixed(8);
  }, [fromCrypto, toCrypto, amount, appliedPromoCode]);

  const validateCalculatedAmount = useCallback(() => {
    const calculatedValue = parseFloat(calculateConversion());
    return calculatedValue < 25;
  }, [calculateConversion]);

  const validateWallet = useCallback((value) => {
    return !value || value.trim() === "" || value.trim().length < 26;
  }, []);

  const handleRedirectToAuth = () => {
    navigate("/auth");
    window.scrollTo(0, 0);
  };

  const handleInputChange = useCallback(
    (field, value) => {
      if (field === "fromCrypto" && cryptos?.length > 0) {
        const tether =
          cryptos.find((crypto) => crypto.id === "tether") || cryptos[1];
        const newToCrypto =
          value.id === tether?.id
            ? cryptos.find((crypto) => crypto.id !== tether?.id) || cryptos[0]
            : tether;

        setFormData((prev) => ({
          ...prev,
          [field]: value,
          toCrypto: newToCrypto,
        }));
      } else if (field === "toCrypto") {
        setFormData((prev) => ({
          ...prev,
          [field]: value,
          senderWallet: "",
        }));
      } else {
        setFormData((prev) => ({ ...prev, [field]: value }));
      }
    },
    [cryptos]
  );

  const handleSelectSavedWallet = useCallback((wallet) => {
    setFormData((prev) => ({ ...prev, senderWallet: wallet.address }));
    setIsSavedWalletsDropdownOpen(false);
  }, []);

  const handleContinue = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const newErrors = {
      calculatedAmount: validateCalculatedAmount(),
      senderWallet: validateWallet(senderWallet),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error)) return;

    try {
      const orderId = Math.floor(
        100000000 + Math.random() * 900000000
      ).toString();

      const exchangeData = {
        fromCrypto: fromCrypto?.name || "",
        toCrypto: toCrypto?.name || "",
        amount: parseFloat(amount),
        calculatedAmount: parseFloat(calculateConversion()),
        senderWallet,
        recipientWallet: "vlad`s-wallet",
        saveFromWallet: Boolean(saveFromWallet),
        orderId,
        promoCode: appliedPromoCode ? appliedPromoCode.code : null,
      };

      dispatch(setCurrentExchange(exchangeData));
      navigate(`/payment/${orderId}`, { state: exchangeData });
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Error saving exchange data:", error);
    }
  };

  const handleApplyPromoCode = (promoCode) => {
    setAppliedPromoCode(promoCode);
  };

  return (
    <div className="crypto-converter">
      <div className="crypto-converter__form">
        <div className="crypto-converter__section crypto-converter__section--left">
          <div
            className="crypto-selector"
            ref={fromDropdownRef}
            onClick={() => setIsFromDropdownOpen(!isFromDropdownOpen)}
          >
            <div className="crypto-selector__selected">
              {fromCrypto ? (
                <>
                  <img
                    className="crypto-selector__icon"
                    src={fromCrypto.image}
                    alt={fromCrypto.name}
                  />
                  <span className="crypto-selector__name">
                    {fromCrypto.name}
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
              <div className="crypto-selector__dropdown">
                {cryptos.map((crypto) => (
                  <div
                    key={crypto.id}
                    className="crypto-selector__option"
                    onClick={(e) => {
                      e.stopPropagation();
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
              value={amount}
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
        </div>

        <div className="crypto-converter__section crypto-converter__section--right">
          <div
            className="crypto-selector"
            ref={toDropdownRef}
            onClick={() => setIsToDropdownOpen(!isToDropdownOpen)}
          >
            <div className="crypto-selector__selected">
              {toCrypto ? (
                <>
                  <img
                    className="crypto-selector__icon"
                    src={toCrypto.image}
                    alt={toCrypto.name}
                  />
                  <span className="crypto-selector__name">{toCrypto.name}</span>
                  <span className="crypto-selector__arrow">▼</span>
                </>
              ) : (
                <span className="crypto-selector__placeholder">
                  {t("transaction.selectCrypto")}
                </span>
              )}
            </div>

            {isToDropdownOpen && (
              <div className="crypto-selector__dropdown">
                {getAvailableToOptions().map((crypto) => (
                  <div
                    key={crypto.id}
                    className="crypto-selector__option"
                    onClick={(e) => {
                      e.stopPropagation();
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
        </div>
      </div>

      <div className="crypto-converter__wallet-container">
        <div className="wallet-input wallet-input--expanded">
          <div className="wallet-input__wrapper">
            <input
              type="text"
              className={`wallet-input__field ${
                errors.senderWallet ? "wallet-input__field--error" : ""
              }`}
              placeholder={`${t("transaction.senderWalletPlaceholder")} ${
                toCrypto?.name || ""
              }`}
              value={senderWallet}
              onChange={(e) =>
                handleInputChange("senderWallet", e.target.value)
              }
            />
            {isAuthenticated && filteredWallets.length > 0 && (
              <button
                className="wallet-input__saved-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSavedWalletsDropdownOpen(!isSavedWalletsDropdownOpen);
                }}
                title={t("transaction.selectSavedWallet")}
              >
                ↓
              </button>
            )}
          </div>

          {isSavedWalletsDropdownOpen && filteredWallets.length > 0 && (
            <div className="wallet-input__saved-dropdown" ref={savedWalletsRef}>
              {filteredWallets.map((wallet, index) => (
                <div
                  key={index}
                  className="wallet-input__saved-option"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectSavedWallet(wallet);
                  }}
                >
                  <div className="wallet-input__saved-currency">
                    {wallet.currency}
                  </div>
                  <div className="wallet-input__saved-address">
                    {wallet.address}
                  </div>
                </div>
              ))}
            </div>
          )}

          {errors.senderWallet && (
            <div className="wallet-input__error">
              {senderWallet.trim() === ""
                ? `${toCrypto?.name || ""}${t(
                    "transaction.senderWalletRequired"
                  )}`
                : t("transaction.senderWalletMinLength")}
            </div>
          )}
          <label className="wallet-input__save">
            <input
              type="checkbox"
              className="wallet-input__checkbox"
              checked={saveFromWallet}
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

      <div ref={authModalRef}>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onConfirm={handleRedirectToAuth}
        />
      </div>

      {isAuthenticated && hasAvailablePromoCodes && (
        <div className="crypto-converter__promo-code">
          <PromoCodeField onApplyPromoCode={handleApplyPromoCode} />
        </div>
      )}

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
