# 🚀 AWS Lambda Setup Guide

Guia passo a passo para fazer deploy da função Lambda no Brasil (São Paulo).

---

## 📋 Pré-requisitos

- ✅ Conta AWS ativa
- ✅ AWS CLI instalado e configurado
- ✅ Node.js instalado
- ✅ MongoDB Atlas configurado (veja `MONGODB_SETUP.md`)

---

## 1️⃣ Preparar o Código

### Build da função:

```bash
cd lambda
npm install
npm run build
npm run deploy
```

Isso cria `function.zip` com tudo que você precisa.

---

## 2️⃣ Criar a Função Lambda

### Via AWS Console:

1. Acesse: https://console.aws.amazon.com/lambda
2. Certifique-se de estar na região **São Paulo (sa-east-1)**
3. Clique em **"Create function"**

### Configurações:

```
Nome: moovia-ai-video-generation
Runtime: Node.js 18.x (ou mais recente)
Architecture: x86_64
Role: Create a new role with basic Lambda permissions
```

4. Clique em **"Create function"**

---

## 3️⃣ Upload do Código

### Via Console:

1. Na página da função, vá em **"Code"** tab
2. Clique em **"Upload from"** → **".zip file"**
3. Selecione o arquivo `function.zip`
4. Clique em **"Save"**

### Via AWS CLI (alternativo):

```bash
aws lambda update-function-code \
  --function-name moovia-ai-video-generation \
  --zip-file fileb://function.zip \
  --region sa-east-1
```

---

## 4️⃣ Configurar Variáveis de Ambiente

1. Na página da função, vá em **"Configuration"** → **"Environment variables"**
2. Clique em **"Edit"**
3. Adicione as seguintes variáveis:

```
MONGODB_URI = mongodb+srv://usuario:senha@cluster.mongodb.net/moovia
GOOGLE_API_KEY = AIzaSy...  (sua NOVA chave - revogue a antiga!)
GEMINI_MODEL = gemini-3-pro-image-preview
RATE_LIMIT_FREE = 0
RATE_LIMIT_PREMIUM = 1000
MAX_DAILY_COST_USD = 50
MAX_MONTHLY_COST_USD = 500
NODE_ENV = production
AWS_REGION = sa-east-1
```

4. Clique em **"Save"**

---

## 5️⃣ Configurar Timeout e Memória

1. Vá em **"Configuration"** → **"General configuration"**
2. Clique em **"Edit"**
3. Configure:

```
Memory: 512 MB
Timeout: 2 min 0 sec (120 segundos)
Ephemeral storage: 512 MB (padrão)
```

4. Clique em **"Save"**

---

## 6️⃣ Criar API Gateway

### Via Console:

1. Acesse: https://console.aws.amazon.com/apigateway
2. Clique em **"Create API"**
3. Escolha **"HTTP API"**
4. Clique em **"Build"**

### Configurações:

```
API name: moovia-ai-api
Description: Moovia AI video generation API
```

### Integração:

1. Clique em **"Add integration"**
2. Integration type: **Lambda**
3. AWS Region: **sa-east-1**
4. Lambda function: **moovia-ai-video-generation**
5. Version: **2.0**
6. Clique em **"Next"**

### Routes:

```
Method: POST
Resource path: /generate-image
```

Clique em **"Next"** → **"Next"** → **"Create"**

---

## 7️⃣ Configurar CORS

1. Na API criada, vá em **"CORS"**
2. Clique em **"Configure"**
3. Configure:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Content-Type,Authorization
Access-Control-Allow-Methods: POST,OPTIONS
```

4. Clique em **"Save"**

---

## 8️⃣ Deploy da API

1. Vá em **"Deploy"** no menu lateral
2. Clique em **"Create"**
3. Stage name: **prod**
4. Clique em **"Create"**

---

## 9️⃣ Obter URL da API

1. Na página da API, vá em **"Stages"** → **"prod"**
2. Copie o **Invoke URL**

Será algo como:
```
https://abc123xyz.execute-api.sa-east-1.amazonaws.com/prod
```

Sua URL completa do endpoint será:
```
https://abc123xyz.execute-api.sa-east-1.amazonaws.com/prod/generate-image
```

---

## 🔟 Atualizar o App

### Edite o arquivo do app:

```typescript
// src/constants/aiModels.ts

