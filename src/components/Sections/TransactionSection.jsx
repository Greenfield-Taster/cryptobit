import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import "../../scss/main.scss";
import CryptocurrenciesList from "../../Transactions/CryptocurrenciesList/CryptocurrenciesList";
import CryptoConverter from "../../Transactions/CryptoConverter/CryptoConverter";

const CRYPTO_IDS = [
  "bitcoin",
  "tether",
  "ethereum",
  "solana",
  "ripple",
  "binancecoin",
  "dogecoin",
  "usd-coin",
  "cardano",
  "staked-ether",
  "avalanche-2",
  "tron",
  "ton-token",
  "stellar",
  "shiba-inu",
];

const TransactionSection = () => {
  const [cryptos, setCryptos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFromListCrypto, setSelectedFromListCrypto] = useState(null);
  const { t } = useTranslation();

  const getCachedData = () => {
    const cachedData = localStorage.getItem("cryptoData");
    const cachedTimestamp = localStorage.getItem("cryptoDataTimestamp");

    if (cachedData && cachedTimestamp) {
      const now = new Date().getTime();
      const cacheTime = parseInt(cachedTimestamp);

      if (now - cacheTime < 300000) {
        return JSON.parse(cachedData);
      }
    }
    return null;
  };

  const fetchCryptos = useCallback(async () => {
    const cachedData = getCachedData();
    if (cachedData) {
      setCryptos(cachedData);
      return;
    }

    if (window.location.pathname.includes("/admin")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const idsParam = CRYPTO_IDS.join(",");

      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${idsParam}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`
      );

      if (!response.ok) {
        throw new Error("Ошибка при загрузке данных");
      }

      const data = await response.json();

      const sortedData = CRYPTO_IDS.map((id) =>
        data.find((coin) => coin.id === id)
      ).filter(Boolean);

      setCryptos(sortedData);

      localStorage.setItem("cryptoData", JSON.stringify(sortedData));
      localStorage.setItem(
        "cryptoDataTimestamp",
        new Date().getTime().toString()
      );
    } catch (err) {
      console.error("Error fetching crypto data:", err);
      setError(err.message);

      const oldCache = localStorage.getItem("cryptoData");
      if (oldCache) {
        setCryptos(JSON.parse(oldCache));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCryptos();
    const interval = setInterval(fetchCryptos, 300000);
    return () => clearInterval(interval);
  }, [fetchCryptos]);

  const handleCryptoSelect = (crypto) => {
    setSelectedFromListCrypto(crypto);
  };

  return (
    <section className="section">
      <div className="section__transaction">
        <div className="section__transaction__header">
          <h3>{t("transaction.title")}</h3>
          <h2>
            {t("transaction.exchangeTitle.line1")} <br />
            {t("transaction.exchangeTitle.line2")}
          </h2>
        </div>
        <div className="section__transaction__content">
          <div className="section__transaction__content__cryptocurrencies">
            <CryptocurrenciesList
              cryptos={cryptos}
              loading={loading}
              error={error}
              onCryptoSelect={handleCryptoSelect}
            />
          </div>
          <div className="section__transaction__content__exchangeForm">
            <CryptoConverter
              cryptos={cryptos}
              selectedFromList={selectedFromListCrypto}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TransactionSection;
