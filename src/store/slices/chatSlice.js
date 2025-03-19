import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import ChatService from "../../services/chat.service";

export const initializeSignalR = createAsyncThunk(
  "chat/initializeSignalR",
  async (userId, { dispatch, getState }) => {
    try {
      const { auth } = getState();
      const userInfo = auth.user;

      ChatService.setMessageCallback((message) => {
        dispatch(addMessage(message));

        if (message.senderId !== userId && message.status !== "Read") {
          dispatch(
            updateMessageStatusSignalR({
              messageId: message.id,
              status: "Read",
            })
          );
        }
      });

      ChatService.setRecentMessagesCallback((messages) => {
        dispatch(setMessages(messages));
      });

      ChatService.setMoreMessagesCallback((messages) => {
        dispatch(prependMessages(messages));
      });

      ChatService.setMessageStatusCallback((messageId, status) => {
        dispatch(updateMessageStatus({ messageId, status }));
      });

      // Если пользователь авторизован, преобразуем его в формат, подходящий для чат-сервиса
      if (userInfo) {
        const chatUserInfo = {
          id: userId,
          name: userInfo.name || "User",
          nickname: userInfo.nickname || userInfo.name || "User",
          email: userInfo.email || "user@example.com",
          role: userInfo.role || "user",
        };

        // Сначала регистрируем пользователя в чат-сервисе
        await ChatService.registerOrUpdateUser(chatUserInfo);
      }

      // Инициализируем подключение
      await ChatService.initConnection();
      await ChatService.registerConnection(userId);
      return true;
    } catch (error) {
      console.error("Failed to initialize SignalR:", error);
      throw error;
    }
  }
);

export const fetchUserChatRooms = createAsyncThunk(
  "chat/fetchUserChatRooms",
  async (userId, { rejectWithValue }) => {
    try {
      const chatRooms = await ChatService.getUserChatRooms(userId);
      return chatRooms;
    } catch (error) {
      console.error("Failed to fetch chat rooms:", error);
      return rejectWithValue(error.message || "Failed to fetch chat rooms");
    }
  }
);

export const joinChatRoomSignalR = createAsyncThunk(
  "chat/joinChatRoomSignalR",
  async ({ userId, chatRoomId }, { rejectWithValue }) => {
    try {
      await ChatService.joinChatRoom(userId, chatRoomId);
      const chatRoom = await ChatService.getChatRoom(chatRoomId);
      return chatRoom;
    } catch (error) {
      console.error("Failed to join chat room:", error);
      return rejectWithValue(error.message || "Failed to join chat room");
    }
  }
);

export const sendMessageSignalR = createAsyncThunk(
  "chat/sendMessageSignalR",
  async ({ userId, chatRoomId, message }, { rejectWithValue }) => {
    try {
      await ChatService.sendMessage(userId, chatRoomId, message);
      return { success: true };
    } catch (error) {
      console.error("Failed to send message:", error);
      return rejectWithValue(error.message || "Failed to send message");
    }
  }
);

export const updateMessageStatusSignalR = createAsyncThunk(
  "chat/updateMessageStatusSignalR",
  async ({ messageId, status }, { rejectWithValue }) => {
    try {
      await ChatService.updateMessageStatus(messageId, status);
      return { messageId, status };
    } catch (error) {
      console.error("Failed to update message status:", error);
      return rejectWithValue(
        error.message || "Failed to update message status"
      );
    }
  }
);

export const loadMoreMessagesSignalR = createAsyncThunk(
  "chat/loadMoreMessagesSignalR",
  async ({ userId, chatRoomId, offset }, { rejectWithValue }) => {
    try {
      await ChatService.loadMoreMessages(userId, chatRoomId, offset);
      return { success: true };
    } catch (error) {
      console.error("Failed to load more messages:", error);
      return rejectWithValue(error.message || "Failed to load more messages");
    }
  }
);

export const checkConnectionStatus = createAsyncThunk(
  "chat/checkConnectionStatus",
  async (_, { dispatch }) => {
    const status = ChatService.getConnectionStatus();

    // Если количество попыток восстановления соединения превышает 5,
    // считаем соединение потерянным и возвращаем ошибку
    if (status.reconnectAttempts > 5) {
      dispatch(
        updateConnectionState({
          isConnected: false,
          connectionState: "Failed",
          error: "Connection lost after multiple attempts",
        })
      );
      return {
        isConnected: false,
        connectionState: "Failed",
      };
    }

    dispatch(updateConnectionState(status));
    return status;
  }
);

