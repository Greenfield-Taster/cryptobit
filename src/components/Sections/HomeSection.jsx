import React from "react";
import "../../scss/sections.scss";
import mainImage from "../../assets/images/main-img.png";

function HomeSection() {
  return (
    <section className="section">
      <div className="section__home">
        <div className="section__home-container">
          <div className="section__home__content">
            <div className="section__home__content-oval"></div>
            <h1 className="section__home__title">
              Ability to buy & cash
              <br />
              cryptocurrency
            </h1>
            <div className="section__home__cryptobit">
              <span>Cryptobit</span>
            </div>
            <p className="section__home__description">
              Cryptography, encryption process of transforming information
              referred to as plaintext using done.
            </p>
          </div>

          <div className="section__home__visuals">
            <img src={mainImage} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeSection;
