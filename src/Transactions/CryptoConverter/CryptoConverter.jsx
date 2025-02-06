import React, { useState, useEffect, useRef } from "react";
import "./CryptoConverter.scss";
import "../media/CryptoConverter.scss";

const CryptoConverter = ({ cryptos, selectedFromList }) => {
  const [formData, setFormData] = useState({
    fromCrypto: null,
    toCrypto: null,
    amount: "1",
    senderWallet: "",
    recipientWallet: "",
    saveFromWallet: true,
    saveToWallet: true,
  });
  const [isFromDropdownOpen, setIsFromDropdownOpen] = useState(false);
  const [isToDropdownOpen, setIsToDropdownOpen] = useState(false);

  const fromDropdownRef = useRef(null);
  const toDropdownRef = useRef(null);

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
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (cryptos && cryptos.length > 0) {
      const defaultFromCrypto = selectedFromList || cryptos[0];
      const tether = cryptos.find((crypto) => crypto.id === "tether");

      const defaultToCrypto =
        defaultFromCrypto.id === tether.id
          ? cryptos.find((crypto) => crypto.id !== tether.id)
          : tether;

      setFormData((prev) => ({
        ...prev,
        fromCrypto: defaultFromCrypto,
        toCrypto: defaultToCrypto,
      }));
    }
  }, [cryptos, selectedFromList]);

  const getAvailableToOptions = () => {
    return cryptos.filter((crypto) => crypto.id !== formData.fromCrypto?.id);
  };

  const handleInputChange = (field, value) => {
    if (field === "fromCrypto") {
      const tether = cryptos.find((crypto) => crypto.id === "tether");
      const newToCrypto =
        value.id === tether.id
          ? cryptos.find((crypto) => crypto.id !== tether.id)
          : tether;

      setFormData((prev) => ({
        ...prev,
        [field]: value,
        toCrypto: newToCrypto,
      }));
    } else {
      const newFormData = {
        ...formData,
        [field]: value,
      };
      setFormData(newFormData);
      console.log("Updated Form Data:", newFormData);
    }
  };

  const calculateConversion = () => {
    if (!formData.fromCrypto || !formData.toCrypto || !formData.amount)
      return "0";

    const toPrice = formData.toCrypto.current_price;
    if (!toPrice) return "0";

    const rate = formData.fromCrypto.current_price / toPrice;
    const amount = parseFloat(formData.amount);

    if (isNaN(amount)) return "0";

    return (amount * rate).toFixed(8);
  };

  const handleContinue = async () => {
    const submissionData = {
      fromCrypto: formData.fromCrypto?.name,
      toCrypto: formData.toCrypto?.name,
      amount: formData.amount,
      calculatedAmount: calculateConversion(),
      senderWallet: formData.senderWallet,
      recipientWallet: formData.recipientWallet,
      saveFromWallet: formData.saveFromWallet,
      saveToWallet: formData.saveToWallet,
    };
    console.log(submissionData);

    try {
      const response = await fetch("http://localhost:5000/api/send-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (data.success) {
        setFormData((prev) => ({
          ...prev,
          amount: "1",
          senderWallet: "",
          recipientWallet: "",
          saveFromWallet: true,
          saveToWallet: true,
          fromCrypto: prev.fromCrypto,
          toCrypto: prev.toCrypto,
        }));
      } else {
        alert("Произошла ошибка при отправке");
      }
    } catch (error) {
      console.error("Ошибка:", error);
      alert("Произошла ошибка при отправке");
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
                  Select cryptocurrency
                </span>
              )}
            </div>

            {isFromDropdownOpen && (
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
              min="25"
              step="any"
            />
            <div className="crypto-converter__min-amount">Min: 25$</div>
          </div>

          <div className="wallet-input">
            <input
              type="text"
              className="wallet-input__field"
              placeholder="Sender's wallet"
              value={formData.senderWallet}
              onChange={(e) =>
                handleInputChange("senderWallet", e.target.value)
              }
            />
            <label className="wallet-input__save">
              <input
                type="checkbox"
                className="wallet-input__checkbox"
                checked={formData.saveFromWallet}
                onChange={(e) =>
                  handleInputChange("saveFromWallet", e.target.checked)
                }
              />
              <span className="wallet-input__save-text">Save wallet</span>
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
                  Select cryptocurrency
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
              className="crypto-converter__amount-input crypto-converter__amount-input--readonly"
              value={calculateConversion()}
              readOnly
            />
          </div>

          <div className="wallet-input">
            <input
              type="text"
              className="wallet-input__field"
              placeholder="Recipient's wallet"
              value={formData.recipientWallet}
              onChange={(e) =>
                handleInputChange("recipientWallet", e.target.value)
              }
            />
            <label className="wallet-input__save">
              <input
                type="checkbox"
                className="wallet-input__checkbox"
                checked={formData.saveToWallet}
                onChange={(e) =>
                  handleInputChange("saveToWallet", e.target.checked)
                }
              />
              <span className="wallet-input__save-text">Save wallet</span>
            </label>
          </div>
        </div>
      </div>

      <div className="crypto-converter__footer">
        <button className="crypto-converter__submit" onClick={handleContinue}>
          Continue
        </button>
      </div>
    </div>
  );
};

export default CryptoConverter;
