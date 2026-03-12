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
      console.log('Registering user:', userData);
      // POST /api/users
      const response = await axios.post(`${API_URL}`, userData);
      console.log('Registration response:', response.data);
      // Do NOT save to local storage yet, because they are not verified
      return response.data; 
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error response message:', error.response?.data?.message);
      console.error('Error response error:', error.response?.data?.error);
      
      // Extract the actual error message from the backend
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error || 
        error.message || 
        'Registration failed';
      
      return rejectWithValue(errorMessage);
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
  async ({ userId, points, carrots, hearts, difficulty }, { rejectWithValue }) => {
    try {
      // PUT /api/users/:id/score
      const response = await axios.put(`${API_URL}/${userId}/score`, { points, carrots, hearts, difficulty });
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

// --- Admin Async Thunks ---

// Fetch All Users
export const fetchAllUsers = createAsyncThunk(
  'admin/fetchAllUsers',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { user } = getState();
      const response = await axios.get(`${API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${user.currentUser.token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

// Update Any User (Admin)
export const adminUpdateUser = createAsyncThunk(
  'admin/updateUser',
  async ({ userId, userData }, { getState, rejectWithValue }) => {
    try {
      const { user } = getState();
      const response = await axios.put(`${API_BASE_URL}/admin/users/${userId}`, userData, {
        headers: { Authorization: `Bearer ${user.currentUser.token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user');
    }
  }
);

// Delete Any User (Admin)
export const adminDeleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (userId, { getState, rejectWithValue }) => {
    try {
      const { user } = getState();
      await axios.delete(`${API_BASE_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${user.currentUser.token}` }
      });
      return userId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
    }
  }
);

// Fetch Activity Logs
export const fetchActivityLogs = createAsyncThunk(
  'admin/fetchLogs',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { user } = getState();
      const response = await axios.get(`${API_BASE_URL}/admin/logs`, {
        headers: { Authorization: `Bearer ${user.currentUser.token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch logs');
    }
  }
);

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
  adminUsers: [],
  activityLogs: [],
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
    
    // Admin Handlers
    builder
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.adminUsers = action.payload;
        state.loading = false;
      })
      .addCase(adminUpdateUser.fulfilled, (state, action) => {
        state.adminUsers = state.adminUsers.map(u => 
          u._id === action.payload._id ? action.payload : u
        );
        state.loading = false;
      })
      .addCase(adminDeleteUser.fulfilled, (state, action) => {
        state.adminUsers = state.adminUsers.filter(u => u._id !== action.payload);
        state.loading = false;
      })
      .addCase(fetchActivityLogs.fulfilled, (state, action) => {
        state.activityLogs = action.payload;
        state.loading = false;
      })
      // Add pending/rejected for admin actions if needed, or use a general helper
      .addMatcher(
        (action) => action.type.startsWith('admin/') && action.type.endsWith('/pending'),
        (state) => { state.loading = true; state.error = null; }
      )
      .addMatcher(
        (action) => action.type.startsWith('admin/') && action.type.endsWith('/rejected'),
        (state, action) => { state.loading = false; state.error = action.payload; }
      );
  },
});

export const { logout, clearError } = userSlice.actions;
export default userSlice.reducer;
