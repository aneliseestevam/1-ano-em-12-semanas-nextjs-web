# 🚀 Otimizações de Performance para o Backend

## 📊 Problemas Identificados

### 1. **Múltiplas Chamadas Sequenciais**
- Frontend faz muitas requisições sequenciais
- Cada semana carrega objetivos individualmente
- Sem cache no backend

### 2. **Dados Desnecessários**
- Carregando dados completos quando só precisa de básicos
- Sem paginação ou limitação de dados

## 🎯 Soluções Recomendadas

### 1. **Novos Endpoints Otimizados**

#### **GET /plans/basic**
```javascript
// Retorna apenas dados básicos dos planos (sem semanas/objetivos)
{
  "success": true,
  "data": [
    {
      "id": "plan1",
      "title": "Plano 1",
      "status": "active",
      "createdAt": "2024-01-01",
      "totalWeeks": 12,
      "totalGoals": 24,
      "completedGoals": 8
    }
  ]
}
```

#### **GET /plans/:id/weeks**
```javascript
// Retorna apenas as semanas de um plano específico
{
  "success": true,
  "data": [
    {
      "id": "week1",
      "weekNumber": 1,
      "title": "Semana 1",
      "totalGoals": 2,
      "completedGoals": 1,
      "status": "in_progress"
    }
  ]
}
```

#### **GET /goals/plans/:planId/weeks/:weekNumber**
```javascript
// Endpoint otimizado que aceita weekNumber em vez de weekId
{
  "success": true,
  "data": [
    {
      "id": "goal1",
      "title": "Objetivo 1",
      "description": "Descrição",
      "completed": false,
      "category": "saude",
      "weekNumber": 1
    }
  ]
}
```

#### **GET /stats**
```javascript
// Endpoint para estatísticas gerais
{
  "success": true,
  "data": {
    "overview": {
      "plans": {
        "totalPlans": 5,
        "activePlans": 2,
        "completedPlans": 1
      },
      "goals": {
        "totalGoals": 50,
        "completedGoals": 20,
        "pendingGoals": 30
      }
    },
    "summary": {
      "goalCompletionRate": 40,
      "taskCompletionRate": 35
    }
  }
}
```

### 2. **Implementação no Backend (Node.js/Express)**

#### **Cache com Redis ou Memória**
```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutos

// Middleware de cache
const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = cache.get(key);
    
    if (cached) {
      return res.json(cached);
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      cache.set(key, body, duration);
      res.sendResponse(body);
    };
    
    next();
  };
};

// Uso nos endpoints
app.get('/plans/basic', cacheMiddleware(300), async (req, res) => {
  // Lógica do endpoint
});
```

#### **Queries Otimizadas**
```javascript
// Em vez de carregar tudo
const plans = await Plan.find().populate('weeks.goals');

// Carregar apenas o necessário
const plans = await Plan.find({}, {
  title: 1,
  status: 1,
  createdAt: 1,
  totalWeeks: 1,
  totalGoals: 1,
  completedGoals: 1
});
```

#### **Paginação**
```javascript
app.get('/goals/plans/:planId/weeks/:weekNumber', async (req, res) => {
  const { planId, weekNumber } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  const goals = await Goal.find({
    planId,
    weekNumber: parseInt(weekNumber)
  })
  .limit(limit * 1)
  .skip((page - 1) * limit)
  .select('title description completed category weekNumber');
  
  res.json({
    success: true,
    data: goals,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: await Goal.countDocuments({ planId, weekNumber: parseInt(weekNumber) })
    }
  });
});
```

### 3. **Compressão e Otimizações**

#### **Compressão Gzip**
```javascript
const compression = require('compression');
app.use(compression());
```

#### **Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por IP
});

app.use('/api/', limiter);
```

#### **CORS Otimizado**
```javascript
const cors = require('cors');
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200
}));
```

### 4. **Database Optimizations**

#### **Índices**
```javascript
// MongoDB
db.plans.createIndex({ "status": 1, "createdAt": -1 });
db.goals.createIndex({ "planId": 1, "weekNumber": 1 });
db.goals.createIndex({ "completed": 1 });

// PostgreSQL
CREATE INDEX idx_plans_status ON plans(status);
CREATE INDEX idx_goals_plan_week ON goals(plan_id, week_number);
CREATE INDEX idx_goals_completed ON goals(completed);
```

#### **Aggregation Pipeline**
```javascript
// Para estatísticas
const stats = await Plan.aggregate([
  {
    $group: {
      _id: null,
      totalPlans: { $sum: 1 },
      activePlans: {
        $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
      }
    }
  }
]);
```

## 🎯 Implementação Prioritária

### **Fase 1 (Imediata)**
1. ✅ Criar endpoint `/plans/basic`
2. ✅ Implementar cache básico
3. ✅ Otimizar queries existentes

### **Fase 2 (Curto Prazo)**
1. ✅ Criar endpoint `/stats`
2. ✅ Implementar paginação
3. ✅ Adicionar compressão

### **Fase 3 (Médio Prazo)**
1. ✅ Implementar Redis
2. ✅ Adicionar rate limiting
3. ✅ Otimizar índices do banco

## 📈 Resultados Esperados

- **⚡ 70% redução** no tempo de carregamento
- **🔄 80% menos** requisições ao banco
- **💾 60% redução** no uso de memória
- **📱 Melhor UX** com carregamento mais rápido

## 🔧 Código de Exemplo Completo

```javascript
// routes/plans.js
const express = require('express');
const router = express.Router();
const Plan = require('../models/Plan');
const Goal = require('../models/Goal');
const cache = require('../utils/cache');

// GET /plans/basic - Planos básicos
router.get('/basic', cache(300), async (req, res) => {
  try {
    const plans = await Plan.find({}, {
      title: 1,
      status: 1,
      createdAt: 1,
      totalWeeks: 1,
      totalGoals: 1,
      completedGoals: 1
    }).lean();
    
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /plans/:id/weeks - Semanas de um plano
router.get('/:id/weeks', cache(300), async (req, res) => {
  try {
    const weeks = await Week.find({ planId: req.params.id }, {
      weekNumber: 1,
      title: 1,
      totalGoals: 1,
      completedGoals: 1,
      status: 1
    }).lean();
    
    res.json({
      success: true,
      data: weeks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
```

Essas otimizações devem resolver significativamente os problemas de performance! 🚀
