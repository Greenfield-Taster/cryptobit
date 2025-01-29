import React from "react";
import "../../scss/main.scss";
import mainImage from "../../assets/images/main-img.png";
import roundImage from "../../assets/images/round.png";
import lockedImage from "../../assets/images/style-1.png";
import guarentedImage from "../../assets/images/style-2.png";
import cross1 from "../../assets/images/cross.png";
import cross2 from "../../assets/images/cross-2.png";
import halfCircle from "../../assets/images/half-circle.png";

function HomeSection({ onNavigate }) {
  return (
    <section className="section">
      <div className="section__home">
        <div className="section__home-container">
          <div className="section__home__content">
            <div className="section__home__content-oval"></div>
            <h1 className="section__home__title">
              Ability to buy & cash cryptocurrency
            </h1>
            <p className="section__home__description">
              Cryptography, encryption process of transforming information
              referred to as plaintext using done.
            </p>
            <div className="section__home__getStarted">
              <button onClick={() => onNavigate("transaction")}>
                Get Started Now
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
