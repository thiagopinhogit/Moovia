# 🔑 Configuração das Credenciais Kling AI

## O que você precisa:

O Kling AI usa **duas chaves** para autenticação:

1. **Access Key** (Chave de Acesso)
2. **Secret Key** (Chave Secreta)

## Onde obter as chaves:

1. Acesse: https://app.klingai.com/global/dev/document-api
2. Faça login na sua conta
3. Vá para a seção de API Keys ou Developer Settings
4. Você verá duas chaves:
   - **Access Key**: Uma string que identifica sua aplicação
   - **Secret Key**: Uma string secreta para autenticação

## Como configurar no projeto:

### 1. Edite o arquivo `.env` na pasta `lambda`:

```bash
cd lambda
nano .env
```

### 2. Adicione suas credenciais:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://thiagopinho:yourpassword@cluster.mongodb.net/moovia?retryWrites=true&w=majority

# Kling AI API Credentials
KLING_ACCESS_KEY=sua_access_key_aqui_xxxxxxxxxxxx
KLING_SECRET_KEY=sua_secret_key_aqui_xxxxxxxxxxxx

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. Salve o arquivo e o servidor reiniciará automaticamente

O `nodemon` detectará a mudança e o servidor recarregará com as novas credenciais.

## Como as chaves são usadas:

As chaves são usadas para gerar um **JWT Token** que é enviado na requisição:

```typescript
// 1. Generate JWT Token
const payload = {
  iss: KLING_ACCESS_KEY,
  exp: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
  nbf: Math.floor(Date.now() / 1000) - 5,
};

const token = jwt.sign(payload, KLING_SECRET_KEY, {
  algorithm: 'HS256',
});

// 2. Use in request headers
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
}
```

**API Domain:** `https://api-singapore.klingai.com`

## Testando a configuração:

Após configurar, teste com:

```bash
curl -X POST http://192.168.0.25:3000/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "prompt": "A cat playing piano in a jazz club",
    "model": "kling-v1-5",
    "duration": "5",
    "aspectRatio": "16:9"
  }'
```

Se as credenciais estiverem corretas, você receberá um `taskId` na resposta.

## Segurança:

⚠️ **IMPORTANTE**: 
- **NUNCA** commit o arquivo `.env` no git
- O `.env` já está no `.gitignore`
- Mantenha suas chaves em segredo
- Não compartilhe suas credenciais

---

**Status**: Aguardando suas credenciais para testar! 🔑

