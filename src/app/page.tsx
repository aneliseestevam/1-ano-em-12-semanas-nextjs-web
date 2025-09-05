'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Flag, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight,
  Target,
  Zap
} from 'lucide-react';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import ApiStatusTest from '../components/ApiStatusTest';

function HomeContent() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showApiTest, setShowApiTest] = useState(false);

  const handleLoginClick = () => {
    setShowLoginForm(true);
  };

  const handleRegisterClick = () => {
    setShowRegisterForm(true);
  };

  const handleSwitchToRegister = () => {
    setShowLoginForm(false);
    setShowRegisterForm(true);
  };

  const handleSwitchToLogin = () => {
    setShowRegisterForm(false);
    setShowLoginForm(true);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="relative z-10">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">12Weeks</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#como-funciona" className="text-gray-600 hover:text-indigo-600 transition-colors">
                Como Funciona
              </a>
              <a href="#recursos" className="text-gray-600 hover:text-indigo-600 transition-colors">
                Recursos
              </a>
              <a href="#sobre" className="text-gray-600 hover:text-indigo-600 transition-colors">
                Sobre
              </a>
            </div>
            <div className="flex items-center space-x-4">
              {/* Botão de teste da API (sempre visível) */}
              <button 
                onClick={() => setShowApiTest(true)}
                className="text-gray-500 hover:text-gray-700 transition-colors px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                title="Testar Status da API"
              >
                🔧 API Status
              </button>
              
              {isAuthenticated ? (
                <>
                  <span className="text-gray-700 font-medium">
                    Olá, {user?.name}!
                  </span>
                  <button 
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-red-600 transition-colors px-4 py-2"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={handleLoginClick}
                    className="text-gray-600 hover:text-indigo-600 transition-colors px-4 py-2"
                  >
                    Entrar
                  </button>
                  <button 
                    onClick={handleRegisterClick}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                  >
                    Começar
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            {/* Main Title */}
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                1 Ano em 12 Semanas
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Transforme seus objetivos anuais em um plano intensivo de 12 semanas. 
              Foque, execute e alcance resultados extraordinários em tempo recorde.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              {isAuthenticated ? (
                <div className="text-center">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-green-600 font-medium mb-2">Bem-vindo de volta!</p>
                    <p className="text-gray-600 text-sm">Redirecionando para o dashboard...</p>
                  </div>
                  <button 
                    onClick={() => router.push('/dashboard')}
                    className="group bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl text-base font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-300 flex items-center space-x-2 mx-auto"
                  >
                    <span>Ir para Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    className="group bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center space-x-2"
                    onClick={handleRegisterClick}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                  >
                    <span>Começar Agora</span>
                    <ArrowRight className={`w-5 h-5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
                  </button>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-2">12x</div>
                <div className="text-gray-600">Mais rápido que métodos tradicionais</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">90%</div>
                <div className="text-gray-600">Maior taxa de conclusão</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-600 mb-2">52</div>
                <div className="text-gray-600">Semanas por ano para crescer</div>
              </div>
            </div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Por que escolher o método 12 Semanas?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Uma abordagem comprovada que transforma a forma como você planeja e executa seus objetivos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Flag className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Foco Intensivo</h3>
              <p className="text-gray-600 leading-relaxed">
                Concentre-se em objetivos específicos por semana, eliminando distrações e maximizando resultados.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Progresso Rápido</h3>
              <p className="text-gray-600 leading-relaxed">
                Acompanhe seu avanço em tempo real com métricas claras e feedback constante.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Resultados Garantidos</h3>
              <p className="text-gray-600 leading-relaxed">
                Transforme 1 ano de mudanças em apenas 12 semanas com metodologia comprovada.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section id="como-funciona" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Como Funciona
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Um processo simples e eficaz em 4 etapas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Step 1 */}
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">1</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Divida seus objetivos</h3>
                <p className="text-gray-600">
                  Transforme metas anuais em 12 semanas intensivas e focadas
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">2</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Foque semanalmente</h3>
                <p className="text-gray-600">
                  Cada semana tem metas específicas e mensuráveis
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">3</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Acompanhe progresso</h3>
                <p className="text-gray-600">
                  Monitore seu avanço e mantenha o foco constante
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">4</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Alcance resultados</h3>
                <p className="text-gray-600">
                  Transforme 1 ano de mudanças em apenas 12 semanas
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto para transformar seu ano?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Junte-se a milhares de pessoas que já transformaram seus objetivos em realidade
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <button 
                onClick={() => router.push('/dashboard')}
                className="bg-white text-indigo-600 px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-gray-50 transition-all duration-300 transform hover:scale-105"
              >
                Acessar Dashboard
              </button>
            ) : (
              <>
                <button 
                  className="bg-white text-indigo-600 px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                  onClick={handleRegisterClick}
                >
                  <Zap className="w-5 h-5" />
                  <span>Começar Gratuitamente</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">12Weeks</span>
            </div>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Transforme seus objetivos anuais em resultados extraordinários em apenas 12 semanas.
            </p>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <p className="text-gray-400">&copy; 20˜ 12Weeks. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Auth Forms */}
      <LoginForm
        open={showLoginForm}
        onClose={() => setShowLoginForm(false)}
        onSwitchToRegister={handleSwitchToRegister}
      />

      <RegisterForm
        open={showRegisterForm}
        onClose={() => setShowRegisterForm(false)}
        onSwitchToLogin={handleSwitchToLogin}
      />
      
      {/* Componente de teste da API */}
      <ApiStatusTest 
        open={showApiTest} 
        onClose={() => setShowApiTest(false)} 
      />
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
  );
}
