import React, { useState } from "react";
import "../../scss/main.scss";
import faqBg from "../../assets/images/faq1.png";

const FAQ_DATA = [
  {
    id: 1,
    question: "What is Blockchain?",
    answer:
      "Globally network emerging action items with best-of-breed core Efficiently build end-to-end mindshare cultivate top-line web-readiness before 24/7 scenarios",
  },
  {
    id: 2,
    question: "Can I Transactions Using Tokens?",
    answer: "Answer about transactions using tokens would go here.",
  },
  {
    id: 3,
    question: "How can I create a crypto-wallet?",
    answer: "Information about creating a crypto-wallet would go here.",
  },
];

const FrequentlyQA = () => {
  const [activeId, setActiveId] = useState(1);

  const toggleAccordion = (id) => {
    setActiveId(activeId === id ? null : id);
  };

  return (
    <div className="section">
      <div className="section__frequentlyQA">
        <div className="faq-container">
          <h4 className="faq-subtitle">FAQ</h4>
          <h2 className="faq-title">Frequently Q/A</h2>
          <p className="faq-description">
            Globally network emerging action items with best-of-breed core
            Efficiently build end-to-end mindshare
          </p>

          <div className="faq-content">
            <div className="accordion">
              {FAQ_DATA.map((item) => (
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
