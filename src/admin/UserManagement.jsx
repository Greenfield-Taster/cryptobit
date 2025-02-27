import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import UserEditModal from "./Modals/UserEditModal";
import UserDetailModal from "./Modals/UserDetailModal";
import ConfirmModal from "./Modals/ConfirmModal";
import adminService from "../services/admin.service";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  // Модальные окна
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.limit, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.userService.getUsers(
        pagination.page,
        pagination.limit,
        search
      );

      if (response.data.success) {
        setUsers(response.data.data.users);
        setPagination({
          ...pagination,
          total: response.data.data.pagination.total,
          pages: response.data.data.pagination.pages,
        });
      } else {
        toast.error("Не удалось загрузить список пользователей");
      }
    } catch (error) {
      console.error("Ошибка при загрузке пользователей:", error);
      toast.error("Ошибка при загрузке пользователей");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleViewUser = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/api/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setSelectedUser({
          ...response.data.data.user,
          stats: response.data.data.stats,
        });
        setShowDetailModal(true);
      } else {
        toast.error("Не удалось загрузить данные пользователя");
      }
    } catch (error) {
      console.error("Ошибка при загрузке данных пользователя:", error);
      toast.error("Ошибка при загрузке данных пользователя");
    }
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `/api/admin/users/${selectedUser._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Пользователь успешно удален");
        setShowDeleteModal(false);
        fetchUsers();
      } else {
        toast.error("Не удалось удалить пользователя");
      }
    } catch (error) {
      console.error("Ошибка при удалении пользователя:", error);
      toast.error(
        error.response?.data?.message || "Ошибка при удалении пользователя"
      );
    }
  };

  const handleSaveUser = async (userData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `/api/admin/users/${userData._id}`,
        userData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Пользователь успешно обновлен");
        setShowEditModal(false);
        fetchUsers();
      } else {
        toast.error("Не удалось обновить пользователя");
      }
    } catch (error) {
      console.error("Ошибка при обновлении пользователя:", error);
      toast.error(
        error.response?.data?.message || "Ошибка при обновлении пользователя"
      );
    }
  };

  return (
    <div className="admin-table-container">
      <div className="table-header">
        <h2>Управление пользователями</h2>
      </div>

      <div className="search-filter">
        <input
          type="text"
          placeholder="Поиск по имени, email или никнейму..."
          value={search}
          onChange={handleSearchChange}
        />
      </div>

      {loading ? (
        <div className="loading-spinner">Загрузка пользователей...</div>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Имя</th>
                <th>Email</th>
                <th>Никнейм</th>
                <th>Телефон</th>
                <th>Роль</th>
                <th>Дата регистрации</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.nickname}</td>
                    <td>{user.phone || "-"}</td>
                    <td>
                      {user.role === "admin" ? "Администратор" : "Пользователь"}
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="actions">
                      <button
                        className="view"
                        onClick={() => handleViewUser(user._id)}
                        title="Просмотр"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="edit"
                        onClick={() => handleEditUser(user)}
                        title="Редактировать"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="delete"
                        onClick={() => handleDeleteUser(user)}
                        title="Удалить"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center">
                    Пользователи не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Пагинация */}
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

              {[...Array(pagination.pages).keys()].map((page) => (
                <button
                  key={page + 1}
                  onClick={() => handlePageChange(page + 1)}
                  className={pagination.page === page + 1 ? "active" : ""}
                >
                  {page + 1}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
              >
                &rsaquo;
              </button>
              <button
                onClick={() => handlePageChange(pagination.pages)}
                disabled={pagination.page === pagination.pages}
              >
                &raquo;
              </button>
            </div>
          )}
        </>
      )}

      {/* Модальные окна */}
      {showEditModal && (
        <UserEditModal
          user={selectedUser}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveUser}
        />
      )}

      {showDetailModal && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setShowDetailModal(false)}
          onEdit={() => {
            setShowDetailModal(false);
            setShowEditModal(true);
          }}
        />
      )}

      {showDeleteModal && (
        <ConfirmModal
          title="Подтверждение удаления"
          message={`Вы действительно хотите удалить пользователя ${selectedUser.name}?`}
          confirmText="Удалить"
          cancelText="Отмена"
          onConfirm={confirmDeleteUser}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};

export default UserManagement;
