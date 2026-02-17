import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/users`;

// --- Async Thunks ---

// Register User
export const registerUser = createAsyncThunk(
  'user/register',
  async (userData, { rejectWithValue }) => {
    try {
      // POST /api/users
      const response = await axios.post(`${API_URL}`, userData);
      // Do NOT save to local storage yet, because they are not verified
      return response.data; 
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'User already exists');
    }
  }
);

// Verify OTP
export const verifyUser = createAsyncThunk(
  'user/verify',
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/verify-otp`, { email, otp });
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Verification failed');
    }
  }
);

// Resend OTP
export const resendOtp = createAsyncThunk(
  'user/resendOtp',
  async (email, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/resend-otp`, { email });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to resend OTP');
    }
  }
);

// Login User
export const loginUser = createAsyncThunk(
  'user/login',
  async (userData, { rejectWithValue }) => {
    try {
      // POST /api/users/login
      const response = await axios.post(`${API_URL}/login`, userData);
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

// Get User (e.g., on page reload)
export const fetchUser = createAsyncThunk(
  'user/fetch',
  async (userId, { rejectWithValue }) => {
    try {
      // GET /api/users/:id
      const response = await axios.get(`${API_URL}/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
    }
  }
);

// Update Score (Add Points)
export const updateScore = createAsyncThunk(
  'user/updateScore',
  async ({ userId, points, carrots, hearts }, { rejectWithValue }) => {
    try {
      // PUT /api/users/:id/score
      const response = await axios.put(`${API_URL}/${userId}/score`, { points, carrots, hearts });
      return response.data; // Returns updated user object
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Reduce Attempts (Wrong Answer)
export const reduceAttempts = createAsyncThunk(
  'user/reduceAttempts',
  async (userId, { rejectWithValue }) => {
    try {
      // PUT /api/users/:id/wrong
      const response = await axios.put(`${API_URL}/${userId}/wrong`);
      return response.data; // Returns updated user object
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reduce attempts');
    }
  }
);

// Reset Game (Sudden Death Restart)
export const resetGame = createAsyncThunk(
  'user/reset',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/${userId}/reset`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reset game');
    }
  }
);

// Delete User
export const deleteUser = createAsyncThunk(
  'user/delete',
  async (userId, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/${userId}`);
      localStorage.removeItem('user');
      return userId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
    }
  }
);

// --- Slice ---

const userHelpers = (builder, thunk) => {
    builder
      .addCase(thunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(thunk.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(thunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
};

const initialState = {
  currentUser: localStorage.getItem('user')
    ? JSON.parse(localStorage.getItem('user'))
    : null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    logout: (state) => {
      state.currentUser = null;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('user');
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Explicitly handle registerUser to avoid logging in immediately
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        // Do not set currentUser
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Handle resendOtp explicitly
    builder
      .addCase(resendOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendOtp.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    userHelpers(builder, verifyUser);
    userHelpers(builder, loginUser);
    userHelpers(builder, fetchUser);
    userHelpers(builder, updateScore);
    userHelpers(builder, reduceAttempts);
    userHelpers(builder, resetGame);
    
    // Custom handler for delete to ensure cleanup
    builder
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteUser.fulfilled, (state) => {
        state.loading = false;
        state.currentUser = null;
        state.error = null;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError } = userSlice.actions;
export default userSlice.reducer;
