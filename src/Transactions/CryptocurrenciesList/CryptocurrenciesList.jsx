import React from "react";
import "./CryptocurrenciesList.scss";
import "../media/CryptocurrenciesList.scss";

const CryptocurrenciesList = ({ cryptos, loading, error, onCryptoSelect }) => {
  return (
    <div className="crypto-list-container">
      <h1 className="title">Cryptocurrencies</h1>
      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loader">Loading...</div>
      ) : (
        <div className="crypto-list">
          {cryptos.map((crypto, index) => (
            <div
              key={crypto.id}
              className="crypto-item"
              onClick={() => onCryptoSelect(crypto)}
            >
              <div className="crypto-info">
                <span className="number">{index + 1}</span>
                <div className="crypto-icon">
                  <img src={crypto.image} alt={crypto.name} />
                </div>
                <div className="crypto-details">
                  <div className="name">{crypto.name}</div>
                  <div className="symbol">{crypto.symbol.toUpperCase()}</div>
                </div>
              </div>
              <div className="crypto-price">
                <div className="price-value">
                  $
                  {crypto.current_price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CryptocurrenciesList;
