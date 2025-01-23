import React from "react";
import "../../scss/sections.scss";
import aboutMainImage from "../../assets/images/about-main-img.png";
import aboutCoinImage from "../../assets/images/about-coin.png";
import aboutIconImage from "../../assets/images/about-icon.png";
import bulbImage from "../../assets/images/icons-bulb.png";
import handshakeImage from "../../assets/images/icons-handshake.png";
import headphonesImage from "../../assets/images/icons-headphones.png";
import timerImage from "../../assets/images/icons-timer.png";

function About() {
  return (
    <section className="section">
      <div className="section__about">
        <div className="section__about__container">
          <div className="section__about__content">
            <div className="section__about__image">
              <div className="section__about__image-wrapper">
                <div className="section__about__icon">
                  <img src={aboutIconImage} />
                </div>
                <div className="section__about__coin">
                  <img src={aboutCoinImage} alt="about coin" />
                </div>
                <img src={aboutMainImage} alt="Blockchain coins" />
              </div>
            </div>

            <div className="section__about__text">
              <div className="section__about__header">
                <h3>TRANSACTIONS</h3>
                <h1>
                  Cryptobit will Record <br /> All Transactions
                </h1>
              </div>

              <p className="section__about__description">
                Fast cashing and buying cryptocurrency is what this platform
                prides itself on. Privacy guarantees, data retention and fast
                transactions.
              </p>

              <div className="section__about__features">
                <div className="section__about__feature">
                  <img src={bulbImage} alt="bulbImage" />
                  <span>Exchange Value</span>
                </div>
                <div className="section__about__feature">
                  <img src={headphonesImage} alt="headphonesImage" />
                  <span>User Security</span>
                </div>
                <div className="section__about__feature">
                  <img src={handshakeImage} alt="handshakeImage" />
                  <span>User Dashboard</span>
                </div>
                <div className="section__about__feature">
                  <img src={timerImage} alt="timerImage" />
                  <span>Asset Registries</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
