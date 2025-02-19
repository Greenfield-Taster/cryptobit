import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const initialState = {
  transactions: [],
  status: "idle",
  error: null,
};

// Здесь будут асинхронные thunks для работы с транзакциями

const transactionsSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Здесь будет обработка асинхронных actions
  },
});

export default transactionsSlice.reducer;
