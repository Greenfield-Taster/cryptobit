import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import adminService from "../services/admin.service";
import ConfirmModal from "./Modals/ConfirmModal";
import StatusUpdateModal from "./Modals/StatusUpdateModal";
import RequestDetailModal from "./Modals/RequestDetailModal";

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

  // Модальные окна
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [pagination.page, pagination.limit, filters]);

  // Исправление ошибки в функции fetchRequests
  const fetchRequests = async () => {
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
        // Безопасно получаем массив заявок
        const receivedRequests = response.data.data.requests || [];
        setRequests(receivedRequests);

        // Обновляем пагинацию с проверками
        if (response.data.data.pagination) {
          const paginationData = response.data.data.pagination;

          setPagination((prev) => ({
            ...prev,
            total: paginationData.total || 0,
            pages: paginationData.pages || 0,
          }));

          // Если текущая страница больше чем общее количество страниц, переходим на первую
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
  };

  const handleStatusChange = (e) => {
    setFilters({ ...filters, status: e.target.value });
    setPagination({ ...pagination, page: 1 }); // Сбрасываем на первую страницу при изменении фильтра
  };

  const handleSortChange = (field) => {
    if (filters.sortField === field) {
      // Если поле то же, меняем порядок сортировки
      setFilters({
        ...filters,
        sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
      });
    } else {
      // Если поле новое, устанавливаем его и сортировку по убыванию
      setFilters({
        ...filters,
        sortField: field,
        sortOrder: "desc",
      });
    }
    setPagination({ ...pagination, page: 1 }); // Сбрасываем на первую страницу при изменении сортировки
  };

  const handlePageChange = (newPage) => {
    // Проверяем, что новая страница в допустимых пределах
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination({ ...pagination, page: newPage });
    } else if (pagination.pages === 0) {
      // Если страниц нет, устанавливаем страницу на 1
      setPagination({ ...pagination, page: 1 });
    }
  };

  const handleViewRequest = async (requestId) => {
    try {
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
    setSelectedRequest(request);
    setConfirmAction("complete");
    setShowConfirmModal(true);
  };

  const confirmCancelRequest = (request) => {
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
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th onClick={() => handleSortChange("orderId")}>
                    ID заявки
                    {filters.sortField === "orderId" && (
                      <i
                        className={`fas fa-sort-${
                          filters.sortOrder === "asc" ? "up" : "down"
                        }`}
                      ></i>
                    )}
                  </th>
                  <th>Отправитель</th>
                  <th>Из</th>
                  <th>В</th>
                  <th onClick={() => handleSortChange("amount")}>
                    Сумма
                    {filters.sortField === "amount" && (
                      <i
                        className={`fas fa-sort-${
                          filters.sortOrder === "asc" ? "up" : "down"
                        }`}
                      ></i>
                    )}
                  </th>
                  <th onClick={() => handleSortChange("status")}>
                    Статус
                    {filters.sortField === "status" && (
                      <i
                        className={`fas fa-sort-${
                          filters.sortOrder === "asc" ? "up" : "down"
                        }`}
                      ></i>
                    )}
                  </th>
                  <th onClick={() => handleSortChange("createdAt")}>
                    Дата создания
                    {filters.sortField === "createdAt" && (
                      <i
                        className={`fas fa-sort-${
                          filters.sortOrder === "asc" ? "up" : "down"
                        }`}
                      ></i>
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
                        <button
                          className="view"
                          onClick={() => handleViewRequest(request._id)}
                          title="Просмотр"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          className="edit"
                          onClick={() => handleUpdateStatus(request)}
                          title="Изменить статус"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        {request.status === "pending" ||
                        request.status === "processing" ? (
                          <>
                            <button
                              className="complete"
                              onClick={() => confirmCompleteRequest(request)}
                              title="Завершить"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                            <button
                              className="cancel"
                              onClick={() => confirmCancelRequest(request)}
                              title="Отменить"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </>
                        ) : null}
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
                    // Показываем только страницы вокруг текущей (+/- 2) и первую/последнюю
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

      {/* Модальные окна */}
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
