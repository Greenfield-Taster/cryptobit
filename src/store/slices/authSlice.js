import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import AuthService from "../../services/auth.service";

const initialState = {
  isAuthenticated: !!localStorage.getItem("token"),
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("token") || null,
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  tokenExpiration: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await AuthService.login(email, password);
      if (!response.success) {
        return rejectWithValue(response.message || "Login failed");
      }
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Login failed");
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async ({ email, password, name, phone }, { rejectWithValue }) => {
    try {
      const response = await AuthService.register(email, password, name, phone);
      if (!response.success) {
        return rejectWithValue(response.message || "Registration failed");
      }
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Registration failed");
    }
  }
);

export const logout = createAsyncThunk("auth/logout", async () => {
  AuthService.logout();
  return null;
});

export const getUserOrders = createAsyncThunk(
  "auth/getUserOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await AuthService.getUserOrders();
      if (!response.success) {
        return rejectWithValue(response.message || "Failed to get orders");
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to get orders");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    checkAuthState: (state) => {
      const token = AuthService.getToken();
      const user = AuthService.getCurrentUser();
      state.isAuthenticated = !!token;
      state.user = user;
      state.token = token;
    },
    setTokenExpiration: (state, action) => {
      state.tokenExpiration = action.payload;
    },
    checkTokenExpiration: (state) => {
      if (
        state.tokenExpiration &&
        new Date() > new Date(state.tokenExpiration)
      ) {
        state.token = null;
        state.isAuthenticated = false;
        state.user = null;
        localStorage.removeItem("token");
        localStorage.removeItem("tokenExpiration");
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;

        if (action.payload.expiresIn) {
          const expirationTime = new Date(
            new Date().getTime() + action.payload.expiresIn * 1000
          );
          state.tokenExpiration = expirationTime.toISOString();
          localStorage.setItem("tokenExpiration", expirationTime.toISOString());
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Login failed";
      });

    builder
      .addCase(register.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Registration failed";
      });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.status = "idle";
      state.error = null;
    });

    // Get user orders
    builder
      .addCase(getUserOrders.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getUserOrders.fulfilled, (state, action) => {
        state.status = "succeeded";
        const orders = action.payload.data || action.payload;

        if (state.user) {
          state.user = {
            ...state.user,
            orders: orders,
          };
        }

        state.orders = orders;
      })
      .addCase(getUserOrders.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { checkAuthState, checkTokenExpiration, setTokenExpiration } =
  authSlice.actions;

export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUser = (state) => state.auth.user;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
export const selectUserOrders = (state) =>
  state.auth.orders || state.auth.user?.orders || [];

export default authSlice.reducer;
