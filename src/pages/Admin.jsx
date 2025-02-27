import React, { useState } from "react";
import UserManagement from "../admin/UserManagement";
import ExchangeRequests from "../admin/ExchangeRequests";
import ChatSupport from "../admin/ChatSupport";
import Dashboard from "../admin/Dashboard";
import "../scss/main.scss";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "users":
        return <UserManagement />;
      case "requests":
        return <ExchangeRequests />;
      case "chats":
        return <ChatSupport />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-sidebar">
        <h2>Админ панель</h2>
        <ul className="admin-nav">
          <li
            className={activeTab === "dashboard" ? "active" : ""}
            onClick={() => setActiveTab("dashboard")}
          >
            <i className="fas fa-chart-line"></i> Статистика
          </li>
          <li
            className={activeTab === "users" ? "active" : ""}
            onClick={() => setActiveTab("users")}
          >
            <i className="fas fa-users"></i> Пользователи
          </li>
          <li
            className={activeTab === "requests" ? "active" : ""}
            onClick={() => setActiveTab("requests")}
          >
            <i className="fas fa-exchange-alt"></i> Заявки на обмен
          </li>
          <li
            className={activeTab === "chats" ? "active" : ""}
            onClick={() => setActiveTab("chats")}
          >
            <i className="fas fa-comments"></i> Чаты поддержки
          </li>
        </ul>
      </div>
      <div className="admin-content">{renderContent()}</div>
    </div>
  );
};

export default Admin;
