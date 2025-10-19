import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { clearTokens } from '../api';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  globalRole: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: User, tenant?: Tenant) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    const storedTenant = localStorage.getItem('tenant');

    if (token && storedUser) {
      setAccessToken(token);
      setUser(JSON.parse(storedUser));
      if (storedTenant) {
        setTenant(JSON.parse(storedTenant));
      }
    }

    setIsLoading(false);
  }, []);

  const login = (
    newAccessToken: string,
    refreshToken: string,
    newUser: User,
    newTenant?: Tenant
  ) => {
    // Save to localStorage
    localStorage.setItem('accessToken', newAccessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(newUser));

    if (newTenant) {
      localStorage.setItem('tenant', JSON.stringify(newTenant));
      setTenant(newTenant);
    }

    // Update state
    setAccessToken(newAccessToken);
    setUser(newUser);
  };

  const logout = () => {
    // Clear tokens using centralized function
    clearTokens();

    // Clear state
    setAccessToken(null);
    setUser(null);
    setTenant(null);
  };

  const updateUser = (updatedUser: User) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    tenant,
    accessToken,
    isAuthenticated: !!user && !!accessToken,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};