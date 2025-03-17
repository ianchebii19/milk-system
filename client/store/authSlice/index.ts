import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = "http://localhost:5000/api/users";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "OPERATOR" | "FARMER";
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  error: null,
};

// **Helper function to extract error message**
const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error) && error.response) {
    return error.response.data?.error || "An unexpected error occurred";
  }
  return "Network error or server is unreachable";
};

// **Register Admin**
export const registerAdmin = createAsyncThunk(
  "users/registerAdmin",
  async (formData: { name: string; email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/register-admin`, formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// **Register Operator**
export const registerOperator = createAsyncThunk(
  "auth/registerOperator",
  async (formData: { name: string; email: string; password: string }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState() as { auth: { token: string } };
      const response = await axios.post(`${API_BASE_URL}/register-operator`, formData, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// **Login User**
export const loginUser = createAsyncThunk(
  "auth/login",
  async (formData: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, formData);
      const { token, user } = response.data;
      Cookies.set("token", token, { expires: 1 });
      return { user, token };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// **Check Authentication Status**
export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const token = Cookies.get("token");
      if (!token) throw new Error("No token found");

      const response = await axios.get(`${API_BASE_URL}/check-auth`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// **Logout User**
export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await axios.post(`${API_BASE_URL}/logout`);
      Cookies.remove("token");
      return null;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // **Handle Register Admin**
      .addCase(registerAdmin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload?.admin || null;
        state.isAuthenticated = !!action.payload?.admin;
      })
      .addCase(registerAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // **Handle Register Operator**
      .addCase(registerOperator.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerOperator.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(registerOperator.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // **Handle Login**
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })

      // **Check Authentication**
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })

      // **Logout**
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;