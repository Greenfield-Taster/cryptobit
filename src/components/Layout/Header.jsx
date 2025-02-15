import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo2 from "../../assets/images/logo2.png";
import "../../scss/header.scss";

const Header = ({ onNavigate }) => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <header className="header">
      <div className="header__container">
        <div className="header__logo">
          <Link to="/cryptobit">
            <img src={logo2} alt="logo" />
          </Link>
        </div>

        <nav className="header__nav">
          <ul className="header__nav-list">
            <li className="header__nav-item">
              <button
                onClick={() => onNavigate("home")}
                className="header__nav-link"
              >
                {t("header.home")}
              </button>
            </li>
            <button
              onClick={() => onNavigate("transaction")}
              className="header__nav-link"
            >
              {t("header.transaction")}
            </button>
            <button
              onClick={() => onNavigate("about")}
              className="header__nav-link"
            >
              {t("header.about")}
            </button>
            <button
              onClick={() => onNavigate("testimonial")}
              className="header__nav-link"
            >
              {t("header.testimonial")}
            </button>
            <button
              onClick={() => onNavigate("frequentlyQA")}
              className="header__nav-link"
            >
              {t("header.frequentlyQA")}
            </button>
            <button
              onClick={() => onNavigate("contact")}
              className="header__nav-link"
            >
              {t("header.contact")}
            </button>
          </ul>
        </nav>

        <button className="header__register-btn">{t("header.register")}</button>
      </div>

      <div className="language-switcher">
        <button onClick={() => changeLanguage("en")}>EN</button>
        <button onClick={() => changeLanguage("ru")}>RU</button>
      </div>
    </header>
  );
};

export default Header;
