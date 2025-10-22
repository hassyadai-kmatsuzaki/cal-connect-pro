import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import type { User, AuthContextType } from '../types';
import { getApiBasePath } from '../utils/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

// Axios インスタンスの設定（CSRF対策）
axios.defaults.withCredentials = true;  // クッキーを送信
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';

// CSRF Token を自動付与するインターセプター
axios.interceptors.request.use((config) => {
  // XSRF-TOKEN クッキーを取得
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];
  
  if (token) {
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
  }
  
  return config;
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const apiBasePath = getApiBasePath();
  const tokenKey = apiBasePath === '/api/central' ? 'central_token' : 'tenant_token';
  
  console.log('[AuthProvider] Initializing with tokenKey:', tokenKey);
  
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem(tokenKey));
  const [loading, setLoading] = useState(true);
  const [csrfInitialized, setCsrfInitialized] = useState(false);

  // CSRF Cookie を初期化
  useEffect(() => {
    const initializeCsrf = async () => {
      try {
        await axios.get('/sanctum/csrf-cookie');
        console.log('[AuthProvider] CSRF token initialized');
        setCsrfInitialized(true);
      } catch (error) {
        console.error('[AuthProvider] Failed to initialize CSRF token:', error);
        setCsrfInitialized(true); // エラーでも続行
      }
    };

    initializeCsrf();
  }, []);

  // ユーザー情報の取得
  useEffect(() => {
    if (!csrfInitialized) {
      return; // CSRF初期化を待つ
    }

    console.log('[AuthProvider] Token changed, token:', token ? 'exists' : 'null');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token, csrfInitialized]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${apiBasePath}/me`);
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setToken(null);
      localStorage.removeItem(tokenKey);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await axios.post(`${apiBasePath}/login`, { email, password });
    const { token: newToken, user: newUser } = response.data;
    
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(tokenKey, newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) => {
    const response = await axios.post(`${apiBasePath}/register`, {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
    const { token: newToken, user: newUser } = response.data;
    
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(tokenKey, newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const logout = async () => {
    try {
      await axios.post(`${apiBasePath}/logout`);
    } catch (error) {
      console.error('Failed to logout:', error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem(tokenKey);
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
