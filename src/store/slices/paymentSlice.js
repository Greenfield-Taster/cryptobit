import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const initialState = {
  currentPayment: null,
  paymentHistory: [],
  status: "idle",
  error: null,
};

// Здесь будут асинхронные thunks для работы с платежами

export const submitPayment = createAsyncThunk(
  "payment/submit",
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await fetch(
        "https://cryptobit-telegram-bot-hxa2gdhufnhtfbfs.germanywestcentral-01.azurewebsites.net/api/send-form",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(
          errorData.message || "Network response was not ok"
        );
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message || "Error submitting payment");
    }
  }
);

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    setCurrentPayment: (state, action) => {
      state.currentPayment = action.payload;
    },
    clearCurrentPayment: (state) => {
      state.currentPayment = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitPayment.pending, (state) => {
        state.status = "loading";
      })
      .addCase(submitPayment.fulfilled, (state, action) => {
        state.status = "succeeded";
        if (action.payload.success) {
          state.paymentHistory.push({
            ...state.currentPayment,
            completedAt: new Date().toISOString(),
          });
        }
      })
      .addCase(submitPayment.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { setCurrentPayment, clearCurrentPayment } = paymentSlice.actions;
export default paymentSlice.reducer;
