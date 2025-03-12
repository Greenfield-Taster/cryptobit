import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import AuthService from "../../services/auth.service";

const API_URL =
  "https://cryptobit-telegram-bot-hxa2gdhufnhtfbfs.germanywestcentral-01.azurewebsites.net/api";

export const createExchangeRequest = createAsyncThunk(
  "exchange/createExchangeRequest",
  async (exchangeData, { rejectWithValue }) => {
    try {
      const token = AuthService.getToken();

      if (!token) {
        return rejectWithValue("Authorization required");
      }

      const requestData = {
        ...exchangeData,
        promoCode: exchangeData.promoCode?.code || exchangeData.promoCode,
      };

      const response = await fetch(`${API_URL}/send-form`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!data.success) {
        return rejectWithValue(
          data.message || "Failed to create exchange request"
        );
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || "An error occurred");
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

export const getExchangeStatus = createAsyncThunk(
  "exchange/getStatus",
  async (orderId, { rejectWithValue }) => {
    try {
      const token = AuthService.getToken();
      const response = await fetch(`${API_URL}/request/${orderId}/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to get status");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const validatePromoCode = createAsyncThunk(
  "exchange/validatePromoCode",
  async (code, { rejectWithValue }) => {
    try {
      const token = AuthService.getToken();

      if (!token) {
        return rejectWithValue("Authorization required");
      }

      const response = await fetch(`${API_URL}/promocodes/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!data.success) {
        return rejectWithValue(data.message || "Invalid promo code");
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || "An error occurred");
    }
  }
);

export const getUserPromoCodes = createAsyncThunk(
  "exchange/getUserPromoCodes",
  async (_, { rejectWithValue }) => {
    try {
      const token = AuthService.getToken();

      if (!token) {
        return rejectWithValue("Authorization required");
      }

      const response = await fetch(`${API_URL}/promocodes/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        return rejectWithValue(data.message || "Failed to fetch promo codes");
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || "An error occurred");
    }
  }
);

const initialState = {
  currentExchange: null,
  requestStatus: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  requestId: null,
  error: null,
  promoCode: null,
  promoCodeStatus: "idle",
  promoCodeError: null,
  userPromoCodes: [],
  userPromoCodesStatus: "idle",
  userPromoCodesError: null,
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
    resetPromoCode: (state) => {
      state.promoCode = null;
      state.promoCodeStatus = "idle";
      state.promoCodeError = null;
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
      })
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
      })
      .addCase(getExchangeStatus.fulfilled, (state, action) => {
        if (state.currentExchange) {
          state.currentExchange.status = action.payload.status;
          state.currentExchange.completedAt = action.payload.completedAt;
        }
      })
      .addCase(validatePromoCode.pending, (state) => {
        state.promoCodeStatus = "loading";
        state.promoCodeError = null;
      })
      .addCase(validatePromoCode.fulfilled, (state, action) => {
        state.promoCodeStatus = "succeeded";
        state.promoCode = action.payload;
      })
      .addCase(validatePromoCode.rejected, (state, action) => {
        state.promoCodeStatus = "failed";
        state.promoCodeError = action.payload;
      })
      .addCase(getUserPromoCodes.pending, (state) => {
        state.userPromoCodesStatus = "loading";
        state.userPromoCodesError = null;
      })
      .addCase(getUserPromoCodes.fulfilled, (state, action) => {
        state.userPromoCodesStatus = "succeeded";
        state.userPromoCodes = action.payload;
      })
      .addCase(getUserPromoCodes.rejected, (state, action) => {
        state.userPromoCodesStatus = "failed";
        state.userPromoCodesError = action.payload;
      });
  },
});

export const { setCurrentExchange, clearCurrentExchange, resetPromoCode } =
  exchangeSlice.actions;

export const selectCurrentExchange = (state) =>
  state.exchange?.currentExchange || null;
export const selectExchangeStatus = (state) => state.exchange.requestStatus;
export const selectExchangeError = (state) => state.exchange.error;
export const selectPromoCode = (state) => state.exchange.promoCode;
export const selectPromoCodeStatus = (state) => state.exchange.promoCodeStatus;
export const selectPromoCodeError = (state) => state.exchange.promoCodeError;
export const selectUserPromoCodes = (state) => state.exchange.userPromoCodes;
export const selectUserPromoCodesStatus = (state) =>
  state.exchange.userPromoCodesStatus;
export const selectUserPromoCodesError = (state) =>
  state.exchange.userPromoCodesError;

export default exchangeSlice.reducer;
