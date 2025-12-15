# ✅ Checklist - Configuração do Webhook RevenueCat

## 🔗 URL do Webhook (PROD)
```
https://krgq9pgvb0.execute-api.sa-east-1.amazonaws.com/prod/revenuecat-webhook
```

## 📋 Passos para Configurar no RevenueCat Dashboard

### 1. Acessar Dashboard
1. Acesse: https://app.revenuecat.com
2. Faça login
3. Selecione o projeto **Moovia**

### 2. Ir para Webhooks
1. No menu lateral, clique em **Project Settings** (ícone de engrenagem)
2. Clique na aba **Integrations**
3. Role até a seção **Webhooks**
4. Clique em **+ Add Webhook** (ou edite o existente)

### 3. Configurar Webhook

#### URL:
```
https://krgq9pgvb0.execute-api.sa-east-1.amazonaws.com/prod/revenuecat-webhook
```

#### Events (Selecione TODOS estes):
- ✅ **INITIAL_PURCHASE** (primeira compra)
- ✅ **RENEWAL** (renovação de subscription)
- ✅ **NON_RENEWING_PURCHASE** (compra de créditos avulsos)
- ⚠️ **CANCELLATION** (opcional - apenas para logs)
- ⚠️ **EXPIRATION** (opcional - apenas para logs)

#### Authorization Header (OPCIONAL mas recomendado):
Se você definiu `REVENUECAT_WEBHOOK_SECRET` na Lambda, adicione:
```
Bearer SEU_TOKEN_SECRETO_AQUI
```

Se NÃO definiu (o webhook aceita sem auth), deixe em branco.

### 4. Testar Webhook

Depois de salvar, clique em **"Send Test"** no dashboard do RevenueCat para enviar um evento de teste.

Você deve ver:
- ✅ Status: **200 OK**
- ✅ Response: `{"success": true, ...}`

### 5. Verificar Logs da Lambda

Acesse AWS Console > Lambda > moovia-ai-lambda > **Monitor** > **View logs in CloudWatch**

Procure por logs como:
```
📨 RevenueCat webhook received
Event type: INITIAL_PURCHASE
✅ Granted 400 credits to device_XXX
```

## 🔍 Troubleshooting

### ❌ Webhook retorna 404
**Problema:** URL errada ou Lambda não deployada corretamente

**Solução:**
1. Verifique se a Lambda está deployada: `cd lambda && npm run deploy`
2. Verifique se o endpoint existe no API Gateway
3. Use a URL exata acima

### ❌ Webhook retorna 401 Unauthorized
**Problema:** Authorization header não bate com `REVENUECAT_WEBHOOK_SECRET`

**Solução:**
1. Vá em AWS Lambda > Configuration > Environment variables
2. Verifique se `REVENUECAT_WEBHOOK_SECRET` está definido
3. Use o mesmo valor no Authorization header do RevenueCat
4. OU remova a variável para aceitar webhooks sem auth

### ❌ Webhook retorna 200 mas créditos não aparecem
**Problema:** Webhook está processando mas pode estar detectando como duplicado

**Solução:**
1. Verifique os logs da Lambda no CloudWatch
2. Procure por: `⚠️ Duplicate purchase detected`
3. Se for duplicado, o webhook já processou essa compra antes
4. Faça uma NOVA compra para testar (ou use "Send Test" no dashboard)

### ❌ App mostra tela de sucesso mas créditos não recarregam
**Problema:** PurchaseSuccessScreen não atualiza os créditos após fechar

**Solução:** Implementar listener de atualização de créditos (ver abaixo)

## 🛠️ Como Testar End-to-End

### Teste 1: Webhook Direto (via RevenueCat Dashboard)
1. Vá em RevenueCat > Project Settings > Integrations > Webhooks
2. Clique em **"Send Test"** ao lado do webhook
3. Verifique se retorna 200 OK
4. Vá na Lambda CloudWatch e veja os logs

### Teste 2: Compra Real no App (Sandbox)
1. Desinstale e reinstale o app (para limpar cache)
2. Faça uma nova compra teste no app
3. Aguarde 10-30 segundos
4. Verifique os logs da Lambda
5. Force-refresh no app (puxe para baixo na home)

### Teste 3: Verificar Créditos Diretamente
Use este comando para ver o saldo de créditos:

```bash
# Substitua USER_ID pelo seu ID
curl https://krgq9pgvb0.execute-api.sa-east-1.amazonaws.com/prod/credits/device_8918A9A7-9902-4449-9638-59582C9EDE6B
```

Deve retornar:
```json
{
  "success": true,
  "userId": "device_8918A9A7-9902-4449-9638-59582C9EDE6B",
  "credits": 400,
  "subscriptionTier": "mooviaproweekly",
  "lastUpdated": "2025-12-15T..."
}
```

## 🎯 Próximos Passos

Se o webhook estiver configurado corretamente mas os créditos ainda não aparecem:

1. **Verificar se o webhook foi chamado**: Veja logs da Lambda
2. **Verificar duplicados**: O webhook não adiciona créditos para transações já processadas
3. **Implementar fallback no app**: Adicionar lógica para conceder créditos localmente se o webhook falhar
4. **Adicionar refresh automático**: Atualizar créditos quando PurchaseSuccessScreen fechar

## 📞 Suporte

Se ainda não funcionar:
1. Envie screenshot da configuração do webhook no RevenueCat
2. Envie logs da Lambda (CloudWatch)
3. Envie o `storeTransactionId` da compra problemática