{
  id: 'lambda-secure',
  displayName: 'Moovia AI (Secure)',
  name: 'gemini-3-pro-image-preview',
  provider: 'lambda',
  apiUrl: 'https://SUA-URL-AQUI.execute-api.sa-east-1.amazonaws.com/prod/generate-image', // ← Coloque sua URL aqui
  // ...
}
```

---

## 1️⃣1️⃣ Configurar MongoDB Whitelist

1. Acesse MongoDB Atlas
2. Vá em **Network Access**
3. Clique em **"Add IP Address"**
4. Adicione:

**Para desenvolvimento:**
```
0.0.0.0/0 (permite todos)
```

**Para produção (recomendado):**
- Obtenha IPs da Lambda usando VPC
- Ou use 0.0.0.0/0 com autenticação forte

---

## 1️⃣2️⃣ Testar a API

### Via curl:

```bash
curl -X POST https://SUA-URL.execute-api.sa-east-1.amazonaws.com/prod/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "imageBase64": "iVBORw0KGgoAAAA...",
    "description": "make it sunset"
  }'
```

### Resposta esperada:

```json
{
  "success": true,
  "imageUrl": "data:image/png;base64,...",
  "processingTimeMs": 3500
}
```

---

## 1️⃣3️⃣ Monitorar Logs

### Via Console:

1. Acesse CloudWatch: https://console.aws.amazon.com/cloudwatch
2. Vá em **Logs** → **Log groups**
3. Procure por `/aws/lambda/moovia-ai-video-generation`
4. Clique para ver os logs

### Via AWS CLI:

```bash
aws logs tail /aws/lambda/moovia-ai-video-generation --follow --region sa-east-1
```

---

## 1️⃣4️⃣ Configurar Alertas de Custo

### CloudWatch Alarm:

1. Acesse CloudWatch Alarms
2. Clique em **"Create alarm"**
3. Select metric → **Lambda** → **Invocations**
4. Statistic: **Sum**
5. Period: **1 day**
6. Threshold: **1000** (ajuste conforme necessário)
7. Action: **Send notification to SNS** (configure email)

---

## 💰 Custos Estimados

### Lambda:
```
Primeiros 1 milhão requests/mês: GRÁTIS
Depois: $0.20 por 1 milhão de requests

Compute:
Primeiros 400.000 GB-seconds/mês: GRÁTIS
Depois: $0.00001667 por GB-second
```

### API Gateway:
```
Primeiros 1 milhão requests/mês: GRÁTIS
Depois: $1.00 por 1 milhão de requests
```

### Exemplo real:
```
10.000 usuários ativos
100.000 requests/mês
= Menos de $5/mês na AWS
```

---

## 🔒 Segurança - Próximos Passos

### 1. Revogar chave antiga do Google:
```
1. Acesse: https://console.cloud.google.com/apis/credentials
2. Encontre a chave: AIzaSyDmVOOl3okeBUDOZnQ2hxWvAd20QzinnsA
3. Clique em "Delete"
```

### 2. Criar nova chave com restrições:
```
1. Create credentials → API key
2. Edit restrictions:
   - Application restrictions: IP addresses
   - Add IPs da Lambda (ou usar NAT Gateway)
   - API restrictions: Generative Language API
   - Add quota: 1000 requests/day
```

### 3. Atualizar variável de ambiente na Lambda:
```
GOOGLE_API_KEY = <nova chave>
```

---

## 🆘 Troubleshooting

### Lambda timeout:
```
Problema: Function timed out after 3 seconds
Solução: Aumentar timeout para 120s (passo 5)
```

### MongoDB connection failed:
```
Problema: MongoNetworkError
Solução: Adicionar 0.0.0.0/0 no MongoDB whitelist
```

### CORS error:
```
Problema: CORS policy blocked
Solução: Verificar configuração CORS no API Gateway (passo 7)
```

### 403 Subscription required:
```
Problema: User não tem subscription
Solução: Verificar se RevenueCat está configurado no app
```

---

## ✅ Checklist Final

- [ ] Lambda criada em sa-east-1
- [ ] Código deployed
- [ ] Variáveis de ambiente configuradas
- [ ] Timeout configurado (120s)
- [ ] API Gateway criada
- [ ] CORS configurado
- [ ] URL da API copiada
- [ ] App atualizado com nova URL
- [ ] MongoDB whitelist configurado
- [ ] Teste realizado com sucesso
- [ ] Chave antiga do Google revogada
- [ ] Nova chave criada com restrições
- [ ] CloudWatch alarms configurados

---

## 📚 Próximos Passos

1. **MongoDB Setup** → `MONGODB_SETUP.md`
2. **Security Guide** → `SECURITY_GUIDE.md`
3. **Monitoring** → `MONITORING.md` (a criar)

---

**🎉 Parabéns! Seu backend está seguro e escalável!**

