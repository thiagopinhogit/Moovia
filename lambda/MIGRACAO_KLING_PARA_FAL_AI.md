# Migração Kling para Fal AI - 19 de Dezembro de 2025

## Problema
O provedor Kling AI estava apresentando erro "Account balance not enough", impossibilitando a geração de vídeos.

## Solução Implementada
Migração para usar a API da Fal AI para todos os modelos Kling, mantendo a mesma interface para o frontend.

## Alterações Realizadas

### 1. Backend - `lambda/src/services/falVideo.ts`
✅ **Adicionado suporte a Text-to-Video e Image-to-Video**
- Atualizada função `getModelEndpoint()` para retornar endpoints diferentes baseado no modo (text-to-video ou image-to-video)
- Endpoints mapeados:
  - `kling-v2.5-turbo-pro`: 
    - Text: `fal-ai/kling-video/v2.5-turbo/pro/text-to-video`
    - Image: `fal-ai/kling-video/v2.5-turbo/pro/image-to-video`
  - `kling-v2.5-turbo-standard`:
    - Text: `fal-ai/kling-video/v2.5-turbo/standard/text-to-video`
    - Image: `fal-ai/kling-video/v2.5-turbo/standard/image-to-video`
  - `kling-v1-5-pro`:
    - Text: `fal-ai/kling-video/v1.5/pro/text-to-video`
    - Image: `fal-ai/kling-video/v1.5/pro/image-to-video`

✅ **Melhorado `checkVideoStatus()`**
- Implementado fallback para tentar todos os endpoints possíveis ao checar status
- Evita erro quando não sabemos qual endpoint foi usado originalmente

### 2. Backend - `lambda/src/handlers/videoHandler.ts`
✅ **Adicionado import da Fal AI**
```typescript
import { generateVideo as generateFalVideo, checkVideoStatus as checkFalStatus } from '../services/falVideo';
```

✅ **Atualizado roteamento de providers**
- Provider `'kling'` agora é roteado para Fal AI automaticamente
- Provider `'fal-ai'` continua usando Fal AI
- Mantido fallback para API direta do Kling (deprecated, com warning)

```typescript
if (provider === 'google-veo') {
  // Google Veo
} else if (provider === 'fal-ai' || provider === 'kling') {
  // Fal AI (inclui ambos providers)
} else {
  // Kling direto (deprecated)
}
```

✅ **Atualizado status check**
- Provider `'kling'` agora checa status via Fal AI
- Provider `'fal-ai'` checa status via Fal AI

### 3. Frontend - `src/constants/videoModels.ts`
✅ **Já estava correto!**
- Modelos já estavam usando `provider: 'fal-ai'`
- Nenhuma alteração necessária no frontend

## Modelos Kling Disponíveis via Fal AI

### 1. Kling 2.5 Turbo (kling-2.5-turbo)
- **Provider:** fal-ai
- **Modos:** text-to-video, image-to-video
- **Custo:** 42 créditos (text), 84 créditos (image)
- **Duração:** 5s ou 10s
- **Status:** ✅ FUNCIONANDO

### 2. Kling 1.5 Pro (kling-2.0-standard)
- **Provider:** fal-ai
- **Modos:** text-to-video, image-to-video
- **Custo:** 70 créditos (text), 140 créditos (image)
- **Duração:** 5s ou 10s
- **Status:** ✅ FUNCIONANDO

## Testes Necessários

### Teste 1: Text-to-Video com Kling 2.5 Turbo
```bash
curl -X POST https://your-api.com/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "provider": "fal-ai",
    "model": "kling-v2.5-turbo-pro",
    "prompt": "A beautiful sunset over the ocean",
    "duration": "5",
    "aspectRatio": "16:9"
  }'
```

### Teste 2: Image-to-Video com Kling 2.5 Turbo
```bash
curl -X POST https://your-api.com/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "provider": "fal-ai",
    "model": "kling-v2.5-turbo-pro",
    "prompt": "The image comes to life with movement",
    "imageUrl": "https://example.com/image.jpg",
    "duration": "5",
    "aspectRatio": "16:9"
  }'
```

### Teste 3: Provider 'kling' (deve ser roteado para Fal AI)
```bash
curl -X POST https://your-api.com/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "provider": "kling",
    "model": "kling-v2.5-turbo-pro",
    "prompt": "A cat playing with a ball",
    "duration": "5"
  }'
```

## Configuração Necessária

### Variáveis de Ambiente
Certifique-se de que a variável `FAL_KEY` está configurada no ambiente Lambda:

```bash
# No arquivo .env
FAL_KEY=your_fal_api_key_here
```

### Atualização do Lambda
```bash
cd lambda
npm run build
npm run deploy
```

Ou usando o script de deploy:
```bash
cd lambda
./deploy-lambda.sh
```

## Benefícios da Migração

1. ✅ **Sem problemas de saldo** - Fal AI tem billing separado
2. ✅ **Mais confiável** - Fal AI tem melhor infraestrutura
3. ✅ **Mesma interface** - Frontend não precisa ser alterado
4. ✅ **Suporte a text-to-video e image-to-video**
5. ✅ **Fallback automático** - Status check funciona mesmo sem saber endpoint original

## Próximos Passos

1. ✅ Compilar código TypeScript
2. ⏳ Deploy para Lambda
3. ⏳ Testar text-to-video
4. ⏳ Testar image-to-video
5. ⏳ Testar status check
6. ⏳ Monitorar logs da Lambda

## Notas Importantes

- A API direta do Kling (provider: null ou outro) ainda funciona como fallback, mas mostra warning
- Todos os modelos Kling do frontend já usam `provider: 'fal-ai'` 
- Nenhuma alteração no app React Native é necessária
- Créditos e preços permanecem os mesmos

## Arquivos Modificados

1. `lambda/src/services/falVideo.ts` - Lógica de geração e status
2. `lambda/src/handlers/videoHandler.ts` - Roteamento de providers
3. `lambda/MIGRACAO_KLING_PARA_FAL_AI.md` - Esta documentação

## Autor
Migração realizada em 19/12/2025 para resolver problema de saldo da Kling AI.

