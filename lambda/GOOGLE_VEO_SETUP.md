# 🎬 Google Veo Setup Guide

Este guia explica como configurar as credenciais do Google Veo para usar a API de geração de vídeos.

## ⚠️ Importante

**Google Veo está em preview limitado** e pode exigir acesso antecipado. Você pode precisar:
- Solicitar acesso via formulário do Google
- Entrar em lista de espera
- Ter uma conta Google Cloud com faturamento ativado

## 📋 Pré-requisitos

- Conta Google Cloud Platform (GCP)
- Faturamento ativado no projeto
- Acesso ao Google Veo (pode estar em preview/beta)

## 🔧 Passo a Passo

### 1. Criar/Acessar Projeto no Google Cloud

1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto ou selecione um existente
3. Anote o **Project ID** (ex: `my-project-12345`)

### 2. Ativar APIs Necessárias

1. No menu lateral: **APIs & Services** → **Library**
2. Procure e ative as seguintes APIs:
   - ✅ **Vertex AI API**
   - ✅ **Generative AI API**
   - ✅ **Cloud AI Platform API**

### 3. Criar Service Account (Recomendado)

**Por que Service Account?**
- Mais seguro que API Keys
- Funciona automaticamente com Google Auth Library
- Melhor controle de permissões

**Como criar:**

1. Vá em: **IAM & Admin** → **Service Accounts**
2. Clique em **Create Service Account**
3. Configure:
   ```
   Nome: moovia-veo-service
   ID: moovia-veo-service
   Descrição: Service account for Moovia video generation
   ```
4. Clique em **Create and Continue**
5. Adicione as roles:
   - ✅ **Vertex AI User** (roles/aiplatform.user)
   - ✅ **Service Account Token Creator** (roles/iam.serviceAccountTokenCreator)
6. Clique em **Continue** → **Done**

### 4. Gerar Chave JSON

1. Clique no service account criado
2. Vá para a aba **Keys**
3. Clique em **Add Key** → **Create new key**
4. Selecione **JSON** → **Create**
5. Um arquivo JSON será baixado automaticamente
6. **Guarde este arquivo com segurança!** ⚠️

### 5. Configurar no Projeto

#### Opção A: Usando Service Account JSON (Recomendado)

1. Coloque o arquivo JSON na pasta do projeto:
   ```bash
   mv ~/Downloads/moovia-veo-service-xxxxx.json ./lambda/google-credentials.json
   ```

2. Configure no `.env`:
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
   GOOGLE_VEO_PROJECT_ID=your-project-id
   GOOGLE_VEO_LOCATION=us-central1
   ```

3. **Para produção/Lambda**, converta o JSON em base64:
   ```bash
   base64 -i google-credentials.json > credentials.base64
   ```
   
   Depois use no Lambda como variável de ambiente e decode no runtime.

#### Opção B: Usando OAuth2 Token (Temporário)

Para testes rápidos, você pode gerar um token temporário:

```bash
# Instale gcloud CLI (se não tiver)
# macOS: brew install google-cloud-sdk
# Windows: https://cloud.google.com/sdk/docs/install

# Autentique
gcloud auth application-default login

# Gere um token
gcloud auth application-default print-access-token
```

Configure no `.env`:
```env
GOOGLE_VEO_API_KEY=ya29.a0AfH6SMBxxxxx... (token obtido)
GOOGLE_VEO_PROJECT_ID=your-project-id
GOOGLE_VEO_LOCATION=us-central1
```

⚠️ **Atenção:** Tokens OAuth2 expiram em 1 hora!

### 6. Escolher Location (Região)

Regiões disponíveis para Vertex AI / Veo:
- `us-central1` (Iowa, EUA) - **Recomendado**
- `us-east1` (South Carolina, EUA)
- `us-west1` (Oregon, EUA)
- `europe-west4` (Netherlands)
- `asia-southeast1` (Singapore)

Escolha a mais próxima dos seus usuários.

### 7. Instalar Dependências

```bash
cd lambda
npm install google-auth-library
```

### 8. Testar Configuração

Execute o servidor local:
```bash
cd lambda
npm run dev
```

Teste gerando um vídeo com Google Veo selecionado no app.

## 🔍 Verificar Acesso ao Veo

Para verificar se você tem acesso ao Google Veo:

```bash
# Autentique
gcloud auth application-default login

# Configure o projeto
gcloud config set project YOUR_PROJECT_ID

# Teste uma chamada (substitua PROJECT_ID)
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "Content-Type: application/json" \
  https://us-central1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT_ID/locations/us-central1/publishers/google/models/veo-3:predict \
  -d '{
    "contents": [{
      "role": "user",
      "parts": [{"text": "A cat playing with a ball"}]
    }]
  }'
```

Se retornar erro 404 ou "model not found", o Google Veo pode não estar disponível para sua conta ainda.

## 📊 Custos

Google Veo é pago. Verifique os preços em:
https://cloud.google.com/vertex-ai/pricing

Custos estimados (podem variar):
- Text-to-video (5s): ~$0.10 - $0.30
- Image-to-video (5s): ~$0.15 - $0.40

## 🔐 Segurança

### ⚠️ NUNCA faça isso:
- ❌ Commitar arquivo JSON de credenciais no Git
- ❌ Compartilhar tokens OAuth2
- ❌ Usar credenciais no frontend

### ✅ Boas práticas:
- ✅ Use Service Account
- ✅ Adicione `google-credentials.json` no `.gitignore`
- ✅ Use variáveis de ambiente
- ✅ Rotacione chaves periodicamente
- ✅ Configure permissões mínimas necessárias

## 🛠️ Troubleshooting

### Erro: "Authentication failed"
- Verifique se o service account tem as roles corretas
- Confirme que as APIs estão ativadas
- Verifique o Project ID no `.env`

### Erro: "Model not found"
- Google Veo pode não estar disponível na sua região
- Solicite acesso ao preview do Veo
- Tente outra região (`us-central1` é recomendada)

### Erro: "Quota exceeded"
- Verifique limites em: https://console.cloud.google.com/iam-admin/quotas
- Solicite aumento de quota se necessário

### Token expira rapidamente
- Use Service Account em vez de OAuth2 tokens
- Service Accounts geram tokens automaticamente

## 📚 Recursos

- [Google Veo Documentation](https://cloud.google.com/vertex-ai/generative-ai/docs/video/overview)
- [Vertex AI Pricing](https://cloud.google.com/vertex-ai/pricing)
- [Service Accounts Guide](https://cloud.google.com/iam/docs/service-accounts)
- [Google Auth Library](https://github.com/googleapis/google-auth-library-nodejs)

## 🚀 Próximos Passos

Depois de configurar:
1. ✅ Configure as credenciais no `.env`
2. ✅ Reinicie o servidor local
3. ✅ Teste gerando um vídeo no app
4. ✅ Para produção, configure no AWS Lambda ou servidor de produção

---

**Dúvidas?** Entre em contato com o time de desenvolvimento.
