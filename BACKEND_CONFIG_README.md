# 🔧 Backend Configuration - Centralized Setup

## 📍 O Problema que Resolvemos

Antes: O IP do backend estava hardcoded em vários arquivos diferentes:
- ❌ `src/services/credits.ts` - tinha `http://192.168.0.25:3000`
- ❌ `src/constants/aiModels.ts` - tinha `http://192.168.0.25:3000/generate-image`
- ❌ `lambda/src/server.ts` - tinha `http://192.168.0.25` no banner

**Problema**: Toda vez que o IP mudava, tinha que alterar em 3+ lugares! 😫

## ✅ A Solução

Agora tudo está **centralizado** em **um único lugar**:

```
src/constants/config.ts
```

## 🎯 Como Usar

### 1️⃣ Configurar o IP do Backend (Mobile)

Edite apenas este arquivo:

```typescript
// src/constants/config.ts
const BACKEND_IP = '192.168.15.140';  // 👈 MUDE AQUI!
const BACKEND_PORT = '3000';
```

**Pronto!** Todos os serviços vão usar esse IP automaticamente:
- ✅ Credit service
- ✅ AI Models
- ✅ Image generation
- ✅ Webhooks

### 2️⃣ Descobrir seu IP Local

#### macOS/Linux:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

#### Ou simplesmente:
```bash
hostname -I
```

#### Windows:
```bash
ipconfig
```

### 3️⃣ Iniciar o Backend

```bash
cd lambda
npm run dev
```

O servidor vai:
- ✅ Detectar **automaticamente** seu IP local
- ✅ Mostrar no console qual IP usar
- ✅ Sugerir atualizar o `config.ts` se necessário

```
╔════════════════════════════════════════╗
║   🚀 Moovia Lambda Local Server       ║
╠════════════════════════════════════════╣
║   Port: 3000                          ║
║   Local IP: 192.168.15.140            ║
║   URL: http://192.168.15.140:3000     ║
╚════════════════════════════════════════╝

💡 Update BACKEND_IP in src/constants/config.ts to: 192.168.15.140
```

## 📱 Tipos de Dispositivo

### iOS Simulator
```typescript
const BACKEND_IP = 'localhost'; // ou '127.0.0.1'
```

### Android Emulator
```typescript
const BACKEND_IP = '10.0.2.2'; // Mapeia para localhost do host
```

### Physical Device (iPhone/Android)
```typescript
const BACKEND_IP = '192.168.15.140'; // Seu IP local da rede
```

## 🔍 Como o Código Usa a Configuração

### Antes (❌ Bad):
```typescript
// src/services/credits.ts
const LAMBDA_BASE_URL = 'http://192.168.0.25:3000'; // hardcoded 😢
```

### Agora (✅ Good):
```typescript
// src/services/credits.ts
import { BACKEND_URL } from '../constants/config';

const LAMBDA_BASE_URL = BACKEND_URL; // Centralizado! 🎉
```

## 🎨 Endpoints Disponíveis

Todos os endpoints estão definidos em `config.ts`:

```typescript
export const API_ENDPOINTS = {
  generateImage: `${BACKEND_URL}/generate-image`,
  getCredits: `${BACKEND_URL}/credits`,
  addCredits: `${BACKEND_URL}/credits/add`,
  consumeCredits: `${BACKEND_URL}/credits/consume`,
  getTransactionHistory: `${BACKEND_URL}/credits/history`,
  webhook: `${BACKEND_URL}/webhook`,
};
```

**Use assim:**
```typescript
import { API_ENDPOINTS } from '../constants/config';

// Ao invés de:
fetch('http://192.168.0.25:3000/credits/balance'); // ❌

// Use:
fetch(API_ENDPOINTS.getCredits); // ✅
```

## 🚀 Deploy para Produção

Quando for para produção, apenas mude o IP para a URL da AWS Lambda:

```typescript
// src/constants/config.ts
const BACKEND_IP = 'krgq9pgvb0.execute-api.sa-east-1.amazonaws.com';
const BACKEND_PORT = ''; // Sem porta para HTTPS
const BACKEND_PROTOCOL = 'https'; // Adicione esta linha se quiser

export const BACKEND_URL = `https://${BACKEND_IP}/prod`;
```

Ou melhor ainda, use variáveis de ambiente:

```typescript
const isDevelopment = __DEV__;

const BACKEND_IP = isDevelopment 
  ? '192.168.15.140'  // Local development
  : 'krgq9pgvb0.execute-api.sa-east-1.amazonaws.com'; // Production

const BACKEND_URL = isDevelopment
  ? `http://${BACKEND_IP}:3000`
  : `https://${BACKEND_IP}/prod`;
```

## 🐛 Troubleshooting

### Erro: "Network request timed out"
1. ✅ Verifique se o backend está rodando: `cd lambda && npm run dev`
2. ✅ Verifique se o IP em `config.ts` está correto
3. ✅ Verifique se está na mesma rede WiFi (mobile e computador)
4. ✅ Verifique firewall (pode estar bloqueando porta 3000)

### Erro: "Connection refused"
- ✅ Backend não está rodando - execute `npm run dev` na pasta `lambda`

### IP mudou?
1. ✅ Rode `ifconfig | grep inet` para ver o novo IP
2. ✅ Atualize **apenas** o `BACKEND_IP` em `src/constants/config.ts`
3. ✅ Reinicie o app mobile
4. ✅ Pronto! ✨

## 📝 Checklist

- [ ] Backend rodando: `cd lambda && npm run dev`
- [ ] IP correto em `src/constants/config.ts`
- [ ] Mobile e backend na mesma rede
- [ ] Firewall não está bloqueando porta 3000
- [ ] App mobile reiniciado após mudar config

## 🎉 Benefícios

1. ✅ **Manutenção fácil** - Muda em um lugar só
2. ✅ **Menos erros** - Não esquece de atualizar algum arquivo
3. ✅ **Autodescoberta** - Backend mostra o IP automaticamente
4. ✅ **Type-safe** - TypeScript garante que os endpoints existem
5. ✅ **Documentado** - Tudo explicado em um lugar

---

**Criado em**: Dec 9, 2025
**Última atualização**: IP atual: `192.168.15.140`

