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
const TransactionSection = () => {
  const [cryptos, setCryptos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFromListCrypto, setSelectedFromListCrypto] = useState(null);
  const { t } = useTranslation();

  const fetchCryptos = async () => {
    setLoading(true);
    setError(null);

    try {
      const ids = CRYPTO_IDS.join(",");
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=15&page=1&sparkline=false`
      );

      if (!response.ok) {
        throw new Error("Ошибка при загрузке данных");
      }

      const data = await response.json();
      const sortedData = CRYPTO_IDS.map((id) =>
        data.find((coin) => coin.id === id)
      ).filter(Boolean);

      setCryptos(sortedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCryptos();
    const interval = setInterval(fetchCryptos, 3000000);
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
