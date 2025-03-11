import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
  login,
  selectAuthStatus,
  selectAuthError,
} from "../../store/slices/authSlice";

const LoginForm = (props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const authStatus = useSelector(selectAuthStatus);
  const authError = useSelector(selectAuthError);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (authStatus === "succeeded") {
      navigate("/profile");
    } else if (authStatus === "failed" && authError) {
      setServerError(authError);
    }
  }, [authStatus, authError, navigate]);

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
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setServerError("");

    // Используем Redux action для авторизации
    dispatch(
      login({
        email: formData.email,
        password: formData.password,
      })
    );
  };

  // Определяем, загружаются ли данные
  const isLoading = authStatus === "loading";

  return (
    <div className="login-form">
      {serverError && <div className="error-message">{serverError}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">{t("auth.login.emailLabel")}</label>
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
          <label htmlFor="password">{t("auth.login.passwordLabel")}</label>
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

        <button type="submit" disabled={isLoading} className="submit-button">
          {isLoading ? t("auth.common.loading") : t("auth.login.submitButton")}
        </button>
      </form>

      <div className="form-links">
        <button
          type="button"
          className="link-button"
          onClick={() => props.onSwitchForm(1)}
        >
          {t("auth.login.registerLink")}
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
