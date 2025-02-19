import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import authService from "../services/auth.service";

const RegisterForm = (props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = t("auth.errors.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t("auth.errors.invalidEmail");
    }

    if (!formData.password) {
      newErrors.password = t("auth.errors.passwordRequired");
    } else if (formData.password.length < 6) {
      newErrors.password = t("auth.errors.passwordTooShort");
    }

    if (!formData.name) {
      newErrors.name = t("auth.errors.nameRequired");
    }

    if (!formData.phone) {
      newErrors.phone = t("auth.errors.phoneRequired");
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = t("auth.errors.invalidPhone");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setServerError("");

    try {
      const response = await authService.register(
        formData.email,
        formData.password,
        formData.name,
        formData.phone
      );

      if (response.success) {
        navigate("/profile");
      } else {
        setServerError(response.message || t("auth.errors.registrationFailed"));
      }
    } catch (error) {
      setServerError(t("auth.errors.serverError"));
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-form">
      {serverError && <div className="error-message">{serverError}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">{t("auth.register.emailLabel")}</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
          />
          {errors.email && <div className="field-error">{errors.email}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="password">{t("auth.register.passwordLabel")}</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
          />
          {errors.password && (
            <div className="field-error">{errors.password}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="name">{t("auth.register.nameLabel")}</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={isLoading}
          />
          {errors.name && <div className="field-error">{errors.name}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="phone">{t("auth.register.phoneLabel")}</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={isLoading}
            placeholder="0XXXXXXXXX"
          />
          {errors.phone && <div className="field-error">{errors.phone}</div>}
        </div>

        <button type="submit" disabled={isLoading} className="submit-button">
          {isLoading
            ? t("auth.common.loading")
            : t("auth.register.submitButton")}
        </button>
      </form>

      <div className="form-links">
        <p>
          {t("auth.register.alreadyHaveAccount")}{" "}
          <button
            type="button"
            className="link-button"
            onClick={() => props.onSwitchForm(2)}
          >
            {t("auth.register.loginLink")}
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
