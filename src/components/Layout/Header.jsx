import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  selectIsAuthenticated,
  selectUser,
  checkAuthState,
} from "../../store/slices/authSlice";
import logo2 from "../../assets/images/logo2.png";
import "../../scss/main.scss";

const Header = ({ onNavigate }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  const [isLangOpen, setIsLangOpen] = useState(false);
  const langSwitcherRef = useRef(null);

  const hideNavPages = ["/admin", "/auth", "/profile"];
  const shouldHideNav = hideNavPages.some((path) =>
    location.pathname.includes(path)
  );

  useEffect(() => {
    dispatch(checkAuthState());
  }, [dispatch]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsLangOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        langSwitcherRef.current &&
        !langSwitcherRef.current.contains(event.target)
      ) {
        setIsLangOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const registration = () => {
    navigate("/auth");
    window.scrollTo(0, 0);
  };

  const goToProfile = () => {
    navigate("/profile");
    window.scrollTo(0, 0);
  };

  const goToAdmin = () => {
    navigate("/admin");
    window.scrollTo(0, 0);
  };

  const getAvatarLetter = () => {
    if (user && user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  const isAdmin = user && user.role === "admin";

  return (
    <header className="header">
      <div className="header__container">
        <div className="header__logo">
          <Link to="/" onClick={() => window.scrollTo(0, 0)}>
            <img src={logo2} alt="logo" />
          </Link>
        </div>

        {!shouldHideNav && (
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
              <li className="header__nav-item">
                <button
                  onClick={() => onNavigate("transaction")}
                  className="header__nav-link"
                >
                  {t("header.transaction")}
                </button>
              </li>
              <li className="header__nav-item">
                <button
                  onClick={() => onNavigate("about")}
                  className="header__nav-link"
                >
                  {t("header.about")}
                </button>
              </li>
              <li className="header__nav-item">
                <button
                  onClick={() => onNavigate("testimonial")}
                  className="header__nav-link"
                >
                  {t("header.testimonial")}
                </button>
              </li>
              <li className="header__nav-item">
                <button
                  onClick={() => onNavigate("frequentlyQA")}
                  className="header__nav-link"
                >
                  {t("header.frequentlyQA")}
                </button>
              </li>
            </ul>
          </nav>
        )}

        <div className="header__right-group">
          <div className="language-switcher" ref={langSwitcherRef}>
            <button
              className="language-switcher__current"
              onClick={() => setIsLangOpen(!isLangOpen)}
            >
              {i18n.language.toUpperCase()}
            </button>
            {isLangOpen && (
              <div className="language-switcher__dropdown">
                <button onClick={() => changeLanguage("en")}>English</button>
                <button onClick={() => changeLanguage("ru")}>Русский</button>
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <button className="header__profile-btn" onClick={goToProfile}>
              <div className="header__profile-avatar">
                <span>{getAvatarLetter()}</span>
              </div>
            </button>
          ) : (
            <button
              className="header__register-btn"
              onClick={() => {
                registration();
              }}
            >
              {t("header.register")}
            </button>
          )}

          {isAdmin && (
            <button onClick={goToAdmin} className="header__admin-btn">
              Admin
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
