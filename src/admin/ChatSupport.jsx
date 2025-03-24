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

  // Допоміжна функція для нормалізації формату повідомлення
  const normalizeMessageFormat = useCallback((message) => {
    // Перевіряємо, чи це об'єкт
    if (!message || typeof message !== "object") return message;

    // Якщо повідомлення вже має поле message - це може бути повідомлення від SignalR
    if (message.message !== undefined || message.Message !== undefined) {
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
    }

    // Повертаємо вхідні дані, якщо формат невідомий
    return message;
  }, []);

  // Оптимізована функція сортування з useMemo для запобігання зайвим викликам
  const sortChatRooms = useCallback((rooms) => {
    if (!rooms || !Array.isArray(rooms)) return [];

    return [...rooms].sort((a, b) => {
      // Перевірка на null/undefined
      if (!a) return 1;
      if (!b) return -1;

      // Спочатку за непрочитаними
      const aUnread = a.unreadCount || 0;
      const bUnread = b.unreadCount || 0;

      if (aUnread > 0 && bUnread === 0) return -1;
      if (aUnread === 0 && bUnread > 0) return 1;

      // Потім за датою (спочатку нові)
      let aDate, bDate;

      try {
        aDate = new Date(a.lastMessageTimestamp || a.createdAt || 0);
        bDate = new Date(b.lastMessageTimestamp || b.createdAt || 0);
      } catch (err) {
        console.error("Помилка обробки дати:", err);
        return 0;
      }

      return bDate - aDate;
    });
  }, []);

  // Обробник отримання нового повідомлення
  const handleReceiveMessage = useCallback(
    (message) => {
      if (!message || !message.roomId) return;

      // Нормалізуємо формат повідомлення
      const normalizedMessage = normalizeMessageFormat(message);
      console.log("Отримано нормалізоване повідомлення:", normalizedMessage);

      // Завжди оновлюємо список чатів при новому повідомленні
      setChatRooms((prev) => {
        const updatedRooms = prev.map((room) => {
          if (room && room.id === normalizedMessage.roomId) {
            // Оновлюємо кімнату з новим повідомленням
            return {
              ...room,
              lastMessageTimestamp: normalizedMessage.timestamp,
              lastMessage: {
                message: normalizedMessage.message,
                timestamp: normalizedMessage.timestamp,
              },
              unreadCount:
                normalizedMessage.senderId !== user?.id
                  ? (room.unreadCount || 0) + 1
                  : room.unreadCount || 0,
            };
          }
          return room;
        });

        // Якщо кімнати з таким ID ще немає, додаємо її до списку через getAllChats
        if (
          !prev.some((room) => room && room.id === normalizedMessage.roomId)
        ) {
          // Викликаємо оновлення списку чатів
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

      // Додаємо повідомлення до списку якщо цей чат відкритий
      if (normalizedMessage.roomId === currentChatRoomId) {
        setMessages((prev) => {
          // Перевіряємо, чи повідомлення вже існує у списку
          const exists = prev.some(
            (msg) => msg && msg.id === normalizedMessage.id
          );
          if (exists) return prev;
          return [...prev, normalizedMessage];
        });
      }
    },
    [
      currentChatRoomId,
      user,
      normalizeMessageFormat,
      sortChatRooms,
      chatService,
    ]
  );

  // Обробник отримання історії повідомлень
  const handleReceiveMessageHistory = useCallback(
    (roomId, messageHistory) => {
      console.log("Отримано історію повідомлень:", roomId, messageHistory);
      if (roomId !== currentChatRoomId || !messageHistory) return;

      // Нормалізуємо формат повідомлень
      const normalizedMessages = Array.isArray(messageHistory)
        ? messageHistory.map((msg) => normalizeMessageFormat(msg))
        : [];

      setMessages(normalizedMessages);
      setLoadingMessages(false);

      // Прокручуємо до останнього повідомлення
      setTimeout(() => {
        if (messagesDivRef.current) {
          messagesDivRef.current.scrollTop =
            messagesDivRef.current.scrollHeight;
        }
      }, 100);
    },
    [currentChatRoomId, normalizeMessageFormat]
  );

  // Обробник створення нової кімнати
  const handleNewRoomCreated = useCallback(
    (room) => {
      console.log("Отримано подію створення нової кімнати:", room);
      if (!room || !room.id) {
        console.warn("Отримано неправильний формат кімнати:", room);
        return;
      }

      // Оновлюємо список чатів з новою кімнатою
      setChatRooms((prev) => {
        // Перевіряємо на дублікати
        if (prev.some((r) => r && r.id === room.id)) {
          return prev; // Кімната вже існує
        }

        // Додаємо lastMessage поле, якщо воно відсутнє
        const roomWithLastMessage = {
          ...room,
          lastMessage: room.lastMessage || null,
          lastMessageTimestamp: room.lastMessageTimestamp || room.createdAt,
          unreadCount: room.unreadCount || 0,
        };

        // Додаємо нову кімнату і сортуємо весь список
        return sortChatRooms([...prev, roomWithLastMessage]);
      });
    },
    [sortChatRooms]
  );

  // Обробник отримання всіх чатів
  const handleReceiveAllChats = useCallback(
    async (chats) => {
      console.log("Отримано список усіх чатів:", chats);
      if (!chats || !Array.isArray(chats)) return;

      // Для кожного чату завантажуємо останнє повідомлення, щоб оновити інформацію
      try {
        const updatedChats = await Promise.all(
          chats.map(async (chat) => {
            if (!chat || !chat.id) return chat;

            // Перевіряємо наявність lastMessage
            let chatWithLastMessage = { ...chat };

            // Якщо у чату вже є lastMessage, використовуємо його
            if (chat.lastMessage) {
              return chat;
            }

            // Якщо немає lastMessage, але є lastMessageTimestamp, спробуємо завантажити повідомлення
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

        // Оновлюємо стан з нормалізованими даними
        setChatRooms(sortChatRooms(updatedChats));
      } catch (error) {
        console.error("Помилка обробки списку чатів:", error);
      }
    },
    [sortChatRooms, normalizeMessageFormat]
  );

  // Обробник оновлення чату
  const handleChatUpdated = useCallback(
    async (updatedRoom) => {
      console.log("Отримано подію оновлення чату:", updatedRoom);

      if (!updatedRoom || !updatedRoom.id) {
        console.warn("Отримано неправильний формат оновленої кімнати");
        return;
      }

      // Перевіряємо, чи є lastMessage у оновленій кімнаті
      let roomWithLastMessage = { ...updatedRoom };

      // Якщо lastMessage відсутній, але є lastMessageTimestamp, спробуємо завантажити повідомлення
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

      // Оновлюємо стан чатів
      setChatRooms((prev) => {
        // Перевіряємо, чи існує чат у поточному списку
        const exists = prev.some(
          (room) => room && room.id === roomWithLastMessage.id
        );

        if (!exists) {
          // Якщо чат новий, додаємо його до списку
          return sortChatRooms([...prev, roomWithLastMessage]);
        }

        // Оновлюємо існуючий чат
        const updated = prev.map((room) =>
          room && room.id === roomWithLastMessage.id
            ? roomWithLastMessage
            : room
        );

        return sortChatRooms(updated);
      });

      // Якщо це поточний чат, оновлюємо його дані в currentChatRoom
      if (currentChatRoomId === updatedRoom.id) {
        setCurrentChatRoom(roomWithLastMessage);
      }
    },
    [currentChatRoomId, normalizeMessageFormat, sortChatRooms]
  );

  // Обробник прочитання повідомлень
  const handleMessagesRead = useCallback(
    (roomId, messageIds, userId) => {
      console.log(
        "Отримано подію прочитання повідомлень:",
        roomId,
        messageIds,
        userId
      );

      if (!roomId || !messageIds || !Array.isArray(messageIds)) return;

      // Оновлюємо статус повідомлень у поточному чаті
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

      // Обнуляємо лічильник непрочитаних у списку чатів
      setChatRooms((prev) => {
        return prev.map((room) => {
          if (room && room.id === roomId) {
            return { ...room, unreadCount: 0 };
          }
          return room;
        });
      });
    },
    [currentChatRoomId]
  );

  // Завантаження списку чатів - використовуємо SignalR та додатково завантажуємо останні повідомлення
  useEffect(() => {
    const loadChatRooms = async () => {
      if (!isConnected || !user || user.role !== "admin" || !chatService)
        return;

      try {
        setLoading(true);
        console.log("Початок завантаження чатів...");

        // Отримуємо чати через SignalR
        if (typeof chatService.getAllChats === "function") {
          console.log("Викликаємо getAllChats через SignalR");
          await chatService.getAllChats();
        } else {
          console.error("Функція getAllChats недоступна в chatService");
        }

        // Додатково завантажуємо останні повідомлення для кожного чату через API
        try {
          console.log("Завантажуємо чати через API");
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/api/ChatRooms/user/${user.id}`
          );
          if (response.ok) {
            const rooms = await response.json();
            console.log("Отримані чати через API:", rooms);

            if (rooms && Array.isArray(rooms)) {
              // Завантажуємо останні повідомлення для кожного чату
              const updatedRooms = await Promise.all(
                rooms.map(async (room) => {
                  if (!room || !room.id) return room;

                  try {
                    const msgResponse = await fetch(
                      `${process.env.REACT_APP_API_URL}/api/ChatMessages/room/${room.id}?limit=1`
                    );
                    if (msgResponse.ok) {
                      const messages = await msgResponse.json();
                      // Нормалізуємо формат повідомлення
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

              console.log("Оброблені чати з повідомленнями:", updatedRooms);
              // Сортуємо отримані чати та оновлюємо стан
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

  // Обробка подій SignalR
  useEffect(() => {
    if (!isConnected || !chatService) return;

    console.log("Настроювання підписки на події SignalR");

    // Явно виводимо поточний стан chatService для діагностики
    console.log("chatService доступний:", chatService);
    if (chatService.isConnected) {
      console.log("Поточний стан з'єднання:", chatService.isConnected());
    }

    // Підписуємось на події SignalR з правильними іменами
    chatService.on("ReceiveMessage", handleReceiveMessage);
    chatService.on("ReceiveMessageHistory", handleReceiveMessageHistory);
    chatService.on("NewRoomCreated", handleNewRoomCreated);
    chatService.on("ReceiveAllChats", handleReceiveAllChats);
    chatService.on("ChatUpdated", handleChatUpdated);
    chatService.on("MessagesRead", handleMessagesRead);

    // Додаємо явну обробку помилок
    chatService.on("Error", (error) => {
      console.error("Отримано помилку SignalR:", error);
    });

    // Відписуємось від усіх подій при розмонтуванні компонента
    return () => {
      console.log("Відписка від подій SignalR");
      chatService.off("ReceiveMessage", handleReceiveMessage);
      chatService.off("ReceiveMessageHistory", handleReceiveMessageHistory);
      chatService.off("NewRoomCreated", handleNewRoomCreated);
      chatService.off("ReceiveAllChats", handleReceiveAllChats);
      chatService.off("ChatUpdated", handleChatUpdated);
      chatService.off("MessagesRead", handleMessagesRead);
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
  ]);

  // Логування подій SignalR для відлагодження
  useEffect(() => {
    if (!isConnected || !chatService) return;

    const logEvent =
      (event) =>
      (...args) => {
        console.log(`SignalR подія '${event}'`, args);
      };

    // Важливі події для логування
    const events = [
      "ReceiveMessage",
      "ReceiveMessageHistory",
      "NewRoomCreated",
      "ReceiveAllChats",
      "MessagesRead",
      "ChatUpdated",
      "Error",
    ];

    // Реєструємо логери для всіх подій
    const cleanupFunctions = events.map((event) => {
      const handler = logEvent(event);
      chatService.on(event, handler);
      return () => chatService.off(event, handler);
    });

    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [isConnected, chatService]);

  // Оновлення статусу повідомлень при перегляді чату
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
        // Скидаємо лічильник непрочитаних повідомлень
        setChatRooms((prev) => {
          return prev.map((room) =>
            room && room.id === currentChatRoomId
              ? { ...room, unreadCount: 0 }
              : room
          );
        });

        // Позначаємо повідомлення як прочитані
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
            console.error("Помилка оновлення статусу повідомлення:", error);
          }
        });
      }
    }
  }, [messages, currentChatRoomId, user, isConnected]);

  // Управління прокруткою списку повідомлень
  useEffect(() => {
    const messagesDiv = messagesDivRef.current;

    if (messagesDiv) {
      if (loadingMore) {
        // Зберігаємо висоту прокрутки при завантаженні старіших повідомлень
        setLastScrollHeight(messagesDiv.scrollHeight);
      } else if (lastScrollHeight > 0) {
        // Відновлюємо позицію прокрутки після завантаження
        const newScrollPosition = messagesDiv.scrollHeight - lastScrollHeight;
        messagesDiv.scrollTop = newScrollPosition > 0 ? newScrollPosition : 0;
        setLastScrollHeight(0);
      } else if (
        initialLoadComplete &&
        !loadingMore &&
        messages &&
        messages.length > 0 &&
        !loadingMessages // Не прокручуємо під час завантаження повідомлень
      ) {
        // Прокручуємо до останнього повідомлення
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

  // Обробка вибору чату
  const handleChatSelect = useCallback(
    (chatRoomId) => {
      if (currentChatRoomId === chatRoomId || !chatRooms) return;

      console.log("Вибір чату:", chatRoomId);
      setCurrentChatRoomId(chatRoomId);

      const selectedRoom = chatRooms.find(
        (room) => room && room.id === chatRoomId
      );
      setCurrentChatRoom(selectedRoom || null);

      // Встановлюємо стан завантаження повідомлень
      setLoadingMessages(true);
      setMessages([]);

      // Скидаємо лічильник непрочитаних повідомлень
      setChatRooms((prev) => {
        return prev.map((room) =>
          room && room.id === chatRoomId ? { ...room, unreadCount: 0 } : room
        );
      });

      // Приєднуємось до кімнати
      if (chatService && typeof chatService.joinRoom === "function") {
        console.log("Приєднуємось до кімнати:", chatRoomId);
        chatService
          .joinRoom(chatRoomId)
          .then(() => {
            console.log("Успішно приєднались до кімнати", chatRoomId);
          })
          .catch((error) => {
            console.error("Помилка приєднання до кімнати:", error);
            setLoadingMessages(false);
          });

        // Встановлюємо таймаут на випадок, якщо повідомлення не прийдуть
        setTimeout(() => {
          if (loadingMessages) {
            console.log("Таймаут на завантаження повідомлень спрацював");
            setLoadingMessages(false);
          }
        }, 5000);
      }
    },
    [currentChatRoomId, chatRooms, chatService, loadingMessages]
  );

  // Завантаження додаткових повідомлень
  const handleLoadMoreMessages = useCallback(async () => {
    if (currentChatRoomId && messages && messages.length > 0 && !loadingMore) {
      try {
        console.log(
          "Завантаження додаткових повідомлень для кімнати:",
          currentChatRoomId
        );
        setLoadingMore(true);

        const apiUrl = `${process.env.REACT_APP_API_URL}/api/ChatMessages/room/${currentChatRoomId}?skip=${messages.length}&limit=20`;

        console.log("Запит за URL:", apiUrl);
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(
            "Помилка завантаження повідомлень, статус: " + response.status
          );
        }

        const data = await response.json();
        console.log("Отримані додаткові повідомлення:", data);

        if (data && Array.isArray(data) && data.length > 0) {
          // Нормалізуємо формат отриманих повідомлень
          const normalizedMessages = data.map((msg) =>
            normalizeMessageFormat(msg)
          );
          setMessages((prev) => [...normalizedMessages, ...prev]);
        } else {
          console.log(
            "Немає додаткових повідомлень або отримано порожній масив"
          );
        }
      } catch (error) {
        console.error("Помилка завантаження додаткових повідомлень:", error);
      } finally {
        setLoadingMore(false);
      }
    }
  }, [currentChatRoomId, messages, loadingMore, normalizeMessageFormat]);

  // Відправлення повідомлення
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
      console.log(
        "Відправка повідомлення в кімнату:",
        currentChatRoomId,
        message
      );
      setSendingMessage(true);
      await chatService.sendMessage(currentChatRoomId, message);
      console.log("Повідомлення успішно відправлено");
    } catch (error) {
      console.error("Помилка відправлення повідомлення:", error);
      setMessageText(message); // Повертаємо текст повідомлення при помилці
    } finally {
      setSendingMessage(false);
    }
  };

  // Спроба повторного підключення
  const retryConnection = useCallback(() => {
    console.log("Спроба повторного підключення...");
    setRetryCount((prevCount) => prevCount + 1);
  }, []);

  // Форматування часу
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      console.error("Помилка форматування часу:", e);
      return "";
    }
  };

  // Форматування дати
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString();
    } catch (e) {
      console.error("Помилка форматування дати:", e);
      return "";
    }
  };

  // Перевірка, чи належать дві дати до одного дня
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
      console.error("Помилка перевірки дат:", e);
      return false;
    }
  };

  // Фільтрація чатів за пошуковим запитом - мемоізована для оптимізації
  const filteredChatRooms = useMemo(() => {
    if (!chatRooms || !Array.isArray(chatRooms)) return [];

    return chatRooms.filter((room) => {
      if (!room) return false;
      if (!searchTerm.trim()) return true;

      const searchTermLower = searchTerm.toLowerCase();

      const userName = (room.user?.name || "").toLowerCase();
      const userNickname = (room.user?.nickname || "").toLowerCase();
      const roomName = (room.name || "").toLowerCase();

      // Перевірка останнього повідомлення
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

  // Перевірка доступу адміністратора
  if (!user || user.role !== "admin") {
    return (
      <div className="admin-restricted">Доступ только для администраторов</div>
    );
  }

  // Відображення помилки підключення
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

  // Основний інтерфейс
  return (
    <div className="chat-support">
      {/* Бічна панель зі списком чатів */}
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
          {/* Відображення списку чатів або стану завантаження */}
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

              // Отримуємо текст останнього повідомлення з правильного місця
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
                // Відображення при завантаженні повідомлень
                <div className="chat-support__loading-messages">
                  <div className="chat-support__loading-spinner"></div>
                  <p>Загрузка сообщений...</p>
                </div>
              ) : !messages || messages.length === 0 ? (
                // Відображення при відсутності повідомлень
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
                                      <span className="message-status-sent"></span>
                                    )}
                                    {message.status === "Delivered" && (
                                      <span className="message-status-delivered"></span>
                                    )}
                                    {message.status === "Read" && (
                                      <span className="message-status-read"></span>
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
