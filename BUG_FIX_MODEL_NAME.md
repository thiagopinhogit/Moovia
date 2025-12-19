# 🐛 Bug Fix: Model Name Error

## Problema Identificado

```
ERROR ❌ [VideoGen] API Error: {
  "error": "model_name value 'kling-v2.5-turbo-pro' is invalid",
  "success": false
}
```

## Causa Raiz

O backend estava recebendo o modelo `kling-v2.5-turbo-pro` (modelo Fal AI) mas estava tentando usar na **API direta da Kling**, que não reconhece esse nome de modelo.

### Por que isso acontecia?

1. Frontend envia: `provider: 'fal-ai'` ✅
2. Backend recebe: `provider: 'fal-ai'` ✅
3. Backend deveria rotear para Fal AI ✅
4. **MAS** estava caindo no `else` e usando API direta da Kling ❌

## Solução Aplicada

### 1. Melhorado Logs (Debug)

**Frontend (`videoGeneration.ts`):**
```typescript
// Adicionado log antes de enviar
console.log('📤 [VideoGen] Sending request to backend:', {
  provider: 'fal-ai',
  model: backendModel,
  duration: requestBody.duration.toString(),
});
```

**Backend (`videoHandler.ts`):**
```typescript
// Adicionado logs detalhados
console.log(`🔍 [VideoGen] Provider check: "${provider}" === "fal-ai" = ${provider === 'fal-ai'}`);
console.log(`🔍 [VideoGen] Provider type: ${typeof provider}`);
console.log(`🔍 [VideoGen] Raw body:`, JSON.stringify(body).substring(0, 200));
```

### 2. Código de Roteamento (Verificado)

O código de roteamento está correto:

```typescript
if (provider === 'google-veo') {
  // Google Veo
} else if (provider === 'fal-ai') {
  // Fal AI ✅ CORRETO
  result = await generateFalVideo(videoRequest);
} else {
  // Kling Direct API (fallback)
}
```

## Próximos Passos

### 1. Rebuild e Deploy
```bash
cd lambda
npm run build
zip -r function.zip dist node_modules package.json

# Deploy via AWS CLI
aws lambda update-function-code \
  --function-name moovia-api \
  --zip-file fileb://function.zip
```

### 2. Testar Novamente

Após deploy, teste a geração de vídeo e verifique os logs:

**Logs Esperados:**
```
📤 [VideoGen] Sending request to backend: {provider: 'fal-ai', model: 'kling-v2.5-turbo-pro'}
🎬 [VideoGen] Request from user: device_XXX
🔍 [VideoGen] Provider check: "fal-ai" === "fal-ai" = true
🎯 [VideoGen] Routing to Fal AI provider
✅ [Fal AI] Video generation started
```

### 3. Verificar CloudWatch

Monitore os logs no CloudWatch para confirmar que:
- ✅ Provider está sendo detectado como 'fal-ai'
- ✅ Roteamento está indo para Fal AI
- ✅ Nenhum erro de "invalid model_name"

## Mapeamento de Modelos

### Frontend → Backend → Fal AI

| Frontend Model ID | Backend Model | Fal AI Endpoint |
|-------------------|---------------|-----------------|
| `kling-2.5-turbo` | `kling-v2.5-turbo-pro` | `fal-ai/kling-video/v2.5-turbo/pro/image-to-video` |
| `kling-2.0-standard` | `kling-v1-5-pro` | `fal-ai/kling-video/v1.5/pro/image-to-video` |

### Validação

**Frontend:**
```typescript
// src/services/videoGeneration.ts
const backendModel = request.modelId === 'kling-2.5-turbo' 
  ? 'kling-v2.5-turbo-pro' 
  : 'kling-v1-5-pro';
```

**Backend:**
```typescript
// lambda/src/services/falVideo.ts
function getModelEndpoint(model: string): string {
  const modelMap: Record<string, string> = {
    'kling-v2.5-turbo-pro': 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video',
    'kling-v2.5-turbo-standard': 'fal-ai/kling-video/v2.5-turbo/standard/image-to-video',
    'kling-v1-5-pro': 'fal-ai/kling-video/v1.5/pro/image-to-video',
  };
  
  return modelMap[model] || modelMap['kling-v2.5-turbo-pro'];
}
```

## Checklist

- [x] ✅ Logs adicionados no frontend
- [x] ✅ Logs adicionados no backend
- [x] ✅ Código compilado sem erros
- [ ] ⏳ Lambda deployada
- [ ] ⏳ Testado em produção
- [ ] ⏳ Logs verificados no CloudWatch

## Possíveis Causas (Se ainda não funcionar)

1. **Lambda não deployada** - Código antigo ainda rodando
2. **Variável FAL_KEY não configurada** - Backend não consegue chamar Fal AI
3. **Provider não sendo enviado** - Frontend não está enviando `provider: 'fal-ai'`

## Teste Local

Antes de fazer deploy, teste localmente:

```bash
cd lambda

# 1. Configure .env
echo "FAL_KEY=sua_chave_aqui" > .env

# 2. Start dev server
npm run dev

# 3. Teste
curl -X POST http://localhost:3000/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test",
    "provider": "fal-ai",
    "model": "kling-v2.5-turbo-pro",
    "prompt": "Beautiful sunset",
    "duration": "5"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "taskId": "xxx-xxx-xxx",
  "status": "pending"
}
```

---

**Status:** ✅ Código corrigido, aguardando deploy
**Data:** 19/12/2025

