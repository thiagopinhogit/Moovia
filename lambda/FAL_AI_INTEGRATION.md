# Integração Fal AI - Kling Video Models

## 🎯 Problema Resolvido
A API direta da Kling AI estava apresentando erros de "Account balance not enough", impedindo a geração de vídeos. Migração para Fal AI resolve esse problema usando a infraestrutura confiável da Fal.

## ✅ Mudanças Implementadas

### 1. Backend (Lambda)
- ✅ Instalado `@fal-ai/client` package
- ✅ Criado `src/services/falVideo.ts` - Novo serviço para Fal AI
- ✅ Atualizado `src/handlers/videoHandler.ts` para suportar provider 'fal-ai'
- ✅ Adicionado suporte para modelos Kling via Fal AI:
  - `kling-v2.5-turbo-pro` (recomendado)
  - `kling-v2.5-turbo-standard`
  - `kling-v1-5-pro`

### 2. Frontend
- ✅ Atualizado `src/constants/videoModels.ts` com novos modelos Fal AI
- ✅ Atualizado `src/services/videoGeneration.ts` para usar provider 'fal-ai'
- ✅ Adicionado tipo de provider 'fal-ai'

### 3. Configuração
- ✅ Adicionado `FAL_KEY` no `env.example`
- ✅ Código compilado e ZIP criado para deploy

## 🔑 Setup - Obter API Key da Fal AI

1. Acesse: https://fal.ai/dashboard/keys
2. Faça login ou crie uma conta
3. Clique em "Create API Key"
4. Copie a chave gerada

## 📝 Configuração

### Lambda (Backend)

1. **Adicione a FAL_KEY nas variáveis de ambiente da Lambda:**

```bash
cd lambda
# Edite .env ou configure diretamente na AWS Lambda Console
FAL_KEY=your_fal_api_key_here
```

2. **Atualize as variáveis de ambiente na AWS Lambda:**

```bash
# Via AWS CLI
aws lambda update-function-configuration \
  --function-name moovia-api \
  --environment "Variables={FAL_KEY=your_fal_api_key_here,MONGODB_URI=...,GOOGLE_VEO_API_KEY=...}"

# Ou via script helper
./update-lambda-env.sh
```

### Frontend

O frontend já está configurado para usar o provider 'fal-ai' por padrão.

## 🚀 Deploy

### Opção 1: Script Automático

```bash
cd lambda
./deploy-lambda.sh
```

### Opção 2: Manual via AWS CLI

```bash
cd lambda

# 1. Build
npm run build

# 2. Criar ZIP (já criado: function.zip)
zip -r function.zip dist node_modules package.json

# 3. Upload para AWS Lambda
aws lambda update-function-code \
  --function-name moovia-api \
  --zip-file fileb://function.zip

# 4. Configurar variáveis de ambiente
aws lambda update-function-configuration \
  --function-name moovia-api \
  --environment "Variables={FAL_KEY=your_key_here,MONGODB_URI=...,GOOGLE_VEO_API_KEY=...}"
```

### Opção 3: Via AWS Console

1. Acesse AWS Lambda Console
2. Selecione a função `moovia-api`
3. Upload `lambda/function.zip` na seção "Code"
4. Configure `FAL_KEY` em "Configuration > Environment variables"

## 📊 Modelos Disponíveis

### Kling 2.5 Turbo Pro (Recomendado) ⭐
- **Model ID:** `kling-v2.5-turbo-pro`
- **Endpoint:** `fal-ai/kling-video/v2.5-turbo/pro/image-to-video`
- **Custo:** 8.4 créditos/segundo
- **Duração:** 5s ou 10s
- **Qualidade:** Alta
- **Velocidade:** Rápida

### Kling 2.5 Turbo Standard
- **Model ID:** `kling-v2.5-turbo-standard`
- **Endpoint:** `fal-ai/kling-video/v2.5-turbo/standard/image-to-video`
- **Custo:** 8.4 créditos/segundo
- **Qualidade:** Alta

