# 🚀 Deploy via Terminal (AWS CLI)

Muito mais rápido e profissional! Deploy completo em 2 minutos.

---

## 📋 Pré-requisitos

### 1. AWS CLI instalado e configurado:

```bash
# Verificar se está instalado
aws --version

# Se não tiver, instalar:
brew install awscli  # macOS

# Configurar (se ainda não configurou)
aws configure
# AWS Access Key ID: [sua key]
# AWS Secret Access Key: [sua secret]
# Default region: sa-east-1
# Default output format: json
```

### 2. Criar arquivo .env:

```bash
cd lambda

# Edite o .env que já criei e adicione sua NOVA Google API Key:
nano .env
# ou
code .env
```

---

## 🚀 OPÇÃO 1: Deploy Completo (Automático)

**Um comando faz tudo:**

```bash
cd lambda
./deploy-all.sh
```

Isso vai:
- ✅ Instalar dependências
- ✅ Compilar TypeScript
- ✅ Criar ZIP
- ✅ Criar IAM Role
- ✅ Criar/atualizar Lambda
- ✅ Criar API Gateway
- ✅ Configurar CORS
- ✅ Conectar tudo
- ✅ Te dar a URL pronta!

**Tempo: ~2 minutos** ⏱️

---

## 🎯 OPÇÃO 2: Deploy em Etapas

### Passo 1: Deploy da Lambda

```bash
cd lambda
./deploy-lambda.sh
```

### Passo 2: Criar API Gateway

```bash
./deploy-api-gateway.sh
```

---

## 📝 Resultado Esperado

No final, você verá algo assim:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ API Gateway configurado com sucesso!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Informações da API:
   API ID: abc123xyz
   Endpoint: https://abc123xyz.execute-api.sa-east-1.amazonaws.com
   Stage: prod

🔗 URL completa:
   https://abc123xyz.execute-api.sa-east-1.amazonaws.com/prod/generate-image

📋 Próximo passo:
Cole essa URL no arquivo: src/constants/aiModels.ts

apiUrl: 'https://abc123xyz.execute-api.sa-east-1.amazonaws.com/prod/generate-image',
```

---

## ✏️ Atualizar o App

Copie a URL e cole em `src/constants/aiModels.ts`:

```typescript
{
  id: 'lambda-secure',
  displayName: 'Moovia AI (Secure)',
  name: 'gemini-3-pro-image-preview',
  provider: 'lambda',
  apiUrl: 'COLE_A_URL_AQUI', // ← Cole a URL completa aqui
  timeout: 120000,
  speed: 'medium',
  quality: 'high',
  free: false,
  censored: true,
  description: 'Secure API through AWS Lambda with cost tracking',
}
```

---

## 🧪 Testar

### 1. Teste via curl:

```bash
# Copie o comando que o script mostra e execute
curl -X POST https://SUA-URL.execute-api.sa-east-1.amazonaws.com/prod/generate-image \
  -H 'Content-Type: application/json' \
  -d '{"userId":"test","imageBase64":"test","description":"test"}'

# Resposta esperada:
{"success":false,"error":"Subscription required"}
# ↑ ISSO ESTÁ CERTO! Significa que está validando!
```

### 2. Teste no app:

```bash
cd ..
npx expo start
```

---

## 🔄 Atualizar Deploy

Se você mudar o código:

```bash
cd lambda

# Só o código da Lambda
./deploy-lambda.sh

# Ou tudo (mais seguro)
./deploy-all.sh
```

---

## 📊 Ver Logs em Tempo Real

```bash
aws logs tail /aws/lambda/moovia-ai-video-generation --follow --region sa-east-1
```

---

## 🗑️ Deletar Tudo (se precisar)

```bash
cd lambda
./cleanup.sh
```

Isso remove:
- Lambda function
- API Gateway
- IAM Role

---

## 🆘 Troubleshooting

### "aws: command not found"
```bash
# Instalar AWS CLI
brew install awscli
aws configure
```

### "The security token included in the request is invalid"
```bash
# Reconfigurar AWS CLI
aws configure
# Coloque suas credenciais novamente
```

### "Permission denied"
```bash
# Dar permissão aos scripts
chmod +x *.sh
```

### "An error occurred (InvalidParameterValueException)"
```bash
# Verificar se o .env está correto
cat .env

# Verificar se tem todas as variáveis
```

---

## ✅ Vantagens do Deploy via CLI

✅ **Muito mais rápido** (2 min vs 15 min manual)  
✅ **Reproduzível** (sempre igual)  
✅ **Automatizado** (zero cliques)  
✅ **Versionado** (scripts no Git)  
✅ **Profissional** (CI/CD ready)  

---

## 🎯 Resumo Rápido

```bash
# 1. Configure AWS CLI
aws configure

# 2. Edite o .env
cd lambda
nano .env  # Adicione GOOGLE_API_KEY nova

# 3. Deploy tudo
./deploy-all.sh

# 4. Copie a URL e cole no app
# src/constants/aiModels.ts

# 5. Teste!
npx expo start
```

**Pronto! 🎉**

---

## 📚 Scripts Disponíveis

- **`deploy-all.sh`** → Deploy completo (Lambda + API Gateway)
- **`deploy-lambda.sh`** → Só a Lambda
- **`deploy-api-gateway.sh`** → Só o API Gateway
- **`cleanup.sh`** → Remove tudo

---

**Agora é só rodar `./deploy-all.sh` e pronto!** 🚀

