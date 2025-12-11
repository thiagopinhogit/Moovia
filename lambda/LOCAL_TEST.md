# 🧪 Teste Local da Lambda

## 🚀 Como Usar

### 1. Instalar dependências (se ainda não fez)

```bash
cd lambda
npm install
```

### 2. Configurar `.env`

Certifique-se que o arquivo `lambda/.env` está preenchido:

```bash
MONGODB_URI=mongodb+srv://thiago_db_user:Mwa8ZFR5avRPm4hC@lumoai.rclwsyv.mongodb.net/lumo?retryWrites=true&w=majority&appName=lumoai
GOOGLE_API_KEY=AIzaSyDA_ZHIAEU0nB18w_NYWPuMXdzWmyGSLLM
GEMINI_MODEL=gemini-3-pro-image-preview
RATE_LIMIT_FREE=0
RATE_LIMIT_PREMIUM=1000
MAX_DAILY_COST_USD=50
MAX_MONTHLY_COST_USD=500
NODE_ENV=development
```

### 3. Rodar o servidor local

```bash
npm run dev
```

Você verá:

```
╔════════════════════════════════════════╗
║   🚀 Lambda Local Test Server         ║
╠════════════════════════════════════════╣
║   Port: 3000                           ║
║   Endpoint: /generate-image            ║
║   Health: /health                      ║
╚════════════════════════════════════════╝
```

---

## 📱 Testar com o App React Native

### Opção 1: Testar com Expo Go (Simulador iOS/Android)

Se estiver rodando no **simulador**, use `localhost`:

```typescript
// src/constants/aiModels.ts
'lambda-gemini-local': {
  id: 'lambda-gemini-local',
  displayName: 'Gemini Pro (Local)',
  provider: 'lambda',
  apiUrl: 'http://localhost:3000/generate-image',
  // ... resto da config
}
```

### Opção 2: Testar com Dispositivo Físico

Se estiver rodando no **celular físico**, use o IP da sua máquina:

```bash
# Descobrir seu IP local
# macOS/Linux:
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows:
ipconfig
```

Depois:

```typescript
// src/constants/aiModels.ts
'lambda-gemini-local': {
  id: 'lambda-gemini-local',
  displayName: 'Gemini Pro (Local)',
  provider: 'lambda',
  apiUrl: 'http://192.168.X.X:3000/generate-image', // Use seu IP
  // ... resto da config
}
```

---

## 🧪 Testar com curl

```bash
curl -X POST http://localhost:3000/generate-image \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "test-user-123",
    "imageBase64": "/9j/4AAQSkZJRgABAQAAAQABAAD/2w...",
    "description": "Adicionar mais brilho"
  }'
```

---

## 🔍 Ver Logs em Tempo Real

O servidor mostra todos os logs no terminal:

```
📥 Received request: { userId: 'test-user', ... }
🔒 MongoDB connected
👤 User: test-user
✅ Subscription valid
🌐 Calling Gemini API...
✅ Image generated!
📤 Response: { statusCode: 200, success: true }
```

---

## 🐛 Depuração

Se der erro:

1. **Verifique o `.env`**: Tem todas as variáveis?
2. **MongoDB conectou?**: Veja se aparece "MongoDB connected"
3. **API Key válida?**: Teste direto no Google AI Studio
4. **Porta ocupada?**: Mude a porta em `src/server.ts`

---

## 🚀 Quando Funcionar Local

1. ✅ Testou local? Funcionou?
2. 🔄 Rode `./deploy-all.sh` para fazer deploy na AWS
3. 🔄 Mude a URL do app para a URL da AWS
4. 🎉 Pronto!

---

## 💡 Dicas

- **Deixe o servidor rodando** enquanto desenvolve
- **Hot reload**: Reinicie o servidor (`Ctrl+C` e `npm run dev`) após mudanças
- **Múltiplos testes**: Use curl para testes rápidos
- **Debug MongoDB**: Acesse o Atlas para ver os registros

---

## ⚠️ IMPORTANTE

**NÃO** faça commit do `.env` com credenciais reais!

Está no `.gitignore`, mas confira antes de commitar.

