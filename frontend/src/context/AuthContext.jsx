import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../utils/apiClient';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  // Hydrate state from localStorage on load
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        logout();
      }
    }
    setLoading(false);

    // Global listener for API 401 logouts
    const handleGlobalLogout = () => {
      logout();
    };
    window.addEventListener('auth-logout', handleGlobalLogout);
    return () => {
      window.removeEventListener('auth-logout', handleGlobalLogout);
    };
  }, [logout]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      
      const { token: receivedToken, user: receivedUser } = response;
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));
      
      setToken(receivedToken);
      setUser(receivedUser);
      setLoading(false);
      return receivedUser;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (name, email, password, rollNumber) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/register', { name, email, password, rollNumber });
      
      const { token: receivedToken, user: receivedUser } = response;
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));
      
      setToken(receivedToken);
      setUser(receivedUser);
      setLoading(false);
      return receivedUser;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await apiClient.post('/auth/change-password', { currentPassword, newPassword });
      
      // If user had to change password on first login, update user state
      if (user?.mustChangePassword) {
        const updatedUser = { ...user, mustChangePassword: false };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    changePassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
