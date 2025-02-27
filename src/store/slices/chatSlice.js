import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Асинхронные действия
export const fetchChats = createAsyncThunk(
  "chat/fetchChats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/admin/chats");
      if (!response.ok) throw new Error("Ошибка при получении чатов");
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchChatMessages = createAsyncThunk(
  "chat/fetchChatMessages",
  async (chatId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/admin/chats/${chatId}/messages`);
      if (!response.ok) throw new Error("Ошибка при получении сообщений");
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const sendChatMessage = createAsyncThunk(
  "chat/sendMessage",
  async ({ chatId, message }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/admin/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw new Error("Ошибка при отправке сообщения");
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const closeChatByAdmin = createAsyncThunk(
  "chat/closeChat",
  async (chatId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/admin/chats/${chatId}/close`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Ошибка при закрытии чата");
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    chats: [],
    currentChat: null,
    messages: [],
    loading: false,
    error: null,
  },
  reducers: {
    setCurrentChat: (state, action) => {
      state.currentChat = action.payload;
    },
    clearCurrentChat: (state) => {
      state.currentChat = null;
      state.messages = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchChats
      .addCase(fetchChats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.loading = false;
        state.chats = action.payload;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchChatMessages
      .addCase(fetchChatMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchChatMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
      })
      .addCase(fetchChatMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // sendChatMessage
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.messages.push(action.payload);
      })
      // closeChatByAdmin
      .addCase(closeChatByAdmin.fulfilled, (state, action) => {
        const index = state.chats.findIndex(
          (chat) => chat._id === action.payload._id
        );
        if (index !== -1) {
          state.chats[index].status = "closed";
        }
        if (state.currentChat && state.currentChat._id === action.payload._id) {
          state.currentChat.status = "closed";
        }
      });
  },
});

export const { setCurrentChat, clearCurrentChat } = chatSlice.actions;
export default chatSlice.reducer;
