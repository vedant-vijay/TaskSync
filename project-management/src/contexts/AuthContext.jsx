// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

// ✅ Named export only
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      if (token) {
        await fetchProfile();
      } else {
        setLoading(false);
      }
    };
    initialize();
  }, [token]);

  const fetchProfile = async () => {
    try {
      const response = await authService.getProfile();
      const userData = response.user || response.data; // safe
      setUser(userData);
    } catch (err) {
      console.error('Profile fetch error:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    const userData = response.user || response.data;

    setToken(response.token);
    localStorage.setItem('token', response.token);
    setUser(userData);
  };

  const register = async (name, email, password, role) => {
    const response = await authService.register(name, email, password, role);
    const userData = response.user || response.data;

    setToken(response.token);
    localStorage.setItem('token', response.token);
    setUser(userData);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
