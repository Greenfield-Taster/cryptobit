import { useState } from "react";
import { useTranslation } from "react-i18next";
import PrivacyPolicyModal from "../modals/PrivacyPolicy";
import "../../scss/main.scss";
import logo2 from "../../assets/images/logo2.png";
import bybitLogo from "../../assets/images/Bybit-Logo.png";
import privatLogo from "../../assets/images/Privat24_Logo.png";
import binanceLogo from "../../assets/images/binance-logo.png";
import monoLogo from "../../assets/images/monobank-logo.png";

const Footer = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__main">
          <div className="footer__logo">
            <img src={logo2} alt="logo" />
          </div>
          <div className="footer__links">
            <button onClick={openModal}>{t("footer.privacyPolicy")}</button>
          </div>
        </div>

        <div className="footer__bottom">
          <div className="footer__copyright">© 2025 Cryptobit</div>
          <div className="footer__payments">
            <img src={bybitLogo} alt="ByBit" />
            <img src={binanceLogo} alt="Binance" />
            <img src={monoLogo} alt="Mono" />
            <img src={privatLogo} alt="Privat" />
          </div>
        </div>
      </div>
      <PrivacyPolicyModal isOpen={isModalOpen} onClose={closeModal} />
    </footer>
  );
};

export default Footer;
