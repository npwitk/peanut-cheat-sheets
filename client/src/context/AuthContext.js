import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await authAPI.getCurrentUser();
      setUser(response.data.user);
    } catch (err) {
      console.error('Auth check failed:', err);
      // Only remove token if it's an auth error, not a network error
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('auth_token');
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    authAPI.loginWithGoogle();
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      localStorage.removeItem('auth_token');
      setUser(null);
      window.location.href = '/';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleAuthCallback = async (token) => {
    localStorage.setItem('auth_token', token);
    await checkAuth();
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: !!user?.is_admin,
    isSeller: !!user?.is_seller,
    isStaff: !!user?.is_staff,
    canUpload: !!(user?.is_admin || user?.is_seller),
    canManageApprovals: !!(user?.is_admin || user?.is_staff),
    login,
    logout,
    checkAuth,
    handleAuthCallback,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
