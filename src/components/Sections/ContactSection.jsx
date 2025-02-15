import React from "react";
import { useTranslation } from "react-i18next";
import "../../scss/main.scss";
import contactBGImage from "../../assets/images/cartoon-bg.png";
import deliveryManImage from "../../assets/images/cartoon.png";
import mainIcon from "../../assets/images/Contact-1.png";

function Contact() {
  const { t } = useTranslation();

  return (
    <section className="section">
      <div className="section__contact">
        <div className="section__contact__container">
          <div className="section__contact__header">
            <h3>{t("contact.subtitle")}</h3>
            <h2>{t("contact.title")}</h2>
          </div>

          <div className="section__contact__content">
            <div className="section__contact__images">
              <img
                className="section__contact__images__post"
                src={contactBGImage}
                alt="Contact illustration"
              />

              <img
                className="section__contact__images__deliveryMan"
                src={deliveryManImage}
                alt="deliveryManImage"
              />
            </div>

            <div className="section__contact__form">
              <h2>{t("contact.getInTouch")}</h2>
              <form>
                <div className="section__contact__form-row">
                  <input type="text" placeholder={t("contact.name")} />
                  <input type="email" placeholder={t("contact.email")} />
                </div>
                <input
                  type="text"
                  placeholder={t("contact.subject")}
                  className="section__contact__subject"
                />
                <textarea
                  placeholder={t("contact.message")}
                  rows="6"
                  className="section__contact__subject"
                ></textarea>
                <div className="section__contact__submit">
                  <button type="submit">
                    <img src={mainIcon} alt="mail icon" />
                    {t("contact.sendMessage")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;
