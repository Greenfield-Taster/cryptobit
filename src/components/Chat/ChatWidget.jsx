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
} from "../../store/slices/chatSlice";
import ChatService from "../../services/chat.service";
import "./ChatWidget.scss";

const ChatWidget = () => {
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
  const messagesEndRef = useRef(null);
  const messagesDivRef = useRef(null);
  const [connectionError, setConnectionError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [lastScrollHeight, setLastScrollHeight] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [creatingNewChat, setCreatingNewChat] = useState(false);

  // Инициализация подключения при первой загрузке
  useEffect(() => {
    if (user && user.role !== "admin") {
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

  // Обновление статуса сообщений и отслеживание новых сообщений
  useEffect(() => {
    if (messages.length > 0 && currentChatRoomId) {
      const hasUnread = messages.some(
        (msg) => msg.senderId !== user.id && msg.status !== "Read"
      );

      // Если чат закрыт и есть непрочитанные сообщения, показываем индикатор
      if (!isOpen && hasUnread) {
        setHasNewMessages(true);
      }

      // Если чат открыт, помечаем все сообщения как прочитанные
      if (isOpen && isConnected) {
        messages.forEach((msg) => {
          if (msg.senderId !== user.id && msg.status !== "Read") {
            dispatch(
              updateMessageStatusSignalR({ messageId: msg.id, status: "Read" })
            );
          }
        });
        setHasNewMessages(false);
      }
    }
  }, [messages, currentChatRoomId, user, dispatch, isOpen, isConnected]);

  // Автоматический выбор первого чата при загрузке
  useEffect(() => {
    if (chatRooms.length > 0 && !currentChatRoomId) {
      dispatch(setCurrentChatRoom(chatRooms[0].id));
    }
  }, [chatRooms, currentChatRoomId, dispatch]);

  // Обработка прокрутки при загрузке новых сообщений
  useEffect(() => {
    const messagesDiv = messagesDivRef.current;

    if (messagesDiv && isOpen) {
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
  }, [messages, loadingMore, lastScrollHeight, initialLoadComplete, isOpen]);

  // Периодическая проверка статуса соединения
  useEffect(() => {
    if (user && user.role !== "admin" && isConnected) {
      dispatch(checkConnectionStatus());

      const intervalId = setInterval(() => {
        dispatch(checkConnectionStatus());
      }, 30000);

      return () => clearInterval(intervalId);
    }
  }, [user, isConnected, dispatch]);

  // Создание нового чата и отправка первого сообщения
  const createNewChatAndSendMessage = async (message) => {
    try {
      setCreatingNewChat(true);

      // Получаем список админов
      const users = await ChatService.getAllUsers();
      const admins = users.filter((user) => user.role === "admin");

      if (admins.length === 0) {
        throw new Error("Нет доступных администраторов для создания чата");
      }

      // Берем первого админа из списка для создания чата
      const adminId = admins[0].id;

      // Создаем новый чат-рум
      const newChatRoom = await ChatService.createChatRoom(adminId, user.id);

      // Обновляем список чатов
      await dispatch(fetchUserChatRooms(user.id));

      // Устанавливаем новый чат как текущий
      dispatch(setCurrentChatRoom(newChatRoom.id));

      // Присоединяемся к новому чату
      await dispatch(
        joinChatRoomSignalR({ userId: user.id, chatRoomId: newChatRoom.id })
      ).unwrap();

      // Отправляем первое сообщение
      await dispatch(
        sendMessageSignalR({
          userId: user.id,
          chatRoomId: newChatRoom.id,
          message: message,
        })
      ).unwrap();

      return true;
    } catch (error) {
      console.error("Failed to create new chat:", error);
      throw error;
    } finally {
      setCreatingNewChat(false);
    }
  };

  // Обработка отправки сообщения
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (
      !messageText.trim() ||
      !isConnected ||
      sendingMessage ||
      creatingNewChat
    )
      return;

    // Запоминаем текст сообщения перед очисткой поля ввода
    const message = messageText.trim();
    setMessageText("");

    try {
      // Если нет активного чата, создаем новый
      if (!currentChatRoomId) {
        await createNewChatAndSendMessage(message);
      } else {
        // Иначе отправляем сообщение в текущий чат
        await dispatch(
          sendMessageSignalR({
            userId: user.id,
            chatRoomId: currentChatRoomId,
            message: message,
          })
        ).unwrap();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Восстанавливаем текст сообщения, если произошла ошибка
      setMessageText(message);
    }
  };

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

  // Открытие/закрытие чата
  const toggleChat = useCallback(() => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasNewMessages(false);
      // При открытии чата прокручиваем к последнему сообщению
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  }, [isOpen]);

  // Закрытие чата
  const closeChat = useCallback(() => {
    setIsOpen(false);
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

  // Отображение ошибки подключения
  if (connectionError) {
    return (
      <div className="user-chat-container">
        <div
          className={`user-chat-toggle ${hasNewMessages ? "new-message" : ""}`}
          onClick={toggleChat}
        >
          <i className={`fas ${isOpen ? "fa-times" : "fa-comments"}`}></i>
        </div>
        <div className={`user-chat ${isOpen ? "visible" : "hidden"}`}>
          <div className="user-chat__header">
            <h3>Чат с поддержкой</h3>
            <div className="user-chat__close" onClick={closeChat}>
              <i className="fas fa-times"></i>
            </div>
          </div>
          <div className="user-chat__connection-error">
            <div className="user-chat__error-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3>Ошибка подключения</h3>
            <p>Не удалось установить соединение с сервером чата</p>
            <button onClick={retryConnection}>
              <i className="fas fa-sync-alt"></i> Повторить попытку
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-chat-container">
      <div
        className={`user-chat-toggle ${hasNewMessages ? "new-message" : ""}`}
        onClick={toggleChat}
      >
        <i className={`fas ${isOpen ? "fa-times" : "fa-comments"}`}></i>
        {hasNewMessages && <span className="user-chat-badge"></span>}
      </div>

      <div className={`user-chat ${isOpen ? "visible" : "hidden"}`}>
        <div className="user-chat__header">
          <h3>Чат с поддержкой</h3>
          {currentChatRoom && currentChatRoom.admin && (
            <div className="user-chat__admin-info">
              <span className="user-chat__admin-label">Ваш консультант:</span>
              <span className="user-chat__admin-name">
                {currentChatRoom.admin.name}
              </span>
            </div>
          )}
          <div className="user-chat__close" onClick={closeChat}>
            <i className="fas fa-times"></i>
          </div>
        </div>

        <div className="user-chat__messages" ref={messagesDivRef}>
          {loading ? (
            <div className="user-chat__loading">
              <div className="user-chat__loading-spinner"></div>
              <p>Загрузка сообщений...</p>
            </div>
          ) : !currentChatRoomId && chatRooms.length === 0 ? (
            <div className="user-chat__new-chat">
              <div className="user-chat__welcome-message">
                <div className="user-chat__welcome-icon">
                  <i className="fas fa-comments"></i>
                </div>
                <h3>Добро пожаловать в чат поддержки</h3>
                <p>
                  Напишите ваше сообщение, и мы ответим вам в ближайшее время
                </p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="user-chat__empty">
              <p>Напишите сообщение, чтобы начать общение</p>
            </div>
          ) : (
            <>
              {messages.length >= 50 && (
                <div className="user-chat__load-more">
                  <button
                    onClick={handleLoadMoreMessages}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <>
                        <div className="user-chat__loading-spinner small"></div>
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
                const isAdmin = msg.senderRole === "admin";
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
                      <div className="user-chat__date-header">
                        {new Date(msg.timestamp).toLocaleDateString()}
                      </div>
                    )}
                    <div
                      className={`user-chat__message-container ${
                        isSentByMe ? "sent" : "received"
                      } ${isAdmin ? "admin" : "user"} ${
                        isConsecutive ? "consecutive" : ""
                      }`}
                    >
                      {!isSentByMe && !isConsecutive && (
                        <div className="user-chat__message-avatar admin">
                          {msg.senderName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="user-chat__message-wrapper">
                        {!isConsecutive && !isSentByMe && (
                          <div className="user-chat__message-sender">
                            {isAdmin ? "Поддержка" : msg.senderName}
                          </div>
                        )}
                        <div className="user-chat__message">
                          <div className="user-chat__message-content">
                            {msg.message}
                          </div>
                          <div className="user-chat__message-meta">
                            <span className="user-chat__message-time">
                              {formatTime(msg.timestamp)}
                            </span>
                            {isSentByMe && (
                              <span className="user-chat__message-status">
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

        <div className="user-chat__connection-status">
          <span
            className={`user-chat__status-indicator ${
              isConnected ? "connected" : "disconnected"
            }`}
          ></span>
          <span className="user-chat__status-text">
            {isConnected ? "Подключено" : "Отключено"}
          </span>
        </div>

        <form className="user-chat__input-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={
              !currentChatRoomId
                ? "Напишите ваше сообщение для создания чата..."
                : "Введите сообщение..."
            }
            disabled={
              !isConnected || loading || sendingMessage || creatingNewChat
            }
          />
          <button
            type="submit"
            disabled={
              !messageText.trim() ||
              !isConnected ||
              loading ||
              sendingMessage ||
              creatingNewChat
            }
            className={sendingMessage || creatingNewChat ? "sending" : ""}
          >
            {sendingMessage || creatingNewChat ? (
              <div className="user-chat__loading-spinner small"></div>
            ) : (
              <i className="fas fa-paper-plane"></i>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWidget;
