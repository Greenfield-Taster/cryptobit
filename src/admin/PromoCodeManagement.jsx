import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import {
  getPromoCodes,
  deletePromoCode,
  selectPromoCodes,
  selectPromoCodesStatus,
  selectPromoCodesError,
  selectPagination,
  resetPromoCodeStatuses,
} from "../store/slices/adminSlice";
import PromoCodeCreateModal from "./Modals/PromoCodeCreateModal";
import PromoCodeDetailModal from "./Modals/PromoCodeDetailModal";
import ConfirmModal from "./Modals/ConfirmModal";
import "../scss/admin/_promoCodeManagement.scss";

const PromoCodeManagement = () => {
  const dispatch = useDispatch();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedPromoCode, setSelectedPromoCode] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const promoCodes = useSelector(selectPromoCodes);
  const promoCodesStatus = useSelector(selectPromoCodesStatus);
  const promoCodesError = useSelector(selectPromoCodesError);
  const pagination = useSelector(selectPagination) || {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  };

  const dropdownRef = useRef(null);

  const loadPromoCodes = useCallback(() => {
    dispatch(
      getPromoCodes({
        page: pagination.page,
        limit: pagination.limit,
        status,
        search,
      })
    );
  }, [dispatch, pagination.page, pagination.limit, status, search]);

  useEffect(() => {
    dispatch(resetPromoCodeStatuses());
    loadPromoCodes();
  }, [dispatch, pagination.page, status, search, loadPromoCodes]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      dispatch(
        getPromoCodes({
          page: newPage,
          limit: pagination.limit,
          status,
          search,
        })
      );
    } else if (pagination.pages === 0) {
      dispatch(
        getPromoCodes({
          page: 1,
          limit: pagination.limit,
          status,
          search,
        })
      );
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
  };

  const toggleDropdown = (promoCodeId) => {
    setActiveDropdown(activeDropdown === promoCodeId ? null : promoCodeId);
  };

  const handleViewPromoCode = (promoCode) => {
    setSelectedPromoCode(promoCode);
    setShowDetailModal(true);
    setActiveDropdown(null);
  };

  const handleDeleteClick = (promoCode) => {
    setSelectedPromoCode(promoCode);
    setShowDeleteModal(true);
    setActiveDropdown(null);
  };

  const confirmDeletePromoCode = async () => {
    try {
      await dispatch(deletePromoCode(selectedPromoCode._id)).unwrap();
      toast.success("Промокод успешно удален");
      setShowDeleteModal(false);
      loadPromoCodes();
    } catch (error) {
      toast.error(error || "Ошибка при удалении промокода");
    }
  };

  const renderStatusBadge = (promoCode) => {
    const now = new Date();
    const expiresAt = new Date(promoCode.expiresAt);

    if (promoCode.isUsed) {
      return <span className="status-badge status-used">Использован</span>;
    } else if (expiresAt < now) {
      return <span className="status-badge status-expired">Истек</span>;
    } else {
      return <span className="status-badge status-active">Активен</span>;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isLoading = promoCodesStatus === "loading";

  return (
    <div className="admin-table-container">
      <div className="table-header">
        <h2>Управление промокодами</h2>
        <button
          className="btn btn-primary create-promo-btn"
          onClick={() => setShowCreateModal(true)}
        >
          Создать промокод
        </button>
      </div>

      <div className="filter-container">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Поиск по коду или пользователю..."
            value={search}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <label>Статус:</label>
          <select value={status} onChange={handleStatusChange}>
            <option value="">Все статусы</option>
            <option value="active">Активные</option>
            <option value="used">Использованные</option>
            <option value="expired">Истекшие</option>
          </select>
        </div>
      </div>

      {isLoading && !promoCodes.length ? (
        <div className="loading-spinner">Загрузка промокодов...</div>
      ) : promoCodesError ? (
        <div className="error-message">{promoCodesError}</div>
      ) : (
        <>
          <div>
            <table>
              <thead>
                <tr>
                  <th>Код</th>
                  <th>Скидка</th>
                  <th>Пользователь</th>
                  <th>Статус</th>
                  <th>Дата создания</th>
                  <th>Истекает</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {promoCodes.length > 0 ? (
                  promoCodes.map((promoCode) => (
                    <tr key={promoCode._id}>
                      <td>{promoCode.code}</td>
                      <td>{promoCode.discount}%</td>
                      <td>
                        {promoCode.userId ? (
                          <>
                            {promoCode.userId.name || "—"} (
                            {promoCode.userId.nickname ||
                              promoCode.userId.email}
                            )
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{renderStatusBadge(promoCode)}</td>
                      <td>{formatDate(promoCode.createdAt)}</td>
                      <td>{formatDate(promoCode.expiresAt)}</td>
                      <td className="actions">
                        <div
                          className={`dropdown ${
                            activeDropdown === promoCode._id ? "active" : ""
                          }`}
                          ref={
                            activeDropdown === promoCode._id
                              ? dropdownRef
                              : null
                          }
                        >
                          <button
                            className="dropdown-toggle"
                            onClick={() => toggleDropdown(promoCode._id)}
                          >
                            Действия
                          </button>
                          <div
                            className={`dropdown-menu ${
                              activeDropdown === promoCode._id ? "show" : ""
                            }`}
                          >
                            <button
                              className="dropdown-item view"
                              onClick={() => handleViewPromoCode(promoCode)}
                            >
                              <i className="fas fa-eye"></i> Просмотр
                            </button>
                            {!promoCode.isUsed && (
                              <button
                                className="dropdown-item delete"
                                onClick={() => handleDeleteClick(promoCode)}
                              >
                                <i className="fas fa-trash"></i> Удалить
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center">
                      Промокоды не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(1)}
                disabled={pagination.page === 1}
              >
                &laquo;
              </button>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                &lsaquo;
              </button>

              {pagination.pages > 0 &&
                Array.from({ length: pagination.pages }, (_, i) => i + 1)
                  .filter((page) => {
                    return (
                      page === 1 ||
                      page === pagination.pages ||
                      Math.abs(page - pagination.page) <= 2
                    );
                  })
                  .map((page, index, array) => {
                    const previousPage = array[index - 1];
                    const showEllipsis =
                      previousPage && page - previousPage > 1;

                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && (
                          <span className="pagination-ellipsis">...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(page)}
                          className={pagination.page === page ? "active" : ""}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={
                  pagination.page === pagination.pages || pagination.pages === 0
                }
              >
                &rsaquo;
              </button>
              <button
                onClick={() => handlePageChange(pagination.pages)}
                disabled={
                  pagination.page === pagination.pages || pagination.pages === 0
                }
              >
                &raquo;
              </button>
            </div>
          )}
        </>
      )}

      {showCreateModal && (
        <PromoCodeCreateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadPromoCodes();
          }}
        />
      )}

      {showDetailModal && selectedPromoCode && (
        <PromoCodeDetailModal
          promoCode={selectedPromoCode}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {showDeleteModal && selectedPromoCode && (
        <ConfirmModal
          title="Подтверждение удаления"
          message={`Вы действительно хотите удалить промокод ${selectedPromoCode.code}?`}
          confirmText="Удалить"
          cancelText="Отмена"
          onConfirm={confirmDeletePromoCode}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};

export default PromoCodeManagement;
