import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import exchangeReducer from "./slices/exchangeSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    exchange: exchangeReducer,
  },
});

export default store;
