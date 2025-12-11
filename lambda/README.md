# 🔒 Lumo AI - AWS Lambda Backend

Backend seguro para geração de imagens com Google Gemini API.

## 🎯 Por que usar Lambda?

✅ **Segurança**: API Key do Google fica no servidor (não exposta no app)  
✅ **Controle**: Tracking de uso e custos no MongoDB  
✅ **Validação**: Só permite requests de usuários com subscription ativa  
✅ **Rate Limiting**: Controla gastos automaticamente  
✅ **Escalabilidade**: Paga apenas pelo que usar  

---

## 📁 Estrutura

```
lambda/
├── src/
│   ├── index.ts                  # Lambda handler principal
│   ├── config/
│   │   └── constants.ts          # Configurações
│   ├── models/
│   │   ├── ApiUsage.ts           # Model: uso por usuário
│   │   ├── ApiRequest.ts         # Model: log de requests
│   │   └── CostTracking.ts      # Model: tracking de custos
│   └── services/
│       ├── mongodb.ts            # Conexão MongoDB
│       ├── subscription.ts       # Validação de subscription
│       ├── costTracking.ts       # Tracking de custos
│       └── gemini.ts             # Cliente Google Gemini
├── package.json
├── tsconfig.json
└── .env.example
```

---

## 🚀 Setup Rápido

### 1️⃣ Instalar dependências

```bash
cd lambda
npm install
```

### 2️⃣ Configurar variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

Edite `.env`:

```env
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/lumo
GOOGLE_API_KEY=AIzaSy...  # SUA NOVA CHAVE (revogue a antiga!)
GEMINI_MODEL=gemini-3-pro-image-preview
RATE_LIMIT_PREMIUM=1000
MAX_DAILY_COST_USD=50
MAX_MONTHLY_COST_USD=500
AWS_REGION=sa-east-1
```

### 3️⃣ Build

```bash
npm run build
```

### 4️⃣ Deploy para AWS

```bash
npm run deploy
```

Isso cria um arquivo `function.zip` com tudo que você precisa fazer upload na Lambda.

---

## 📊 Collections MongoDB

A Lambda cria 3 collections automaticamente:

### `api_usage` - Uso por usuário
```javascript
{
  userId: "user_123",
  subscriptionTier: "premium",
  subscriptionActive: true,
  requestCount: {
    daily: 15,
    monthly: 450,
    total: 1250
  },
  lastRequest: Date
}
```

### `api_requests` - Log detalhado
```javascript
{
  userId: "user_123",
  timestamp: Date,
  success: true,
  processingTimeMs: 3500,
  estimatedCostUSD: 0.01,
  metadata: {
    description: "make it sunset",
    modelUsed: "gemini-3-pro-image-preview"
  }
}
```

### `cost_tracking` - Custos agregados
```javascript
{
  date: Date,
  totalRequests: 1500,
  successfulRequests: 1450,
  totalCostUSD: 15.00,
  uniqueUsers: 230
}
```

---

## 🔧 Configuração AWS

Veja o guia completo em: `../docs/AWS_LAMBDA_SETUP.md`

Resumo:
1. Criar função Lambda
2. Configurar API Gateway
3. Adicionar variáveis de ambiente
4. Testar endpoint

---

## 💰 Controle de Custos

### Limites configuráveis:

```typescript
// Em .env
RATE_LIMIT_PREMIUM=1000        // requests/dia para premium
MAX_DAILY_COST_USD=50          // limite diário
MAX_MONTHLY_COST_USD=500       // limite mensal
```

### Alertas automáticos:

- ⚠️ Alerta em 80% do limite
- 🚨 Bloqueio em 100% do limite
- 📊 Logs detalhados no CloudWatch

---

## 🎮 Fluxo de Funcionamento

```
1. App envia request → Lambda
2. Lambda valida subscription (RevenueCat)
3. Se ativo → chama Google Gemini API
4. Salva log no MongoDB
5. Retorna imagem pro app
6. Atualiza cost tracking
```

---

## 🧪 Testar Localmente

Você pode testar a Lambda localmente (requer MongoDB):

```bash
npm run dev
```

---

## 📝 TODO Futuro

- [ ] Sistema de créditos (preparado nos models)
- [ ] Notificações SNS para alertas
- [ ] Dashboard de analytics
- [ ] Suporte para mais modelos de IA
- [ ] Cache de imagens no S3

---

## 🆘 Problemas Comuns

### MongoDB não conecta
- Verifique se a URI está correta
- Whitelist o IP da Lambda no MongoDB Atlas
- Use 0.0.0.0/0 (todos IPs) para desenvolvimento

### Lambda timeout
- Aumente timeout para 2 minutos (120s)
- Verifique se a Google API está respondendo

### Subscription não validada
- Verifique se o userId está sendo enviado
- Logs no CloudWatch mostrarão o erro

---

## 📚 Próximos Passos

1. ✅ Deploy na AWS → Veja `AWS_LAMBDA_SETUP.md`
2. ✅ Setup MongoDB Atlas → Veja `MONGODB_SETUP.md`
3. ✅ Configurar alertas → Veja `SECURITY_GUIDE.md`
4. ✅ Atualizar app → URL já configurada!

