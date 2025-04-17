import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import LoginForm from "../auth/components/LoginForm";
import RegisterForm from "../auth/components/RegisterForm";
import "../scss/main.scss";

const Auth = () => {
  const { t } = useTranslation();
  const [activeForm, setActiveForm] = useState(1);

  const handleSwitchForm = (formId) => {
    setActiveForm(formId);
  };

  const getFormTitle = () => {
    return activeForm === 1 ? t("auth.register.title") : t("auth.login.title");
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">{getFormTitle()}</h1>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${activeForm === 1 ? "active" : ""}`}
            onClick={() => handleSwitchForm(1)}
          >
            {t("auth.register.tabTitle")}
          </button>
          <button
            className={`auth-tab ${activeForm === 2 ? "active" : ""}`}
            onClick={() => handleSwitchForm(2)}
          >
            {t("auth.login.tabTitle")}
          </button>
        </div>

        <div className="auth-form-container">
          {activeForm === 1 && <RegisterForm onSwitchForm={handleSwitchForm} />}

          {activeForm === 2 && <LoginForm onSwitchForm={handleSwitchForm} />}
        </div>
      </div>
    </div>
  );
};

export default Auth;
