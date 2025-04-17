import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import adminService from "../services/admin.service";
import ConfirmModal from "./Modals/ConfirmModal";
import StatusUpdateModal from "./Modals/StatusUpdateModal";
import RequestDetailModal from "./Modals/RequestDetailModal";
import "../scss/admin/_exchangeRequests.scss";

const ExchangeRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    status: "",
    sortField: "createdAt",
    sortOrder: "desc",
  });
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [activeViewDropdown, setActiveViewDropdown] = useState(null);
  const [activeActionDropdown, setActiveActionDropdown] = useState(null);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const viewDropdownRef = useRef(null);
  const actionDropdownRef = useRef(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);

      const response = await adminService.exchangeService.getRequests({
        page: pagination.page,
        limit: pagination.limit,
        status: filters.status,
        sortField: filters.sortField,
        sortOrder: filters.sortOrder,
      });

      if (response && response.data && response.data.success) {
        const receivedRequests = response.data.data.requests || [];
        setRequests(receivedRequests);

        if (response.data.data.pagination) {
          const paginationData = response.data.data.pagination;

          setPagination((prev) => ({
            ...prev,
            total: paginationData.total || 0,
            pages: paginationData.pages || 0,
          }));

          if (
            pagination.page > paginationData.pages &&
            paginationData.pages > 0
          ) {
            setPagination((prev) => ({ ...prev, page: 1 }));
          }
        } else {
          setPagination((prev) => ({ ...prev, total: 0, pages: 0 }));
        }
      } else {
        toast.error("Не удалось загрузить список заявок");
        setRequests([]);
        setPagination((prev) => ({ ...prev, total: 0, pages: 0 }));
      }
    } catch (error) {
      console.error("Ошибка при загрузке заявок:", error);
      toast.error("Ошибка при загрузке заявок");
      setRequests([]);
      setPagination((prev) => ({ ...prev, total: 0, pages: 0 }));
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        viewDropdownRef.current &&
        !viewDropdownRef.current.contains(event.target)
      ) {
        setActiveViewDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [viewDropdownRef]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        actionDropdownRef.current &&
        !actionDropdownRef.current.contains(event.target)
      ) {
        setActiveActionDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [actionDropdownRef]);

  const handleStatusChange = (e) => {
    setFilters({ ...filters, status: e.target.value });
    setPagination({ ...pagination, page: 1 });
  };

  const handleSortChange = (field) => {
    if (filters.sortField === field) {
      setFilters({
        ...filters,
        sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
      });
    } else {
      setFilters({
        ...filters,
        sortField: field,
        sortOrder: "desc",
      });
    }
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination({ ...pagination, page: newPage });
    } else if (pagination.pages === 0) {
      setPagination({ ...pagination, page: 1 });
    }
  };

  const toggleViewDropdown = (requestId) => {
    setActiveViewDropdown(activeViewDropdown === requestId ? null : requestId);
    if (activeActionDropdown) {
      setActiveActionDropdown(null);
    }
  };

  const toggleActionDropdown = (requestId) => {
    setActiveActionDropdown(
      activeActionDropdown === requestId ? null : requestId
    );
    if (activeViewDropdown) {
      setActiveViewDropdown(null);
    }
  };

  const handleViewRequest = async (requestId) => {
    try {
      setActiveViewDropdown(null);
      setLoading(true);
      const response = await adminService.exchangeService.getRequestById(
        requestId
      );

      if (response && response.data && response.data.success) {
        setSelectedRequest(response.data.data.request);
        setShowDetailModal(true);
      } else {
        toast.error("Не удалось загрузить данные заявки");
      }
    } catch (error) {
      console.error("Ошибка при загрузке данных заявки:", error);
      toast.error("Ошибка при загрузке данных заявки");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = (request) => {
    setActiveViewDropdown(null);
    setSelectedRequest(request);
    setShowStatusModal(true);
  };

  const handleSaveStatus = async (statusData) => {
    try {
      const response = await adminService.exchangeService.updateRequestStatus(
        selectedRequest._id,
        statusData
      );

      if (response && response.data && response.data.success) {
        toast.success(response.data.message || "Статус успешно обновлен");
        setShowStatusModal(false);
        fetchRequests();
      } else {
        toast.error("Не удалось обновить статус заявки");
      }
    } catch (error) {
      console.error("Ошибка при обновлении статуса:", error);
      toast.error(
        error.response?.data?.message || "Ошибка при обновлении статуса"
      );
    }
  };

  const confirmCompleteRequest = (request) => {
    setActiveActionDropdown(null);
    setSelectedRequest(request);
    setConfirmAction("complete");
    setShowConfirmModal(true);
  };

  const confirmCancelRequest = (request) => {
    setActiveActionDropdown(null);
    setSelectedRequest(request);
    setConfirmAction("cancel");
    setShowConfirmModal(true);
  };

  const executeConfirmAction = async () => {
    try {
      let statusData = {};

      if (confirmAction === "complete") {
        statusData = { status: "completed" };
      } else if (confirmAction === "cancel") {
        statusData = { status: "failed" };
      }

      const response = await adminService.exchangeService.updateRequestStatus(
        selectedRequest._id,
        statusData
      );

      if (response && response.data && response.data.success) {
        toast.success(response.data.message || "Статус успешно обновлен");
        setShowConfirmModal(false);
        fetchRequests();
      } else {
        toast.error("Не удалось обновить статус заявки");
      }
    } catch (error) {
      console.error("Ошибка при обновлении статуса:", error);
      toast.error(
        error.response?.data?.message || "Ошибка при обновлении статуса"
      );
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "Ожидающая";
      case "processing":
        return "В обработке";
      case "completed":
        return "Завершена";
      case "failed":
        return "Неудачная";
      default:
        return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
        return "status-pending";
      case "processing":
        return "status-processing";
      case "completed":
        return "status-completed";
      case "failed":
        return "status-failed";
      default:
        return "";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";

    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return "—";
    return parseFloat(value).toFixed(2);
  };

  return (
    <div className="admin-table-container">
      <div className="table-header">
        <h2>Заявки на обмен</h2>
      </div>

      <div className="filter-container">
        <div className="filter-group">
          <label>Статус:</label>
          <select value={filters.status} onChange={handleStatusChange}>
            <option value="">Все статусы</option>
            <option value="pending">Ожидающие</option>
            <option value="processing">В обработке</option>
            <option value="completed">Завершенные</option>
            <option value="failed">Неудачные</option>
          </select>
        </div>
      </div>

      {loading && requests.length === 0 ? (
        <div className="loading-spinner">Загрузка заявок...</div>
      ) : (
        <>
          <div>
            <table>
              <thead>
                <tr>
                  <th>ID заявки</th>
                  <th>Отправитель</th>
                  <th>Из</th>
                  <th>В</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                  <th onClick={() => handleSortChange("createdAt")}>
                    Дата создания
                    {filters.sortField === "createdAt" && (
                      <i
                        className={`fas fa-sort-${
                          filters.sortOrder === "asc" ? "up" : "down"
                        }`}
                      >
                        \/
                      </i>
                    )}
                  </th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {requests.length > 0 ? (
                  requests.map((request) => (
                    <tr key={request._id}>
                      <td>{request.orderId || "—"}</td>
                      <td>
                        {request.userId && request.userId.name
                          ? request.userId.name
                          : "—"}
                      </td>
                      <td>
                        {request.fromCrypto
                          ? request.fromCrypto.toUpperCase()
                          : "—"}
                      </td>
                      <td>
                        {request.toCrypto
                          ? request.toCrypto.toUpperCase()
                          : "—"}
                      </td>
                      <td>
                        {formatCurrency(request.amount)}{" "}
                        {request.fromCrypto
                          ? request.fromCrypto.toUpperCase()
                          : ""}
                      </td>
                      <td>
                        <span className={getStatusClass(request.status)}>
                          {getStatusLabel(request.status)}
                        </span>
                      </td>
                      <td>{formatDate(request.createdAt)}</td>
                      <td className="actions">
                        <div
                          className={`dropdown ${
                            activeViewDropdown === request._id ? "active" : ""
                          }`}
                          ref={
                            activeViewDropdown === request._id
                              ? viewDropdownRef
                              : null
                          }
                        >
                          <button
                            className="dropdown-toggle"
                            onClick={() => toggleViewDropdown(request._id)}
                          >
                            <i className="fas fa-eye"></i> Просмотр
                          </button>
                          <div
                            className={`dropdown-menu ${
                              activeViewDropdown === request._id ? "show" : ""
                            }`}
                          >
                            <button
                              className="dropdown-item view"
                              onClick={() => handleViewRequest(request._id)}
                            >
                              <i className="fas fa-eye"></i> Просмотр
                            </button>
                            <button
                              className="dropdown-item edit"
                              onClick={() => handleUpdateStatus(request)}
                            >
                              <i className="fas fa-edit"></i> Изменить статус
                            </button>
                          </div>
                        </div>

                        {(request.status === "pending" ||
                          request.status === "processing") && (
                          <div
                            className={`dropdown ${
                              activeActionDropdown === request._id
                                ? "active"
                                : ""
                            }`}
                            ref={
                              activeActionDropdown === request._id
                                ? actionDropdownRef
                                : null
                            }
                            style={{ marginLeft: "10px" }}
                          >
                            <button
                              className="dropdown-toggle"
                              onClick={() => toggleActionDropdown(request._id)}
                            >
                              <i className="fas fa-cog"></i> Действия
                            </button>
                            <div
                              className={`dropdown-menu ${
                                activeActionDropdown === request._id
                                  ? "show"
                                  : ""
                              }`}
                            >
                              <button
                                className="dropdown-item complete"
                                onClick={() => confirmCompleteRequest(request)}
                              >
                                <i className="fas fa-check"></i> Завершить
                              </button>
                              <button
                                className="dropdown-item delete"
                                onClick={() => confirmCancelRequest(request)}
                              >
                                <i className="fas fa-times"></i> Отменить
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center">
                      Заявки не найдены
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
                    // Добавляем многоточие между несмежными страницами
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

      {showStatusModal && selectedRequest && (
        <StatusUpdateModal
          request={selectedRequest}
          onClose={() => setShowStatusModal(false)}
          onSave={handleSaveStatus}
        />
      )}

      {showDetailModal && selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={() => setShowDetailModal(false)}
          onUpdateStatus={() => {
            setShowDetailModal(false);
            setShowStatusModal(true);
          }}
        />
      )}

      {showConfirmModal && selectedRequest && (
        <ConfirmModal
          title={
            confirmAction === "complete"
              ? "Подтверждение завершения"
              : "Подтверждение отмены"
          }
          message={
            confirmAction === "complete"
              ? `Вы действительно хотите завершить заявку ${selectedRequest.orderId}?`
              : `Вы действительно хотите отменить заявку ${selectedRequest.orderId}?`
          }
          confirmText={confirmAction === "complete" ? "Завершить" : "Отменить"}
          cancelText="Отмена"
          onConfirm={executeConfirmAction}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  );
};

export default ExchangeRequests;
