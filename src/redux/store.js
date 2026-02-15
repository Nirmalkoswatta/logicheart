import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';

// Configure the Redux store
// Redux Toolkit automatically sets up the Redux DevTools Extension and Thunk middleware
const store = configureStore({
  reducer: {
    user: userReducer, // Add the user slice reducer
    // Add other reducers here (e.g., game slice)
  },
});

export default store;
