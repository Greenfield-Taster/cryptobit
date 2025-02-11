import React from "react";
import { Link } from "react-router-dom";
import logo2 from "../../assets/images/logo2.png";
import "../../scss/header.scss";

const Header = ({ onNavigate }) => {
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
                Home
              </button>
            </li>
            <button
              onClick={() => onNavigate("transaction")}
              className="header__nav-link"
            >
              Transaction
            </button>
            <button
              onClick={() => onNavigate("about")}
              className="header__nav-link"
            >
              About
            </button>
            <button
              onClick={() => onNavigate("testimonial")}
              className="header__nav-link"
            >
              Testimonial
            </button>
            <button
              onClick={() => onNavigate("frequentlyQA")}
              className="header__nav-link"
            >
              Frequently Q/A
            </button>
            <button
              onClick={() => onNavigate("contact")}
              className="header__nav-link"
            >
              Contact
            </button>
          </ul>
        </nav>

        <button className="header__register-btn">Register</button>
      </div>
    </header>
  );
};

export default Header;
