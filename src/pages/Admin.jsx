import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import "../scss/main.scss";

const AdminLayout = () => {
  const location = useLocation();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/admin/users")) return "users";
    if (path.includes("/admin/requests")) return "requests";
    if (path.includes("/admin/chats")) return "chats";
    if (path.includes("/admin/promocodes")) return "promocodes";
    return "dashboard";
  };

  const activeTab = getActiveTab();

  return (
    <div className="admin-page">
      <div className="admin-sidebar">
        <h2>Админ панель</h2>
        <ul className="admin-nav">
          <li className={activeTab === "dashboard" ? "active" : ""}>
            <Link to="/admin/dashboard">Статистика</Link>
          </li>
          <li className={activeTab === "users" ? "active" : ""}>
            <Link to="/admin/users">Пользователи</Link>
          </li>
          <li className={activeTab === "requests" ? "active" : ""}>
            <Link to="/admin/requests">Заявки на обмен</Link>
          </li>
          <li className={activeTab === "chats" ? "active" : ""}>
            <Link to="/admin/chats">Чаты поддержки</Link>
          </li>
          <li className={activeTab === "promocodes" ? "active" : ""}>
            <Link to="/admin/promocodes">Промокоды</Link>
          </li>
        </ul>
      </div>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
