import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUserChatRooms,
  initializeSignalR,
  joinChatRoomSignalR,
  sendMessageSignalR,
  updateMessageStatusSignalR,
  setCurrentChatRoom,
  loadMoreMessagesSignalR,
  clearChat,
  checkConnectionStatus,
  cleanupChat,
} from "../store/slices/chatSlice";
import "../scss/admin/_chatSupport.scss";

const ChatSupport = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    chatRooms,
    currentChatRoom,
    currentChatRoomId,
    messages,
    isConnected,
    connectionState,
    loading,
    sendingMessage,
    loadingMore,
    error,
  } = useSelector((state) => state.chat);

  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef(null);
  const messagesDivRef = useRef(null);
  const [connectionError, setConnectionError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastScrollHeight, setLastScrollHeight] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Инициализация подключения при первой загрузке
  useEffect(() => {
    if (user && user.role === "admin") {
      setConnectionError(false);

      dispatch(initializeSignalR(user.id))
        .unwrap()
        .then(() => {
          dispatch(fetchUserChatRooms(user.id));
          setInitialLoadComplete(true);
        })
        .catch((error) => {
          console.error("Failed to initialize SignalR:", error);
          setConnectionError(true);
        });
    }

    return () => {
      if (isConnected) {
        dispatch(cleanupChat());
      }
    };
  }, [user, dispatch, retryCount]);

  // Присоединение к комнате чата после установки соединения
  useEffect(() => {
    if (isConnected && currentChatRoomId) {
      dispatch(
        joinChatRoomSignalR({ userId: user.id, chatRoomId: currentChatRoomId })
      );
    }
  }, [isConnected, currentChatRoomId, user, dispatch]);

  // Обновление статуса сообщений после их загрузки
  useEffect(() => {
    if (messages.length > 0 && currentChatRoomId && isConnected) {
      const unreadMessages = messages.filter(
        (msg) => msg.senderId !== user.id && msg.status !== "Read"
      );

      if (unreadMessages.length > 0) {
        unreadMessages.forEach((msg) => {
          dispatch(
            updateMessageStatusSignalR({ messageId: msg.id, status: "Read" })
          );
        });
      }
    }
  }, [messages, currentChatRoomId, user, dispatch, isConnected]);

  // Обработка прокрутки при загрузке новых сообщений
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

  // Периодическая проверка статуса соединения
  useEffect(() => {
    if (user && user.role === "admin" && isConnected) {
      dispatch(checkConnectionStatus());

      const intervalId = setInterval(() => {
        dispatch(checkConnectionStatus());
      }, 30000);

      return () => clearInterval(intervalId);
    }
  }, [user, isConnected, dispatch]);

  // Обработка отправки сообщения
  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!messageText.trim() || !currentChatRoomId || !isConnected) return;

    // Запоминаем текст сообщения перед очисткой поля ввода
    const message = messageText.trim();
    setMessageText("");

    dispatch(
      sendMessageSignalR({
        userId: user.id,
        chatRoomId: currentChatRoomId,
        message: message,
      })
    ).catch((error) => {
      console.error("Failed to send message:", error);
      // В случае ошибки можно показать уведомление пользователю
    });
  };

  // Выбор чата
  const handleChatSelect = useCallback(
    (chatRoomId) => {
      if (currentChatRoomId !== chatRoomId) {
        dispatch(setCurrentChatRoom(chatRoomId));
      }
    },
    [currentChatRoomId, dispatch]
  );

  // Загрузка предыдущих сообщений
  const handleLoadMoreMessages = useCallback(() => {
    if (currentChatRoomId && messages.length > 0 && !loadingMore) {
      dispatch(
        loadMoreMessagesSignalR({
          userId: user.id,
          chatRoomId: currentChatRoomId,
          offset: messages.length,
        })
      );
    }
  }, [currentChatRoomId, messages.length, loadingMore, user, dispatch]);

  // Повторная попытка подключения при ошибке
  const retryConnection = useCallback(() => {
    setRetryCount((prevCount) => prevCount + 1);
  }, []);

  // Форматирование времени
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Форматирование даты
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  // Проверка, отображается ли сообщение в тот же день, что и предыдущее
  const isSameDay = (current, previous) => {
    if (!previous) return false;

    const currentDate = new Date(current);
    const previousDate = new Date(previous);

    return (
      currentDate.getFullYear() === previousDate.getFullYear() &&
      currentDate.getMonth() === previousDate.getMonth() &&
      currentDate.getDate() === previousDate.getDate()
    );
  };

  // Фильтрация чатов по поисковому запросу
  const filteredChatRooms = chatRooms.filter(
    (room) =>
      room.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.user.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (room.lastMessage &&
        room.lastMessage.message
          .toLowerCase()
          .includes(searchTerm.toLowerCase()))
  );

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
        <p>Не удалось установить соединение с сервером чата</p>
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
          {loading && filteredChatRooms.length === 0 ? (
            <div className="chat-support__loading">Загрузка чатов...</div>
          ) : filteredChatRooms.length === 0 ? (
            <div className="chat-support__no-chats">
              {searchTerm
                ? "Нет чатов, соответствующих поиску"
                : "Нет активных чатов"}
            </div>
          ) : (
            filteredChatRooms.map((room) => (
              <div
                key={room.id}
                className={`chat-support__user ${
                  currentChatRoomId === room.id ? "active" : ""
                }`}
                onClick={() => handleChatSelect(room.id)}
              >
                <div className="chat-support__user-avatar">
                  {room.user.nickname.charAt(0).toUpperCase()}
                </div>
                <div className="chat-support__user-info">
                  <div className="chat-support__user-name">
                    {room.user.nickname || room.user.name}
                  </div>
                  {room.lastMessage && (
                    <div className="chat-support__last-message">
                      {room.lastMessage.message.length > 30
                        ? `${room.lastMessage.message.substring(0, 30)}...`
                        : room.lastMessage.message}
                    </div>
                  )}
                </div>
                <div className="chat-support__message-meta">
                  <div className="chat-support__message-time">
                    {room.lastMessage
                      ? formatTime(room.lastMessage.timestamp)
                      : formatDate(room.createdAt)}
                  </div>
                  {room.lastMessage &&
                    room.lastMessage.senderId !== user.id &&
                    room.lastMessage.status !== "Read" && (
                      <div className="chat-support__unread-indicator"></div>
                    )}
                </div>
              </div>
            ))
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
                    {currentChatRoom.user.nickname.charAt(0).toUpperCase()}
                  </div>
                  <div className="chat-support__user-info">
                    <div className="chat-support__user-name">
                      {currentChatRoom.user.nickname ||
                        currentChatRoom.user.name}
                    </div>
                    <div className="chat-support__user-email">
                      {currentChatRoom.user.email}
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
              ) : messages.length === 0 ? (
                <div className="chat-support__no-messages">
                  <p>Начните общение с пользователем</p>
                </div>
              ) : (
                <>
                  {messages.length >= 50 && (
                    <div className="chat-support__load-more">
                      <button
                        onClick={handleLoadMoreMessages}
                        disabled={loadingMore}
                      >
                        {loadingMore ? (
                          <>
                            <div className="chat-support__loading-spinner small"></div>
                            <span>Загрузка...</span>
                          </>
                        ) : (
                          "Загрузить предыдущие сообщения"
                        )}
                      </button>
                    </div>
                  )}

                  {messages.map((msg, index) => {
                    const isSentByMe = msg.senderId === user.id;
                    const prevMsg = index > 0 ? messages[index - 1] : null;
                    const showDateHeader = !isSameDay(
                      msg.timestamp,
                      prevMsg?.timestamp
                    );
                    const isConsecutive =
                      prevMsg &&
                      prevMsg.senderId === msg.senderId &&
                      !showDateHeader;

                    return (
                      <React.Fragment key={msg.id}>
                        {showDateHeader && (
                          <div className="chat-support__date-header">
                            {new Date(msg.timestamp).toLocaleDateString()}
                          </div>
                        )}
                        <div
                          className={`chat-support__message-container ${
                            isSentByMe ? "sent" : "received"
                          } ${isConsecutive ? "consecutive" : ""}`}
                        >
                          {!isSentByMe && !isConsecutive && (
                            <div className="chat-support__message-avatar">
                              {msg.senderName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="chat-support__message-wrapper">
                            {!isConsecutive && !isSentByMe && (
                              <div className="chat-support__message-sender">
                                {msg.senderName}
                              </div>
                            )}
                            <div className="chat-support__message">
                              <div className="chat-support__message-content">
                                {msg.message}
                              </div>
                              <div className="chat-support__message-meta">
                                <span className="chat-support__message-time">
                                  {formatTime(msg.timestamp)}
                                </span>
                                {isSentByMe && (
                                  <span className="chat-support__message-status">
                                    {msg.status === "Sent" && (
                                      <i className="fas fa-check"></i>
                                    )}
                                    {msg.status === "Delivered" && (
                                      <i className="fas fa-check-double"></i>
                                    )}
                                    {msg.status === "Read" && (
                                      <i className="fas fa-check-double read"></i>
                                    )}
                                  </span>
                                )}
                              </div>
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

            <form
              className="chat-support__input-form"
              onSubmit={handleSendMessage}
            >
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Введите сообщение..."
                disabled={!isConnected || loading}
              />
              <button
                type="submit"
                disabled={
                  !messageText.trim() ||
                  !isConnected ||
                  loading ||
                  sendingMessage
                }
                className={sendingMessage ? "sending" : ""}
              >
                {sendingMessage ? (
                  <div className="chat-support__loading-spinner small"></div>
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
