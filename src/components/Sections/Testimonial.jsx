import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "../../scss/main.scss";
import testimonialDataEn from "../../data/testimonials-en.json";
import testimonialDataRu from "../../data/testimonials-ru.json";
import team1 from "../../assets/images/testi/team1.png";
import team2 from "../../assets/images/testi/team2.png";
import team3 from "../../assets/images/testi/team3.png";
import team4 from "../../assets/images/testi/team4.png";
import testiBack from "../..//assets/images/testi.png";

const images = {
  team1,
  team2,
  team3,
  team4,
};

const testimonialsByLang = {
  en: testimonialDataEn,
  ru: testimonialDataRu,
};

const Testimonial = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const { t, i18n } = useTranslation();
  const testimonials =
    testimonialsByLang[i18n.language]?.testimonials ||
    testimonialsByLang.en.testimonials;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 10000);

    return () => clearInterval(timer);
  }, [testimonials.length]);

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const stars = [];

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <span key={i} className="star full">
            ★
          </span>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <span key={i} className="star half">
            ★
          </span>
        );
      } else {
        stars.push(
          <span key={i} className="star empty">
            ☆
          </span>
        );
      }
    }
    return stars;
  };

  return (
    <div className="section">
      <div className="section__testimonial">
        <div className="client-story">
          <h4 className="client-story__label">{t("testimonial.label")}</h4>
          <h2 className="client-story__title">
            {t("testimonial.title.line1")}
            <br />
            {t("testimonial.title.line2")}
          </h2>

          <div className="testimonials">
            <div className="testimonials__stats">
              <div className="stats-box">
                <img src={testiBack} alt="Statistics background" />
                <h3 className="stats-number">3120 +</h3>
                <p className="stats-text">
                  {t("testimonial.text.line1")}
                  <br />
                  {t("testimonial.text.line2")}
                </p>
              </div>
            </div>

            <div className="testimonials__content">
              <div className="testimonials__slides">
                {testimonials.map((testimonial, index) => (
                  <div
                    key={testimonial.id}
                    className={`testimonial ${
                      index === currentSlide ? "active" : ""
                    }`}
                  >
                    <div className="testimonial__content">
                      <div className="testimonial__header">
                        <div className="testimonial__avatar">
                          <img
                            src={images[testimonial.image]}
                            alt={testimonial.name}
                          />
                        </div>
                        <div className="testimonial__info">
                          <h3 className="testimonial__name">
                            {testimonial.name}
                            <span className="testimonial__rating">
                              {renderStars(testimonial.rating)}
                            </span>
                          </h3>
                          <p className="testimonial__role">
                            {testimonial.role}
                          </p>
                        </div>
                        <span className="quote-icon">❝</span>
                      </div>
                      <p className="testimonial__text">{testimonial.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="testimonials__navigation">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    className={`nav-dot ${
                      index === currentSlide ? "active" : ""
                    }`}
                    onClick={() => setCurrentSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testimonial;
