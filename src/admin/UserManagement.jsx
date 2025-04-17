import React, { useState, useEffect, useRef, useCallback } from "react";
import UserEditModal from "./Modals/UserEditModal";
import UserDetailModal from "./Modals/UserDetailModal";
import ConfirmModal from "./Modals/ConfirmModal";
import adminService from "../services/admin.service";
import "../scss/admin/_userManagement.scss";

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
  const [activeDropdown, setActiveDropdown] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const dropdownRef = useRef(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.userService.getUsers(
        pagination.page,
        pagination.limit,
        search
      );

      if (response.data.success) {
        setUsers(response.data.data.users);
        setPagination((prev) => ({
          ...prev,
          total: response.data.data.pagination.total,
          pages: response.data.data.pagination.pages,
        }));
      } else {
        console.error("Не удалось загрузить список пользователей");
      }
    } catch (error) {
      console.error("Ошибка при загрузке пользователей:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination({ ...pagination, page: newPage });
    } else if (pagination.pages === 0) {
      setPagination({ ...pagination, page: 1 });
    }
  };

  const handleEditUser = (user) => {
    setActiveDropdown(null);
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleViewUser = async (userId) => {
    try {
      setActiveDropdown(null);
      const response = await adminService.userService.getUserById(userId);

      if (response.data.success) {
        setSelectedUser({
          ...response.data.data.user,
          stats: response.data.data.stats,
        });
        setShowDetailModal(true);
      } else {
        console.error("Не удалось загрузить данные пользователя");
      }
    } catch (error) {
      console.error("Ошибка при загрузке данных пользователя:", error);
    }
  };

  const handleDeleteUser = (user) => {
    setActiveDropdown(null);
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const toggleDropdown = (userId) => {
    setActiveDropdown(activeDropdown === userId ? null : userId);
  };

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
  }, [dropdownRef]);

  const confirmDeleteUser = async () => {
    try {
      const response = await adminService.userService.deleteUser(
        selectedUser._id
      );

      if (response.data.success) {
        setShowDeleteModal(false);
        fetchUsers();
      } else {
        console.error("Не удалось удалить пользователя");
      }
    } catch (error) {
      console.error("Ошибка при удалении пользователя:", error);
    }
  };

  const handleSaveUser = async (userData) => {
    try {
      const response = await adminService.userService.updateUser(
        userData._id,
        userData
      );

      if (response.data.success) {
        setShowEditModal(false);
        fetchUsers();
      } else {
        console.error("Не удалось обновить пользователя");
      }
    } catch (error) {
      console.error("Ошибка при обновлении пользователя:", error);
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
                      <div
                        className={`dropdown ${
                          activeDropdown === user._id ? "active" : ""
                        }`}
                        ref={activeDropdown === user._id ? dropdownRef : null}
                      >
                        <button
                          className="dropdown-toggle"
                          onClick={() => toggleDropdown(user._id)}
                        >
                          Действия
                        </button>
                        <div
                          className={`dropdown-menu ${
                            activeDropdown === user._id ? "show" : ""
                          }`}
                        >
                          <button
                            className="dropdown-item view"
                            onClick={() => handleViewUser(user._id)}
                          >
                            Просмотр
                          </button>
                          <button
                            className="dropdown-item edit"
                            onClick={() => handleEditUser(user)}
                          >
                            Редактировать
                          </button>
                          <div className="dropdown-divider"></div>
                          <button
                            className="dropdown-item delete"
                            onClick={() => handleDeleteUser(user)}
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
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
