import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      const stored = await AsyncStorage.getItem('user');
      const storedDriver = await AsyncStorage.getItem('driver');
      if (stored) setUser(JSON.parse(stored));
      if (storedDriver) setDriver(JSON.parse(storedDriver));
      setLoading(false);
    };
    restore();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    if (data.driver) await AsyncStorage.setItem('driver', JSON.stringify(data.driver));
    setUser(data.user);
    setDriver(data.driver);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    if (data.driver) await AsyncStorage.setItem('driver', JSON.stringify(data.driver));
    setUser(data.user);
    setDriver(data.driver);
    return data;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user', 'driver']);
    setUser(null);
    setDriver(null);
  };

  const updateDriver = async (updates) => {
    const updated = { ...driver, ...updates };
    await AsyncStorage.setItem('driver', JSON.stringify(updated));
    setDriver(updated);
  };

  return (
    <AuthContext.Provider value={{ user, driver, loading, login, register, logout, updateDriver }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
