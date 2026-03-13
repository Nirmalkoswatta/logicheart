import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/users`;
const storedUser = localStorage.getItem('user')
  ? JSON.parse(localStorage.getItem('user'))
  : null;

const persistCurrentUser = (user) => {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
};

const getAuthToken = (getState) => getState().user.currentUser?.token || storedUser?.token;

const getAuthConfig = (getState) => {
  const token = getAuthToken(getState);

  return token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : {};
};

const mergeCurrentUser = (state, payload) => {
  const nextUser = {
    ...(state.currentUser || {}),
    ...(payload || {}),
  };

  if (!nextUser.token && state.currentUser?.token) {
    nextUser.token = state.currentUser.token;
  }

  state.currentUser = nextUser;
  persistCurrentUser(nextUser);
};

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

      const responseData = error.response?.data;

      const normalizedErrorMessage = typeof responseData === 'string'
        ? responseData
        : responseData?.message ||
        responseData?.error?.message ||
        responseData?.error ||
        error.message ||
        'Registration failed';

      return rejectWithValue(normalizedErrorMessage);
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
  async (userId, { rejectWithValue, getState }) => {
    try {
      const { user } = getState();
      const playtime = user.loginAt ? Math.floor((Date.now() - user.loginAt) / 1000) : null;
      const response = await axios.put(`${API_URL}/${userId}/reset`, { playtime });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reset game');
    }
  }
);

// Keep presence current for online-user tracking
export const syncPresence = createAsyncThunk(
  'user/presence',
  async (userId, { rejectWithValue, getState }) => {
    try {
      const response = await axios.put(`${API_URL}/${userId}/presence`, {}, getAuthConfig(getState));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to sync presence');
    }
  }
);

// Logout User
export const logoutUser = createAsyncThunk(
  'user/logoutUser',
  async (_, { getState }) => {
    const { user } = getState();
    const userId = user.currentUser?._id || storedUser?._id;

    if (!userId) {
      return { backendRecorded: false, reason: 'NO_ACTIVE_USER' };
    }

    const sessionDurationSecs = user.loginAt
      ? Math.max(0, Math.floor((Date.now() - user.loginAt) / 1000))
      : null;

    try {
      await axios.post(
        `${API_URL}/${userId}/logout`,
        { sessionDurationSecs },
        getAuthConfig(getState)
      );

      return { backendRecorded: true };
    } catch (error) {
      const status = error.response?.status;

      // Session can already be invalid/expired by the time user clicks logout.
      if (status === 401 || status === 403 || status === 404) {
        return { backendRecorded: false, reason: 'SESSION_NOT_ACTIVE' };
      }

      return {
        backendRecorded: false,
        reason: 'NETWORK_OR_SERVER_ERROR',
      };
    }
  }
);

// Update Password
export const updatePassword = createAsyncThunk(
  'user/updatePassword',
  async ({ userId, currentPassword, newPassword }, { rejectWithValue, getState }) => {
    try {
      const response = await axios.put(
        `${API_URL}/${userId}/password`,
        { currentPassword, newPassword },
        getAuthConfig(getState)
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update password');
    }
  }
);

// Delete User
export const deleteUser = createAsyncThunk(
  'user/delete',
  async (userId, { rejectWithValue, getState }) => {
    try {
      const { user } = getState();
      const sessionDurationSecs = user.loginAt
        ? Math.max(0, Math.floor((Date.now() - user.loginAt) / 1000))
        : null;

      await axios.delete(`${API_URL}/${userId}`, {
        ...getAuthConfig(getState),
        data: { sessionDurationSecs },
      });

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
      mergeCurrentUser(state, action.payload);
    })
    .addCase(thunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || action.error.message;
    });
};

const initialState = {
  currentUser: storedUser,
  loginAt: storedUser?.lastLoginAt ? Date.parse(storedUser.lastLoginAt) : null,
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
      state.loginAt = null;
      state.loading = false;
      state.error = null;
      persistCurrentUser(null);
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

    // verifyUser and loginUser handled explicitly below to also capture loginAt
    userHelpers(builder, fetchUser);
    userHelpers(builder, updateScore);
    userHelpers(builder, reduceAttempts);
    userHelpers(builder, resetGame);

    // Set loginAt on login and OTP verification
    builder
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        mergeCurrentUser(state, action.payload);
        state.loginAt = action.payload?.lastLoginAt ? Date.parse(action.payload.lastLoginAt) : Date.now();
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(verifyUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(verifyUser.fulfilled, (state, action) => {
        state.loading = false;
        mergeCurrentUser(state, action.payload);
        state.loginAt = action.payload?.lastLoginAt ? Date.parse(action.payload.lastLoginAt) : Date.now();
      })
      .addCase(verifyUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(syncPresence.fulfilled, (state, action) => {
        if (state.currentUser) {
          mergeCurrentUser(state, action.payload);
          if (!state.loginAt && action.payload?.lastLoginAt) {
            state.loginAt = Date.parse(action.payload.lastLoginAt);
          }
        }
      })
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.currentUser = null;
        state.loginAt = null;
        state.loading = false;
        persistCurrentUser(null);
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(updatePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePassword.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.user) {
          mergeCurrentUser(state, action.payload.user);
        }
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state) => {
        state.currentUser = null;
        state.loginAt = null;
        state.loading = false;
        persistCurrentUser(null);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });

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
        (state) => {
          state.loading = state.adminUsers.length === 0 && state.activityLogs.length === 0;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith('admin/') && action.type.endsWith('/rejected'),
        (state, action) => { state.loading = false; state.error = action.payload; }
      );
  },
});

export const { logout, clearError } = userSlice.actions;
export default userSlice.reducer;
