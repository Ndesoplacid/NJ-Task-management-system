import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Configure Axios defaults
let apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Defensive check: ensure the URL always ends with '/api' for backend compatibility
if (apiURL && !apiURL.endsWith('/api') && !apiURL.endsWith('/api/')) {
  apiURL = apiURL.endsWith('/') ? `${apiURL}api` : `${apiURL}/api`;
}
axios.defaults.baseURL = apiURL;
axios.defaults.withCredentials = true; // Send HttpOnly cookie automatically

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'signup'

  // Verify active user session on startup
  const checkSession = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      // User is not logged in, ignore error logs on boot
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setAuthError(null);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    setAuthError(null);
  };

  const registerUser = async (username, email, password) => {
    try {
      setAuthError(null);
      const response = await axios.post('/auth/register', { username, email, password });
      if (response.data.success) {
        setUser(response.data.user);
        closeAuthModal();
        return { success: true };
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Registration failed';
      setAuthError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const loginUser = async (email, password) => {
    try {
      setAuthError(null);
      const response = await axios.post('/auth/login', { email, password });
      if (response.data.success) {
        setUser(response.data.user);
        closeAuthModal();
        return { success: true };
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Login failed';
      setAuthError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const forgotPassword = async (email) => {
    try {
      setAuthError(null);
      const response = await axios.post('/auth/forgotpassword', { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Password recovery request failed';
      setAuthError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const resetPassword = async (token, password) => {
    try {
      setAuthError(null);
      const response = await axios.put(`/auth/resetpassword/${token}`, { password });
      if (response.data.success) {
        setUser(response.data.user);
        closeAuthModal();
        return { success: true };
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Password reset failed';
      setAuthError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const logoutUser = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      // Always clear user locally even if backend cookie removal errors out
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        authModalOpen,
        authModalMode,
        setAuthModalMode,
        openAuthModal,
        closeAuthModal,
        registerUser,
        loginUser,
        logoutUser,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthContext;
