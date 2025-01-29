import React, { useState, useEffect, useRef } from "react";
import "./CryptoConverter.scss";

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
    if (cryptos.length > 0) {
      const tether = cryptos.find((crypto) => crypto.id === "tether");
      const defaultFromCrypto = selectedFromList || cryptos[0];

      setFormData((prev) => ({
        ...prev,
        fromCrypto: defaultFromCrypto,
        toCrypto: tether,
      }));
    }
  }, [cryptos, selectedFromList]);

  const handleInputChange = (field, value) => {
    const newFormData = {
      ...formData,
      [field]: value,
    };
    setFormData(newFormData);
    console.log("Updated Form Data:", newFormData);
  };

  const calculateConversion = () => {
    if (!formData.fromCrypto || !formData.toCrypto || !formData.amount)
      return "0";
    const rate =
      formData.fromCrypto.current_price / formData.toCrypto.current_price;
    return (parseFloat(formData.amount) * rate).toFixed(8);
  };

  const handleContinue = () => {
    console.log("Form Submission:", {
      fromCrypto: formData.fromCrypto?.name,
      toCrypto: formData.toCrypto?.name,
      amount: formData.amount,
      calculatedAmount: calculateConversion(),
      senderWallet: formData.senderWallet,
      recipientWallet: formData.recipientWallet,
      saveFromWallet: formData.saveFromWallet,
      saveToWallet: formData.saveToWallet,
    });
  };

  return (
    <div className="container">
      <div className="container__converter">
        <div className="container__converter--from">
          <div
            className="container__select"
            ref={fromDropdownRef}
            onClick={() => setIsFromDropdownOpen(!isFromDropdownOpen)}
          >
            {formData.fromCrypto ? (
              <>
                <img
                  src={formData.fromCrypto.image}
                  alt={formData.fromCrypto.name}
                />
                <span>{formData.fromCrypto.name}</span>
                <span className="container__select__arrow">▼</span>
              </>
            ) : (
              <span>Select cryptocurrency</span>
            )}
            {isFromDropdownOpen && (
              <div className="container__select__dropdown">
                {cryptos.map((crypto) => (
                  <div
                    key={crypto.id}
                    className="container__option"
                    onClick={() => {
                      handleInputChange("fromCrypto", crypto);
                      setIsFromDropdownOpen(false);
                    }}
                  >
                    <img src={crypto.image} alt={crypto.name} />
                    <span>{crypto.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => handleInputChange("amount", e.target.value)}
            className="container__amountInput"
            min="0"
            step="any"
          />
          <div className="container__minAmount">Min: 25$</div>
          <div className="container__walletInput">
            <input
              type="text"
              placeholder="Sender's wallet"
              value={formData.senderWallet}
              onChange={(e) =>
                handleInputChange("senderWallet", e.target.value)
              }
            />
            <label className="container__saveWallet">
              <input
                type="checkbox"
                checked={formData.saveFromWallet}
                onChange={(e) =>
                  handleInputChange("saveFromWallet", e.target.checked)
                }
              />
              Save wallet
            </label>
          </div>
        </div>

        <div className="container__converter--to">
          <div
            className="container__select"
            ref={toDropdownRef}
            onClick={() => setIsToDropdownOpen(!isToDropdownOpen)}
          >
            {formData.toCrypto ? (
              <>
                <img
                  src={formData.toCrypto.image}
                  alt={formData.toCrypto.name}
                />
                <span>{formData.toCrypto.name}</span>
                <span className="container__select__arrow">▼</span>
              </>
            ) : (
              <span>Select cryptocurrency</span>
            )}
            {isToDropdownOpen && (
              <div className="container__select__dropdown">
                {cryptos.map((crypto) => (
                  <div
                    key={crypto.id}
                    className="container__option"
                    onClick={() => {
                      handleInputChange("toCrypto", crypto);
                      setIsToDropdownOpen(false);
                    }}
                  >
                    <img src={crypto.image} alt={crypto.name} />
                    <span>{crypto.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <input
            type="text"
            value={calculateConversion()}
            readOnly
            className="container__amountInput container__amountInput--spaceBottom"
          />
          <div className="container__walletInput">
            <input
              type="text"
              placeholder="Recipient's wallet"
              value={formData.recipientWallet}
              onChange={(e) =>
                handleInputChange("recipientWallet", e.target.value)
              }
            />
            <label className="container__saveWallet">
              <input
                type="checkbox"
                checked={formData.saveToWallet}
                onChange={(e) =>
                  handleInputChange("saveToWallet", e.target.checked)
                }
              />
              Save wallet
            </label>
          </div>
        </div>
      </div>
      <div className="container__continue-button">
        <button onClick={handleContinue}>Continue</button>
      </div>
    </div>
  );
};

export default CryptoConverter;
