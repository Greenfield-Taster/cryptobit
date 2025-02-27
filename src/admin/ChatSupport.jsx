import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const ChatSupport = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [chatFilter, setChatFilter] = useState("active");

  const messagesEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    fetchChats();

    pollingIntervalRef.current = setInterval(() => {
      if (!loading) {
        fetchChats(false);

        if (selectedChat) {
          fetchMessages(selectedChat._id, false);
        }
      }
    }, 10000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const fetchChats = async (showLoading = true) => {
    if (showLoading) setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/admin/chats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          status: chatFilter,
        },
      });

      if (response.data.success) {
        setChats(response.data.data.chats);
      } else {
        if (showLoading) {
          toast.error("Не удалось загрузить список чатов");
        }
      }
    } catch (error) {
      console.error("Ошибка при загрузке чатов:", error);
      if (showLoading) {
        toast.error("Ошибка при загрузке чатов");
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchMessages = async (chatId, showLoading = true) => {
    if (showLoading) setMessagesLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/api/admin/chats/${chatId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setMessages(response.data.data);
      } else {
        if (showLoading) {
          toast.error("Не удалось загрузить сообщения");
        }
      }
    } catch (error) {
      console.error("Ошибка при загрузке сообщений:", error);
      if (showLoading) {
        toast.error("Ошибка при загрузке сообщений");
      }
    } finally {
      if (showLoading) setMessagesLoading(false);
    }
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    fetchMessages(chat._id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `/api/admin/chats/${selectedChat._id}/messages`,
        {
          message: newMessage,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setNewMessage("");
        // Добавляем сообщение в список
        setMessages([...messages, response.data.data]);
      } else {
        toast.error("Не удалось отправить сообщение");
      }
    } catch (error) {
      console.error("Ошибка при отправке сообщения:", error);
      toast.error("Ошибка при отправке сообщения");
    }
  };

  const handleCloseChat = async () => {
    if (!selectedChat) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `/api/admin/chats/${selectedChat._id}/close`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Чат успешно закрыт");
        fetchChats();
        setSelectedChat(null);
        setMessages([]);
      } else {
        toast.error("Не удалось закрыть чат");
      }
    } catch (error) {
      console.error("Ошибка при закрытии чата:", error);
      toast.error("Ошибка при закрытии чата");
    }
  };

  const handleArchiveChat = async () => {
    if (!selectedChat) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `/api/admin/chats/${selectedChat._id}/archive`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Чат успешно архивирован");
        fetchChats();
        setSelectedChat(null);
        setMessages([]);
      } else {
        toast.error("Не удалось архивировать чат");
      }
    } catch (error) {
      console.error("Ошибка при архивации чата:", error);
      toast.error("Ошибка при архивации чата");
    }
  };

  const handleFilterChange = (filter) => {
    setChatFilter(filter);
    setSelectedChat(null);
    setMessages([]);
    setLoading(true);
    setTimeout(() => fetchChats(), 100);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  return (
    <div className="admin-table-container">
      <div className="table-header">
        <h2>Чаты поддержки</h2>
        <div className="chat-filters">
          <button
            className={`btn ${
              chatFilter === "active" ? "btn-primary" : "btn-outline"
            }`}
            onClick={() => handleFilterChange("active")}
          >
            Активные
          </button>
          <button
            className={`btn ${
              chatFilter === "closed" ? "btn-primary" : "btn-outline"
            }`}
            onClick={() => handleFilterChange("closed")}
          >
            Закрытые
          </button>
          <button
            className={`btn ${
              chatFilter === "archived" ? "btn-primary" : "btn-outline"
            }`}
            onClick={() => handleFilterChange("archived")}
          >
            Архивные
          </button>
        </div>
      </div>

      <div className="chat-container">
        <div className="chat-list">
          {loading ? (
            <div className="loading-spinner">Загрузка чатов...</div>
          ) : chats.length > 0 ? (
            chats.map((chat) => (
              <div
                key={chat._id}
                className={`chat-item ${
                  selectedChat && selectedChat._id === chat._id ? "active" : ""
                }`}
                onClick={() => handleChatSelect(chat)}
              >
                <div className="chat-user">
                  {chat.userId.nickname || chat.userId.email}
                  {chat.unreadCount > 0 && (
                    <span className="unread-badge">{chat.unreadCount}</span>
                  )}
                </div>
                <div className="chat-preview">Заказ #{chat.orderId}</div>
                <div className="chat-time">
                  {formatTimestamp(chat.lastMessageAt || chat.createdAt)}
                </div>
              </div>
            ))
          ) : (
            <div className="no-chats">Чаты не найдены</div>
          )}
        </div>

        <div className="chat-messages">
          {selectedChat ? (
            <>
              <div className="messages-header">
                <h3>
                  Чат с{" "}
                  {selectedChat.userId.nickname || selectedChat.userId.email}
                  <span className="chat-order">#{selectedChat.orderId}</span>
                </h3>
                <div className="header-actions">
                  {selectedChat.status === "active" && (
                    <button onClick={handleCloseChat} title="Закрыть чат">
                      <i className="fas fa-times-circle"></i>
                    </button>
                  )}
                  {selectedChat.status === "closed" && (
                    <button
                      onClick={handleArchiveChat}
                      title="Архивировать чат"
                    >
                      <i className="fas fa-archive"></i>
                    </button>
                  )}
                </div>
              </div>

              <div className="messages-body">
                {messagesLoading ? (
                  <div className="loading-spinner">Загрузка сообщений...</div>
                ) : messages.length > 0 ? (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`message ${
                        message.sender === "admin" ? "admin" : "user"
                      }`}
                    >
                      <div className="message-content">{message.content}</div>
                      <div className="message-time">
                        {formatTimestamp(message.timestamp)}
                        {message.read && message.sender === "admin" && (
                          <span className="read-mark">
                            <i className="fas fa-check"></i>
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-messages">Нет сообщений</div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {selectedChat.status === "active" && (
                <div className="messages-footer">
                  <form className="message-form" onSubmit={handleSendMessage}>
                    <input
                      type="text"
                      placeholder="Введите сообщение..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button type="submit">
                      <i className="fas fa-paper-plane"></i>
                    </button>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="no-chat-selected">
              <i className="fas fa-comments"></i>
              <p>Выберите чат для просмотра сообщений</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSupport;
