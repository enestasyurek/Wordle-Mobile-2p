import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
const AuthContext = createContext();

// Configure axios defaults - don't set baseURL here since we use full URLs

// Add token to requests if it exists
axios.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token expiration
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const API_URL = __DEV__ ? 'https://twopwordle-server.onrender.com' : 'https://twopwordle-server.onrender.com';
          const response = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
          const { accessToken } = response.data;
          await AsyncStorage.setItem('accessToken', accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          
          // Update token in context if AuthContext is available
          if (window._authContext) {
            window._authContext.setToken(accessToken);
          }
          
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      }
    }
    
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Make setToken available globally for axios interceptor
  useEffect(() => {
    window._authContext = { setToken };
    return () => {
      delete window._authContext;
    };
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('user');
        const accessToken = await AsyncStorage.getItem('accessToken');
        
        if (savedUser && accessToken) {
          try {
            // Verify token is still valid
            const API_URL = __DEV__ ? 'https://twopwordle-server.onrender.com' : 'https://twopwordle-server.onrender.com';
            const response = await axios.get(`${API_URL}/api/auth/verify`, {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            setUser(response.data.user);
            setToken(accessToken);
          } catch (error) {
            // Token is invalid, clear storage
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);

  const register = async (username, email, password) => {
    try {
      setError(null);
      const API_URL = __DEV__ ? 'https://twopwordle-server.onrender.com' : 'https://twopwordle-server.onrender.com';
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        username,
        email,
        password,
        platform: 'mobile'
      });
      
      const { user, accessToken, refreshToken } = response.data;
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      setToken(accessToken);
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const login = async (username, password) => {
    try {
      setError(null);
      const API_URL = __DEV__ ? 'https://twopwordle-server.onrender.com' : 'https://twopwordle-server.onrender.com';
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        username,
        password,
        platform: 'mobile'
      });
      
      const { user, accessToken, refreshToken } = response.data;
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      setToken(accessToken);
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        const API_URL = __DEV__ ? 'https://twopwordle-server.onrender.com' : 'https://twopwordle-server.onrender.com';
        await axios.post(`${API_URL}/api/auth/logout`, { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear AsyncStorage and state
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      setUser(null);
      setToken(null);
    }
  };

  const updateProfile = async (updates) => {
    try {
      setError(null);
      const API_URL = __DEV__ ? 'https://twopwordle-server.onrender.com' : 'https://twopwordle-server.onrender.com';
      const currentToken = await AsyncStorage.getItem('accessToken');
      const response = await axios.put(`${API_URL}/api/users/profile`, updates, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      const { user } = response.data;
      
      // Update AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Profile update failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const getStats = async () => {
    try {
      const API_URL = __DEV__ ? 'https://twopwordle-server.onrender.com' : 'https://twopwordle-server.onrender.com';
      const currentToken = await AsyncStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/users/stats`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      return response.data.stats;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return null;
    }
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    getStats,
    isAuthenticated: !!user,
    token
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};