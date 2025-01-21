import React from "react";
import "../../scss/footer.scss";
import logo2 from '../../assets/images/logo2.png'
import bybitLogo from '../../assets/images/Bybit-Logo.png'
import privatLogo from '../../assets/images/Privat24_Logo.png'
import binanceLogo from '../../assets/images/binance-logo.png'
import monoLogo from '../../assets/images/monobank-logo.png'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__main">
          <div className="footer__logo"><img src={logo2} alt="logo"/></div>
          <div className="footer__links">
            <p>Privacy Policy</p>
            <p>Terms & Conditions</p>
          </div>
        </div>

        <div className="footer__bottom">
          <div className="footer__copyright">
            © 2025 Cryptobit. Developed by <span>GreenTeaTaster</span>
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
