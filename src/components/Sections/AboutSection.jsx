import React from "react";
import { useTranslation } from "react-i18next";
import "../../scss/main.scss";
import aboutMainImage from "../../assets/images/about-main-img.png";
import aboutCoinImage from "../../assets/images/about-coin.png";
import aboutIconImage from "../../assets/images/about-icon.png";
import bulbImage from "../../assets/images/icons-bulb.png";
import handshakeImage from "../../assets/images/icons-handshake.png";
import headphonesImage from "../../assets/images/icons-headphones.png";
import timerImage from "../../assets/images/icons-timer.png";

function About() {
  const { t } = useTranslation();

  return (
    <section className="section">
      <div className="section__about">
        <div className="section__about__container">
          <div className="section__about__content">
            <div className="section__about__image">
              <div className="section__about__image-wrapper">
                <img
                  className="section__about__image-wrapper__icon"
                  src={aboutIconImage}
                  alt="about coin"
                />
                <img
                  className="section__about__image-wrapper__coin"
                  src={aboutCoinImage}
                  alt="about coin"
                />
                <img
                  className="section__about__image-wrapper__main"
                  src={aboutMainImage}
                  alt="Blockchain coins"
                />
              </div>
            </div>

            <div className="section__about__text">
              <div className="section__about__header">
                <h3>{t("about.title")}</h3>
                <h1>
                  {t("about.aboutTitle.line1")} <br />
                  {t("about.aboutTitle.line2")}
                </h1>
              </div>

              <p className="section__about__description">
                {t("about.description")}
              </p>

              <div className="section__about__features">
                <div className="section__about__feature">
                  <img src={bulbImage} alt="bulbImage" />
                  <span>{t("about.block1")}</span>
                </div>
                <div className="section__about__feature">
                  <img src={headphonesImage} alt="headphonesImage" />
                  <span>{t("about.block2")}</span>
                </div>
                <div className="section__about__feature">
                  <img src={handshakeImage} alt="handshakeImage" />
                  <span>{t("about.block3")}</span>
                </div>
                <div className="section__about__feature">
                  <img src={timerImage} alt="timerImage" />
                  <span>{t("about.block4")}</span>
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
