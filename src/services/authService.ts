import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  User, 
  ChangePasswordRequest,
  ProfileUpdateRequest 
} from '../types/auth';

const API_BASE_URL = '/api';

class AuthService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Adicionar token de autorização se existir
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      
      // Verificar se a resposta é JSON válido
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('Erro ao fazer parse do JSON:', jsonError);
          throw new Error(`Erro de resposta do servidor: ${response.status} ${response.statusText}`);
        }
      } else {
        // Se não for JSON, ler como texto
        const textResponse = await response.text();
        console.error('Resposta não-JSON do servidor:', textResponse);
        throw new Error(`Erro do servidor: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(data?.message || `Erro HTTP: ${response.status} ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('Auth service error:', error);
      
      // Se for um erro de rede ou servidor, fornecer mensagem mais clara
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
      }
      
      throw error;
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<{ success: boolean; data: { user: User; token: string }; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    // A API retorna { success: true, data: { user: {...}, token: "..." }, message: "..." }
    // Precisamos extrair user e token de dentro de data
    return {
      success: response.success,
      data: {
        user: response.data.user,
        token: response.data.token
      },
      message: response.message
    };
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<{ success: boolean; data: { user: User; token: string }; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // A API retorna { success: true, data: { user: {...}, token: "..." }, message: "..." }
    // Precisamos extrair user e token de dentro de data
    return {
      success: response.success,
      data: {
        user: response.data.user,
        token: response.data.token
      },
      message: response.message
    };
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<{ success: boolean; data: User; message: string }> {
    const response = await this.request<{ success: boolean; data: { user: User }; message: string }>('/auth/me');
    
    // A API retorna { success: true, data: { user: {...} }, message: "..." }
    // Precisamos extrair o user de dentro de data
    return {
      success: response.success,
      data: response.data.user, // Extrair o user de dentro de data
      message: response.message
    };
  }

  async updateProfile(profileData: ProfileUpdateRequest): Promise<{ success: boolean; data: User; message: string }> {
    const response = await this.request<{ success: boolean; data: { user: User }; message: string }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    
    // A API retorna { success: true, data: { user: {...} }, message: "..." }
    // Precisamos extrair o user de dentro de data
    return {
      success: response.success,
      data: response.data.user, // Extrair o user de dentro de data
      message: response.message
    };
  }

  async changePassword(passwordData: ChangePasswordRequest): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  async refreshToken(): Promise<{ success: boolean; data: { token: string }; message: string }> {
    return this.request<{ success: boolean; data: { token: string }; message: string }>('/auth/refresh', {
      method: 'POST',
    });
  }

  // Métodos auxiliares para gerenciar o token localmente
  setToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  removeToken(): void {
    localStorage.removeItem('authToken');
  }

  // Métodos auxiliares para gerenciar dados do usuário localmente
  setUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  removeUser(): void {
    localStorage.removeItem('user');
  }

  // Limpar todos os dados de autenticação
  clearAuth(): void {
    this.removeToken();
    this.removeUser();
  }
}

export const authService = new AuthService();
export default authService;
