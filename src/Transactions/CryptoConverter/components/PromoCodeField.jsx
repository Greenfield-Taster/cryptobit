import React, { useState, useEffect, forwardRef, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import {
  validatePromoCode,
  resetPromoCode,
  selectPromoCode,
  selectPromoCodeStatus,
  selectPromoCodeError,
  getUserPromoCodes,
  selectUserPromoCodes,
  selectUserPromoCodesStatus,
} from "../../../store/slices/exchangeSlice.js";
import "./PromoCodeField.scss";

const PromoCodeField = forwardRef(({ onApplyPromoCode }, ref) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [code, setCode] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const promoCode = useSelector(selectPromoCode);
  const promoCodeStatus = useSelector(selectPromoCodeStatus);
  const promoCodeError = useSelector(selectPromoCodeError);
  const userPromoCodes = useSelector(selectUserPromoCodes);
  const userPromoCodesStatus = useSelector(selectUserPromoCodesStatus);

  const containerRef = useRef(null);
  const dropdownButtonRef = useRef(null);

  React.useImperativeHandle(ref, () => ({
    contains: (element) => {
      return (
        containerRef.current?.contains(element) ||
        dropdownButtonRef.current?.contains(element)
      );
    },
    closeDropdown: () => {
      setDropdownVisible(false);
    },
  }));

  useEffect(() => {
    dispatch(getUserPromoCodes());
  }, [dispatch]);

  useEffect(() => {
    if (promoCodeStatus === "succeeded" && promoCode) {
      onApplyPromoCode(promoCode);
    }
  }, [promoCodeStatus, promoCode, onApplyPromoCode]);

  const handleValidatePromoCode = () => {
    if (code.trim()) {
      dispatch(validatePromoCode(code.trim()));
    }
  };

  const handleResetPromoCode = () => {
    setCode("");
    dispatch(resetPromoCode());
    onApplyPromoCode(null);
  };

  const handleSelectPromoCode = (selectedCode) => {
    setCode(selectedCode.code);
    setDropdownVisible(false);
    dispatch(validatePromoCode(selectedCode.code));
  };

  const toggleDropdown = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDropdownVisible(!dropdownVisible);
  };

  const isLoading = promoCodeStatus === "loading";
  const isValidated = promoCodeStatus === "succeeded" && promoCode;
  const hasError = promoCodeStatus === "failed";
  const hasAvailablePromoCodes = userPromoCodes && userPromoCodes.length > 0;
  const isLoadingPromoCodes = userPromoCodesStatus === "loading";

  return (
    <div className="promo-code-container" ref={containerRef}>
      <div
        className={`promo-code-field ${isValidated ? "validated" : ""} ${
          hasError ? "error" : ""
        }`}
      >
        <input
          type="text"
          placeholder={t("promoCode.placeholder")}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={isLoading || isValidated || isLoadingPromoCodes}
          className="promo-code-input"
        />

        {hasAvailablePromoCodes && !isValidated && (
          <button
            ref={dropdownButtonRef}
            className="promo-code-saved-btn"
            onClick={toggleDropdown}
            title={t("promoCode.selectSaved")}
            disabled={isLoading || isLoadingPromoCodes}
          >
            {dropdownVisible ? "↑" : "↓"}
          </button>
        )}

        {!isValidated ? (
          <button
            className="promo-code-apply-btn"
            onClick={handleValidatePromoCode}
            disabled={!code.trim() || isLoading || isLoadingPromoCodes}
          >
            {isLoading ? t("promoCode.checking") : t("promoCode.apply")}
          </button>
        ) : (
          <button
            className="promo-code-remove-btn"
            onClick={handleResetPromoCode}
          >
            <span className="remove-icon">×</span>
          </button>
        )}
      </div>

      {dropdownVisible && hasAvailablePromoCodes && (
        <div className="promo-code-dropdown">
          {userPromoCodes.map((promo, index) => (
            <div
              key={index}
              className="promo-code-option"
              onClick={() => handleSelectPromoCode(promo)}
            >
              <div className="promo-code-option-header">
                <span className="promo-code-value">{promo.code}</span>
                <span className="promo-code-discount">+{promo.discount}%</span>
              </div>
              <div className="promo-code-expires">
                {t("promoCode.expires")}{" "}
                {new Date(promo.expiresAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasError && <div className="promo-code-error">{promoCodeError}</div>}

      {isValidated && (
        <div className="promo-code-success">
          {t("promoCode.applied", { discount: promoCode.discount })}
        </div>
      )}
    </div>
  );
});

export default PromoCodeField;
