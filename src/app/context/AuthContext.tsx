import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { RecordModel } from 'pocketbase';
import pb from '../../lib/pb';

interface AuthContextValue {
  user: RecordModel | null;
  isAuthenticated: boolean;
  login: (id: string, pwd: string) => boolean | Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<RecordModel | null>(pb.authStore.model ?? null);
  const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid);

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange(() => {
      setUser(pb.authStore.model ?? null);
      setIsAuthenticated(pb.authStore.isValid);
    }, true);

    return unsubscribe;
  }, []);

  const login = useMemo(() => {
    return async (id: string, pwd: string) => {
      try {
        await pb.collection('users').authWithPassword(id, pwd);
        setUser(pb.authStore.model ?? null);
        setIsAuthenticated(pb.authStore.isValid);
        return true;
      } catch (error) {
        pb.authStore.clear();
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }
    };
  }, []);

  const logout = useMemo(() => {
    return () => {
      pb.authStore.clear();
      setUser(null);
      setIsAuthenticated(false);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
