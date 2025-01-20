// Header.jsx
import React from "react";
import logo2 from "../../assets/images/logo2.png"
import "../../scss/Header.scss";

const Header = () => {
  return (
    <header className="header">
      <div className="header__container">
        <div className="header__logo">
          <img src={logo2} />
        </div>

        <nav className="header__nav">
          <ul className="header__nav-list">
            <li className="header__nav-item">
              <a href="#home" className="header__nav-link">
                Home
              </a>
            </li>
            <li className="header__nav-item">
              <a href="#about" className="header__nav-link">
                About
              </a>
            </li>
            <li className="header__nav-item">
              <a href="#transaction" className="header__nav-link">
                Transaction
              </a>
            </li>
            <li className="header__nav-item">
              <a href="#contact" className="header__nav-link">
                Contact
              </a>
            </li>
          </ul>
        </nav>

        <button className="header__register-btn">Register</button>
      </div>
    </header>
  );
};

export default Header;