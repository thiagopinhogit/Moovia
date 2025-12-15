# 🔐 Configuração do Webhook RevenueCat

## Problema

Os créditos não estão sendo adicionados após compras porque a variável `REVENUECAT_WEBHOOK_SECRET` não está configurada na Lambda em produção.

## ⚠️ Por que funcionava no backend local?

O backend local (`npm run dev`) não valida rigorosamente o token de autorização, por isso funcionava. Mas em produção (AWS Lambda), a validação é obrigatória para segurança.

## 📋 Passos para Configurar

### 1. Obter o Token de Autorização do RevenueCat

1. Acesse: https://app.revenuecat.com/
2. Selecione seu projeto: **Moovia**
3. Vá em: **Project Settings** → **Integrations** → **Webhooks**
4. Você verá a seção **"Authorization Bearer Token"**
5. **Copie o token** (é algo como: `rev_cat_wh_abc123...`)

### 2. Configurar o Arquivo `.env`

Na pasta `lambda/`, crie o arquivo `.env` baseado no `env.example`:

```bash
cd lambda
cp env.example .env
```

Edite o arquivo `.env` e adicione o token:

```bash
# RevenueCat Webhook Configuration
REVENUECAT_WEBHOOK_SECRET=seu_token_aqui

# ... outras variáveis ...
```

### 3. Atualizar Variáveis de Ambiente na Lambda

Execute o script que criamos:

```bash
cd lambda
chmod +x update-env-vars.sh
./update-env-vars.sh
```

Este script irá:
- ✅ Ler as variáveis do arquivo `.env`
- ✅ Atualizar a configuração da Lambda AWS
- ✅ Verificar se a configuração foi aplicada

### 4. Verificar a Configuração do Webhook no RevenueCat

Confirme que a URL do webhook está configurada corretamente:

**URL do Webhook:**
```
https://krgq9pgvb0.execute-api.sa-east-1.amazonaws.com/prod/revenuecat-webhook
```

**Eventos que devem estar habilitados:**
- ✅ `INITIAL_PURCHASE` - Primeira compra/assinatura
- ✅ `RENEWAL` - Renovação de assinatura
- ✅ `NON_RENEWING_PURCHASE` - Compras únicas (créditos)

### 5. Testar o Webhook

Após configurar, você pode testar de duas formas:

#### **Opção A: Teste Manual via RevenueCat Dashboard**

1. No RevenueCat Dashboard, vá em **Integrations → Webhooks**
2. Clique em **"Send Test"** próximo à sua URL
3. Escolha um evento (ex: `INITIAL_PURCHASE`)
4. Clique em **Send**
5. Verifique os logs da Lambda

#### **Opção B: Teste Real - Faça uma Compra de Teste**

1. No app, tente comprar créditos
2. Use uma conta de teste do App Store/Google Play
3. Após a compra, aguarde ~5 segundos
4. Verifique se os créditos foram adicionados

### 6. Verificar Logs (Se algo der errado)

```bash
# Ver logs recentes da Lambda
aws logs tail /aws/lambda/moovia-ai-video-generation \
  --region sa-east-1 \
  --since 10m \
  --follow

# Ver logs específicos do webhook
aws logs tail /aws/lambda/moovia-ai-video-generation \
  --region sa-east-1 \
  --since 10m \
  --filter-pattern "REVENUECAT WEBHOOK"
```

## 🔍 Debug: Verificar se o Webhook está Chegando

Se após configurar o token ainda não funcionar, verifique:

### 1. A Lambda está recebendo as requisições?

```bash
aws logs tail /aws/lambda/moovia-ai-video-generation \
  --region sa-east-1 \
  --since 5m \
  --filter-pattern "REVENUECAT WEBHOOK RECEIVED"
```

Se aparecer logs, significa que o webhook está chegando na Lambda.

### 2. Está falhando na validação do token?

```bash
aws logs tail /aws/lambda/moovia-ai-video-generation \
  --region sa-east-1 \
  --since 5m \
  --filter-pattern "Webhook signature verification FAILED"
```

Se aparecer, significa que o token está incorreto. Verifique se copiou corretamente do RevenueCat.

### 3. Verificar variáveis de ambiente atuais:

```bash
aws lambda get-function-configuration \
  --function-name moovia-ai-video-generation \
  --region sa-east-1 \
  --query 'Environment.Variables.REVENUECAT_WEBHOOK_SECRET'
```

## ✅ Checklist de Verificação

- [ ] Token copiado do RevenueCat Dashboard
- [ ] Arquivo `.env` criado na pasta `lambda/`
- [ ] Token adicionado ao `.env` como `REVENUECAT_WEBHOOK_SECRET=...`
- [ ] Script `update-env-vars.sh` executado com sucesso
- [ ] URL do webhook configurada no RevenueCat: `https://krgq9pgvb0.execute-api.sa-east-1.amazonaws.com/prod/revenuecat-webhook`
- [ ] Eventos habilitados: `INITIAL_PURCHASE`, `RENEWAL`, `NON_RENEWING_PURCHASE`
- [ ] Teste realizado (manual ou compra real)
- [ ] Créditos adicionados com sucesso ✨

## 🎯 Produtos Configurados

Certifique-se de que estes Product IDs estão configurados tanto no RevenueCat quanto no código:

### Assinaturas:
- `mooviaproweekly` - Moovia Pro Weekly
- `mooviaproannual` - Moovia Pro Annual

### Créditos (One-Time Purchase):
- `moovia_credits_1000` - 1,000 créditos
- `moovia_credits_5000` - 5,000 créditos
- `moovia_credits_10000` - 10,000 créditos

## 📞 Suporte

Se após seguir todos os passos ainda não funcionar:

1. Verifique os logs da Lambda (passo 6 acima)
2. Teste o webhook manualmente no RevenueCat Dashboard
3. Confirme que o Product ID da compra está na lista acima
4. Verifique se o MongoDB está acessível pela Lambda

## 🔐 Segurança

⚠️ **IMPORTANTE:**
- **NUNCA** faça commit do arquivo `.env` no Git
- O arquivo `.gitignore` já deve ter `.env` listado
- O token `REVENUECAT_WEBHOOK_SECRET` é sensível - mantenha seguro