### Kling 1.5 Pro
- **Model ID:** `kling-v1-5-pro`
- **Endpoint:** `fal-ai/kling-video/v1.5/pro/image-to-video`
- **Custo:** 14 créditos/segundo
- **Qualidade:** Standard

## 🔄 Migração da API Direta Kling

### Antes (Kling Direct API - DEPRECATED)
```typescript
provider: 'kling'
model: 'kling-v1-5'
```

### Depois (Fal AI - RECOMENDADO)
```typescript
provider: 'fal-ai'
model: 'kling-v2.5-turbo-pro'
```

## 💰 Créditos

Os custos permanecem os mesmos:
- **Text-to-Video (5s):** 42 créditos
- **Image-to-Video (10s):** 84 créditos

## ✨ Vantagens da Fal AI

1. **Mais Confiável:** Infraestrutura robusta sem problemas de saldo
2. **Mesmo Custo:** Preços equivalentes à API direta
3. **Fácil Upload:** Suporte nativo para upload de imagens base64
4. **Queue System:** Sistema de filas otimizado
5. **Melhor Monitoring:** Logs e status mais claros

## 🧪 Testando

### 1. Teste Local (Dev Server)
```bash
cd lambda
npm run dev
# Server rodando em http://localhost:3000

# Em outro terminal, teste:
curl -X POST http://localhost:3000/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "provider": "fal-ai",
    "model": "kling-v2.5-turbo-pro",
    "prompt": "A beautiful sunset over the ocean",
    "duration": "5",
    "aspectRatio": "16:9"
  }'
```

### 2. Teste em Produção
```bash
# Via API Gateway
curl -X POST https://your-api-gateway-url/prod/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "provider": "fal-ai",
    "model": "kling-v2.5-turbo-pro",
    "prompt": "A beautiful sunset",
    "duration": "5"
  }'
```

## 📱 Uso no App

O app já está configurado para usar Fal AI por padrão. Ao gerar um vídeo:

```typescript
// Em HomeScreen.tsx ou EditScreen.tsx
const result = await generateVideo({
  modelId: 'kling-2.5-turbo', // Automaticamente usa Fal AI
  prompt: "A beautiful sunset over the ocean",
  imageUrl: imageUri, // Opcional
  duration: 5,
  aspectRatio: '16:9',
});
```

## 🔧 Troubleshooting

### Erro: "FAL_KEY must be configured"
**Solução:** Configure a variável de ambiente FAL_KEY na Lambda

### Erro: "Account balance not enough"
**Solução:** Você ainda está usando a API direta da Kling. Certifique-se de que:
1. Lambda tem FAL_KEY configurada
2. Frontend está usando provider 'fal-ai'
3. Lambda foi deployada com código atualizado

### Vídeo não processa
**Solução:** 
1. Verifique os logs da Lambda no CloudWatch
2. Confirme que o taskId está sendo salvo no MongoDB
3. Teste o status: `GET /video-status/{taskId}`

## 📝 Próximos Passos

1. ✅ Obter API Key da Fal AI
2. ✅ Configurar FAL_KEY na Lambda
3. ✅ Deploy da Lambda atualizada
4. ✅ Testar geração de vídeo
5. ✅ Monitorar logs e custos

## 💡 Notas Importantes

- **Default Provider:** O sistema agora usa 'fal-ai' por padrão
- **Backwards Compatibility:** A API direta da Kling ainda funciona se necessário
- **Créditos:** Sistema de créditos permanece inalterado
- **MongoDB:** Tracking de tasks continua funcionando normalmente

## 📚 Referências

- [Fal AI Documentation](https://fal.ai/models/fal-ai/kling-video)
- [Fal AI Client SDK](https://github.com/fal-ai/fal-js)
- [Kling Video Models](https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/image-to-video)

---

**Status:** ✅ PRONTO PARA DEPLOY
**Data:** 19 de dezembro de 2025

