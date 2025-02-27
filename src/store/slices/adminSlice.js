import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchUsers = createAsyncThunk(
  "admin/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("Ошибка при загрузке пользователей");
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.message || "Ошибка при загрузке пользователей"
      );
    }
  }
);

export const fetchOrders = createAsyncThunk(
  "admin/fetchOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/admin/orders");
      if (!response.ok) {
        throw new Error("Ошибка при загрузке заявок");
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || "Ошибка при загрузке заявок");
    }
  }
);

export const confirmOrder = createAsyncThunk(
  "admin/confirmOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Ошибка при подтверждении заявки");
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.message || "Ошибка при подтверждении заявки"
      );
    }
  }
);

export const fetchStats = createAsyncThunk(
  "admin/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/admin/stats");
      if (!response.ok) {
        throw new Error("Ошибка при загрузке статистики");
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || "Ошибка при загрузке статистики");
    }
  }
);

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    users: [],
    orders: [],
    stats: {
      totalUsers: 0,
      totalOrders: 0,
      completedOrders: 0,
      pendingOrders: 0,
      todayOrders: 0,
      weeklyVolume: 0,
    },
    currentOrder: null,
    loading: false,
    error: null,
  },
  reducers: {
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(confirmOrder.fulfilled, (state, action) => {
        const index = state.orders.findIndex(
          (order) => order._id === action.payload._id
        );
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        if (
          state.currentOrder &&
          state.currentOrder._id === action.payload._id
        ) {
          state.currentOrder = action.payload;
        }
      })

      .addCase(fetchStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentOrder, clearCurrentOrder } = adminSlice.actions;
export default adminSlice.reducer;
