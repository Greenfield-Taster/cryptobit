import React from "react";
import { useTranslation } from "react-i18next";
import "../../scss/main.scss";
import logo2 from "../../assets/images/logo2.png";
import bybitLogo from "../../assets/images/Bybit-Logo.png";
import privatLogo from "../../assets/images/Privat24_Logo.png";
import binanceLogo from "../../assets/images/binance-logo.png";
import monoLogo from "../../assets/images/monobank-logo.png";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__main">
          <div className="footer__logo">
            <img src={logo2} alt="logo" />
          </div>
          <div className="footer__links">
            <p>{t("footer.privacyPolicy")}</p>
            <p>{t("footer.termsAndConditions")}</p>
          </div>
        </div>

        <div className="footer__bottom">
          <div className="footer__copyright">
            © 2025 Cryptobit. {t("footer.developedBy")}{" "}
            <span>GreenTeaTaster</span>
          </div>
          <div className="footer__payments">
            <img src={bybitLogo} alt="ByBit" />
            <img src={binanceLogo} alt="Binance" />
            <img src={monoLogo} alt="Mono" />
            <img src={privatLogo} alt="Privat" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
