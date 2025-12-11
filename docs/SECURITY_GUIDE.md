# 🔒 Guia Completo de Segurança

Este documento explica todos os aspectos de segurança implementados.

---

## ⚠️ O Problema Original

### ANTES (INSEGURO):
```typescript
// ❌ API Key exposta no código do app
const GEMINI_API_KEY = 'AIzaSyDmVOOl3okeBUDOZnQ2hxWvAd20QzinnsA';
```

**Riscos:**
- ✅ Qualquer pessoa pode extrair a chave do app
- ✅ Uso ilimitado → custos altíssimos
- ✅ Sem controle de quem usa
- ✅ Sem tracking de gastos
- ✅ Chave está no Git (público se você fizer push)

---

## ✅ A Solução Implementada

### AGORA (SEGURO):
```
App (React Native)
    ↓ HTTPS
API Gateway (AWS - sa-east-1)
    ↓ Validação
AWS Lambda
    ↓ Verifica subscription
    ↓ Verifica rate limits
    ↓ Trackeia no MongoDB
    ↓
Google Gemini API (key fica aqui, segura!)
```

---

## 🛡️ Camadas de Segurança

### 1️⃣ API Key Protegida

**Onde a chave fica:**
- ✅ Variável de ambiente na Lambda (não no código)
- ✅ Nunca exposta pro app
- ✅ Nunca vai pro Git

**Como funciona:**
```typescript
// No app - SEM chave
fetch('https://sua-lambda.com/generate', {
  body: JSON.stringify({ userId, image, description })
});

// Na Lambda - COM chave (segura)
const apiKey = process.env.GOOGLE_API_KEY; // ✅ Seguro
fetch(`https://gemini-api.com?key=${apiKey}`);
```

---

### 2️⃣ Validação de Subscription

**Só permite requests de usuários pagantes:**

```typescript
// Lambda valida ANTES de chamar Google API
const subscription = await validateSubscription(userId);

if (!subscription.canMakeRequest) {
  return {
    statusCode: 403,
    body: { error: 'Subscription required' }
  };
}

// Só continua se tiver subscription ativa
```

**Resultado:**
- ✅ Usuários free não podem usar (ou limite baixo)
- ✅ Só premium pode gerar imagens
- ✅ Previne abuso

---

### 3️⃣ Rate Limiting

**Limites configuráveis por tier:**

```typescript
const LIMITS = {
  free: 0,        // Bloqueado
  premium: 1000,  // 1000 requests/dia
};
```

**MongoDB trackeia:**
```javascript
{
  userId: "user_123",
  requestCount: {
    daily: 15,    // ← Reseta todo dia
    monthly: 450,
    total: 1250
  }
}
```

**Se ultrapassar:**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again tomorrow."
}
```

---

### 4️⃣ Cost Tracking Automático

**Toda request é logada:**

```javascript
// Collection: api_requests
{
  userId: "user_123",
  timestamp: "2024-12-06T10:30:00Z",
  success: true,
  processingTimeMs: 3500,
  estimatedCostUSD: 0.01,  // ← Tracking de custo
  metadata: {
    description: "make it sunset",
    modelUsed: "gemini-3-pro"
  }
}
```

**Agregação diária:**

```javascript
// Collection: cost_tracking
{
  date: "2024-12-06",
  totalRequests: 1500,
  totalCostUSD: 15.00,  // ← Total do dia
  uniqueUsers: 230
}
```

---

### 5️⃣ Limites Globais de Custo

**Proteção contra custos excessivos:**

```typescript
// Se ultrapassar $50/dia, bloqueia TUDO
if (dailyCost >= MAX_DAILY_COST) {
  return {
    statusCode: 503,
    body: { error: 'Service unavailable due to high demand' }
  };
}
```

**Alertas automáticos:**
- ⚠️ 80% do limite → Log de aviso
- 🚨 100% do limite → Bloqueio automático

---

## 🔐 Restrições na Google API Key

### Configurações recomendadas:

**1. Application restrictions:**
```
HTTP referrers (web sites) OU IP addresses
- Adicione IPs da Lambda
- OU use sem restrição + rate limiting forte
```

**2. API restrictions:**
```
✅ Restrict key
✅ Selecione: Generative Language API apenas
❌ Desabilite outras APIs
```

**3. Quotas:**
```
Requests per day: 1000
Requests per minute: 60
```

---

## 🔒 MongoDB Security

### 1. Autenticação forte:
```
Username: lumo_admin
Password: Min 16 caracteres, letras+números+símbolos
2FA: Habilitado na conta MongoDB Atlas
```

### 2. Network Access:
```
Desenvolvimento: 0.0.0.0/0 (temporário)
Produção: IPs específicos da Lambda
```

### 3. Database permissions:
```
User: readWrite no database 'lumo' apenas
Não tem acesso a outros databases
```

### 4. Connection string:
```
✅ Armazenada em variável de ambiente
❌ NUNCA no código
❌ NUNCA no Git
```

---

## 🚨 Monitoramento e Alertas

### CloudWatch Alarms:

**1. Custo por dia:**
```
Metric: Custom metric (totalCostUSD)
Threshold: $40 (80% de $50)
Action: SNS → Email
```

