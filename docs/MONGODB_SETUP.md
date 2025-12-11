# 🍃 MongoDB Atlas Setup Guide

Guia completo para configurar MongoDB Atlas para o Moovia AI.

---

## 1️⃣ Criar Conta no MongoDB Atlas

1. Acesse: https://www.mongodb.com/cloud/atlas/register
2. Crie uma conta (pode usar Google/GitHub)
3. Escolha o plano **M0 Sandbox (FREE)**

---

## 2️⃣ Criar Cluster

### Configurações recomendadas:

```
Cloud Provider: AWS
Region: São Paulo (sa-east-1)
Cluster Name: moovia-cluster
Cluster Tier: M0 Sandbox (FREE)
```

Clique em **"Create Cluster"** (leva ~3-5 minutos)

---

## 3️⃣ Configurar Database Access

### Criar usuário:

1. No menu lateral, clique em **"Database Access"**
2. Clique em **"Add New Database User"**
3. Configure:

```
Authentication Method: Password
Username: moovia_admin
Password: [gere uma senha forte]
Database User Privileges: Read and write to any database
```

4. Clique em **"Add User"**

**⚠️ IMPORTANTE: Salve a senha em local seguro!**

---

## 4️⃣ Configurar Network Access

### Whitelist IPs:

1. No menu lateral, clique em **"Network Access"**
2. Clique em **"Add IP Address"**

### Para desenvolvimento:
```
IP Address: 0.0.0.0/0
Comment: Allow from anywhere (development only)
```

### Para produção:
- Depois do deploy da Lambda, adicione os IPs específicos
- Ou mantenha 0.0.0.0/0 com senha forte (aceitável)

3. Clique em **"Confirm"**

---

## 5️⃣ Obter Connection String

1. Clique em **"Clusters"** no menu lateral
2. Clique em **"Connect"** no seu cluster
3. Escolha **"Connect your application"**
4. Driver: **Node.js**
5. Version: **5.5 or later**
6. Copie o connection string:

```
mongodb+srv://moovia_admin:<password>@moovia-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

7. **Substitua `<password>`** pela senha real
8. **Adicione o database name** antes do `?`:

```
mongodb+srv://moovia_admin:SuaSenha@moovia-cluster.xxxxx.mongodb.net/moovia?retryWrites=true&w=majority
```

---

## 6️⃣ Criar Database e Collections

### Via Mongo Compass (GUI - Recomendado):

1. Download: https://www.mongodb.com/try/download/compass
2. Instale e abra
3. Cole o connection string
4. Clique em **"Connect"**

### Criar database:

1. Clique em **"Create Database"**
2. Database Name: **moovia**
3. Collection Name: **api_usage**
4. Clique em **"Create Database"**

### Criar collections adicionais:

1. No database **moovia**, clique em **"+"**
2. Collection Name: **api_requests**
3. Repita para: **cost_tracking**

### Via MongoDB Shell (alternativo):

```javascript
use moovia

db.createCollection("api_usage")
db.createCollection("api_requests")
db.createCollection("cost_tracking")
```

---

## 7️⃣ Criar Índices para Performance

### Via Compass:

#### Collection: api_usage
```javascript
// Índice por userId (unique)
{ userId: 1 }  // unique: true

// Índice por subscription
{ subscriptionActive: 1, lastRequest: -1 }
```

#### Collection: api_requests
```javascript
// Índice por userId e timestamp
{ userId: 1, timestamp: -1 }

// Índice por success
{ timestamp: -1, success: 1 }

// TTL Index (auto-delete após 90 dias)
{ timestamp: 1 }  // expireAfterSeconds: 7776000
```

#### Collection: cost_tracking
```javascript
// Índice por date (unique)
{ date: -1 }  // unique: true
```

### Via MongoDB Shell:

```javascript
use moovia

// api_usage
db.api_usage.createIndex({ userId: 1 }, { unique: true })
db.api_usage.createIndex({ subscriptionActive: 1, lastRequest: -1 })

// api_requests
db.api_requests.createIndex({ userId: 1, timestamp: -1 })
db.api_requests.createIndex({ timestamp: -1, success: 1 })
db.api_requests.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 })

// cost_tracking
db.cost_tracking.createIndex({ date: -1 }, { unique: true })
```

---

## 8️⃣ Testar Conexão

### Via Node.js (local):

```javascript
const mongoose = require('mongoose');

const uri = 'mongodb+srv://moovia_admin:SuaSenha@moovia-cluster.xxxxx.mongodb.net/moovia?retryWrites=true&w=majority';

mongoose.connect(uri)
  .then(() => console.log('✅ MongoDB connected!'))
  .catch(err => console.error('❌ Error:', err));
