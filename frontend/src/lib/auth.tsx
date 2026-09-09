import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { api } from './api';
import type { AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: async (username, password) => {
        const { accessToken, user: loggedInUser } = await api.login(username, password);
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        setUser(loggedInUser);
      },
      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
