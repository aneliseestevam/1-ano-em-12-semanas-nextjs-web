import axios from 'axios';

// Configuração base do Axios
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://one-ano-em-12-semanas-api.onrender.com/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token JWT em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Erro 401 - Token expirado ou inválido
      if (error.response.status === 401) {
        // Não limpar dados automaticamente, deixar o componente de autenticação lidar
        console.log('⚠️ API: Erro 401 detectado, mas não limpando dados automaticamente');
        return Promise.reject(new Error('Não autorizado. Faça login novamente.'));
      }
      
      // Erro 429 - Rate limit
      if (error.response.status === 429) {
        return Promise.reject(new Error('Muitas requisições. Tente novamente em alguns minutos.'));
      }
      
      // Outros erros HTTP
      const message = error.response.data?.message || 'Erro na requisição';
      return Promise.reject(new Error(message));
    }
    
    // Erro de rede
    if (error.request) {
      return Promise.reject(new Error('Erro de conexão. Verifique sua internet.'));
    }
    
    // Outros erros
    return Promise.reject(error);
  }
);

export default api;
