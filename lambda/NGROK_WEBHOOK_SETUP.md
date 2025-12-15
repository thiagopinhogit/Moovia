# 🔗 Setup do Webhook RevenueCat com ngrok

Este guia explica como testar o webhook do RevenueCat localmente usando ngrok.

## 📋 Pré-requisitos

1. **Instalar ngrok**: https://ngrok.com/download
   ```bash
   # macOS
   brew install ngrok
   
   # Ou baixar diretamente
   # https://ngrok.com/download
   ```

2. **Criar conta no ngrok** (gratuito): https://dashboard.ngrok.com/signup

3. **Configurar authtoken**:
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

## 🚀 Passos para Testar

### 1. Iniciar o servidor local

Em um terminal, na pasta `lambda/`:

```bash
npm run dev
```

Você verá:
```
🚀 Moovia Lambda Local Server
Port: 3000
Local IP: 192.168.x.x
URL: http://192.168.x.x:3000
```

### 2. Iniciar o ngrok

Em **outro terminal**, na pasta `lambda/`:

```bash
npm run ngrok
```

Ou manualmente:
```bash
ngrok http 3000
```

Você verá algo como:
```
Forwarding  https://abcd-1234-5678.ngrok-free.app -> http://localhost:3000
```

**⚠️ IMPORTANTE**: Copie a URL HTTPS (ex: `https://abcd-1234-5678.ngrok-free.app`)

### 3. Configurar Webhook no RevenueCat

1. Acesse: https://app.revenuecat.com
2. Vá em **Project Settings** > **Integrations** > **Webhooks**
3. Clique em **+ Add Webhook**
4. Configure:
   - **URL**: `https://sua-url-ngrok.ngrok-free.app/revenuecat-webhook`
   - **Authorization**: `Bearer seu-token-secreto` (opcional)
   - **Events**: Selecione:
     - ✅ INITIAL_PURCHASE
     - ✅ RENEWAL
     - ✅ NON_RENEWING_PURCHASE
     - ✅ CANCELLATION
     - ✅ EXPIRATION
5. Clique em **Save**

### 4. Testar o Webhook

#### Opção A: Testar com RevenueCat Sandbox

1. No app, faça uma compra teste (sandbox)
2. Observe os logs no terminal do servidor local
3. Você verá algo como:

```
📥 POST /revenuecat-webhook
🔔 Webhook received: INITIAL_PURCHASE
👤 User: device_ABC123
💎 Product: mooviaproweekly
✅ Credits granted: 400
```

#### Opção B: Testar Manualmente com cURL

```bash
curl -X POST https://sua-url-ngrok.ngrok-free.app/revenuecat-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer seu-token-secreto" \
  -d '{
    "event": {
      "type": "INITIAL_PURCHASE",
      "app_user_id": "device_test_123",
      "product_id": "mooviaproweekly",
      "purchased_at_ms": 1234567890000,
      "store": "app_store"
    }
  }'
```

### 5. Verificar Créditos no MongoDB

```bash
# Na pasta lambda/
npm run mongo-check

# Ou use MongoDB Compass:
mongodb://localhost:27017
# Database: moovia
# Collection: usercredits
```

## 🔍 Logs e Debug

### Ver Logs do Servidor
Os logs aparecem automaticamente no terminal onde você rodou `npm run dev`

### Ver Logs do ngrok
Acesse: http://localhost:4040
- Interface web do ngrok com todas as requisições
- Perfeito para debug

### Testar Endpoint Manualmente

```bash
# Verificar saldo de créditos
curl http://localhost:3000/credits/balance?userId=device_test_123

# Ver histórico
curl http://localhost:3000/credits/history?userId=device_test_123
```

## 🛠️ Troubleshooting

### Erro: "Port 3000 already in use"
```bash
# O servidor já mata processos automaticamente, mas se precisar:
lsof -ti:3000 | xargs kill -9
```

### Erro: "MongoDB connection failed"
```bash
# Verificar se MongoDB está rodando:
brew services start mongodb-community

# Ou:
mongod --config /usr/local/etc/mongod.conf
```

### Erro: "Invalid webhook signature"
- Verifique se o token no `.env` é o mesmo do RevenueCat
- Arquivo: `lambda/.env`
- Variável: `REVENUECAT_WEBHOOK_SECRET=seu-token`

### ngrok túnel expirou
- Túneis gratuitos expiram após 2 horas
- Basta reiniciar o ngrok e atualizar a URL no RevenueCat

## 📝 Produtos para Testar

### Assinaturas (Recurring):
- `mooviaproweekly` → 400 créditos
- `mooviaproannual` → 1.600 créditos

### Compras Únicas (One-time):
- `moovia_credits_1000` → 1.000 créditos
- `moovia_credits_5000` → 5.000 créditos
- `moovia_credits_10000` → 10.000 créditos

## ✅ Checklist de Teste

- [ ] Servidor local rodando (`npm run dev`)
- [ ] ngrok rodando (`npm run ngrok`)
- [ ] URL do webhook configurada no RevenueCat
- [ ] MongoDB rodando localmente
- [ ] Compra teste realizada no app
- [ ] Créditos apareceram no MongoDB
- [ ] App mostra os créditos corretamente

## 🎯 Próximos Passos

Depois de testar e validar:

1. **Deploy para produção**:
   ```bash
   cd lambda
   ./deploy-all.sh
   ```

2. **Atualizar webhook no RevenueCat** com a URL da API Gateway real

3. **Remover configuração do ngrok** do RevenueCat (manter só a URL de produção)

## 📚 Links Úteis

- RevenueCat Webhooks: https://www.revenuecat.com/docs/webhooks
- ngrok Dashboard: https://dashboard.ngrok.com
- MongoDB Compass: https://www.mongodb.com/products/compass


