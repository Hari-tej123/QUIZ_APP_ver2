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
    try {
      localStorage.removeItem('quizzify_has_session');
      localStorage.removeItem('quizzify_csrf_token');
    } catch {}
    await apiClient.post('/auth/logout').catch(() => {});
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;
    const handleGlobalLogout = () => {
      try {
        localStorage.removeItem('quizzify_has_session');
        localStorage.removeItem('quizzify_csrf_token');
      } catch {}
      if (active) setUser(null);
    };
    window.addEventListener('auth-logout', handleGlobalLogout);

    // Verify session on mount (handles page refresh, cross-domain cookies, and OAuth redirects)
    apiClient.get('/auth/me')
      .then(response => {
        if (active) {
          setUser(response.user);
          try {
            localStorage.setItem('quizzify_has_session', 'true');
          } catch {}
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
          try {
            localStorage.removeItem('quizzify_has_session');
            localStorage.removeItem('quizzify_csrf_token');
          } catch {}
        }
      })
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
      try {
        localStorage.setItem('quizzify_has_session', 'true');
      } catch {}
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
      try {
        localStorage.setItem('quizzify_has_session', 'true');
      } catch {}
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
