import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import userReducer from "./slices/userSlice";
import transactionsReducer from "./slices/transactionsSlice";
import paymentReducer from "./slices/paymentSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    transactions: transactionsReducer,
    payment: paymentReducer,
  },
});

export default store;
