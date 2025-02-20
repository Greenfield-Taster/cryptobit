import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import AuthService from "../../auth/services/auth.service";

const API_URL =
  "https://cryptobit-telegram-bot-hxa2gdhufnhtfbfs.germanywestcentral-01.azurewebsites.net/api";

export const createExchangeRequest = createAsyncThunk(
  "exchange/createRequest",
  async (requestData, { rejectWithValue }) => {
    try {
      const token = AuthService.getToken();
      if (!token) {
        return rejectWithValue("Authorization required");
      }

      const response = await fetch(`${API_URL}/send-form`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(
          errorData.message || "Failed to create exchange request"
        );
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(
        error.message || "Error submitting exchange request"
      );
    }
  }
);

export const getExchangeRequest = createAsyncThunk(
  "exchange/getRequest",
  async (requestId, { rejectWithValue }) => {
    try {
      const token = AuthService.getToken();
      if (!token) {
        return rejectWithValue("Authorization required");
      }

      const response = await fetch(`${API_URL}/request/${requestId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(
          errorData.message || "Failed to get exchange request"
        );
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message || "Error getting exchange request");
    }
  }
);

const initialState = {
  currentExchange: null,
  requestStatus: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  requestId: null,
  error: null,
};

const exchangeSlice = createSlice({
  name: "exchange",
  initialState,
  reducers: {
    setCurrentExchange: (state, action) => {
      state.currentExchange = action.payload;
    },
    clearCurrentExchange: (state) => {
      state.currentExchange = null;
      state.requestId = null;
      state.requestStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createExchangeRequest.pending, (state) => {
        state.requestStatus = "loading";
        state.error = null;
      })
      .addCase(createExchangeRequest.fulfilled, (state, action) => {
        state.requestStatus = "succeeded";
        state.requestId = action.payload.requestId;
        state.error = null;
      })
      .addCase(createExchangeRequest.rejected, (state, action) => {
        state.requestStatus = "failed";
        state.error = action.payload;
      });

    builder
      .addCase(getExchangeRequest.pending, (state) => {
        state.requestStatus = "loading";
      })
      .addCase(getExchangeRequest.fulfilled, (state, action) => {
        state.requestStatus = "succeeded";
        state.currentExchange = action.payload.data;
      })
      .addCase(getExchangeRequest.rejected, (state, action) => {
        state.requestStatus = "failed";
        state.error = action.payload;
      });
  },
});

export const { setCurrentExchange, clearCurrentExchange } =
  exchangeSlice.actions;

export const selectCurrentExchange = (state) =>
  state.exchange?.currentExchange || null;
export const selectExchangeStatus = (state) => state.exchange.requestStatus;
export const selectExchangeError = (state) => state.exchange.error;
export const selectRequestId = (state) => state.exchange.requestId;

export default exchangeSlice.reducer;
