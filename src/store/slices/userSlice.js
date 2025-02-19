import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const initialState = {
  profile: null,
  status: "idle",
  error: null,
};

// Здесь будут асинхронные thunks для получения данных профиля пользователя

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Здесь будет обработка асинхронных actions
  },
});

export default userSlice.reducer;
