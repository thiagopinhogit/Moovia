# ✅ Frontend Configurado para Backend Local

## 🎯 Configuração Aplicada:

### 1. **`src/constants/config.ts`**
```typescript
const USE_PRODUCTION = false; // ✅ Alterado para false
const BACKEND_IP = '192.168.0.25'; // ✅ Já estava correto
const BACKEND_PORT = '3000';
const LOCAL_BACKEND_URL = `http://${BACKEND_IP}:${BACKEND_PORT}`;
```

**Resultado**: Todas as chamadas de API agora vão para `http://192.168.0.25:3000`

### 2. **`src/services/videoGeneration.ts`**
```typescript
const BACKEND_API_URL = __DEV__ 
  ? 'http://192.168.0.25:3000' // ✅ Atualizado de localhost para seu IP
  : 'https://your-production-api.com';
```

**Resultado**: Chamadas de geração de vídeo também vão para o backend local

## 📡 Endpoints Configurados:

Agora o app se comunicará com:

```
Backend Local: http://192.168.0.25:3000

Endpoints disponíveis:
✅ POST /generate-image           - Geração de imagens
✅ POST /generate-video          - Geração de vídeos (NOVO!)
✅ GET  /video-status/:taskId    - Status de vídeos (NOVO!)
✅ GET  /credits/balance         - Consulta de créditos
✅ GET  /credits/history         - Histórico de créditos
✅ POST /credits/grant-subscription
✅ POST /credits/grant-purchase
✅ POST /revenuecat-webhook
✅ GET  /health
```

## 🧪 Como Testar:

### 1. Certifique-se que o backend está rodando:
```bash
cd lambda
npm run dev
```

Você deve ver:
```
✅ Server ready for testing!
URL: http://192.168.0.25:3000
```

### 2. Inicie o app React Native:
```bash
npx expo start -c
```

### 3. Teste no App:

**Para Imagens:**
1. Abra o app
2. Selecione uma foto
3. Escolha um efeito
4. Toque em "Generate"
5. O app chamará `http://192.168.0.25:3000/generate-image`

**Para Vídeos:**
1. Toque no botão `+` central
2. Escolha "Text to Video" ou "Image to Video"
3. Preencha o prompt
4. Toque em "Create"
5. O app chamará `http://192.168.0.25:3000/generate-video`

## 🔍 Debugging:

### Ver logs do Backend:
Monitore o terminal onde o `npm run dev` está rodando. Você verá:
```
🎬 [Kling] Starting video generation...
💸 Deducting credits from user...
📝 Video task saved to MongoDB
```

### Ver logs do Frontend:
No Metro bundler, você verá:
```
📡 Calling backend: http://192.168.0.25:3000/generate-video
✅ Response received: { taskId: "..." }
```

## 🔄 Voltar para Produção:

Quando quiser usar o backend AWS em produção:

```typescript
// src/constants/config.ts
const USE_PRODUCTION = true; // ← Mude para true
```

## ⚠️ Importante:

1. **Mesma Rede**: Seu celular/emulador deve estar na mesma rede WiFi que seu computador
2. **Firewall**: Certifique-se que a porta 3000 não está bloqueada
3. **IP Correto**: O IP `192.168.0.25` é o IP local do seu computador na rede

## ✅ Status:

- [x] Backend rodando em `192.168.0.25:3000`
- [x] Frontend configurado para apontar para o backend local
- [x] Endpoints de vídeo disponíveis
- [ ] Aguardando credenciais do Kling AI no `.env`
- [ ] Testar geração de vídeo end-to-end

Tudo pronto para testar! 🚀

