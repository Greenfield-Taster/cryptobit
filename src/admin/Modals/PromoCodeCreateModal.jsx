import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  createPromoCode,
  selectCreatePromoCodeStatus,
  selectCreatePromoCodeError,
} from "../../store/slices/adminSlice";
import "../../scss/admin/_modals.scss";
import adminService from "../../services/admin.service";

const PromoCodeCreateModal = ({ onClose, onSuccess }) => {
  const dispatch = useDispatch();

  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const [formData, setFormData] = useState({
    userId: "",
    discount: "5",
    expiresAt: "",
  });

  const [errors, setErrors] = useState({});

  const createStatus = useSelector(selectCreatePromoCodeStatus);
  const createError = useSelector(selectCreatePromoCodeError);

  useEffect(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);

    setFormData((prev) => ({
      ...prev,
      expiresAt: defaultDate.toISOString().split("T")[0],
    }));

    loadUsers();
  }, []);

  useEffect(() => {
    if (createStatus === "succeeded") {
      toast.success("Промокод успешно создан");
      onSuccess && onSuccess();
    }
  }, [createStatus, onSuccess]);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await adminService.userService.getUsers(1, 100);

      if (response.data.success) {
        setUsers(response.data.data.users);
      } else {
        toast.error("Не удалось загрузить список пользователей");
      }
    } catch (error) {
      console.error("Ошибка при загрузке пользователей:", error);
      toast.error("Ошибка при загрузке пользователей");
    } finally {
      setIsLoadingUsers(false);
    }
  };

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

    if (!formData.userId) {
      newErrors.userId = "Выберите пользователя";
    }

    if (!formData.discount) {
      newErrors.discount = "Укажите размер скидки";
    } else if (
      isNaN(formData.discount) ||
      formData.discount < 1 ||
      formData.discount > 100
    ) {
      newErrors.discount = "Скидка должна быть от 1% до 100%";
    }

    if (!formData.expiresAt) {
      newErrors.expiresAt = "Укажите дату истечения срока действия";
    } else {
      const expiryDate = new Date(formData.expiresAt);
      const now = new Date();

      if (expiryDate <= now) {
        newErrors.expiresAt = "Дата истечения срока должна быть в будущем";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    dispatch(createPromoCode(formData));
  };

  const isLoading = createStatus === "loading";

  return (
    <div className="modal-overlay">
      <div className="admin-modal">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Создание промокода</h3>
            <button className="close-btn" onClick={onClose}>
              &times;
            </button>
          </div>

          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="modal-body">
              {createError && <div className="form-error">{createError}</div>}

              <div className="form-group">
                <label htmlFor="userId">Пользователь</label>
                <select
                  id="userId"
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  className={errors.userId ? "error" : ""}
                  disabled={isLoading || isLoadingUsers}
                >
                  <option value="">Выберите пользователя</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.nickname || user.email})
                    </option>
                  ))}
                </select>
                {isLoadingUsers && (
                  <div className="loading-info">Загрузка пользователей...</div>
                )}
                {errors.userId && (
                  <div className="error-message">{errors.userId}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="discount">Скидка (%)</label>
                <input
                  type="number"
                  id="discount"
                  name="discount"
                  min="1"
                  max="100"
                  value={formData.discount}
                  onChange={handleChange}
                  className={errors.discount ? "error" : ""}
                  disabled={isLoading}
                />
                {errors.discount && (
                  <div className="error-message">{errors.discount}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="expiresAt">Действителен до</label>
                <input
                  type="date"
                  id="expiresAt"
                  name="expiresAt"
                  value={formData.expiresAt}
                  onChange={handleChange}
                  className={errors.expiresAt ? "error" : ""}
                  disabled={isLoading}
                />
                {errors.expiresAt && (
                  <div className="error-message">{errors.expiresAt}</div>
                )}
              </div>

              <div className="info-block">
                <p>
                  <i className="fas fa-info-circle"></i> Промокод будет
                  автоматически сгенерирован системой.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? "Создание..." : "Создать промокод"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PromoCodeCreateModal;
