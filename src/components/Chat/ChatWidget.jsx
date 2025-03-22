import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/authSlice";
import { useSignalR } from "../../contexts/SignalRContext";
import "./ChatWidget.scss";

const ChatWidget = () => {
  const user = useSelector(selectUser);
  const { isConnected, connectionError, chatService } = useSignalR();

  const [messages, setMessages] = useState([]);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [creatingNewChat, setCreatingNewChat] = useState(false);
  const [userRooms, setUserRooms] = useState([]);
  const [lastScrollHeight, setLastScrollHeight] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesDivRef = useRef(null);

  useEffect(() => {
    const loadUserRooms = async () => {
      if (!user || !user.id || !isConnected) return;

      try {
        setLoading(true);
        const rooms = await chatService.getUserChatRooms(user.id);
        setUserRooms(rooms);

        if (rooms.length > 0 && !currentRoomId) {
          setCurrentRoomId(rooms[0].id);
          setCurrentRoom(rooms[0]);
          await chatService.joinRoom(rooms[0].id);
        }

        setInitialLoadComplete(true);
      } catch (error) {
        console.error("Failed to load user rooms:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isConnected && user) {
      loadUserRooms();
    }
  }, [isConnected, user, currentRoomId, chatService]);

  // Обработка сообщений SignalR
  useEffect(() => {
    if (!isConnected) return;

    const handleReceiveMessage = (message) => {
      setMessages((prev) => {
        const exists = prev.some((msg) => msg.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });

      if (!isOpen && message.senderId !== user.id) {
        setHasNewMessages(true);
      }
    };

    const handleReceiveMessageHistory = (roomId, messageHistory) => {
      if (roomId === currentRoomId) {
        setMessages(messageHistory);
      }
    };

    const handleMessagesRead = (roomId, messageIds, userId) => {
      if (roomId === currentRoomId && userId !== user.id) {
        setMessages((prev) =>
          prev.map((msg) =>
            messageIds.includes(msg.id) ? { ...msg, status: "Read" } : msg
          )
        );
      }
    };

    const handleRoomCreated = (roomId) => {
      setCurrentRoomId(roomId);
      chatService.joinRoom(roomId);
    };

    // Регистрация обработчиков событий
    chatService.on("ReceiveMessage", handleReceiveMessage);
    chatService.on("ReceiveMessageHistory", handleReceiveMessageHistory);
    chatService.on("MessagesRead", handleMessagesRead);
    chatService.on("RoomCreated", handleRoomCreated);

    return () => {
      // Удаление обработчиков при размонтировании
      chatService.off("ReceiveMessage", handleReceiveMessage);
      chatService.off("ReceiveMessageHistory", handleReceiveMessageHistory);
      chatService.off("MessagesRead", handleMessagesRead);
      chatService.off("RoomCreated", handleRoomCreated);
    };
  }, [isConnected, currentRoomId, isOpen, user, chatService]);

  // Обновление статуса сообщений при открытии чата
  useEffect(() => {
    const updateMessageStatuses = async () => {
      if (
        !isConnected ||
        !isOpen ||
        !currentRoomId ||
        !user ||
        messages.length === 0
      )
        return;

      const unreadMessages = messages.filter(
        (msg) => msg.senderId !== user.id && msg.status !== "Read"
      );

      if (unreadMessages.length > 0) {
        // Обновляем статус каждого непрочитанного сообщения
        for (const msg of unreadMessages) {
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
        }
      }
    };

    updateMessageStatuses();
  }, [messages, currentRoomId, isOpen, user, isConnected]);

  // Обработка прокрутки при загрузке сообщений
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

  // Создание нового чата и отправка первого сообщения
  const createNewChatAndSendMessage = async (message) => {
    try {
      setCreatingNewChat(true);
      console.log("Creating new chat with message:", message);

      if (!user || !user.id) {
        throw new Error("User not available");
      }

      try {
        console.log("Authenticating user:", user.id);
        await chatService.authenticateUser({
          Id: user.id,
          Email: user.email,
          Name: user.name,
          Nickname: user.nickname,
          Role: user.role || "user",
        });
        console.log("User authenticated successfully");
      } catch (authError) {
        console.warn("User authentication error:", authError);
      }

      console.log("Fetching admin users");
      const users = await fetch(
        `${
          process.env.REACT_APP_API_URL ||
          "https://chat-service-dev.azurewebsites.net"
        }/api/Users`
      )
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch users: ${res.status}`);
          }
          return res.json();
        })
        .catch((error) => {
          console.error("Error fetching users:", error);
          return [];
        });

      const admins = users.filter((u) => u.role === "admin");
      console.log(`Found ${admins.length} admins`);

      if (admins.length === 0) {
        throw new Error("No available administrators for chat creation");
      }

      const adminId = admins[0].id;
      console.log("Selected admin:", adminId);

      try {
        console.log("Creating chat room via API");
        const newRoom = await chatService.createChatRoom(
          adminId,
          user.id,
          user.nickname
        );
        console.log("Chat room created:", newRoom);

        // Обновляем список чатов
        const updatedRooms = await chatService.getUserChatRooms(user.id);
        console.log("Updated rooms:", updatedRooms);
        setUserRooms(Array.isArray(updatedRooms) ? updatedRooms : []);

        setCurrentRoomId(newRoom.id);
        setCurrentRoom(newRoom);

        await chatService.joinRoom(newRoom.id);

        await chatService.sendMessage(newRoom.id, message);
        console.log("Message sent successfully");

        return true;
      } catch (apiError) {
        console.error(
          "Failed to create chat via API, trying SignalR:",
          apiError
        );

        try {
          const roomId = await chatService.createRoom(user.id);
          console.log("Chat room created via SignalR:", roomId);

          await chatService.joinRoom(roomId);

          setCurrentRoomId(roomId);

          await chatService.sendMessage(roomId, message);
          console.log("Message sent successfully via SignalR");

          return true;
        } catch (signalRError) {
          console.error("SignalR chat creation also failed:", signalRError);
          throw new Error("Failed to create chat room through any method");
        }
      }
    } catch (error) {
      console.error("Failed to create new chat:", error);
      throw error;
    } finally {
      setCreatingNewChat(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (
      !messageText.trim() ||
      !isConnected ||
      sendingMessage ||
      creatingNewChat
    )
      return;

    const message = messageText.trim();
    setMessageText("");

    try {
      setSendingMessage(true);

      if (!currentRoomId) {
        await createNewChatAndSendMessage(message);
      } else {
        await chatService.sendMessage(currentRoomId, message);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessageText(message);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleLoadMoreMessages = useCallback(async () => {
    if (currentRoomId && messages.length > 0 && !loadingMore) {
      try {
        setLoadingMore(true);

        const response = await fetch(
          `${
            process.env.REACT_APP_API_URL
          }/api/PaginatedMessages/room/${currentRoomId}?page=${
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
  }, [currentRoomId, messages.length, loadingMore]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

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
            <p>{connectionError}</p>
            <button onClick={() => window.location.reload()}>
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
          {currentRoom && currentRoom.admin && (
            <div className="user-chat__admin-info">
              <span className="user-chat__admin-label">Ваш консультант:</span>
              <span className="user-chat__admin-name">
                {currentRoom.admin.name}
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
          ) : !currentRoomId && userRooms.length === 0 ? (
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
                          {msg.senderName?.charAt(0).toUpperCase() || "A"}
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
              !currentRoomId
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
