'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { User, LoginRequest, RegisterRequest, ChangePasswordRequest, ProfileUpdateRequest } from '../types/auth';
import authService from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (userData: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (profileData: ProfileUpdateRequest) => Promise<boolean>;
  changePassword: (passwordData: ChangePasswordRequest) => Promise<boolean>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user && !!token;

  // Função para redirecionar para o dashboard
  const redirectToDashboard = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  };

  // Verificar autenticação ao carregar a página
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = authService.getToken();
        const storedUser = authService.getUser();

        if (storedToken && storedUser) {
          // Verificar se o token ainda é válido
          try {
            const response = await authService.getCurrentUser();
            
            if (response.success) {
              setUser(response.data);
              setToken(storedToken);
            } else {
              authService.clearAuth();
            }
          } catch {
            authService.clearAuth();
          }
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        authService.clearAuth();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (credentials: LoginRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.login(credentials);
      
      if (response.success && response.data) {
        const { user: userData, token: tokenData } = response.data;
        
        // Salvar dados localmente
        authService.setToken(tokenData);
        authService.setUser(userData);
        
        // Atualizar estado
        setUser(userData);
        setToken(tokenData);
        
        // Redirecionar para o dashboard após login bem-sucedido
        redirectToDashboard();
        
        return true;
      } else {
        setError(response.message || 'Erro no login');
        return false;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer login';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: RegisterRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.register(userData);
      
      if (response.success && response.data) {
        const { user: userData, token: tokenData } = response.data;
        
        // Salvar dados localmente
        authService.setToken(tokenData);
        authService.setUser(userData);
        
        // Atualizar estado
        setUser(userData);
        setToken(tokenData);
        
        // Redirecionar para o dashboard após registro bem-sucedido
        redirectToDashboard();
        
        return true;
      } else {
        setError(response.message || 'Erro no cadastro');
        return false;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer cadastro';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Tentar fazer logout na API
      try {
        await authService.logout();
      } catch (error) {
        console.error('Erro ao fazer logout na API:', error);
      }
      
      // Limpar dados locais
      authService.clearAuth();
      setUser(null);
      setToken(null);
      setError(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (profileData: ProfileUpdateRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.updateProfile(profileData);
      
      if (response.success) {
        // Atualizar usuário localmente
        authService.setUser(response.data);
        setUser(response.data);
        return true;
      } else {
        setError(response.message || 'Erro ao atualizar perfil');
        return false;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar perfil';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (passwordData: ChangePasswordRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.changePassword(passwordData);
      
      if (response.success) {
        return true;
      } else {
        setError(response.message || 'Erro ao alterar senha');
        return false;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao alterar senha';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const response = await authService.getCurrentUser();
      if (response.success) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
    }
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
