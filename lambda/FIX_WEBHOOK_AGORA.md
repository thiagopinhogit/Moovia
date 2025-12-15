# 🚨 CORREÇÃO RÁPIDA: Webhook RevenueCat não está funcionando

## ❌ Problema Identificado

A variável `REVENUECAT_WEBHOOK_SECRET` **não está configurada** na Lambda AWS. Por isso os créditos não são adicionados após compras.

## ✅ Solução Rápida (5 minutos)

### 1️⃣ Obter o Token do RevenueCat

1. Acesse: https://app.revenuecat.com/
2. Vá em: **Project Settings** → **Integrations** → **Webhooks**
3. Copie o **"Authorization Bearer Token"**

### 2️⃣ Criar arquivo `.env`

```bash
cd lambda
cp env.example .env
```

Abra o arquivo `.env` e adicione na linha correspondente:

```bash
REVENUECAT_WEBHOOK_SECRET=cole_o_token_aqui
```

### 3️⃣ Atualizar a Lambda

```bash
./update-env-vars.sh
```

**Aguarde ~30 segundos** para a Lambda aplicar as mudanças.

### 4️⃣ Testar

```bash
./test-webhook-prod.sh
```

Ou faça uma compra de teste no app e veja se os créditos são adicionados.

---

## 📋 Verificação da Configuração do Webhook no RevenueCat

Confirme que estes valores estão configurados no RevenueCat Dashboard:

**URL do Webhook:**
```
https://krgq9pgvb0.execute-api.sa-east-1.amazonaws.com/prod/revenuecat-webhook
```

**Eventos Habilitados:**
- ✅ `INITIAL_PURCHASE`
- ✅ `RENEWAL`
- ✅ `NON_RENEWING_PURCHASE`

---

## 🔍 Se ainda não funcionar

### Verificar logs da Lambda:

```bash
aws logs tail /aws/lambda/moovia-ai-video-generation \
  --region sa-east-1 \
  --since 10m \
  --filter-pattern "REVENUECAT" \
  --follow
```

### Verificar se a variável foi configurada:

```bash
aws lambda get-function-configuration \
  --function-name moovia-ai-video-generation \
  --region sa-east-1 \
  --query 'Environment.Variables.REVENUECAT_WEBHOOK_SECRET'
```

Se retornar `null` ou vazio, execute o passo 3 novamente.

---

## 📝 Checklist

- [ ] Token copiado do RevenueCat
- [ ] Arquivo `.env` criado com `REVENUECAT_WEBHOOK_SECRET=...`
- [ ] Script `update-env-vars.sh` executado
- [ ] Aguardou 30 segundos
- [ ] Testou com `test-webhook-prod.sh` ou compra real
- [ ] Créditos adicionados! 🎉

---

## 💡 Por que funcionava no backend local?

O backend local (`npm run dev`) não valida rigorosamente o token por ser ambiente de desenvolvimento. Em produção (AWS Lambda), a validação é obrigatória para segurança.

---

Para mais detalhes, consulte: `REVENUECAT_WEBHOOK_CONFIG.md`