```

Execute:
```bash
node test-connection.js
```

---

## 9️⃣ Configurar na Lambda

### Adicione a variável de ambiente:

```
MONGODB_URI = mongodb+srv://moovia_admin:SuaSenha@moovia-cluster.xxxxx.mongodb.net/moovia?retryWrites=true&w=majority
```

**⚠️ NUNCA commite a connection string no Git!**

---

## 🔟 Monitorar Uso

### Via MongoDB Atlas:

1. Clique em **"Clusters"**
2. Veja métricas em tempo real:
   - Connections
   - Operations/second
   - Network I/O
   - Storage size

### Alertas:

1. Vá em **"Alerts"** no menu lateral
2. Configure alertas para:
   - High CPU usage
   - High memory usage
   - Connection spikes

---

## 💰 Limites do Tier Free (M0)

```
Storage: 512 MB
RAM: Shared
Connections: 500 concurrent
Backups: Não inclusos
```

### Quando fazer upgrade:

- Storage > 400 MB (80%)
- Muitas conexões simultâneas
- Precisa de backups automáticos
- Performance lenta

### Upgrade para M10 (~$57/mês):
```
Storage: 10 GB
RAM: 2 GB dedicated
Connections: Unlimited
Backups: Automáticos
```

---

## 📊 Queries Úteis

### Ver uso total:

```javascript
db.api_usage.aggregate([
  {
    $group: {
      _id: null,
      totalUsers: { $sum: 1 },
      totalRequests: { $sum: "$requestCount.total" },
      activeSubscriptions: {
        $sum: { $cond: ["$subscriptionActive", 1, 0] }
      }
    }
  }
])
```

### Ver custos do último mês:

```javascript
db.cost_tracking.aggregate([
  {
    $match: {
      date: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    }
  },
  {
    $group: {
      _id: null,
      totalCost: { $sum: "$totalCostUSD" },
      totalRequests: { $sum: "$totalRequests" },
      avgCostPerRequest: { $avg: "$totalCostUSD" }
    }
  }
])
```

### Top 10 usuários por uso:

```javascript
db.api_usage.find({})
  .sort({ "requestCount.total": -1 })
  .limit(10)
```

---

## 🔒 Segurança

### Best Practices:

✅ Use senhas fortes (min 16 caracteres)  
✅ Habilite 2FA na conta MongoDB Atlas  
✅ Nunca commite credentials no Git  
✅ Use variáveis de ambiente  
✅ Monitore atividade suspeita  
✅ Limite whitelist de IPs quando possível  
✅ Faça backups regulares (tier pago)  

### Rotação de senha:

1. **Database Access** → Editar usuário
2. **Edit Password** → Gerar nova senha
3. Atualizar variável de ambiente na Lambda
4. Testar conexão

---

## 📈 Escalabilidade

### Para crescimento:

```
Até 1K usuários: M0 (Free) - OK
1K - 10K usuários: M10 ($57/mês)
10K - 100K usuários: M20 ($145/mês)
100K+ usuários: M30+ ou cluster dedicado
```

### Otimizações:

- ✅ Índices bem configurados
- ✅ TTL para limpar dados antigos
- ✅ Connection pooling (já configurado no código)
- ✅ Queries eficientes (não fazer scan completo)

---

## 🆘 Troubleshooting

### "MongoNetworkError: connection timed out"
```
Causa: IP não está no whitelist
Solução: Adicionar 0.0.0.0/0 no Network Access
```

### "Authentication failed"
```
Causa: Senha incorreta ou usuário não existe
Solução: Verificar credenciais no Database Access
```

### "Too many connections"
```
Causa: Tier M0 tem limite de 500 conexões
Solução: 
1. Verificar connection leaks no código
2. Fazer upgrade para M10
```

### "Storage exceeded"
```
Causa: Mais de 512 MB no tier M0
Solução:
1. Limpar logs antigos
2. Fazer upgrade para M10
```

---

## ✅ Checklist Final

- [ ] Cluster criado em sa-east-1
- [ ] Usuário criado com senha forte
- [ ] Network Access configurado (0.0.0.0/0)
- [ ] Connection string copiada
- [ ] Database `moovia` criada
- [ ] 3 collections criadas (api_usage, api_requests, cost_tracking)
- [ ] Índices criados
- [ ] TTL index configurado
- [ ] Conexão testada localmente
- [ ] MONGODB_URI adicionada na Lambda
- [ ] Alertas configurados

---

## 📚 Recursos

- **Docs oficiais**: https://www.mongodb.com/docs/atlas/
- **Mongoose docs**: https://mongoosejs.com/docs/
- **Community**: https://www.mongodb.com/community/forums/

---

**🎉 MongoDB está pronto para uso em produção!**

