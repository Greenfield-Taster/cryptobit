import {
  HubConnectionBuilder,
  LogLevel,
  HttpTransportType,
} from "@microsoft/signalr";

import axios from "axios";

const API_BASE_URL = "https://chat-service-dev.azurewebsites.net/api";
const HUB_URL = "https://chat-service-dev.azurewebsites.net/chatHub";

class ChatService {
  constructor() {
    this.connection = null;
    this.connectionPromise = null;
    this.isConnected = false;
    this.currentUserId = null;
    this.currentChatRoomId = null;
    this.reconnectAttempts = 0;
  }

  async initConnection() {
    if (this.connection && this.isConnected) {
      return this.connection;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise(async (resolve, reject) => {
      try {
        this.connection = new HubConnectionBuilder()
          .withUrl(HUB_URL, {
            skipNegotiation: false,
            transport: HttpTransportType.WebSockets,
          })
          .configureLogging(LogLevel.Information)
          .withAutomaticReconnect([0, 2000, 5000, 10000, 20000])
          .build();

        this.setupEventHandlers();

        await this.connection.start();
        console.log("SignalR connection established");
        this.isConnected = true;
        this.reconnectAttempts = 0;
        resolve(this.connection);
      } catch (error) {
        console.error("Error establishing SignalR connection:", error);
        this.isConnected = false;
        this.connection = null;
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  setupEventHandlers() {
    this.connection.on("ReceiveMessage", (message) => {
      if (this.onMessageReceived) {
        this.onMessageReceived(message);
      }
    });

    this.connection.on("ReceiveRecentMessages", (messages) => {
      if (this.onRecentMessagesReceived) {
        this.onRecentMessagesReceived(messages);
      }
    });

    this.connection.on("ReceiveMoreMessages", (messages) => {
      if (this.onMoreMessagesReceived) {
        this.onMoreMessagesReceived(messages);
      }
    });

    this.connection.on("MessageStatusUpdated", (messageId, status) => {
      if (this.onMessageStatusUpdated) {
        this.onMessageStatusUpdated(messageId, status);
      }
    });

    this.connection.onclose(() => {
      console.log("SignalR connection closed");
      this.isConnected = false;
      this.connection = null;
      this.connectionPromise = null;
    });

    this.connection.onreconnecting(() => {
      console.log("SignalR attempting to reconnect...");
      this.isConnected = false;
      this.reconnectAttempts++;
    });

    this.connection.onreconnected(async () => {
      console.log("SignalR connection reconnected");
      this.isConnected = true;

      // Если до потери соединения был активный чат, присоединиться снова
      if (this.currentUserId) {
        try {
          await this.registerConnection(this.currentUserId);

          if (this.currentChatRoomId) {
            await this.joinChatRoom(this.currentUserId, this.currentChatRoomId);
          }
        } catch (error) {
          console.error("Error rejoining chat room after reconnection:", error);
        }
      }
    });
  }

  setMessageCallback(callback) {
    this.onMessageReceived = callback;
  }

  setRecentMessagesCallback(callback) {
    this.onRecentMessagesReceived = callback;
  }

  setMoreMessagesCallback(callback) {
    this.onMoreMessagesReceived = callback;
  }

  setMessageStatusCallback(callback) {
    this.onMessageStatusUpdated = callback;
  }

  async ensureUserExists(userId, userInfo = null) {
    try {
      // Проверяем, существует ли пользователь, получая его чаты
      await this.getUserChatRooms(userId);
      return true;
    } catch (error) {
      // Если пользователь не найден, создаем его
      if (
        error.response &&
        (error.response.status === 404 || error.response.status === 400)
      ) {
        if (!userInfo) {
          // Если информация о пользователе не предоставлена, используем базовую
          const currentUser = this.getCurrentUserFromLocalStorage();
          userInfo = {
            id: userId,
            name: currentUser?.name || "User",
            nickname: currentUser?.nickname || currentUser?.name || "User",
            email: currentUser?.email || "user@example.com",
            role: currentUser?.role || "user",
          };
        }

        // Регистрируем пользователя в чат-сервисе
        await this.registerOrUpdateUser(userInfo);
        return true;
      }
      throw error;
    }
  }

  getCurrentUserFromLocalStorage() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  async registerConnection(userId) {
    try {
      // Сначала убедимся, что пользователь существует
      await this.ensureUserExists(userId);

      // Запоминаем текущего пользователя для возможного переподключения
      this.currentUserId = userId;

      // Затем подключаемся
      const connection = await this.initConnection();
      await connection.invoke("RegisterConnection", userId);
    } catch (error) {
      console.error("Error registering connection:", error);
      throw error;
    }
  }

  async joinChatRoom(userId, chatRoomId) {
    try {
      const connection = await this.initConnection();
      // Сохраняем ID комнаты для возможного переподключения
      this.currentChatRoomId = chatRoomId;
      await connection.invoke("JoinChatRoom", userId, chatRoomId);
    } catch (error) {
      console.error("Error joining chat room:", error);
      throw error;
    }
  }

  async sendMessage(userId, chatRoomId, message) {
    try {
      const connection = await this.initConnection();
      await connection.invoke("SendMessage", userId, chatRoomId, message);
    } catch (error) {
      console.error("Error sending message via SignalR:", error);

      // Если ошибка с SignalR, попробуем через REST API как запасной вариант
      try {
        console.log("Fallback to REST API for sending message");
        await this.sendMessageApi(chatRoomId, userId, message);
      } catch (apiError) {
        console.error("Error sending message via API fallback:", apiError);
        throw apiError;
      }
    }
  }

  async updateMessageStatus(messageId, status) {
    try {
      const connection = await this.initConnection();
      await connection.invoke("UpdateMessageStatus", messageId, status);
    } catch (error) {
      console.error("Error updating message status:", error);
      throw error;
    }
  }

  async loadMoreMessages(userId, chatRoomId, offset) {
    try {
      const connection = await this.initConnection();
      await connection.invoke("LoadMoreMessages", userId, chatRoomId, offset);
    } catch (error) {
      console.error("Error loading more messages:", error);
      throw error;
    }
  }

  async closeConnection() {
    if (this.connection) {
      try {
        await this.connection.stop();
        this.isConnected = false;
        this.connection = null;
        this.connectionPromise = null;
        this.currentUserId = null;
        this.currentChatRoomId = null;
        console.log("SignalR connection closed");
      } catch (error) {
        console.error("Error closing SignalR connection:", error);
      }
    }
  }

  async getUserChatRooms(userId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/rooms/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user chat rooms:", error);
      throw error;
    }
  }

  async getChatRoom(roomId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/room/${roomId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching chat room:", error);
      throw error;
    }
  }

  async createChatRoom(adminId, userId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/chat/room`, {
        adminId,
        userId,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating chat room:", error);
      throw error;
    }
  }

  async getMessages(chatRoomId, limit = 50, offset = 0) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/chat/messages/${chatRoomId}`,
        { params: { limit, offset } }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  }

  async sendMessageApi(chatRoomId, senderId, message) {
    try {
      const response = await axios.post(`${API_BASE_URL}/chat/message`, {
        chatRoomId,
        senderId,
        message,
      });
      return response.data;
    } catch (error) {
      console.error("Error sending message via API:", error);
      throw error;
    }
  }

  async registerOrUpdateUser(userInfo) {
    try {
      const response = await axios.post(`${API_BASE_URL}/chat/user`, userInfo);
      return response.data;
    } catch (error) {
      console.error("Error registering/updating user:", error);
      throw error;
    }
  }

  async getAllUsers() {
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/users`);
      return response.data;
    } catch (error) {
      console.error("Error fetching all users:", error);
      throw error;
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      connectionState: this.connection?.state || "Disconnected",
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

export default new ChatService();
