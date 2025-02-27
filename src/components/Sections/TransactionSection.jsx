import React, { useState, useEffect } from "react";
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
  "the-open-network",
  "stellar",
  "shiba-inu",
];

// Создаем отображение id CoinGecko на id CoinCap
const CRYPTO_ID_MAPPING = {
  bitcoin: "bitcoin",
  tether: "tether",
  ethereum: "ethereum",
  solana: "solana",
  ripple: "xrp",
  binancecoin: "binance-coin",
  dogecoin: "dogecoin",
  "usd-coin": "usd-coin",
  cardano: "cardano",
  "staked-ether": "ethereum", // Используем обычный ethereum как замену
  "avalanche-2": "avalanche",
  tron: "tron",
  "the-open-network": "tontoken",
  stellar: "stellar",
  "shiba-inu": "shiba-inu",
};

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

  const fetchCryptos = async () => {
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
      const coinCapIds = Object.values(CRYPTO_ID_MAPPING).join(",");
      const response = await fetch(
        `https://api.coincap.io/v2/assets?ids=${coinCapIds}`
      );

      if (!response.ok) {
        throw new Error("Ошибка при загрузке данных");
      }

      const responseData = await response.json();

      const mappedData = responseData.data.map((coin) => {
        const originalId = Object.keys(CRYPTO_ID_MAPPING).find(
          (key) => CRYPTO_ID_MAPPING[key] === coin.id
        );

        return {
          id: originalId || coin.id,
          symbol: coin.symbol,
          name: coin.name,
          image: `https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`,
          current_price: parseFloat(coin.priceUsd),
          market_cap: parseFloat(coin.marketCapUsd),
          price_change_percentage_24h: parseFloat(coin.changePercent24Hr),
          total_volume: parseFloat(coin.volumeUsd24Hr),
        };
      });

      const sortedData = CRYPTO_IDS.map((id) =>
        mappedData.find((coin) => coin.id === id)
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
  };

  useEffect(() => {
    fetchCryptos();
    const interval = setInterval(fetchCryptos, 300000);
    return () => clearInterval(interval);
  }, []);

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
