import * as signalR from "@microsoft/signalr";
import authService from "./auth.service";

const API_URL = process.env.REACT_APP_API_URL;
const HUB_URL = `${API_URL}/chatHub`;

class ChatService {
  constructor() {
    this.connection = null;
    this.connectionPromise = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.eventCallbacks = {};
  }

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

    this.registerDefaultHandlers();

    return this.connection;
  }

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

  isConnected() {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

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

    this.connection.on("NewRoomCreated", (room) => {
      console.log("ChatService отримав подію NewRoomCreated:", room);
      this.invokeEvent("NewRoomCreated", room);
    });

    this.connection.on("ChatUpdated", (room) => {
      console.log("ChatService отримав подію ChatUpdated:", room);
      this.invokeEvent("ChatUpdated", room);
    });

    const events = [
      "ReceiveMessage",
      "ReceiveMessageHistory",
      "UserTyping",
      "MessagesRead",
      "MessageStatusUpdated",
      "MessagesStatusUpdated",
      "MessageDeleted",
      "NewRoomCreated",
      "RoomCreated",
      "ReceiveAllChats",
      "UserOnline",
      "UserOffline",
      "ChatUpdated",
      "Error",
    ];

    events.forEach((event) => {
      this.connection.on(event, (...args) => {
        this.invokeEvent(event, ...args);
      });
    });
  }

  on(event, callback) {
    if (!this.eventCallbacks[event]) {
      this.eventCallbacks[event] = [];
    }
    this.eventCallbacks[event].push(callback);
    return this;
  }

  off(event, callback) {
    if (this.eventCallbacks[event]) {
      this.eventCallbacks[event] = this.eventCallbacks[event].filter(
        (cb) => cb !== callback
      );
    }
    return this;
  }

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

  async connectUser(userId) {
    try {
      const connection = await this.startConnection();
      return connection.invoke("ConnectUser", userId);
    } catch (error) {
      console.error("Failed to connect user:", error);
      throw error;
    }
  }

  async sendMessage(roomId, message) {
    try {
      const connection = await this.startConnection();
      return connection.invoke("SendMessage", roomId, message);
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    }
  }

  async createRoom(userId) {
    try {
      const connection = await this.startConnection();
      return connection.invoke("CreateRoom", userId);
    } catch (error) {
      console.error("Failed to create room:", error);
      throw error;
    }
  }

  async joinRoom(roomId) {
    try {
      const connection = await this.startConnection();
      return connection.invoke("JoinRoom", roomId);
    } catch (error) {
      console.error("Failed to join room:", error);
      throw error;
    }
  }

  async getAllChats() {
    try {
      const connection = await this.startConnection();
      return connection.invoke("GetAllChats");
    } catch (error) {
      console.error("Failed to get all chats:", error);
      throw error;
    }
  }

  async sendTypingStatus(roomId, isTyping) {
    try {
      const connection = await this.startConnection();
      return connection.invoke("SendTypingStatus", roomId, isTyping);
    } catch (error) {
      console.error("Failed to send typing status:", error);
      throw error;
    }
  }

  async getUserChatRooms(userId) {
    try {
      if (!userId) {
        console.warn("getUserChatRooms called with empty userId");
        return [];
      }

      const response = await fetch(`${API_URL}/api/ChatRooms/user/${userId}`);

      if (response.status === 404) {
        console.log("No chat rooms found (404), returning empty array");
        return [];
      }

      if (!response.ok) {
        console.error("Response not OK:", response.status, response.statusText);
        return [];
      }

      const text = await response.text();
      if (!text || text.trim() === "") {
        console.log("Empty response, returning empty array");
        return [];
      }

      try {
        const data = JSON.parse(text);
        return data;
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        console.log("Raw response:", text);
        return [];
      }
    } catch (error) {
      console.error("Error in getUserChatRooms:", error);
      return [];
    }
  }

  async createChatRoom(adminId, userId, nickname) {
    try {
      const roomName = `Chat with ${nickname}`;

      const response = await fetch(`${API_URL}/api/ChatRooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminId,
          userId,
          name: roomName,
        }),
      });

      if (!response.ok) {
        console.error("Response not OK:", response.status, response.statusText);
        throw new Error(`Failed to create chat room: ${response.status}`);
      }

      const text = await response.text();
      if (!text || text.trim() === "") {
        console.error("Empty response when creating chat room");
        throw new Error("Empty response from server");
      }

      try {
        const data = JSON.parse(text);
        return data;
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        console.log("Raw response:", text);
        throw new Error("Invalid JSON response");
      }
    } catch (error) {
      console.error("Failed to create chat room:", error);
      throw error;
    }
  }

  async authenticateUser(userData) {
    try {
      const response = await fetch(`${API_URL}/api/Users/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        console.error(
          "Auth response not OK:",
          response.status,
          response.statusText
        );
        throw new Error(`Failed to authenticate user: ${response.status}`);
      }

      const user = await response.json();
      return user;
    } catch (error) {
      console.error("Failed to authenticate user:", error);
      throw error;
    }
  }
}

const chatService = new ChatService();
export default chatService;
