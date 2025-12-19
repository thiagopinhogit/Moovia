# ✅ Deploy Concluído com Sucesso!

**Data:** 14 de Dezembro de 2025

## 🚀 Lambda Deploy

### Função Lambda Criada

```
Nome: moovia-ai-video-generation
Região: sa-east-1 (São Paulo)
ARN: arn:aws:lambda:sa-east-1:825765408473:function:moovia-ai-video-generation
Runtime: Node.js 20.x
Memória: 512 MB
Timeout: 120 segundos
```

### IAM Role

```
Nome: moovia-lambda-execution-role
ARN: arn:aws:iam::825765408473:role/moovia-lambda-execution-role
```

---

## 👤 Usuário de Deploy Criado

```
User ID: moovia-deploy-user-1765761999
Tier: premium
Status: active
Requests: 0/0/0 (daily/monthly/total)
```

Este usuário pode ser usado para testar o app imediatamente.

---

## 📋 Próximos Passos

### 1. Configurar API Gateway

Para expor a Lambda publicamente:

```bash
cd /Users/thiagopinho/Moovia/Moovia/lambda
./deploy-api-gateway.sh
```

Ou configure manualmente no console AWS.

### 2. Criar Novos Usuários

Use o script criado para facilitar:

```bash
# Criar usuário com ID automático
./create-user.sh

# Criar usuário com ID específico (ex: do RevenueCat)
./create-user.sh "$RCAnonymousID:3363085efadd4f52a48e90d4e74aa4f4"
```

### 3. Ver Logs da Lambda

```bash
aws logs tail /aws/lambda/moovia-ai-video-generation --follow --region sa-east-1
```

### 4. Testar a Lambda

Use o arquivo `test-video.sh` ou faça requests diretos.

---

## 🔧 Comandos Úteis

### Atualizar Lambda (após mudanças no código)

```bash
./deploy-lambda.sh
```

### Deploy Completo (Lambda + API Gateway)

```bash
./deploy-all.sh
```

### Limpar Banco de Dados

```bash
# Limpar todos os créditos
node clear-credits.js

# Limpar tudo
node clear-db.js
```

---

## 📊 Monitoramento

### CloudWatch Logs

- Acesse: AWS Console > CloudWatch > Log Groups
- Grupo: `/aws/lambda/moovia-ai-video-generation`

### MongoDB Atlas

- Acesse seu cluster no MongoDB Atlas
- Collections:
  - `api_usage` - Uso por usuário
  - `api_requests` - Log detalhado de requests
  - `cost_tracking` - Tracking de custos
  - `user_credits` - Créditos dos usuários
  - `video_tasks` - Tasks de geração de vídeo

---

## 🆘 Troubleshooting

### Lambda não responde

1. Verifique logs no CloudWatch
2. Verifique variáveis de ambiente
3. Verifique conectividade com MongoDB (whitelist de IP)

### Usuário não consegue fazer requests

1. Verifique se está no MongoDB:
   ```bash
   node add-premium-user.js USER_ID
   ```
2. Verifique subscription status
3. Veja logs para mensagens de erro

### Timeout na Lambda

1. Aumente timeout (atual: 120s)
2. Verifique se APIs externas estão respondendo
3. Otimize código se necessário

---

## 🎉 Sucesso!

Sua infraestrutura está pronta para uso. O app pode começar a fazer chamadas para a Lambda imediatamente.

**Próximo passo recomendado:** Configure o API Gateway para ter uma URL pública e use no app.

---

## 📚 Documentação Adicional

- [AWS Lambda Setup](../docs/AWS_LAMBDA_SETUP.md)
- [MongoDB Setup](../docs/MONGODB_SETUP.md)
- [Google Veo Setup](./GOOGLE_VEO_SETUP.md)
- [Ngrok Webhook Setup](./NGROK_WEBHOOK_SETUP.md)
- [Security Guide](../docs/SECURITY_GUIDE.md)




