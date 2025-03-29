import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/authSlice";
import { useSignalR } from "../../contexts/SignalRContext";
import "./ChatWidget.scss";
import paperPlane from "../../assets/images/paper-plane.png";
import chatWidget from "../../assets/images/chat-widget.png";

const ChatWidget = () => {
  const user = useSelector(selectUser);
  const { isConnected, connectionError, chatService } = useSignalR();

  const [messages, setMessages] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
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
  const newMessagesBadgeRef = useRef(null);

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

  useEffect(() => {
    const checkUnreadMessages = async () => {
      if (!user || !user.id || !isConnected || !userRooms.length) return;

      try {
        let totalUnread = 0;

        for (const roomId of userRooms.map((room) => room.id)) {
          if (!roomId) continue;

          try {
            const response = await fetch(
              `${process.env.REACT_APP_API_URL}/api/ChatMessages/room/${roomId}`
            );

            if (!response.ok) continue;

            const roomMessages = await response.json();

            const unreadInRoom = roomMessages.filter(
              (msg) => msg.senderId !== user.id && msg.status !== "Read"
            ).length;

            totalUnread += unreadInRoom;
          } catch (roomError) {
            console.error(`Error checking room ${roomId} messages:`, roomError);
          }
        }

        setUnreadMessages(totalUnread);
        setHasNewMessages(totalUnread > 0);

        if (totalUnread > 0 && newMessagesBadgeRef.current && !isOpen) {
          newMessagesBadgeRef.current.classList.add("pulse");
          setTimeout(() => {
            if (newMessagesBadgeRef.current) {
              newMessagesBadgeRef.current.classList.remove("pulse");
            }
          }, 1000);
        }
      } catch (error) {
        console.error("Failed to check unread messages:", error);
      }
    };

    checkUnreadMessages();

    const intervalId = setInterval(checkUnreadMessages, 30000);

    return () => clearInterval(intervalId);
  }, [isConnected, user, userRooms, isOpen]);

  useEffect(() => {
    if (!isConnected) return;

    const handleReceiveMessage = (message) => {
      const normalizedMessage = {
        id: message.id || message.Id,
        message: message.message || message.Message || message.content,
        timestamp: message.timestamp || message.Timestamp,
        status: message.status || message.Status,
        roomId:
          message.roomId ||
          message.RoomId ||
          message.chatRoomId ||
          message.ChatRoomId,
        senderId:
          message.senderId ||
          message.SenderId ||
          (message.sender ? message.sender.id : null),
        sender: message.sender || message.Sender || null,
      };

      setMessages((prev) => {
        const existingMessageIndex = prev.findIndex(
          (msg) =>
            msg.id === normalizedMessage.id ||
            (msg.isPending &&
              msg.message === normalizedMessage.message &&
              msg.sender?.id === normalizedMessage.senderId)
        );

        if (existingMessageIndex !== -1) {
          return prev.map((msg, index) =>
            index === existingMessageIndex
              ? {
                  ...msg,
                  id: normalizedMessage.id || msg.id,
                  status: normalizedMessage.status || msg.status,
                  isPending: false,
                }
              : msg
          );
        }

        return [...prev, normalizedMessage];
      });

      if (
        normalizedMessage.senderId !== user.id &&
        (!isOpen || normalizedMessage.roomId !== currentRoomId)
      ) {
        setHasNewMessages(true);
        setUnreadMessages((prev) => prev + 1);

        if (newMessagesBadgeRef.current) {
          newMessagesBadgeRef.current.classList.add("pulse");
          setTimeout(() => {
            if (newMessagesBadgeRef.current) {
              newMessagesBadgeRef.current.classList.remove("pulse");
            }
          }, 1000);
        }
      }
    };

    const handleReceiveMessageHistory = (roomId, messageHistory) => {
      if (roomId === currentRoomId) {
        const normalizedMessages = Array.isArray(messageHistory)
          ? messageHistory.map((msg) => ({
              id: msg.id || msg.Id,
              message: msg.message || msg.Message || msg.content,
              timestamp: msg.timestamp || msg.Timestamp,
              status: msg.status || msg.Status,
              roomId:
                msg.roomId || msg.RoomId || msg.chatRoomId || msg.ChatRoomId,
              senderId:
                msg.senderId ||
                msg.SenderId ||
                (msg.sender ? msg.sender.id : null),
              sender: msg.sender || msg.Sender || null,
            }))
          : [];

        const uniqueMessages = [];
        const messageIds = new Set();

        for (const msg of normalizedMessages) {
          if (!messageIds.has(msg.id)) {
            messageIds.add(msg.id);
            uniqueMessages.push(msg);
          }
        }

        setMessages(uniqueMessages);

        const notFromUser = uniqueMessages.filter(
          (msg) => msg.senderId !== user.id
        );

        if (notFromUser.length > 0 && isOpen) {
          fetch(
            `${process.env.REACT_APP_API_URL}/api/ChatMessages/room/${roomId}/status`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                status: "Read",
                userId: user.id,
              }),
            }
          ).catch((error) =>
            console.error("Failed to update message statuses:", error)
          );
        }
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

    const handleMessageStatusUpdated = (messageId, status, userId) => {
      setMessages((prev) => {
        return prev.map((msg) => {
          if (msg.id === messageId) {
            return { ...msg, status: status };
          }
          return msg;
        });
      });
    };

    const handleMessagesStatusUpdated = (
      roomId,
      messageIds,
      status,
      userId
    ) => {
      if (roomId === currentRoomId) {
        setMessages((prev) =>
          prev.map((msg) =>
            messageIds.includes(msg.id) ? { ...msg, status: status } : msg
          )
        );
      }
    };

    const handleRoomCreated = (roomId) => {
      setCurrentRoomId(roomId);
      chatService.joinRoom(roomId);
    };

    chatService.on("ReceiveMessage", handleReceiveMessage);
    chatService.on("ReceiveMessageHistory", handleReceiveMessageHistory);
    chatService.on("MessagesRead", handleMessagesRead);
    chatService.on("MessageStatusUpdated", handleMessageStatusUpdated);
    chatService.on("MessagesStatusUpdated", handleMessagesStatusUpdated);
    chatService.on("RoomCreated", handleRoomCreated);

    return () => {
      chatService.off("ReceiveMessage", handleReceiveMessage);
      chatService.off("ReceiveMessageHistory", handleReceiveMessageHistory);
      chatService.off("MessagesRead", handleMessagesRead);
      chatService.off("MessageStatusUpdated", handleMessageStatusUpdated);
      chatService.off("MessagesStatusUpdated", handleMessagesStatusUpdated);
      chatService.off("RoomCreated", handleRoomCreated);
    };
  }, [isConnected, currentRoomId, isOpen, user, chatService]);

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
        (msg) => msg.sender?.id !== user.id && msg.status !== "Read"
      );

      if (unreadMessages.length > 0) {
        try {
          await fetch(
            `${process.env.REACT_APP_API_URL}/api/ChatMessages/room/${currentRoomId}/status`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                status: "Read",
                userId: user.id,
              }),
            }
          );

          setMessages((prev) =>
            prev.map((msg) =>
              msg.sender?.id !== user.id ? { ...msg, status: "Read" } : msg
            )
          );

          setUnreadMessages(0);
          setHasNewMessages(false);
        } catch (error) {
          console.error("Failed to update message statuses:", error);
        }
      }
    };

    if (isOpen) {
      updateMessageStatuses();
    }
  }, [messages, currentRoomId, isOpen, user, isConnected]);

  useEffect(() => {
    const messagesDiv = messagesDivRef.current;

    if (messagesDiv && isOpen) {
      if (loadingMore) {
        setLastScrollHeight(messagesDiv.scrollHeight);
      } else if (lastScrollHeight > 0) {
        messagesDiv.scrollTop = messagesDiv.scrollHeight - lastScrollHeight;
        setLastScrollHeight(0);
      } else if (initialLoadComplete && !loadingMore) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

        const isAtBottom =
          messagesDiv.scrollHeight -
            messagesDiv.scrollTop -
            messagesDiv.clientHeight <
          50;

        if (isAtBottom) {
          setHasNewMessages(false);
        }
      }
    }
  }, [messages, loadingMore, lastScrollHeight, initialLoadComplete, isOpen]);

  useEffect(() => {
    const messagesDiv = messagesDivRef.current;

    const handleScroll = () => {
      if (!messagesDiv) return;

      const isAtBottom =
        messagesDiv.scrollHeight -
          messagesDiv.scrollTop -
          messagesDiv.clientHeight <
        50;

      if (isAtBottom && isOpen) {
        setHasNewMessages(false);
      }
    };

    if (messagesDiv) {
      messagesDiv.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (messagesDiv) {
        messagesDiv.removeEventListener("scroll", handleScroll);
      }
    };
  }, [isOpen]);

  const toggleChat = useCallback(() => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  }, [isOpen]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const createNewChatAndSendMessage = async (message) => {
    try {
      setCreatingNewChat(true);

      if (!user || !user.id) {
        throw new Error("User not available");
      }

      try {
        await chatService.authenticateUser({
          Id: user.id,
          Email: user.email,
          Name: user.name,
          Nickname: user.nickname,
          Role: user.role || "user",
        });
      } catch (authError) {
        console.warn("User authentication error:", authError);
      }

      const users = await fetch(`${process.env.REACT_APP_API_URL}/api/Users`)
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

      if (admins.length === 0) {
        throw new Error("No available administrators for chat creation");
      }

      const adminId = admins[0].id;

      try {
        const newRoom = await chatService.createChatRoom(
          adminId,
          user.id,
          user.nickname
        );

        const updatedRooms = await chatService.getUserChatRooms(user.id);
        setUserRooms(Array.isArray(updatedRooms) ? updatedRooms : []);

        setCurrentRoomId(newRoom.id);
        setCurrentRoom(newRoom);

        await chatService.joinRoom(newRoom.id);

        await chatService.sendMessage(newRoom.id, message);

        return true;
      } catch (apiError) {
        console.error(
          "Failed to create chat via API, trying SignalR:",
          apiError
        );

        try {
          const roomId = await chatService.createRoom(user.id);

          await chatService.joinRoom(roomId);

          setCurrentRoomId(roomId);

          await chatService.sendMessage(roomId, message);

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

      const localId = `local_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`;

      const tempMessage = {
        id: localId,
        localId: localId,
        message: message,
        sender: user,
        senderId: user.id,
        timestamp: new Date().toISOString(),
        status: "Sending",
        isPending: true,
      };

      setMessages((prev) => [...prev, tempMessage]);

      await new Promise((resolve) => setTimeout(resolve, 300));

      if (!currentRoomId) {
        await createNewChatAndSendMessage(message);
      } else {
        await chatService.sendMessage(currentRoomId, message);
      }
    } catch (error) {
      console.error("Failed to send message:", error);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.isPending && msg.message === message
            ? { ...msg, status: "Error" }
            : msg
        )
      );
    } finally {
      setSendingMessage(false);
    }
  };

  const handleRetryMessage = async (msg) => {
    try {
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));

      setMessageText(msg.message);
    } catch (error) {
      console.error("Failed to retry message:", error);
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
          <img src={chatWidget} alt="chat-widget" />
        </div>
        <div className={`user-chat ${isOpen ? "visible" : "hidden"}`}>
          <div className="user-chat__header">
            <h3>Чат с поддержкой</h3>
            <div className="user-chat__close" onClick={closeChat}>
              ×
            </div>
          </div>
          <div className="user-chat__connection-error">
            <div className="user-chat__error-icon"></div>
            <h3>Ошибка подключения</h3>
            <p>{connectionError}</p>
            <button onClick={() => window.location.reload()}>
              Повторить попытку
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
        title={
          hasNewMessages
            ? `У вас ${unreadMessages} непрочитанных сообщений`
            : "Открыть чат"
        }
      >
        <img src={chatWidget} alt="chat-widget" />
        {hasNewMessages && (
          <span className="user-chat-badge" ref={newMessagesBadgeRef}>
            {unreadMessages > 0 && unreadMessages <= 99
              ? unreadMessages
              : unreadMessages > 99
              ? "99+"
              : ""}
          </span>
        )}
      </div>

      <div className={`user-chat ${isOpen ? "visible" : "hidden"}`}>
        <div className="user-chat__header">
          <h3>Чат с поддержкой</h3>

          <div className="user-chat__close" onClick={closeChat}>
            ×
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
                <div className="user-chat__welcome-icon"></div>
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
                const isDuplicate =
                  messages.findIndex((m) => m.id === msg.id) !== index;
                if (isDuplicate) return null;

                const isSentByMe =
                  msg.sender?.id === user.id || msg.senderId === user.id;
                const isAdmin = msg.sender?.role === "admin";
                const prevMsg = index > 0 ? messages[index - 1] : null;
                const showDateHeader = !isSameDay(
                  msg.timestamp,
                  prevMsg?.timestamp
                );
                const isConsecutive =
                  prevMsg &&
                  (prevMsg.sender?.id === msg.sender?.id ||
                    prevMsg.senderId === msg.senderId) &&
                  !showDateHeader;
                const isPending = msg.isPending;
                const hasError = msg.status === "Error";

                return (
                  <React.Fragment key={msg.id || index}>
                    {showDateHeader && (
                      <div className="user-chat__date-header">
                        {formatDate(msg.timestamp)}
                      </div>
                    )}
                    <div
                      className={`user-chat__message-container ${
                        isSentByMe ? "sent" : "received"
                      } ${isAdmin ? "admin" : "user"} ${
                        isConsecutive ? "consecutive" : ""
                      } ${isPending ? "pending" : ""} ${
                        hasError ? "error" : ""
                      }`}
                    >
                      {!isSentByMe && !isConsecutive && (
                        <div className="user-chat__message-avatar admin">
                          {msg.sender?.name?.charAt(0).toUpperCase() || "A"}
                        </div>
                      )}
                      <div className="user-chat__message-wrapper">
                        {!isConsecutive && !isSentByMe && (
                          <div className="user-chat__message-sender">
                            {isAdmin ? "Поддержка" : msg.sender?.name}
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
                                {hasError ? (
                                  <span
                                    className="user-chat__retry-button"
                                    onClick={() => handleRetryMessage(msg)}
                                    title="Повторить отправку"
                                  >
                                    ↻
                                  </span>
                                ) : isPending ? (
                                  "⋯"
                                ) : msg.status === "Read" ? (
                                  "✓✓"
                                ) : (
                                  "✓"
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
              <div className="paperPlane">
                <img src={paperPlane} alt="paperPlane" />
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWidget;
