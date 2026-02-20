import React, { createContext, useContext, useMemo, useState } from 'react';

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (id: string, pwd: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_STORAGE_KEY = 'docgen_auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true'
  );

  const loginValue = useMemo(() => {
    const envLogin = import.meta.env.VITE_AUTH_LOGIN;
    const envPassword = import.meta.env.VITE_AUTH_PASSWORD;

    return (id: string, pwd: string) => {
      if (!envLogin || !envPassword) {
        console.warn(
          'Auth config missing: define VITE_AUTH_LOGIN and VITE_AUTH_PASSWORD in .env.local.'
        );
        return false;
      }
      if (id === envLogin && pwd === envPassword) {
        sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
        setIsAuthenticated(true);
        return true;
      }
      return false;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login: loginValue }}>
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
