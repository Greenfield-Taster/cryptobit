import React from "react";
import { useTranslation } from "react-i18next";
import "../../scss/modals/privacyPolicy.scss";

const PrivacyPolicyModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>{t("privacyPolicy.title")}</h2>
          <button className="close-button" onClick={onClose}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <div className="modal-content">
          <section className="policy-section">
            <h3>{t("privacyPolicy.section1.title")}</h3>
            <p>{t("privacyPolicy.section1.content")}</p>
          </section>

          <section className="policy-section">
            <h3>{t("privacyPolicy.section2.title")}</h3>
            <p>{t("privacyPolicy.section2.intro")}</p>
            <ul>
              <li>{t("privacyPolicy.section2.dataTypes.name")}</li>
              <li>{t("privacyPolicy.section2.dataTypes.contact")}</li>
              <li>{t("privacyPolicy.section2.dataTypes.payment")}</li>
              <li>{t("privacyPolicy.section2.dataTypes.technical")}</li>
            </ul>
            <p>{t("privacyPolicy.section2.usageIntro")}</p>
            <ul>
              <li>{t("privacyPolicy.section2.usageTypes.service")}</li>
              <li>{t("privacyPolicy.section2.usageTypes.support")}</li>
              <li>{t("privacyPolicy.section2.usageTypes.legal")}</li>
              <li>{t("privacyPolicy.section2.usageTypes.improvement")}</li>
            </ul>
          </section>

          <section className="policy-section">
            <h3>{t("privacyPolicy.section3.title")}</h3>
            <p>{t("privacyPolicy.section3.content")}</p>
          </section>

          <section className="policy-section">
            <h3>{t("privacyPolicy.section4.title")}</h3>
            <p>{t("privacyPolicy.section4.intro")}</p>
            <ul>
              <li>{t("privacyPolicy.section4.cases.legal")}</li>
              <li>{t("privacyPolicy.section4.cases.amlKyc")}</li>
              <li>{t("privacyPolicy.section4.cases.payments")}</li>
            </ul>
          </section>

          <section className="policy-section">
            <h3>{t("privacyPolicy.section5.title")}</h3>
            <p>{t("privacyPolicy.section5.content")}</p>
          </section>

          <section className="policy-section">
            <h3>{t("privacyPolicy.section6.title")}</h3>
            <p>{t("privacyPolicy.section6.intro")}</p>
            <ul>
              <li>{t("privacyPolicy.section6.rights.access")}</li>
              <li>{t("privacyPolicy.section6.rights.modify")}</li>
              <li>{t("privacyPolicy.section6.rights.withdraw")}</li>
            </ul>
          </section>

          <section className="policy-section">
            <h3>{t("privacyPolicy.section7.title")}</h3>
            <p>{t("privacyPolicy.section7.content")}</p>
          </section>

          <section className="policy-section">
            <h3>{t("privacyPolicy.section8.title")}</h3>
            <p>{t("privacyPolicy.section8.content")}</p>
          </section>

          <section className="policy-section">
            <h3>{t("privacyPolicy.section9.title")}</h3>
            <p>{t("privacyPolicy.section9.content")}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
