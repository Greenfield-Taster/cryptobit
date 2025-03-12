import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import adminService from "../../services/admin.service";

const initialState = {
  promoCodes: [],
  promoCodesStatus: "idle",
  promoCodesError: null,
  promoCodeDetails: null,
  promoCodeDetailsStatus: "idle",
  promoCodeDetailsError: null,
  createPromoCodeStatus: "idle",
  createPromoCodeError: null,
  deletePromoCodeStatus: "idle",
  deletePromoCodeError: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  },
};

export const getPromoCodes = createAsyncThunk(
  "admin/getPromoCodes",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await adminService.promoCodeService.getPromoCodes(
        params.page || 1,
        params.limit || 10,
        params.search || "",
        params.status || ""
      );

      if (response.data.success) {
        return response.data.data;
      } else {
        return rejectWithValue(
          response.data.message || "Failed to fetch promo codes"
        );
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "An error occurred"
      );
    }
  }
);

export const getPromoCodeById = createAsyncThunk(
  "admin/getPromoCodeById",
  async (promoCodeId, { rejectWithValue }) => {
    try {
      const response = await adminService.promoCodeService.getPromoCodeById(
        promoCodeId
      );

      if (response.data.success) {
        return response.data.data;
      } else {
        return rejectWithValue(
          response.data.message || "Failed to fetch promo code details"
        );
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "An error occurred"
      );
    }
  }
);

export const createPromoCode = createAsyncThunk(
  "admin/createPromoCode",
  async (promoCodeData, { rejectWithValue }) => {
    try {
      const response = await adminService.promoCodeService.createPromoCode(
        promoCodeData
      );

      if (response.data.success) {
        return response.data.data;
      } else {
        return rejectWithValue(
          response.data.message || "Failed to create promo code"
        );
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "An error occurred"
      );
    }
  }
);

export const deletePromoCode = createAsyncThunk(
  "admin/deletePromoCode",
  async (promoCodeId, { rejectWithValue }) => {
    try {
      const response = await adminService.promoCodeService.deletePromoCode(
        promoCodeId
      );

      if (response.data.success) {
        return promoCodeId;
      } else {
        return rejectWithValue(
          response.data.message || "Failed to delete promo code"
        );
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "An error occurred"
      );
    }
  }
);

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearPromoCodeDetails: (state) => {
      state.promoCodeDetails = null;
      state.promoCodeDetailsStatus = "idle";
    },
    resetPromoCodeStatuses: (state) => {
      state.createPromoCodeStatus = "idle";
      state.createPromoCodeError = null;
      state.deletePromoCodeStatus = "idle";
      state.deletePromoCodeError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPromoCodes.pending, (state) => {
        state.promoCodesStatus = "loading";
        state.promoCodesError = null;
      })
      .addCase(getPromoCodes.fulfilled, (state, action) => {
        state.promoCodesStatus = "succeeded";
        state.promoCodes = action.payload.promoCodes;
        state.pagination = action.payload.pagination;
      })
      .addCase(getPromoCodes.rejected, (state, action) => {
        state.promoCodesStatus = "failed";
        state.promoCodesError = action.payload;
      })
      .addCase(getPromoCodeById.pending, (state) => {
        state.promoCodeDetailsStatus = "loading";
        state.promoCodeDetailsError = null;
      })
      .addCase(getPromoCodeById.fulfilled, (state, action) => {
        state.promoCodeDetailsStatus = "succeeded";
        state.promoCodeDetails = action.payload;
      })
      .addCase(getPromoCodeById.rejected, (state, action) => {
        state.promoCodeDetailsStatus = "failed";
        state.promoCodeDetailsError = action.payload;
      })
      .addCase(createPromoCode.pending, (state) => {
        state.createPromoCodeStatus = "loading";
        state.createPromoCodeError = null;
      })
      .addCase(createPromoCode.fulfilled, (state) => {
        state.createPromoCodeStatus = "succeeded";
      })
      .addCase(createPromoCode.rejected, (state, action) => {
        state.createPromoCodeStatus = "failed";
        state.createPromoCodeError = action.payload;
      })
      .addCase(deletePromoCode.pending, (state) => {
        state.deletePromoCodeStatus = "loading";
        state.deletePromoCodeError = null;
      })
      .addCase(deletePromoCode.fulfilled, (state, action) => {
        state.deletePromoCodeStatus = "succeeded";
        state.promoCodes = state.promoCodes.filter(
          (code) => code._id !== action.payload
        );
      })
      .addCase(deletePromoCode.rejected, (state, action) => {
        state.deletePromoCodeStatus = "failed";
        state.deletePromoCodeError = action.payload;
      });
  },
});

export const { clearPromoCodeDetails, resetPromoCodeStatuses } =
  adminSlice.actions;

export const selectPromoCodes = (state) => state.admin.promoCodes;
export const selectPromoCodesStatus = (state) => state.admin.promoCodesStatus;
export const selectPromoCodesError = (state) => state.admin.promoCodesError;
export const selectPromoCodeDetails = (state) => state.admin.promoCodeDetails;
export const selectPromoCodeDetailsStatus = (state) =>
  state.admin.promoCodeDetailsStatus;
export const selectCreatePromoCodeStatus = (state) =>
  state.admin.createPromoCodeStatus;
export const selectCreatePromoCodeError = (state) =>
  state.admin.createPromoCodeError;
export const selectDeletePromoCodeStatus = (state) =>
  state.admin.deletePromoCodeStatus;
export const selectDeletePromoCodeError = (state) =>
  state.admin.deletePromoCodeError;
export const selectPagination = (state) => state.admin.pagination;

export default adminSlice.reducer;