export const cleanupChat = createAsyncThunk(
  "chat/cleanupChat",
  async (_, { dispatch }) => {
    try {
      await ChatService.closeConnection();
      dispatch(clearChat());
      return true;
    } catch (error) {
      console.error("Error during chat cleanup:", error);
      return false;
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    isConnected: false,
    connectionState: "Disconnected",
    reconnectAttempts: 0,
    chatRooms: [],
    currentChatRoomId: null,
    currentChatRoom: null,
    messages: [],
    loading: false,
    sendingMessage: false,
    loadingMore: false,
    error: null,
  },
  reducers: {
    setCurrentChatRoom: (state, action) => {
      state.currentChatRoomId = action.payload;
      state.messages = [];
      state.currentChatRoom = state.chatRooms.find(
        (room) => room.id === action.payload
      );
    },
    addMessage: (state, action) => {
      const existingMessageIndex = state.messages.findIndex(
        (msg) => msg.id === action.payload.id
      );

      if (existingMessageIndex === -1) {
        state.messages.push(action.payload);
        // Sort messages by timestamp to ensure newest are at the bottom
        state.messages.sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
      } else {
        state.messages[existingMessageIndex] = action.payload;
      }

      if (state.currentChatRoomId) {
        const roomIndex = state.chatRooms.findIndex(
          (room) => room.id === state.currentChatRoomId
        );
        if (roomIndex !== -1) {
          state.chatRooms[roomIndex].lastMessage = action.payload;

          // Помещаем чат с новым сообщением вверху списка
          if (roomIndex !== 0) {
            const updatedRoom = state.chatRooms[roomIndex];
            state.chatRooms.splice(roomIndex, 1);
            state.chatRooms.unshift(updatedRoom);
          }
        }
      }
    },
    setMessages: (state, action) => {
      // Sort messages by timestamp before setting them
      state.messages = [...action.payload].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
    },
    prependMessages: (state, action) => {
      // Удаляем дубликаты перед добавлением новых сообщений
      const newMessageIds = new Set(action.payload.map((msg) => msg.id));
      const existingMessages = state.messages.filter(
        (msg) => !newMessageIds.has(msg.id)
      );

      const allMessages = [...action.payload, ...existingMessages];
      // Sort all messages by timestamp
      state.messages = allMessages.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
    },
    updateMessageStatus: (state, action) => {
      const { messageId, status } = action.payload;
      const messageIndex = state.messages.findIndex(
        (msg) => msg.id === messageId
      );
      if (messageIndex !== -1) {
        state.messages[messageIndex].status = status;
      }
    },
    clearChat: (state) => {
      state.currentChatRoomId = null;
      state.currentChatRoom = null;
      state.messages = [];
    },
    disconnectSignalR: (state) => {
      state.isConnected = false;
      state.connectionState = "Disconnected";
    },
    updateConnectionState: (state, action) => {
      const { isConnected, connectionState, reconnectAttempts, error } =
        action.payload;
      state.isConnected = isConnected;
      state.connectionState = connectionState;
      if (reconnectAttempts !== undefined) {
        state.reconnectAttempts = reconnectAttempts;
      }
      if (error) {
        state.error = error;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeSignalR.pending, (state) => {
        state.loading = true;
        state.connectionState = "Connecting";
        state.error = null;
      })
      .addCase(initializeSignalR.fulfilled, (state, action) => {
        state.isConnected = action.payload;
        state.connectionState = action.payload ? "Connected" : "Disconnected";
        state.loading = false;
        state.error = null;
      })
      .addCase(initializeSignalR.rejected, (state, action) => {
        state.loading = false;
        state.isConnected = false;
        state.connectionState = "Disconnected";
        state.error = action.error.message;
      })

      .addCase(fetchUserChatRooms.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserChatRooms.fulfilled, (state, action) => {
        state.chatRooms = action.payload;
        state.loading = false;
      })
      .addCase(fetchUserChatRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      .addCase(joinChatRoomSignalR.pending, (state) => {
        state.loading = true;
      })
      .addCase(joinChatRoomSignalR.fulfilled, (state, action) => {
        state.currentChatRoom = action.payload;
        state.loading = false;
      })
      .addCase(joinChatRoomSignalR.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      .addCase(sendMessageSignalR.pending, (state) => {
        state.sendingMessage = true;
      })
      .addCase(sendMessageSignalR.fulfilled, (state) => {
        state.sendingMessage = false;
      })
      .addCase(sendMessageSignalR.rejected, (state, action) => {
        state.sendingMessage = false;
        state.error = action.payload || action.error.message;
      })

      .addCase(loadMoreMessagesSignalR.pending, (state) => {
        state.loadingMore = true;
      })
      .addCase(loadMoreMessagesSignalR.fulfilled, (state) => {
        state.loadingMore = false;
      })
      .addCase(loadMoreMessagesSignalR.rejected, (state, action) => {
        state.loadingMore = false;
        state.error = action.payload || action.error.message;
      })

      .addCase(checkConnectionStatus.fulfilled, (state, action) => {
        state.isConnected = action.payload.isConnected;
        state.connectionState = action.payload.connectionState;
        if (action.payload.reconnectAttempts !== undefined) {
          state.reconnectAttempts = action.payload.reconnectAttempts;
        }
      })

      .addCase(cleanupChat.fulfilled, (state) => {
        state.isConnected = false;
        state.connectionState = "Disconnected";
        state.currentChatRoomId = null;
        state.currentChatRoom = null;
        state.messages = [];
      });
  },
});

export const {
  setCurrentChatRoom,
  addMessage,
  setMessages,
  prependMessages,
  updateMessageStatus,
  clearChat,
  disconnectSignalR,
  updateConnectionState,
} = chatSlice.actions;

export default chatSlice.reducer;