**2. Rate de erro:**
```
Metric: Lambda Errors
Threshold: > 10 errors em 5 min
Action: SNS → Email
```

**3. Invocations spike:**
```
Metric: Lambda Invocations
Threshold: > 1000 em 1 hora
Action: SNS → Email
```

### MongoDB Monitoring:

**Métricas importantes:**
```
- Connections (deve ser < 100)
- Operations/second (deve ser < 100)
- Storage size (alerta em 400 MB - 80% do free tier)
```

---

## 🔄 Rotação de Credenciais

### Google API Key (a cada 90 dias):

```bash
# 1. Criar nova chave no Google Cloud Console
# 2. Testar com a nova chave
# 3. Atualizar variável na Lambda
aws lambda update-function-configuration \
  --function-name lumo-ai-image-generation \
  --environment Variables={GOOGLE_API_KEY=nova_chave_aqui,...}
# 4. Revogar chave antiga
```

### MongoDB Password (a cada 6 meses):

```bash
# 1. MongoDB Atlas → Database Access
# 2. Edit User → Change Password
# 3. Atualizar variável na Lambda
# 4. Testar conexão
```

---

## 🚫 O Que NUNCA Fazer

❌ **Commitar secrets no Git**
```bash
# Antes de commitar, sempre verifique:
git diff
git status

# Se acidentalmente commitou:
git reset HEAD~1  # Remove último commit
git push --force  # ⚠️ Só se o repo for privado!
```

❌ **Expor API keys no app**
```typescript
// ❌ NUNCA
const API_KEY = 'AIzaSy...';

// ✅ SEMPRE via backend
const response = await fetch(LAMBDA_URL);
```

❌ **Logs com informações sensíveis**
```typescript
// ❌ NUNCA
console.log('API Key:', apiKey);

// ✅ SEMPRE
console.log('API Key:', apiKey.substring(0, 8) + '...');
```

---

## 📊 Audit & Compliance

### Logs que mantemos:

**1. Access logs:**
```
- Quem acessou (userId)
- Quando (timestamp)
- O que fez (description)
- Resultado (success/error)
```

**2. Cost logs:**
```
- Custo por request
- Custo por dia
- Custo por usuário
```

**3. Error logs:**
```
- Tipo de erro
- Stack trace (sem dados sensíveis)
- Frequência
```

### Retenção:

```
Lambda logs: 30 dias (CloudWatch)
MongoDB api_requests: 90 dias (TTL index)
MongoDB cost_tracking: Permanente
```

---

## 🛠️ Incident Response

### Se a chave vazar:

```bash
# 1. IMEDIATO - Revogar chave
Google Cloud Console → Credentials → Delete key

# 2. Criar nova chave
Create new API key → Configure restrictions

# 3. Atualizar Lambda
Atualizar variável GOOGLE_API_KEY

# 4. Monitorar custos
Ver se houve uso não autorizado
```

### Se houver uso excessivo:

```bash
# 1. Verificar no MongoDB quem está abusando
db.api_usage.find().sort({ "requestCount.daily": -1 }).limit(10)

# 2. Bloquear usuário
db.api_usage.updateOne(
  { userId: "abusive_user" },
  { $set: { subscriptionActive: false } }
)

# 3. Ajustar rate limits
Reduzir RATE_LIMIT_PREMIUM temporariamente
```

---

## ✅ Security Checklist

### Desenvolvimento:
- [ ] Secrets em .env (não no código)
- [ ] .env no .gitignore
- [ ] Verificar git diff antes de commit
- [ ] Usar HTTPS sempre

### Deploy:
- [ ] Google API key nova (antiga revogada)
- [ ] MongoDB password forte
- [ ] Lambda variáveis de ambiente configuradas
- [ ] CloudWatch alarms configurados
- [ ] Rate limits configurados
- [ ] CORS configurado corretamente

### Produção:
- [ ] Monitoramento ativo
- [ ] Alertas de custo funcionando
- [ ] Logs sendo gerados
- [ ] Backup do MongoDB (tier pago)
- [ ] Rotação de credenciais agendada

---

## 📚 Compliance & Regulações

### LGPD / GDPR:

**Dados que coletamos:**
- userId (não identificável diretamente)
- Timestamps de uso
- Custos agregados

**Não coletamos:**
- Imagens originais (não salvamos)
- Dados pessoais (nome, email, etc)
- Localização precisa

**Direitos do usuário:**
- Deletar dados: Remover do MongoDB
- Exportar dados: Query no MongoDB
- Opt-out: Desabilitar subscription

---

## 🎓 Boas Práticas Aprendidas

1. **Nunca confie no cliente**
   - Sempre valide no backend
   
2. **Defense in depth**
   - Múltiplas camadas de segurança
   
3. **Fail secure**
   - Se algo falhar, bloqueie (não libere)
   
4. **Monitor everything**
   - Logs, métricas, alertas
   
5. **Prepare for the worst**
   - Incident response plan
   - Backup strategy
   - Cost limits

---

**🔒 Sistema seguro e escalável implementado com sucesso!**

