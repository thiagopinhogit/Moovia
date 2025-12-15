# 🔍 Verificação Rápida - Webhook RevenueCat

## ⚡ Checklist de 5 Minutos

### ✅ 1. URL está correta no RevenueCat?

Vá em: https://app.revenuecat.com → Project Settings → Integrations → Webhooks

**URL deve ser EXATAMENTE:**
```
https://krgq9pgvb0.execute-api.sa-east-1.amazonaws.com/prod/revenuecat-webhook
```

**Events selecionados:**
- ✅ INITIAL_PURCHASE
- ✅ RENEWAL  
- ✅ NON_RENEWING_PURCHASE

### ✅ 2. Teste o webhook direto

No dashboard do RevenueCat, clique em **"Send Test"** ao lado do webhook.

**Resultado esperado:**
```json
{
  "success": true,
  "message": "Subscription credits granted successfully",
  "creditsGranted": 400
}
```

Se der **erro 401**: Remova o Authorization header no webhook (ou configure `REVENUECAT_WEBHOOK_SECRET` na Lambda)

Se der **erro 404**: A Lambda não está deployada corretamente. Rode:
```bash
cd lambda
npm run deploy
```

### ✅ 3. Verifique os logs da Lambda

1. Acesse: https://console.aws.amazon.com/lambda
2. Selecione `moovia-ai-lambda`
3. Clique em **Monitor** → **View logs in CloudWatch**
4. Procure por:

**Se o webhook está chegando:**
```
🔔 ====== REVENUECAT WEBHOOK RECEIVED ======
```

**Se os créditos foram concedidos:**
```
✅ Granted 400 credits to device_XXX
🎉 ====== WEBHOOK SUCCESS ======
```

**Se é duplicado (já processado antes):**
```
⚠️ Duplicate subscription detected - credits NOT added
```

### ✅ 4. Teste manualmente com o script

```bash
cd lambda
./test-webhook-prod.sh
```

Isso vai:
1. Enviar um webhook de teste para produção
2. Verificar o saldo de créditos
3. Enviar uma compra de créditos
4. Verificar o saldo novamente

### ✅ 5. Verifique os créditos no app

**Opção A: Via API**
```bash
curl https://krgq9pgvb0.execute-api.sa-east-1.amazonaws.com/prod/credits/device_8918A9A7-9902-4449-9638-59582C9EDE6B | jq
```

**Opção B: No app**
1. Force-refresh na home (puxe para baixo)
2. Vá em créditos
3. Deve mostrar o saldo atual

## 🚨 Problemas Comuns

### Problema 1: Webhook retorna 200 mas créditos não aparecem

**Causa:** Transação já foi processada antes (duplicado)

**Solução:**
1. Veja os logs da Lambda
2. Procure por "Duplicate"
3. Faça uma NOVA compra (não tente reprocessar a mesma)

**OU** limpe o histórico de transações no MongoDB:
```bash
cd lambda
npm run clear-db
```
⚠️ **CUIDADO:** Isso apaga TODOS os dados!

### Problema 2: App mostra tela de sucesso mas créditos ficam em 0

**Causa:** Webhook não está chegando na Lambda

**Passos:**
1. Verifique a URL no RevenueCat (passo 1)
2. Teste o webhook com "Send Test" (passo 2)
3. Veja os logs da Lambda (passo 3)
4. Se não aparecer NADA nos logs = webhook não está configurado

### Problema 3: Erro 401 Unauthorized

**Causa:** Authorization header não bate com `REVENUECAT_WEBHOOK_SECRET`

**Solução:**
1. Vá em AWS Lambda → Configuration → Environment variables
2. Verifique se `REVENUECAT_WEBHOOK_SECRET` existe
3. Se existe: use o mesmo valor no RevenueCat Authorization header (`Bearer TOKEN`)
4. Se não existe: remova o Authorization header do webhook no RevenueCat

## 🎯 Próximos Passos

### Se o webhook estiver funcionando MAS créditos não aparecem no app:

1. **Force refresh no app:**
   - Puxe para baixo na home
   - Isso recarrega os créditos

2. **Espere alguns segundos:**
   - O webhook pode levar 5-10 segundos para processar
   - O app agora atualiza automaticamente após compra

3. **Verifique direto na API:**
   ```bash
   curl https://krgq9pgvb0.execute-api.sa-east-1.amazonaws.com/prod/credits/SEU_USER_ID
   ```
   
   Se a API mostrar os créditos mas o app não = problema no app (cache)
   
   Se a API também mostrar 0 = webhook não processou

### Se o webhook NÃO estiver funcionando:

1. **Verifique a configuração:**
   - URL exata
   - Events selecionados
   - Sem Authorization header (ou com o correto)

2. **Redeploy a Lambda:**
   ```bash
   cd lambda
   npm run build
   npm run deploy
   ```

3. **Teste novamente:**
   ```bash
   ./test-webhook-prod.sh
   ```

4. **Faça uma compra nova no app:**
   - Não tente reprocessar a mesma compra
   - O sistema previne duplicados

## 📞 Suporte

Se nada funcionar, envie:
1. Screenshot da configuração do webhook no RevenueCat
2. Logs da Lambda (últimas 50 linhas)
3. Output do comando:
   ```bash
   curl https://krgq9pgvb0.execute-api.sa-east-1.amazonaws.com/prod/credits/SEU_USER_ID
   ```
4. Transaction ID da compra problemática (aparece nos logs do app)

---

**✨ Depois que tudo funcionar, delete este arquivo!**

