import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "../../scss/main.scss";
import testimonialDataEn from "../../data/testimonials-en.json";
import testimonialDataRu from "../../data/testimonials-ru.json";
import userIcon from "../../assets/images/user-icon.png";
import testiBack from "../..//assets/images/testi.png";

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
    }, 5000);

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

  const getPrevSlideIndex = (current) => {
    return (current - 1 + testimonials.length) % testimonials.length;
  };

  const getNextSlideIndex = (current) => {
    return (current + 1) % testimonials.length;
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
                <div className="testimonial-carousel">
                  <div className="testimonial prev">
                    <div className="testimonial__content">
                      <div className="testimonial__header">
                        <div className="testimonial__avatar">
                          <img src={userIcon} alt="userIcon" />
                        </div>
                        <div className="testimonial__info">
                          <h3 className="testimonial__name">
                            {testimonials[getPrevSlideIndex(currentSlide)].name}
                            <span className="testimonial__rating">
                              {renderStars(
                                testimonials[getPrevSlideIndex(currentSlide)]
                                  .rating
                              )}
                            </span>
                          </h3>
                          <p className="testimonial__role">
                            {testimonials[getPrevSlideIndex(currentSlide)].role}
                          </p>
                        </div>
                        <span className="quote-icon">❝</span>
                      </div>
                      <p className="testimonial__text">
                        {testimonials[getPrevSlideIndex(currentSlide)].text}
                      </p>
                    </div>
                  </div>

                  <div className="testimonial active">
                    <div className="testimonial__content">
                      <div className="testimonial__header">
                        <div className="testimonial__avatar">
                          <img src={userIcon} alt="user icon" />
                        </div>
                        <div className="testimonial__info">
                          <h3 className="testimonial__name">
                            {testimonials[currentSlide].name}
                            <span className="testimonial__rating">
                              {renderStars(testimonials[currentSlide].rating)}
                            </span>
                          </h3>
                          <p className="testimonial__role">
                            {testimonials[currentSlide].role}
                          </p>
                        </div>
                        <span className="quote-icon">❝</span>
                      </div>
                      <p className="testimonial__text">
                        {testimonials[currentSlide].text}
                      </p>
                    </div>
                  </div>

                  <div className="testimonial next">
                    <div className="testimonial__content">
                      <div className="testimonial__header">
                        <div className="testimonial__avatar">
                          <img src={userIcon} alt="user icon" />
                        </div>
                        <div className="testimonial__info">
                          <h3 className="testimonial__name">
                            {testimonials[getNextSlideIndex(currentSlide)].name}
                            <span className="testimonial__rating">
                              {renderStars(
                                testimonials[getNextSlideIndex(currentSlide)]
                                  .rating
                              )}
                            </span>
                          </h3>
                          <p className="testimonial__role">
                            {testimonials[getNextSlideIndex(currentSlide)].role}
                          </p>
                        </div>
                        <span className="quote-icon">❝</span>
                      </div>
                      <p className="testimonial__text">
                        {testimonials[getNextSlideIndex(currentSlide)].text}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testimonial;
