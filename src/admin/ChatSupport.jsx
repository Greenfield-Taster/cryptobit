import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../store/slices/authSlice";
import { useSignalR } from "../contexts/SignalRContext";
import "../scss/admin/_chatSupport.scss";

const ChatSupport = () => {
  const user = useSelector(selectUser);
  const { isConnected, connectionError, chatService } = useSignalR();

  const [chatRooms, setChatRooms] = useState([]);
  const [currentChatRoomId, setCurrentChatRoomId] = useState(null);
  const [currentChatRoom, setCurrentChatRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastScrollHeight, setLastScrollHeight] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesDivRef = useRef(null);
  const [retryCount, setRetryCount] = useState(0);

  // Загрузка чатов
  useEffect(() => {
    const loadChatRooms = async () => {
      if (!isConnected || !user || user.role !== "admin") return;

      try {
        setLoading(true);
        await chatService.getAllChats();
        const rooms = await chatService.getUserChatRooms(user.id);
        setChatRooms(rooms);
        setInitialLoadComplete(true);
      } catch (error) {
        console.error("Failed to load chat rooms:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isConnected && user && user.role === "admin") {
      loadChatRooms();
    }
  }, [isConnected, user, chatService]);

  // Регистрация обработчиков событий
  useEffect(() => {
    if (!isConnected) return;

    const handleReceiveMessage = (message) => {
      if (!message) return;

      setMessages((prev) => {
        if (!prev) return [message];
        const exists = prev.some((msg) => msg && msg.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });

      // Обновляем информацию о последнем сообщении в комнате
      setChatRooms((prev) => {
        if (!prev) return [];
        return prev.map((room) =>
          room && room.id === message.roomId
            ? {
                ...room,
                lastMessage: {
                  message: message.message,
                  timestamp: message.timestamp,
                  status: message.status,
                  senderId: message.senderId,
                },
              }
            : room
        );
      });
    };

    const handleReceiveMessageHistory = (roomId, messageHistory) => {
      if (roomId === currentChatRoomId && messageHistory) {
        setMessages(messageHistory);
      }
    };

    const handleNewRoomCreated = (room) => {
      if (!room) return;

      setChatRooms((prev) => {
        if (!prev) return [room];
        const exists = prev.some((r) => r && r.id === room.id);
        if (exists) return prev;
        return [...prev, room];
      });
    };

    const handleReceiveAllChats = (chats) => {
      if (chats) {
        setChatRooms(chats);
      }
    };

    chatService.on("ReceiveMessage", handleReceiveMessage);
    chatService.on("ReceiveMessageHistory", handleReceiveMessageHistory);
    chatService.on("NewRoomCreated", handleNewRoomCreated);
    chatService.on("ReceiveAllChats", handleReceiveAllChats);

    return () => {
      chatService.off("ReceiveMessage", handleReceiveMessage);
      chatService.off("ReceiveMessageHistory", handleReceiveMessageHistory);
      chatService.off("NewRoomCreated", handleNewRoomCreated);
      chatService.off("ReceiveAllChats", handleReceiveAllChats);
    };
  }, [isConnected, currentChatRoomId, chatService]);

  // Обновление статуса сообщений
  useEffect(() => {
    if (
      messages &&
      messages.length > 0 &&
      currentChatRoomId &&
      isConnected &&
      user
    ) {
      const unreadMessages = messages.filter(
        (msg) => msg && msg.senderId !== user.id && msg.status !== "Read"
      );

      if (unreadMessages && unreadMessages.length > 0) {
        unreadMessages.forEach(async (msg) => {
          if (!msg || !msg.id) return;

          try {
            await fetch(
              `${process.env.REACT_APP_API_URL}/api/ChatMessages/${msg.id}/status`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: "Read", userId: user.id }),
              }
            );
          } catch (error) {
            console.error("Failed to update message status:", error);
          }
        });
      }
    }
  }, [messages, currentChatRoomId, user, isConnected]);

  // Обработка прокрутки при загрузке сообщений
  useEffect(() => {
    const messagesDiv = messagesDivRef.current;

    if (messagesDiv) {
      if (loadingMore) {
        // Сохраняем текущее положение прокрутки перед загрузкой дополнительных сообщений
        setLastScrollHeight(messagesDiv.scrollHeight);
      } else if (lastScrollHeight > 0) {
        // После загрузки сохраняем относительное положение прокрутки
        messagesDiv.scrollTop = messagesDiv.scrollHeight - lastScrollHeight;
        setLastScrollHeight(0);
      } else if (initialLoadComplete && !loadingMore) {
        // Прокручиваем вниз только при первоначальной загрузке или при новых сообщениях
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages, loadingMore, lastScrollHeight, initialLoadComplete]);

  // Выбор чата
  const handleChatSelect = useCallback(
    (chatRoomId) => {
      if (currentChatRoomId !== chatRoomId && chatRooms) {
        setCurrentChatRoomId(chatRoomId);
        const selectedRoom = chatRooms.find(
          (room) => room && room.id === chatRoomId
        );
        setCurrentChatRoom(selectedRoom || null);
        setMessages([]);
        if (chatService && typeof chatService.joinRoom === "function") {
          chatService.joinRoom(chatRoomId);
        }
      }
    },
    [currentChatRoomId, chatRooms, chatService]
  );

  // Загрузка предыдущих сообщений
  const handleLoadMoreMessages = useCallback(async () => {
    if (currentChatRoomId && messages && messages.length > 0 && !loadingMore) {
      try {
        setLoadingMore(true);

        const response = await fetch(
          `${
            process.env.REACT_APP_API_URL
          }/api/PaginatedMessages/room/${currentChatRoomId}?page=${
            Math.floor(messages.length / 20) + 1
          }&pageSize=20`
        );

        if (!response.ok) {
          throw new Error("Failed to load more messages");
        }

        const data = await response.json();

        if (data.items && data.items.length > 0) {
          setMessages((prev) => [...data.items, ...prev]);
        }
      } catch (error) {
        console.error("Failed to load more messages:", error);
      } finally {
        setLoadingMore(false);
      }
    }
  }, [currentChatRoomId, messages, loadingMore]);

  // Отправка сообщения
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageText.trim() || !currentChatRoomId || !isConnected) return;

    // Запоминаем текст сообщения перед очисткой поля ввода
    const message = messageText.trim();
    setMessageText("");

    try {
      setSendingMessage(true);
      await chatService.sendMessage(currentChatRoomId, message);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Восстанавливаем текст сообщения, если произошла ошибка
      setMessageText(message);
    } finally {
      setSendingMessage(false);
    }
  };

  // Повторная попытка подключения при ошибке
  const retryConnection = useCallback(() => {
    setRetryCount((prevCount) => prevCount + 1);
  }, []);

  // Форматирование времени и даты
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "";
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString();
    } catch (e) {
      return "";
    }
  };

  // Проверка дат сообщений
  const isSameDay = (current, previous) => {
    if (!current || !previous) return false;

    try {
      const currentDate = new Date(current);
      const previousDate = new Date(previous);

      return (
        currentDate.getFullYear() === previousDate.getFullYear() &&
        currentDate.getMonth() === previousDate.getMonth() &&
        currentDate.getDate() === previousDate.getDate()
      );
    } catch (e) {
      return false;
    }
  };

  // Фильтрация чатов по поисковому запросу
  const filteredChatRooms = chatRooms
    ? chatRooms.filter((room) => {
        if (!room) return false;

        // Адаптация к структуре API - проверка обоих вариантов
        const userName = (room.userName || room.user?.name || "").toLowerCase();
        const userNickname = (room.user?.nickname || "").toLowerCase();
        const messageText = (room.lastMessage?.message || "").toLowerCase();

        return (
          userName.includes(searchTerm.toLowerCase()) ||
          userNickname.includes(searchTerm.toLowerCase()) ||
          messageText.includes(searchTerm.toLowerCase())
        );
      })
    : [];

  // Проверка доступа
  if (!user || user.role !== "admin") {
    return (
      <div className="admin-restricted">Доступ только для администраторов</div>
    );
  }

  // Отображение ошибки подключения
  if (connectionError) {
    return (
      <div className="chat-support__connection-error">
        <div className="chat-support__error-icon">
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <h3>Ошибка подключения</h3>
        <p>{connectionError}</p>
        <button onClick={retryConnection}>
          <i className="fas fa-sync-alt"></i> Повторить попытку
        </button>
      </div>
    );
  }

  return (
    <div className="chat-support">
      <div className="chat-support__sidebar">
        <div className="chat-support__search">
          <input
            type="text"
            placeholder="Поиск пользователей..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="fas fa-search"></i>
        </div>

        <div className="chat-support__connection-status">
          <span
            className={`chat-support__status-indicator ${
              isConnected ? "connected" : "disconnected"
            }`}
          ></span>
          <span className="chat-support__status-text">
            {isConnected ? "Подключено" : "Отключено"}
          </span>
        </div>

        <div className="chat-support__users">
          {loading && (!filteredChatRooms || filteredChatRooms.length === 0) ? (
            <div className="chat-support__loading">Загрузка чатов...</div>
          ) : !filteredChatRooms || filteredChatRooms.length === 0 ? (
            <div className="chat-support__no-chats">
              {searchTerm
                ? "Нет чатов, соответствующих поиску"
                : "Нет активных чатов"}
            </div>
          ) : (
            filteredChatRooms.map((room) => {
              if (!room) return null;

              return (
                <div
                  key={room.id}
                  className={`chat-support__user ${
                    currentChatRoomId === room.id ? "active" : ""
                  }`}
                  onClick={() => handleChatSelect(room.id)}
                >
                  <div className="chat-support__user-avatar">
                    {(
                      (
                        room.userName ||
                        room.user?.name ||
                        room.user?.nickname ||
                        "U"
                      ).charAt(0) || "U"
                    ).toUpperCase()}
                  </div>
                  <div className="chat-support__user-info">
                    <div className="chat-support__user-name">
                      {room.user?.nickname ||
                        room.userName ||
                        room.user?.name ||
                        "Неизвестный пользователь"}
                    </div>
                    {room.lastMessage && room.lastMessage.message && (
                      <div className="chat-support__last-message">
                        {room.lastMessage.message.length > 30
                          ? `${room.lastMessage.message.substring(0, 30)}...`
                          : room.lastMessage.message}
                      </div>
                    )}
                  </div>
                  <div className="chat-support__message-meta">
                    <div className="chat-support__message-time">
                      {room.lastMessage && room.lastMessage.timestamp
                        ? formatTime(room.lastMessage.timestamp)
                        : room.createdAt
                        ? formatDate(room.createdAt)
                        : ""}
                    </div>
                    {room.lastMessage &&
                      room.lastMessage.senderId &&
                      user &&
                      room.lastMessage.senderId !== user.id &&
                      room.lastMessage.status !== "Read" && (
                        <div className="chat-support__unread-indicator"></div>
                      )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="chat-support__main">
        {!currentChatRoomId ? (
          <div className="chat-support__no-chat-selected">
            <div className="chat-support__no-chat-icon">
              <i className="fas fa-comments"></i>
            </div>
            <h3>Выберите чат</h3>
            <p>Выберите чат из списка слева, чтобы начать общение</p>
          </div>
        ) : (
          <>
            <div className="chat-support__header">
              {currentChatRoom && (
                <>
                  <div className="chat-support__user-avatar">
                    {(
                      (
                        currentChatRoom.userName ||
                        currentChatRoom.user?.name ||
                        currentChatRoom.user?.nickname ||
                        "U"
                      ).charAt(0) || "U"
                    ).toUpperCase()}
                  </div>
                  <div className="chat-support__user-info">
                    <div className="chat-support__user-name">
                      {currentChatRoom.user?.nickname ||
                        currentChatRoom.userName ||
                        currentChatRoom.user?.name ||
                        "Неизвестный пользователь"}
                    </div>
                    <div className="chat-support__user-email">
                      {currentChatRoom.user?.email ||
                        currentChatRoom.userEmail ||
                        "Нет email"}
                    </div>
                  </div>
                  <div className="chat-support__user-status">
                    <span
                      className={`status-indicator ${
                        isConnected ? "online" : "offline"
                      }`}
                    ></span>
                    {isConnected ? "Онлайн" : "Офлайн"}
                  </div>
                </>
              )}
            </div>

            <div className="chat-support__messages" ref={messagesDivRef}>
              {loading ? (
                <div className="chat-support__loading-messages">
                  <div className="chat-support__loading-spinner"></div>
                  <p>Загрузка сообщений...</p>
                </div>
              ) : !messages || messages.length === 0 ? (
                <div className="chat-support__no-messages">
                  <p>Начните общение с пользователем</p>
                </div>
              ) : (
                <>
                  {messages && messages.length >= 20 && (
                    <div className="chat-support__load-more">
                      <button
                        onClick={handleLoadMoreMessages}
                        disabled={loadingMore}
                        className={loadingMore ? "loading" : ""}
                      >
                        {loadingMore ? (
                          <>
                            <span className="chat-support__loading-dots"></span>
                            Загрузка...
                          </>
                        ) : (
                          "Загрузить предыдущие сообщения"
                        )}
                      </button>
                    </div>
                  )}

                  {messages &&
                    messages.map((message, index) => {
                      if (!message) return null;

                      const isCurrentUserMessage =
                        message && user && message.senderId === user.id;
                      const previousMessage =
                        index > 0 && messages ? messages[index - 1] : null;
                      const showDateSeparator =
                        message &&
                        message.timestamp &&
                        !isSameDay(
                          message.timestamp,
                          previousMessage?.timestamp
                        );

                      return (
                        <React.Fragment key={message.id || index}>
                          {showDateSeparator && message.timestamp && (
                            <div className="chat-support__date-separator">
                              <span>{formatDate(message.timestamp)}</span>
                            </div>
                          )}

                          <div
                            className={`chat-support__message ${
                              isCurrentUserMessage ? "outgoing" : "incoming"
                            }`}
                          >
                            {!isCurrentUserMessage && currentChatRoom && (
                              <div className="chat-support__message-avatar">
                                {(
                                  (
                                    currentChatRoom.userName ||
                                    currentChatRoom.user?.name ||
                                    currentChatRoom.user?.nickname ||
                                    "U"
                                  ).charAt(0) || "U"
                                ).toUpperCase()}
                              </div>
                            )}

                            <div className="chat-support__message-content">
                              <div className="chat-support__message-text">
                                {message.message || ""}
                              </div>
                              <div className="chat-support__message-time">
                                {message.timestamp
                                  ? formatTime(message.timestamp)
                                  : ""}
                                {isCurrentUserMessage && message.status && (
                                  <span
                                    className={`message-status ${message.status.toLowerCase()}`}
                                  >
                                    {message.status === "Sent" && (
                                      <i className="fas fa-check"></i>
                                    )}
                                    {message.status === "Delivered" && (
                                      <i className="fas fa-check-double"></i>
                                    )}
                                    {message.status === "Read" && (
                                      <i className="fas fa-check-double read"></i>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <form className="chat-support__input" onSubmit={handleSendMessage}>
              <textarea
                placeholder="Введите сообщение..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                disabled={!isConnected || sendingMessage}
              />
              <button
                type="submit"
                disabled={!isConnected || !messageText.trim() || sendingMessage}
                className={sendingMessage ? "sending" : ""}
              >
                {sendingMessage ? (
                  <div className="chat-support__sending-indicator"></div>
                ) : (
                  <i className="fas fa-paper-plane"></i>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatSupport;
