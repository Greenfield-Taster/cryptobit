import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import exchangeReducer from "./slices/exchangeSlice";
import chatReducer from "./slices/chatSlice";
import adminReducer from "./slices/adminSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    exchange: exchangeReducer,
    chat: chatReducer,
    admin: adminReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["chat/initializeSignalR/fulfilled"],
        ignoredPaths: ["chat.connection"],
      },
    }),
});

export default store;
