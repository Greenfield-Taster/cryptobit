import React from "react";
import { useTranslation } from "react-i18next";
import "../../scss/main.scss";
import mainImage from "../../assets/images/main-img.png";
import roundImage from "../../assets/images/round.png";
import lockedImage from "../../assets/images/style-1.png";
import guarentedImage from "../../assets/images/style-2.png";
import cross1 from "../../assets/images/cross.png";
import cross2 from "../../assets/images/cross-2.png";
import halfCircle from "../../assets/images/half-circle.png";
import shapeImg from "../../assets/images/shape.png";

function HomeSection({ onNavigate }) {
  const { t } = useTranslation();

  return (
    <section className="section">
      <div className="section__home">
        <div className="section__home-container">
          <div className="section__home__content">
            <h1 className="section__home__title">{t("home.title")}</h1>
            <div className="section__home__content-logo-container">
              <img
                src={shapeImg}
                alt="shape"
                className="section__home__shape-image"
              />
              <h1 className="section__home__titleLogo">CRYPTOBIT</h1>
            </div>
            <p className="section__home__description">
              {t("home.description")}
            </p>
            <div className="section__home__getStarted">
              <button onClick={() => onNavigate("transaction")}>
                {t("home.getStarted")}
              </button>
            </div>
          </div>

          <div className="section__home__visuals">
            <div className="section__home__circle">
              <img src={roundImage} alt="circle" />
            </div>
            <div className="section__home__image-wrapper">
              <img
                src={mainImage}
                alt="Blockchain visualization"
                className="section__home__image"
              />
              <div className="section__home__status section__home__status--locked">
                <img src={lockedImage} alt="Locked" />
              </div>
              <div className="section__home__status section__home__status--guarented">
                <img src={guarentedImage} alt="guarented" />
              </div>
            </div>
          </div>
        </div>
        <div className="section__home__dot section__home__dot--1">
          <img src={halfCircle} alt="halfCircle" />
        </div>
        <div className="section__home__dot section__home__dot--2">
          <img src={cross2} alt="cross2" />
        </div>
        <div className="section__home__dot section__home__dot--3">
          <img src={cross1} alt="cross1" />
        </div>
      </div>
    </section>
  );
}

export default HomeSection;
