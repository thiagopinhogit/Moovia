# 🚀 GUIA RÁPIDO - Teste AGORA!

Siga esses passos NA ORDEM para testar em 15 minutos:

---

## ⏱️ PASSO 1: MongoDB Atlas (5 min)

### 1. Criar conta e cluster:
```
1. Acesse: https://www.mongodb.com/cloud/atlas/register
2. Crie conta (use Google para ser rápido)
3. Create a Deployment → M0 FREE
4. Cloud: AWS
5. Region: São Paulo (sa-east-1)
6. Create Deployment
```

### 2. Criar usuário:
```
Security Quickstart aparecerá:
- Username: moovia_admin
- Password: (auto-gerada) → COPIE A SENHA!
- Add User
```

### 3. Liberar acesso:
```
- IP Access List: Add My Current IP Address
- OU: 0.0.0.0/0 (permite todos - mais fácil pra teste)
- Finish and Close
```

### 4. Pegar connection string:
```
- Clique em "Connect"
- Drivers
- Copie o connection string
- Substitua <password> pela senha que você copiou

Exemplo:
mongodb+srv://moovia_admin:SuaSenha123@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority

Adicione /moovia antes do ?:
mongodb+srv://moovia_admin:SuaSenha123@cluster0.xxxxx.mongodb.net/moovia?retryWrites=true&w=majority
```

**✅ MongoDB pronto! Guarde essa string!**

---

## ⏱️ PASSO 2: Google API Key Nova (3 min)

### URGENTE - Revogar a chave exposta:

```
1. Acesse: https://console.cloud.google.com/apis/credentials
2. Procure a chave: AIzaSyDmVOOl3okeBUDOZnQ2hxWvAd20QzinnsA
3. Clique nos 3 pontinhos → Delete
4. Confirme
```

### Criar nova chave:

```
1. Create Credentials → API Key
2. Copie a nova chave
3. Edit API key (ícone de lápis)
4. API restrictions → Restrict key
5. Marque: Generative Language API
6. Set a quota (opcional):
   - Requests per day: 1000
7. Save
```

**✅ Nova chave criada! Guarde ela!**

---

## ⏱️ PASSO 3: Deploy da Lambda (7 min)

### 1. Instalar dependências e build:

```bash
cd lambda
npm install
npm run build
```

### 2. Criar .env:

```bash
# Crie o arquivo .env
cat > .env << 'EOF'
MONGODB_URI=COLE_SUA_STRING_AQUI
GOOGLE_API_KEY=COLE_SUA_CHAVE_AQUI
GEMINI_MODEL=gemini-3-pro-image-preview
RATE_LIMIT_FREE=0
RATE_LIMIT_PREMIUM=1000
MAX_DAILY_COST_USD=50
MAX_MONTHLY_COST_USD=500
NODE_ENV=production
AWS_REGION=sa-east-1
EOF
```

**Edite o .env e cole suas credenciais!**

### 3. Criar o zip para deploy:

```bash
npm run deploy
```

Isso cria `function.zip`

### 4. Deploy na AWS (via Console - mais fácil):

```
1. Acesse: https://console.aws.amazon.com/lambda
2. Mude região para: São Paulo (sa-east-1) [topo direito]
3. Create function
   - Nome: moovia-ai-video-generation
   - Runtime: Node.js 18.x
   - Create function
4. Upload code:
   - Code tab → Upload from → .zip file
   - Selecione function.zip
   - Save
5. Configuration → General configuration → Edit
   - Memory: 512 MB
   - Timeout: 2 min
   - Save
6. Configuration → Environment variables → Edit
   - Add todas as variáveis do .env
   - Save
```

**✅ Lambda deployada!**

---

## ⏱️ PASSO 4: API Gateway (5 min)

### 1. Criar API:

```
1. Acesse: https://console.aws.amazon.com/apigateway
2. Create API → HTTP API → Build
3. Add integration:
   - Lambda
   - Region: sa-east-1
   - Lambda function: moovia-ai-video-generation
   - Next
4. Configure routes:
   - Method: POST
   - Resource path: /generate-image
   - Next
5. Stage name: prod
6. Next → Create
```

### 2. Configurar CORS:

```
1. CORS no menu lateral
2. Configure
3. Access-Control-Allow-Origin: *
4. Access-Control-Allow-Headers: Content-Type,Authorization
5. Access-Control-Allow-Methods: POST,OPTIONS
6. Save
```

### 3. Copiar URL:

