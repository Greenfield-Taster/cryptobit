import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import exchangeReducer from "./slices/exchangeSlice";
import adminReducer from "./slices/adminSlice";
import chatReducer from "./slices/chatSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    exchange: exchangeReducer,
    admin: adminReducer,
    chat: chatReducer,
  },
});

export default store;
