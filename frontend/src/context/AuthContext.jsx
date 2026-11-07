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
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    await apiClient.post('/auth/logout').catch(() => {});
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;
    const handleGlobalLogout = () => {
      if (active) setUser(null);
    };
    window.addEventListener('auth-logout', handleGlobalLogout);
    const hasSessionMarker = document.cookie.split('; ').some(cookie => cookie.startsWith('csrfToken='));
    if (!hasSessionMarker) {
      setLoading(false);
      return () => {
        active = false;
        window.removeEventListener('auth-logout', handleGlobalLogout);
      };
    }
    apiClient.get('/auth/me')
      .then(response => { if (active) setUser(response.user); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => {
      active = false;
      window.removeEventListener('auth-logout', handleGlobalLogout);
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { user: receivedUser } = response;
      setUser(receivedUser);
      setLoading(false);
      return receivedUser;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (details) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/register', details);
      const { user: receivedUser } = response;
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
        setUser(updatedUser);
      }
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    changePassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