```
Na página da API:
Invoke URL: https://abc123xyz.execute-api.sa-east-1.amazonaws.com/prod

Sua URL completa:
https://abc123xyz.execute-api.sa-east-1.amazonaws.com/prod/generate-image
```

**✅ API pronta! Copie a URL!**

---

## ⏱️ PASSO 5: Atualizar o App (2 min)

### Edite: `src/constants/aiModels.ts`

```typescript
{
  id: 'lambda-secure',
  displayName: 'Moovia AI (Secure)',
  name: 'gemini-3-pro-image-preview',
  provider: 'lambda',
  apiUrl: 'COLE_SUA_URL_AQUI/generate-image', // ← Sua URL do API Gateway
  timeout: 120000,
  speed: 'medium',
  quality: 'high',
  free: false,
  censored: true,
  description: 'Secure API through AWS Lambda with cost tracking',
}
```

**✅ App configurado!**

---

## ⏱️ PASSO 6: Testar! 🎉

### Teste 1: Via curl (terminal):

```bash
curl -X POST https://SUA-URL.execute-api.sa-east-1.amazonaws.com/prod/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_123",
    "imageBase64": "/9j/4AAQSkZJRg...",
    "description": "make it sunset"
  }'
```

**Resposta esperada:**
```json
{
  "success": false,
  "error": "Subscription required. Please subscribe to use this feature."
}
```

**✅ Isso está CERTO! Significa que está funcionando!**

### Teste 2: No app:

```bash
# Volte para a pasta do app
cd ..

# Rode o app
npx expo start
```

1. Abra no seu iPhone
2. Faça login/subscribe se necessário
3. Tente gerar uma imagem
4. Deve funcionar! 🎉

---

## 🔍 Ver Logs em Tempo Real

### MongoDB (ver se está salvando):

```
1. Acesse MongoDB Atlas
2. Collections
3. Veja: api_usage, api_requests, cost_tracking
```

### Lambda (ver erros):

```
1. Acesse CloudWatch: https://console.aws.amazon.com/cloudwatch
2. Logs → Log groups
3. /aws/lambda/moovia-ai-video-generation
4. Clique no stream mais recente
```

---

## 🐛 Problemas Comuns

### "Internal server error" no app:
```bash
# Ver logs da Lambda
aws logs tail /aws/lambda/moovia-ai-video-generation --follow --region sa-east-1
```

### "Network error":
```
- Verifique se a URL do API Gateway está correta
- Verifique se CORS está configurado
- Tente o curl primeiro
```

### "MongoDB connection failed":
```
- Verifique se adicionou /moovia na connection string
- Verifique se o IP 0.0.0.0/0 está liberado no MongoDB
- Teste a connection string no Compass
```

### Lambda timeout:
```
- Verifique se o timeout está em 120 segundos
- Verifique se a Google API Key está correta
```

---

## 📊 Verificar se Está Funcionando

### 1. MongoDB tem dados?
```
MongoDB Atlas → Collections → api_usage
Deve ter pelo menos 1 documento após um request
```

### 2. Custos sendo trackados?
```
MongoDB Atlas → Collections → cost_tracking
Deve criar um documento por dia
```

### 3. Lambda está sendo invocada?
```
Lambda Console → Monitor tab
Deve mostrar invocations no gráfico
```

---

## 💰 Custos Totais (Estimativa)

```
MongoDB Atlas M0: GRÁTIS
AWS Lambda: GRÁTIS (até 1M requests)
API Gateway: GRÁTIS (até 1M requests)
Google Gemini API: ~$0.01 por imagem

Total: Basicamente só paga a Google API
```

---

## ✅ Checklist Rápido

- [ ] MongoDB Atlas criado
- [ ] Connection string copiada
- [ ] Google API Key antiga REVOGADA
- [ ] Nova Google API Key criada
- [ ] Lambda deployada em sa-east-1
- [ ] Variáveis de ambiente configuradas
- [ ] Timeout 120s configurado
- [ ] API Gateway criada
- [ ] CORS configurado
- [ ] URL do API Gateway copiada
- [ ] App atualizado com URL
- [ ] Teste com curl funcionou
- [ ] App funcionando

---

## 🎯 Próximo Nível (Depois que funcionar)

1. **Dashboard**: Criar dashboard no MongoDB Charts
2. **Alertas**: Configurar SNS para alertas de custo
3. **Monitoring**: CloudWatch Dashboards
4. **Backup**: Configurar backups do MongoDB
5. **Créditos**: Implementar sistema de créditos

---

**🚀 Agora é só seguir os passos e testar! Qualquer erro, me chama!**

