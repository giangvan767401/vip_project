import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import { User, Role } from '../types/auth';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  getDefaultPathForRole: (role?: Role) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const savedToken = localStorage.getItem('mindlog_token');
    const savedUser = localStorage.getItem('mindlog_user');

    if (savedToken) {
      setToken(savedToken);
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          // ignore corrupted data
        }
      }

      // Verify token with backend
      api.getMe()
        .then((fetchedUser) => {
          startTransition(() => {
            setUser(fetchedUser);
            localStorage.setItem('mindlog_user', JSON.stringify(fetchedUser));
          });
        })
        .catch(() => {
          // Token is expired or invalid
          logout();
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('mindlog_token', newToken);
    localStorage.setItem('mindlog_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('mindlog_token');
    localStorage.removeItem('mindlog_user');
  };

  const getDefaultPathForRole = (role?: Role): string => {
    const activeRole = role || user?.role;
    switch (activeRole) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'COUNSELOR':
        return '/counselor/dashboard';
      case 'USER':
      default:
        return '/student/dashboard';
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, getDefaultPathForRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
