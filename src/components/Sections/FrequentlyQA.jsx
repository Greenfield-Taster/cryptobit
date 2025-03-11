import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "../../scss/main.scss";
import faqBg from "../../assets/images/faq1.png";
import faqDataEn from "../../data/FAQ_DATA-en.json";
import faqDataRu from "../../data/FAQ_DATA-ru.json";

const faqDataByLang = {
  en: faqDataEn,
  ru: faqDataRu,
};

const FrequentlyQA = () => {
  const [activeId, setActiveId] = useState(1);

  const toggleAccordion = (id) => {
    setActiveId(activeId === id ? null : id);
  };

  const { t, i18n } = useTranslation();
  const faqData =
    faqDataByLang[i18n.language]?.faqData || faqDataByLang.en.faqData;

  return (
    <div className="section">
      <div className="section__frequentlyQA">
        <div className="faq-container">
          <h4 className="faq-subtitle">{t("frequentlyQA.subtitle")}</h4>
          <h2 className="faq-title">{t("frequentlyQA.title")}</h2>
          <p className="faq-description">{t("frequentlyQA.description")}</p>

          <div className="faq-content">
            <div className="accordion">
              {faqData.map((item) => (
                <div
                  key={item.id}
                  className={`accordion-item ${
                    activeId === item.id ? "active" : ""
                  }`}
                >
                  <div
                    className="accordion-header"
                    onClick={() => toggleAccordion(item.id)}
                  >
                    <h3>{item.question}</h3>
                    <span className="accordion-icon">
                      {activeId === item.id ? "−" : "+"}
                    </span>
                  </div>
                  <div
                    className={`accordion-content ${
                      activeId === item.id ? "show" : ""
                    }`}
                  >
                    <p>{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="faq-image">
              <img src={faqBg} alt="FAQ illustration" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrequentlyQA;
