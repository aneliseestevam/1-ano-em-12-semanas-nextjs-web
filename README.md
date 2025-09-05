# 🎯 1 Ano em 12 Semanas - Frontend

Aplicação frontend para o sistema de planejamento "1 Ano em 12 Semanas", desenvolvida com Next.js, TypeScript e Tailwind CSS.

## 🚀 Tecnologias

- **Next.js 15.5.2** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS 3.4.17** - Framework CSS utilitário
- **Lucide React** - Ícones
- **React Context API** - Gerenciamento de estado global
- **JWT** - Autenticação com tokens

## 📋 Funcionalidades

### 🔐 Autenticação
- Registro de usuários
- Login/Logout
- Autenticação JWT
- Proteção de rotas
- Gerenciamento de perfil

### 📊 Dashboard
- Visão geral dos planos ativos
- Estatísticas de progresso
- Resumo da semana atual
- Ações rápidas

### 📋 Gerenciamento de Planos
- Criar, listar, editar e excluir planos
- Controle de status (draft, active, completed)
- Visualização de planos ativos

### 📅 Estrutura Hierárquica
- **Planos** → **Semanas** → **Objetivos** → **Tasks**
- Gerenciamento completo da hierarquia
- Progresso em tempo real

### 🎯 Objetivos e Tasks
- Categorização (saúde, carreira, finanças, etc.)
- Prioridades (low, medium, high)
- Status de progresso
- Tempo estimado vs real

## 🛠️ Instalação

### Pré-requisitos

- Node.js (v18 ou superior)
- npm ou yarn

### 1. Clone o repositório

```bash
git clone https://github.com/aneliseestevam/1-ano-em-12-semanas-web.git
cd 1-ano-em-12-semanas-web
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```bash
# API Base URL
NEXT_PUBLIC_API_URL=https://one-ano-em-12-semanas-api.onrender.com/api
```

### 4. Execute o projeto

**Desenvolvimento:**

```bash
npm run dev
```

**Produção:**

```bash
npm run build
npm start
```

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router (Next.js 13+)
│   ├── dashboard/         # Páginas do dashboard
│   │   ├── layout.tsx     # Layout específico do dashboard
│   │   ├── page.tsx       # Dashboard principal
│   │   └── plans/         # Gerenciamento de planos
│   ├── globals.css        # Estilos globais
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página inicial
├── components/            # Componentes React
│   ├── dashboard/         # Componentes do dashboard
│   │   └── DashboardNav.tsx
│   ├── LoginForm.tsx      # Formulário de login
│   └── RegisterForm.tsx   # Formulário de registro
├── hooks/                 # Custom hooks
│   └── useAuth.tsx        # Hook de autenticação
├── services/              # Serviços de API
│   ├── authService.ts     # Serviço de autenticação
│   └── dashboardService.ts # Serviço do dashboard
└── types/                 # Definições TypeScript
    ├── auth.ts            # Tipos de autenticação
    └── dashboard.ts       # Tipos do dashboard
```

## 🔗 Integração com API

### Endpoints Utilizados

A aplicação se integra com a API backend através dos seguintes endpoints:

#### Autenticação
- `POST /auth/register` - Registrar usuário
- `POST /auth/login` - Fazer login
- `POST /auth/logout` - Fazer logout
- `GET /auth/me` - Obter dados do usuário
- `PUT /auth/profile` - Atualizar perfil
- `POST /auth/change-password` - Alterar senha

#### Planos
- `GET /plans` - Listar planos
- `POST /plans` - Criar plano
- `GET /plans/:id` - Obter plano específico
- `PUT /plans/:id` - Atualizar plano
- `DELETE /plans/:id` - Deletar plano

#### Semanas
- `GET /weeks` - Listar semanas
- `GET /weeks/:id` - Obter semana específica
- `PUT /weeks/:id` - Atualizar semana

#### Objetivos
- `GET /goals/plans/:planId/weeks/:weekId` - Listar objetivos da semana
- `POST /goals/plans/:planId/weeks/:weekId` - Criar objetivo
- `GET /goals/plans/:planId/weeks/:weekId/:goalId` - Obter objetivo específico
- `PUT /goals/plans/:planId/weeks/:weekId/:goalId` - Atualizar objetivo
- `DELETE /goals/plans/:planId/weeks/:weekId/:goalId` - Deletar objetivo

#### Tasks
- `GET /tasks/plans/:planId/weeks/:weekId/goals/:goalId` - Listar tasks do objetivo
- `POST /tasks/plans/:planId/weeks/:weekId/goals/:goalId` - Criar task
- `GET /tasks/plans/:planId/weeks/:weekId/goals/:goalId/:taskId` - Obter task específica
- `PUT /tasks/plans/:planId/weeks/:weekId/goals/:goalId/:taskId` - Atualizar task
- `DELETE /tasks/plans/:planId/weeks/:weekId/goals/:goalId/:taskId` - Deletar task

#### Estatísticas
- `GET /stats/plans/:planId` - Estatísticas do plano
- `GET /stats/overview` - Visão geral das estatísticas

### Configuração de Proxy

A aplicação utiliza um proxy Next.js para evitar problemas de CORS:

```typescript
// next.config.ts
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'https://one-ano-em-12-semanas-api.onrender.com/api/:path*',
    },
  ];
}
```

## 🎨 Interface do Usuário

### Design System
- **Cores**: Gradientes indigo-purple para ações principais
- **Tipografia**: Inter font family
- **Componentes**: Cards com sombras suaves e bordas arredondadas
- **Responsividade**: Design mobile-first

### Páginas Principais

#### 1. Página Inicial (`/`)
- Landing page moderna
- Formulários de login/registro
- Call-to-action para dashboard

#### 2. Dashboard (`/dashboard`)
- Visão geral dos planos ativos
- Estatísticas de progresso
- Resumo da semana atual
- Ações rápidas

#### 3. Gerenciamento de Planos (`/dashboard/plans`)
- Lista de todos os planos
- Estatísticas por status
- Ações de CRUD

## 🔒 Segurança

- **JWT Tokens**: Armazenados no localStorage
- **Proteção de Rotas**: Verificação de autenticação
- **Validação**: Validação de formulários
- **CORS**: Configurado via proxy Next.js

## 🚀 Deploy

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Netlify

```bash
# Build
npm run build

# Deploy manual via interface do Netlify
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Anelise Estevam**

- GitHub: [@aneliseestevam](https://github.com/aneliseestevam)

## 🙏 Agradecimentos

- Comunidade Next.js
- Tailwind CSS
- Lucide React
- Todos os contribuidores

---

**Desenvolvido com ❤️ para ajudar pessoas a alcançarem seus objetivos em 12 semanas!**
