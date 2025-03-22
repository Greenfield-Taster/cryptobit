import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import chatService from "../../services/chat.service";

export const fetchUserChatRooms = createAsyncThunk(
  "chat/fetchUserChatRooms",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await chatService.getUserChatRooms(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const initializeSignalR = createAsyncThunk(
  "chat/initializeSignalR",
  async (userId, { rejectWithValue }) => {
    try {
      await chatService.startConnection();
      await chatService.connectUser(userId);
      return { connected: true };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const sendMessageSignalR = createAsyncThunk(
  "chat/sendMessage",
  async ({ userId, chatRoomId, message }, { rejectWithValue }) => {
    try {
      await chatService.sendMessage(chatRoomId, message);
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const joinChatRoomSignalR = createAsyncThunk(
  "chat/joinChatRoom",
  async ({ userId, chatRoomId }, { rejectWithValue }) => {
    try {
      await chatService.joinRoom(chatRoomId);
      return { roomId: chatRoomId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateMessageStatusSignalR = createAsyncThunk(
  "chat/updateMessageStatus",
  async ({ messageId, status }, { rejectWithValue }) => {
    try {
      await fetch(
        `${process.env.REACT_APP_API_URL}/api/ChatMessages/${messageId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status, userId: "" }),
        }
      );
      return { messageId, status };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const loadMoreMessagesSignalR = createAsyncThunk(
  "chat/loadMoreMessages",
  async ({ userId, chatRoomId, offset }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL
        }/api/PaginatedMessages/room/${chatRoomId}?page=${
          Math.floor(offset / 20) + 1
        }&pageSize=20`
      );
      if (!response.ok) {
        throw new Error("Failed to load more messages");
      }
      const data = await response.json();
      return { messages: data.items || [] };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    chatRooms: [],
    currentChatRoomId: null,
    currentChatRoom: null,
    messages: [],
    isConnected: false,
    connectionState: "disconnected",
    loading: false,
    loadingMore: false,
    sendingMessage: false,
    error: null,
  },
  reducers: {
    setCurrentChatRoom: (state, action) => {
      state.currentChatRoomId = action.payload;
      state.currentChatRoom = state.chatRooms.find(
        (room) => room.id === action.payload
      );
      state.messages = [];
    },
    addMessage: (state, action) => {
      const message = action.payload;
      const existingMessage = state.messages.find((m) => m.id === message.id);
      if (!existingMessage) {
        state.messages.push(message);
      }
    },
    updateMessageStatus: (state, action) => {
      const { messageId, status } = action.payload;
      const message = state.messages.find((m) => m.id === messageId);
      if (message) {
        message.status = status;
      }
    },
    clearChat: (state) => {
      state.messages = [];
    },
    setConnectionState: (state, action) => {
      state.connectionState = action.payload;
      state.isConnected = action.payload === "connected";
    },
    cleanupChat: (state) => {
      state.chatRooms = [];
      state.currentChatRoomId = null;
      state.currentChatRoom = null;
      state.messages = [];
      state.isConnected = false;
      state.connectionState = "disconnected";
    },
  },
  extraReducers: (builder) => {
    builder
      // Получение комнат пользователя
      .addCase(fetchUserChatRooms.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserChatRooms.fulfilled, (state, action) => {
        state.loading = false;
        state.chatRooms = action.payload;
      })
      .addCase(fetchUserChatRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Инициализация SignalR
      .addCase(initializeSignalR.pending, (state) => {
        state.connectionState = "connecting";
      })
      .addCase(initializeSignalR.fulfilled, (state) => {
        state.isConnected = true;
        state.connectionState = "connected";
      })
      .addCase(initializeSignalR.rejected, (state, action) => {
        state.isConnected = false;
        state.connectionState = "disconnected";
        state.error = action.payload;
      })
      // Отправка сообщения
      .addCase(sendMessageSignalR.pending, (state) => {
        state.sendingMessage = true;
      })
      .addCase(sendMessageSignalR.fulfilled, (state) => {
        state.sendingMessage = false;
      })
      .addCase(sendMessageSignalR.rejected, (state, action) => {
        state.sendingMessage = false;
        state.error = action.payload;
      })
      // Загрузка дополнительных сообщений
      .addCase(loadMoreMessagesSignalR.pending, (state) => {
        state.loadingMore = true;
      })
      .addCase(loadMoreMessagesSignalR.fulfilled, (state, action) => {
        state.loadingMore = false;
        if (action.payload.messages) {
          state.messages = [...action.payload.messages, ...state.messages];
        }
      })
      .addCase(loadMoreMessagesSignalR.rejected, (state, action) => {
        state.loadingMore = false;
        state.error = action.payload;
      });
  },
});

export const {
  setCurrentChatRoom,
  addMessage,
  updateMessageStatus,
  clearChat,
  setConnectionState,
  cleanupChat,
} = chatSlice.actions;

export const selectChatRooms = (state) => state.chat.chatRooms;
export const selectCurrentChatRoomId = (state) => state.chat.currentChatRoomId;
export const selectCurrentChatRoom = (state) => state.chat.currentChatRoom;
export const selectMessages = (state) => state.chat.messages;
export const selectIsConnected = (state) => state.chat.isConnected;
export const selectConnectionState = (state) => state.chat.connectionState;
export const selectIsLoading = (state) => state.chat.loading;
export const selectIsSendingMessage = (state) => state.chat.sendingMessage;
export const selectIsLoadingMore = (state) => state.chat.loadingMore;
export const selectChatError = (state) => state.chat.error;

export const checkConnectionStatus = () => (dispatch, getState) => {
  const state = getState();
  const isConnected = chatService.isConnected();

  if (isConnected && !state.chat.isConnected) {
    dispatch(setConnectionState("connected"));
  } else if (!isConnected && state.chat.isConnected) {
    dispatch(setConnectionState("disconnected"));
  }

  return isConnected;
};

export default chatSlice.reducer;
