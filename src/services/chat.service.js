import * as signalR from "@microsoft/signalr";
import authService from "./auth.service";

// Базовый URL API
const API_URL = "https://chat-service-dev.azurewebsites.net";
const HUB_URL = `${API_URL}/chatHub`;

class ChatService {
  constructor() {
    this.connection = null;
    this.connectionPromise = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.eventCallbacks = {};
  }

  // Создание подключения SignalR
  createConnection() {
    if (this.connection) {
      return this.connection;
    }

    const token = authService.getToken();

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 15000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Регистрация стандартных обработчиков событий
    this.registerDefaultHandlers();

    return this.connection;
  }

  // Инициализация подключения
  async startConnection() {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    const connection = this.createConnection();

    this.connectionPromise = connection
      .start()
      .then(() => {
        console.log("SignalR connected");
        this.reconnectAttempts = 0;
        return connection;
      })
      .catch((err) => {
        console.error("SignalR connection error:", err);
        this.connectionPromise = null;

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(this.startConnection());
            }, 2000);
          });
        }

        throw err;
      });

    return this.connectionPromise;
  }

  // Проверка состояния подключения
  isConnected() {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  // Регистрация слушателей событий по умолчанию
  registerDefaultHandlers() {
    if (!this.connection) return;

    this.connection.onreconnecting((error) => {
      console.log("SignalR reconnecting:", error);
      this.invokeEvent("onReconnecting", error);
    });

    this.connection.onreconnected((connectionId) => {
      console.log("SignalR reconnected, ID:", connectionId);
      this.invokeEvent("onReconnected", connectionId);
    });

    this.connection.onclose((error) => {
      console.log("SignalR connection closed:", error);
      this.connectionPromise = null;
      this.invokeEvent("onClose", error);
    });

    // Стандартные события чата
    const events = [
      "ReceiveMessage",
      "ReceiveMessageHistory",
      "UserTyping",
      "MessagesRead",
      "NewRoomCreated",
      "RoomCreated",
      "ReceiveAllChats",
      "UserOnline",
      "UserOffline",
      "Error",
    ];

    events.forEach((event) => {
      this.connection.on(event, (...args) => {
        this.invokeEvent(event, ...args);
      });
    });
  }

  // Регистрация обработчика события
  on(event, callback) {
    if (!this.eventCallbacks[event]) {
      this.eventCallbacks[event] = [];
    }
    this.eventCallbacks[event].push(callback);
    return this;
  }

  // Удаление обработчика события
  off(event, callback) {
    if (this.eventCallbacks[event]) {
      this.eventCallbacks[event] = this.eventCallbacks[event].filter(
        (cb) => cb !== callback
      );
    }
    return this;
  }

  // Вызов всех обработчиков события
  invokeEvent(event, ...args) {
    const callbacks = this.eventCallbacks[event] || [];
    callbacks.forEach((callback) => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in ${event} handler:`, error);
      }
    });
  }

  // Остановка подключения
  async stopConnection() {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log("SignalR connection stopped");
      } catch (err) {
        console.error("SignalR stop error:", err);
      } finally {
        this.connection = null;
        this.connectionPromise = null;
      }
    }
  }

  // Методы для работы с чатом

  // Подключение пользователя
  async connectUser(userId) {
    try {
      const connection = await this.startConnection();
      return connection.invoke("ConnectUser", userId);
    } catch (error) {
      console.error("Failed to connect user:", error);
      throw error;
    }
  }

  // Отправка сообщения
  async sendMessage(roomId, message) {
    try {
      const connection = await this.startConnection();
      return connection.invoke("SendMessage", roomId, message);
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    }
  }

  // Создание новой комнаты
  async createRoom(userId) {
    try {
      const connection = await this.startConnection();
      return connection.invoke("CreateRoom", userId);
    } catch (error) {
      console.error("Failed to create room:", error);
      throw error;
    }
  }

  // Присоединение к комнате
  async joinRoom(roomId) {
    try {
      const connection = await this.startConnection();
      return connection.invoke("JoinRoom", roomId);
    } catch (error) {
      console.error("Failed to join room:", error);
      throw error;
    }
  }

  // Получение всех чатов (для админов)
  async getAllChats() {
    try {
      const connection = await this.startConnection();
      return connection.invoke("GetAllChats");
    } catch (error) {
      console.error("Failed to get all chats:", error);
      throw error;
    }
  }

  // Отправка статуса "печатает..."
  async sendTypingStatus(roomId, isTyping) {
    try {
      const connection = await this.startConnection();
      return connection.invoke("SendTypingStatus", roomId, isTyping);
    } catch (error) {
      console.error("Failed to send typing status:", error);
      throw error;
    }
  }

  // API запросы

  // Получение комнат пользователя
  async getUserChatRooms(userId) {
    const response = await fetch(`${API_URL}/api/ChatRooms/user/${userId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch user chat rooms");
    }
    return response.json();
  }

  // Получение всех пользователей
  async getAllUsers() {
    const response = await fetch(`${API_URL}/api/Users`);
    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }
    return response.json();
  }

  // Создание комнаты чата
  async createChatRoom(adminId, userId) {
    const response = await fetch(`${API_URL}/api/ChatRooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authService.getToken()}`,
      },
      body: JSON.stringify({
        adminId,
        userId,
        name: `Support chat for user ${userId}`,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create chat room");
    }

    return response.json();
  }
}

// Создаем синглтон для сервиса чата
const chatService = new ChatService();
export default chatService;
