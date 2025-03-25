import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
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
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesDivRef = useRef(null);
  const [retryCount, setRetryCount] = useState(0);

  const normalizeMessageFormat = useCallback((message) => {
    if (!message || typeof message !== "object") return message;

    return {
      id: message.id || message.Id,
      message: message.message || message.Message,
      timestamp: message.timestamp || message.Timestamp,
      status: message.status || message.Status,
      roomId:
        message.roomId ||
        message.RoomId ||
        message.chatRoomId ||
        message.ChatRoomId,
      senderId: message.senderId || message.SenderId,
      sender: message.sender || message.Sender || null,
    };
  }, []);

  const sortChatRooms = useCallback((rooms) => {
    if (!rooms || !Array.isArray(rooms)) return [];

    return [...rooms].sort((a, b) => {
      if (!a) return 1;
      if (!b) return -1;

      const aUnread = a.unreadCount || 0;
      const bUnread = b.unreadCount || 0;

      if (aUnread > 0 && bUnread === 0) return -1;
      if (aUnread === 0 && bUnread > 0) return 1;

      let aDate, bDate;

      try {
        aDate = new Date(a.lastMessageTimestamp || a.createdAt || 0);
        bDate = new Date(b.lastMessageTimestamp || b.createdAt || 0);
      } catch (err) {
        return 0;
      }

      return bDate - aDate;
    });
  }, []);

  const syncUnreadCountWithMessages = useCallback(
    async (roomId, forceUpdate = false) => {
      if (!roomId || !user?.id) return;

      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/ChatMessages/room/${roomId}`
        );

        if (!response.ok) {
          throw new Error(`Error loading messages: ${response.status}`);
        }

        const allMessages = await response.json();
        const unreadCount = allMessages.filter(
          (msg) => msg.senderId !== user.id && msg.status !== "Read"
        ).length;

        setChatRooms((prev) => {
          const prevRoom = prev.find((r) => r && r.id === roomId);
          const prevCount = prevRoom ? prevRoom.unreadCount || 0 : 0;

          if (
            forceUpdate ||
            unreadCount > prevCount ||
            currentChatRoomId === roomId
          ) {
            return prev.map((room) => {
              if (room && room.id === roomId) {
                if (currentChatRoomId === roomId) {
                  return { ...room, unreadCount: 0 };
                }
                return { ...room, unreadCount };
              }
              return room;
            });
          }

          return prev;
        });
      } catch (error) {
        console.log("Error", error);
      }
    },
    [currentChatRoomId, user]
  );

  const handleReceiveMessage = useCallback(
    (message) => {
      if (!message || !message.roomId) return;

      const normalizedMessage = normalizeMessageFormat(message);
      const isFromCurrentUser = normalizedMessage.senderId === user?.id;
      const shouldIncrementUnread =
        !isFromCurrentUser && currentChatRoomId !== normalizedMessage.roomId;

      setChatRooms((prev) => {
        const updatedRooms = prev.map((room) => {
          if (room && room.id === normalizedMessage.roomId) {
            let newUnreadCount = room.unreadCount || 0;

            if (shouldIncrementUnread) {
              newUnreadCount += 1;
            }

            return {
              ...room,
              lastMessageTimestamp: normalizedMessage.timestamp,
              lastMessage: {
                message: normalizedMessage.message,
                timestamp: normalizedMessage.timestamp,
              },
              unreadCount: newUnreadCount,
            };
          }
          return room;
        });

        if (
          !prev.some((room) => room && room.id === normalizedMessage.roomId)
        ) {
          if (chatService && typeof chatService.getAllChats === "function") {
            chatService
              .getAllChats()
              .catch((err) =>
                console.error("Помилка оновлення списку чатів:", err)
              );
          }
        }

        return sortChatRooms(updatedRooms);
      });

      if (normalizedMessage.roomId === currentChatRoomId) {
        setMessages((prev) => {
          const exists = prev.some(
            (msg) => msg && msg.id === normalizedMessage.id
          );
          if (exists) return prev;
          return [...prev, normalizedMessage];
        });
      }

      if (shouldIncrementUnread) {
        setTimeout(() => {
          syncUnreadCountWithMessages(normalizedMessage.roomId, true);
        }, 500);
      }
    },
    [
      currentChatRoomId,
      user,
      normalizeMessageFormat,
      sortChatRooms,
      chatService,
      syncUnreadCountWithMessages,
    ]
  );

  const handleReceiveMessageHistory = useCallback(
    (roomId, messageHistory) => {
      if (roomId !== currentChatRoomId || !messageHistory) return;

      const normalizedMessages = Array.isArray(messageHistory)
        ? messageHistory.map((msg) => normalizeMessageFormat(msg))
        : [];

      setMessages(normalizedMessages);
      setLoadingMessages(false);

      setTimeout(() => {
        if (messagesDivRef.current) {
          messagesDivRef.current.scrollTop =
            messagesDivRef.current.scrollHeight;
        }
      }, 100);
    },
    [currentChatRoomId, normalizeMessageFormat]
  );

  const handleNewRoomCreated = useCallback(
    (room) => {
      if (!room || !room.id) {
        console.warn("Отримано неправильний формат кімнати:", room);
        return;
      }

      setChatRooms((prev) => {
        if (prev.some((r) => r && r.id === room.id)) {
          return prev;
        }

        const roomWithLastMessage = {
          ...room,
          lastMessage: room.lastMessage || null,
          lastMessageTimestamp: room.lastMessageTimestamp || room.createdAt,
          unreadCount: room.unreadCount || 0,
        };

        return sortChatRooms([...prev, roomWithLastMessage]);
      });
    },
    [sortChatRooms]
  );

  const handleReceiveAllChats = useCallback(
    async (chats) => {
      if (!chats || !Array.isArray(chats)) return;

      try {
        const updatedChats = await Promise.all(
          chats.map(async (chat) => {
            if (!chat || !chat.id) return chat;

            let chatWithLastMessage = { ...chat };

            if (chat.lastMessage) {
              return chat;
            }

            if (!chat.lastMessage && chat.lastMessageTimestamp) {
              try {
                const response = await fetch(
                  `${process.env.REACT_APP_API_URL}/api/ChatMessages/room/${chat.id}?limit=1`
                );
                if (response.ok) {
                  const messages = await response.json();
                  if (messages && messages.length > 0) {
                    const lastMsg = normalizeMessageFormat(
                      messages[messages.length - 1]
                    );
                    chatWithLastMessage = {
                      ...chat,
                      lastMessage: {
                        message: lastMsg.message,
                        timestamp: lastMsg.timestamp,
                      },
                    };
                  }
                }
              } catch (e) {
                console.error(
                  `Помилка завантаження повідомлень для кімнати ${chat.id}:`,
                  e
                );
              }
            }

            return chatWithLastMessage;
          })
        );

        setChatRooms(sortChatRooms(updatedChats));
      } catch (error) {
        console.error("Помилка обробки списку чатів:", error);
      }
    },
    [sortChatRooms, normalizeMessageFormat]
  );

  const handleChatUpdated = useCallback(
    async (updatedRoom) => {
      if (!updatedRoom || !updatedRoom.id) return;

      let currentUnreadCount = 0;
      let isForceUpdateNeeded = false;

      setChatRooms((prev) => {
        const existingRoom = prev.find(
          (room) => room && room.id === updatedRoom.id
        );
        if (existingRoom) {
          currentUnreadCount = existingRoom.unreadCount || 0;

          if (
            existingRoom.lastMessageTimestamp !==
            updatedRoom.lastMessageTimestamp
          ) {
            isForceUpdateNeeded = true;
          }
        } else {
          isForceUpdateNeeded = true;
        }
        return prev;
      });

      let roomWithLastMessage = { ...updatedRoom };

      if (!updatedRoom.lastMessage && updatedRoom.lastMessageTimestamp) {
        try {
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/api/ChatMessages/room/${updatedRoom.id}?limit=1`
          );
          if (response.ok) {
            const messages = await response.json();
            if (messages && messages.length > 0) {
              const lastMsg = normalizeMessageFormat(
                messages[messages.length - 1]
              );
              roomWithLastMessage = {
                ...updatedRoom,
                lastMessage: {
                  message: lastMsg.message,
                  timestamp: lastMsg.timestamp,
                },
              };
            }
          }
        } catch (e) {
          console.error(
            `Помилка завантаження повідомлень для кімнати ${updatedRoom.id}:`,
            e
          );
        }
      }

      if (updatedRoom.unreadCount > currentUnreadCount) {
        currentUnreadCount = updatedRoom.unreadCount;
      }

      roomWithLastMessage = {
        ...roomWithLastMessage,
        unreadCount:
          currentChatRoomId === updatedRoom.id ? 0 : currentUnreadCount,
      };

      setChatRooms((prev) => {
        const exists = prev.some(
          (room) => room && room.id === roomWithLastMessage.id
        );

        if (!exists) {
          return sortChatRooms([...prev, roomWithLastMessage]);
        }

        const updated = prev.map((room) => {
          if (room && room.id === roomWithLastMessage.id) {
            if (currentChatRoomId === roomWithLastMessage.id) {
              return {
                ...roomWithLastMessage,
                unreadCount: 0,
              };
            }

            const finalUnreadCount = Math.max(
              room.unreadCount || 0,
              currentUnreadCount
            );

            return {
              ...roomWithLastMessage,
              unreadCount: finalUnreadCount,
            };
          }
          return room;
        });

        return sortChatRooms(updated);
      });

      if (currentChatRoomId === updatedRoom.id) {
        setCurrentChatRoom({
          ...roomWithLastMessage,
          unreadCount: 0,
        });
      }

      if (isForceUpdateNeeded) {
        setTimeout(() => {
          syncUnreadCountWithMessages(updatedRoom.id, true);
        }, 500);
      }
    },
    [
      currentChatRoomId,
      normalizeMessageFormat,
      sortChatRooms,
      syncUnreadCountWithMessages,
    ]
  );

  const handleMessageStatusUpdated = useCallback(
    (messageId, status, userId) => {
      setMessages((prev) => {
        return prev.map((msg) => {
          if (msg && msg.id === messageId) {
            return { ...msg, status };
          }
          return msg;
        });
      });
    },
    []
  );

  const handleMessagesStatusUpdated = useCallback(
    (roomId, messageIds, status, userId) => {
      if (roomId === currentChatRoomId) {
        setMessages((prev) => {
          return prev.map((msg) => {
            if (msg && messageIds.includes(msg.id)) {
              return { ...msg, status };
            }
            return msg;
          });
        });
      }

      if (status === "Read") {
        setChatRooms((prev) => {
          return prev.map((room) => {
            if (room && room.id === roomId) {
              return { ...room, unreadCount: 0 };
            }
            return room;
          });
        });
      }
    },
    [currentChatRoomId]
  );

  const handleMessagesRead = useCallback(
    (roomId, messageIds, userId) => {
      if (!roomId || !messageIds || !Array.isArray(messageIds)) return;

      if (userId === user?.id) {
        return;
      }

      if (roomId === currentChatRoomId) {
        setMessages((prev) => {
          return prev.map((msg) => {
            if (msg && messageIds.includes(msg.id)) {
              return { ...msg, status: "Read" };
            }
            return msg;
          });
        });
      }

      syncUnreadCountWithMessages(roomId, true);
    },
    [currentChatRoomId, user, syncUnreadCountWithMessages]
  );

  const updateMessageStatuses = useCallback(async (roomId, userId) => {
    if (!roomId || !userId) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/ChatMessages/room/${roomId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "Read", userId }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
    } catch (error) {
      console.log("Error updating message status", error);
    }
  }, []);

  useEffect(() => {
    const loadChatRooms = async () => {
      if (!isConnected || !user || user.role !== "admin" || !chatService)
        return;

      try {
        setLoading(true);

        if (typeof chatService.getAllChats === "function") {
          await chatService.getAllChats();
        }

        try {
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/api/ChatRooms/user/${user.id}`
          );
          if (response.ok) {
            const rooms = await response.json();

            if (rooms && Array.isArray(rooms)) {
              const updatedRooms = await Promise.all(
                rooms.map(async (room) => {
                  if (!room || !room.id) return room;

                  try {
                    const msgResponse = await fetch(
                      `${process.env.REACT_APP_API_URL}/api/ChatMessages/room/${room.id}?limit=1`
                    );
                    if (msgResponse.ok) {
                      const messages = await msgResponse.json();
                      const lastMsg =
                        messages.length > 0
                          ? normalizeMessageFormat(
                              messages[messages.length - 1]
                            )
                          : null;

                      return {
                        ...room,
                        lastMessage: lastMsg
                          ? {
                              message: lastMsg.message,
                              timestamp: lastMsg.timestamp,
                            }
                          : null,
                        lastMessageTimestamp: lastMsg
                          ? lastMsg.timestamp
                          : room.lastMessageTimestamp,
                      };
                    }
                  } catch (e) {
                    console.error(
                      `Помилка завантаження повідомлень для кімнати ${room.id}:`,
                      e
                    );
                  }
                  return room;
                })
              );

              setChatRooms(sortChatRooms(updatedRooms));
            }
          }
        } catch (apiError) {
          console.error("Помилка завантаження чатів через API:", apiError);
        }

        setInitialLoadComplete(true);
      } catch (error) {
        console.error("Помилка завантаження чатів:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isConnected && user && user.role === "admin") {
      loadChatRooms();
    }
  }, [isConnected, user, chatService, sortChatRooms, normalizeMessageFormat]);

  useEffect(() => {
    if (!isConnected || !chatService) return;

    chatService.on("ReceiveMessage", handleReceiveMessage);
    chatService.on("ReceiveMessageHistory", handleReceiveMessageHistory);
    chatService.on("NewRoomCreated", handleNewRoomCreated);
    chatService.on("ReceiveAllChats", handleReceiveAllChats);
    chatService.on("ChatUpdated", handleChatUpdated);
    chatService.on("MessagesRead", handleMessagesRead);
    chatService.on("MessageStatusUpdated", handleMessageStatusUpdated);
    chatService.on("MessagesStatusUpdated", handleMessagesStatusUpdated);
    chatService.on("Error", (error) => {
      console.error("Отримано помилку SignalR:", error);
    });

    return () => {
      chatService.off("ReceiveMessage", handleReceiveMessage);
      chatService.off("ReceiveMessageHistory", handleReceiveMessageHistory);
      chatService.off("NewRoomCreated", handleNewRoomCreated);
      chatService.off("ReceiveAllChats", handleReceiveAllChats);
      chatService.off("ChatUpdated", handleChatUpdated);
      chatService.off("MessagesRead", handleMessagesRead);
      chatService.off("MessageStatusUpdated", handleMessageStatusUpdated);
      chatService.off("MessagesStatusUpdated", handleMessagesStatusUpdated);
      chatService.off("Error", (error) => console.error(error));
    };
  }, [
    isConnected,
    chatService,
    handleReceiveMessage,
    handleReceiveMessageHistory,
    handleNewRoomCreated,
    handleReceiveAllChats,
    handleChatUpdated,
    handleMessagesRead,
    handleMessageStatusUpdated,
    handleMessagesStatusUpdated,
  ]);

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
        setChatRooms((prev) => {
          return prev.map((room) =>
            room && room.id === currentChatRoomId
              ? { ...room, unreadCount: 0 }
              : room
          );
        });

        updateMessageStatuses(currentChatRoomId, user.id);
      }
    }
  }, [messages, currentChatRoomId, user, isConnected, updateMessageStatuses]);

  useEffect(() => {
    const messagesDiv = messagesDivRef.current;

    if (messagesDiv) {
      if (loadingMore) {
        setLastScrollHeight(messagesDiv.scrollHeight);
      } else if (lastScrollHeight > 0) {
        const newScrollPosition = messagesDiv.scrollHeight - lastScrollHeight;
        messagesDiv.scrollTop = newScrollPosition > 0 ? newScrollPosition : 0;
        setLastScrollHeight(0);
      } else if (
        initialLoadComplete &&
        !loadingMore &&
        messages &&
        messages.length > 0 &&
        !loadingMessages
      ) {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      }
    }
  }, [
    messages,
    loadingMore,
    lastScrollHeight,
    initialLoadComplete,
    loadingMessages,
  ]);

  useEffect(() => {
    if (isConnected && chatRooms && chatRooms.length > 0 && user) {
      const checkUnreadCount = async () => {
        for (const room of chatRooms) {
          if (room && room.id) {
            await syncUnreadCountWithMessages(room.id, false);
          }
        }
      };

      checkUnreadCount();

      const intervalId = setInterval(() => {
        if (!document.hidden) {
          checkUnreadCount();
        }
      }, 30000);

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [isConnected, chatRooms.length, user, syncUnreadCountWithMessages]);

  const handleChatSelect = useCallback(
    (chatRoomId) => {
      if (currentChatRoomId === chatRoomId || !chatRooms) return;

      setCurrentChatRoomId(chatRoomId);

      const selectedRoom = chatRooms.find(
        (room) => room && room.id === chatRoomId
      );
      setCurrentChatRoom(selectedRoom || null);

      setLoadingMessages(true);
      setMessages([]);

      setChatRooms((prev) => {
        return prev.map((room) =>
          room && room.id === chatRoomId ? { ...room, unreadCount: 0 } : room
        );
      });

      if (chatService && typeof chatService.joinRoom === "function") {
        chatService
          .joinRoom(chatRoomId)
          .then(() => {
            if (user && user.id) {
              updateMessageStatuses(chatRoomId, user.id);
            }
          })
          .catch((error) => {
            console.error("Помилка приєднання до кімнати:", error);
            setLoadingMessages(false);
          });

        setTimeout(() => {
          if (loadingMessages) {
            setLoadingMessages(false);
          }
        }, 5000);
      }
    },
    [
      currentChatRoomId,
      chatRooms,
      chatService,
      loadingMessages,
      user,
      updateMessageStatuses,
    ]
  );

  const handleLoadMoreMessages = useCallback(async () => {
    if (currentChatRoomId && messages && messages.length > 0 && !loadingMore) {
      try {
        setLoadingMore(true);

        const apiUrl = `${process.env.REACT_APP_API_URL}/api/ChatMessages/room/${currentChatRoomId}?skip=${messages.length}&limit=20`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error("Error loading messages, status: " + response.status);
        }

        const data = await response.json();

        if (data && Array.isArray(data) && data.length > 0) {
          const normalizedMessages = data.map((msg) =>
            normalizeMessageFormat(msg)
          );
          setMessages((prev) => [...normalizedMessages, ...prev]);
        }
      } catch (error) {
        console.error("Помилка завантаження додаткових повідомлень:", error);
      } finally {
        setLoadingMore(false);
      }
    }
  }, [currentChatRoomId, messages, loadingMore, normalizeMessageFormat]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (
      !messageText.trim() ||
      !currentChatRoomId ||
      !isConnected ||
      !chatService
    ) {
      console.log(
        "Неможливо відправити повідомлення: текст порожній або немає з'єднання"
      );
      return;
    }

    const message = messageText.trim();
    setMessageText("");

    try {
      setSendingMessage(true);
      await chatService.sendMessage(currentChatRoomId, message);
    } catch (error) {
      console.error("Помилка відправлення повідомлення:", error);
      setMessageText(message);
    } finally {
      setSendingMessage(false);
    }
  };

  const retryConnection = useCallback(() => {
    console.log("Спроба повторного підключення...");
    setRetryCount((prevCount) => prevCount + 1);
  }, []);

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

  const filteredChatRooms = useMemo(() => {
    if (!chatRooms || !Array.isArray(chatRooms)) return [];

    return chatRooms.filter((room) => {
      if (!room) return false;
      if (!searchTerm.trim()) return true;

      const searchTermLower = searchTerm.toLowerCase();

      const userName = (room.user?.name || "").toLowerCase();
      const userNickname = (room.user?.nickname || "").toLowerCase();
      const roomName = (room.name || "").toLowerCase();

      let messageText = "";
      if (room.lastMessage) {
        if (typeof room.lastMessage === "object") {
          messageText = (room.lastMessage.message || "").toLowerCase();
        } else if (typeof room.lastMessage === "string") {
          messageText = room.lastMessage.toLowerCase();
        }
      }

      return (
        userName.includes(searchTermLower) ||
        userNickname.includes(searchTermLower) ||
        roomName.includes(searchTermLower) ||
        messageText.includes(searchTermLower)
      );
    });
  }, [chatRooms, searchTerm]);

  if (!user || user.role !== "admin") {
    return (
      <div className="admin-restricted">Доступ только для администраторов</div>
    );
  }

  if (connectionError) {
    return (
      <div className="chat-support__connection-error">
        <div className="chat-support__error-icon">
          <span className="chat-support__error-icon-symbol">!</span>
        </div>
        <h3>Ошибка подключения</h3>
        <p>{connectionError}</p>
        <button
          onClick={retryConnection}
          className="chat-support__retry-button"
        >
          <span className="chat-support__retry-icon"></span>
          Повторить попытку
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
          <span className="chat-support__search-icon"></span>
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

              const lastTimestamp = room.lastMessageTimestamp || room.createdAt;
              const hasUnreadMessages =
                room.unreadCount && room.unreadCount > 0;
              const userName = room.user?.name || "Неизвестный пользователь";
              const userInitial = (
                (userName || "U").charAt(0) || "U"
              ).toUpperCase();

              let lastMessageText = "";
              if (room.lastMessage) {
                if (typeof room.lastMessage === "object") {
                  lastMessageText = room.lastMessage.message || "";
                } else if (typeof room.lastMessage === "string") {
                  lastMessageText = room.lastMessage;
                }
              }

              return (
                <div
                  key={room.id}
                  className={`chat-support__user ${
                    currentChatRoomId === room.id ? "active" : ""
                  } ${hasUnreadMessages ? "unread" : ""}`}
                  onClick={() => handleChatSelect(room.id)}
                >
                  <div className="chat-support__user-avatar">{userInitial}</div>
                  <div className="chat-support__user-info">
                    <div className="chat-support__user-name">
                      {room.name || userName}
                    </div>
                    <div className="chat-support__last-message-container">
                      {lastMessageText ? (
                        <div className="chat-support__last-message">
                          {lastMessageText.length > 30
                            ? `${lastMessageText.substring(0, 30)}...`
                            : lastMessageText}
                        </div>
                      ) : (
                        <div className="chat-support__last-message chat-support__last-message--empty">
                          Нет сообщений
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="chat-support__message-meta">
                    <div className="chat-support__message-time">
                      {lastTimestamp ? formatTime(lastTimestamp) : ""}
                    </div>
                    {hasUnreadMessages && (
                      <div className="chat-support__unread-badge">
                        {room.unreadCount}
                      </div>
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
              <span className="chat-support__no-chat-icon-symbol"></span>
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
                      (currentChatRoom.user?.name || "U").charAt(0) || "U"
                    ).toUpperCase()}
                  </div>
                  <div className="chat-support__user-info">
                    <div className="chat-support__user-name">
                      {currentChatRoom.user?.name || "Неизвестный пользователь"}
                    </div>
                    <div className="chat-support__user-email">
                      {currentChatRoom.user?.email || "Нет email"}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="chat-support__messages" ref={messagesDivRef}>
              {loadingMessages ? (
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
                                  (currentChatRoom.user?.name || "U").charAt(
                                    0
                                  ) || "U"
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
                                      <span className="message-status-sent">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <path d="M20 6l-11 11-5-5"></path>
                                        </svg>
                                      </span>
                                    )}
                                    {message.status === "Delivered" && (
                                      <span className="message-status-delivered">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <path d="M20 6l-11 11-5-5"></path>
                                        </svg>
                                      </span>
                                    )}
                                    {message.status === "Read" && (
                                      <span className="message-status-read">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <path d="M18 7l-8 8-4-4"></path>
                                          <path d="M9 11l-4 4-4-4"></path>
                                        </svg>
                                      </span>
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
                  <span className="chat-support__send-icon"></span>
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
