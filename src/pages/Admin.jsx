import React, { useEffect } from "react";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import UserManagement from "../admin/UserManagement";
import ExchangeRequests from "../admin/ExchangeRequests";
import ChatSupport from "../admin/ChatSupport";
import Dashboard from "../admin/Dashboard";
import PromoCodeManagement from "../admin/PromoCodeManagement";
import "../scss/main.scss";

const Admin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/admin") {
      navigate("dashboard");
    }
  }, [location.pathname, navigate]);

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("users")) return "users";
    if (path.includes("requests")) return "requests";
    if (path.includes("chats")) return "chats";
    if (path.includes("promocodes")) return "promocodes";
    return "dashboard";
  };

  const activeTab = getActiveTab();

  return (
    <div className="admin-page">
      <div className="admin-sidebar">
        <h2>Админ панель</h2>
        <ul className="admin-nav">
          <li className={activeTab === "dashboard" ? "active" : ""}>
            <Link to="dashboard">Статистика</Link>
          </li>
          <li className={activeTab === "users" ? "active" : ""}>
            <Link to="users">Пользователи</Link>
          </li>
          <li className={activeTab === "requests" ? "active" : ""}>
            <Link to="requests">Заявки на обмен</Link>
          </li>
          <li className={activeTab === "chats" ? "active" : ""}>
            <Link to="chats">Чаты поддержки</Link>
          </li>
          <li className={activeTab === "promocodes" ? "active" : ""}>
            <Link to="promocodes">Промокоды</Link>
          </li>
        </ul>
      </div>
      <div className="admin-content">
        <Routes>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="requests" element={<ExchangeRequests />} />
          <Route path="chats" element={<ChatSupport />} />
          <Route path="promocodes" element={<PromoCodeManagement />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </div>
    </div>
  );
};

export default Admin;
