# ⚡ AÇÃO IMEDIATA - Configurar Fal AI

## 🎯 O QUE FAZER AGORA

### 1️⃣ Obter API Key (2 minutos)
```
→ Acesse: https://fal.ai/dashboard/keys
→ Login/Criar conta
→ "Create API Key"
→ Copiar chave
```

### 2️⃣ Deploy Lambda (3 minutos)

**Opção A: Script Automático (Recomendado)**
```bash
cd lambda
export FAL_KEY="sua_chave_aqui"
./deploy-fal-ai.sh
```

**Opção B: AWS Console (Manual)**
```
1. AWS Lambda Console
2. Função: moovia-api
3. Upload: lambda/function.zip (JÁ CRIADO)
4. Environment variables:
   FAL_KEY = sua_chave_aqui
```

### 3️⃣ Testar (1 minuto)
```bash
# Via curl
curl -X POST https://seu-api-gateway/prod/generate-video \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","provider":"fal-ai","model":"kling-v2.5-turbo-pro","prompt":"sunset","duration":"5"}'

# Ou teste direto no app
```

## ✅ Checklist

- [ ] API Key obtida em https://fal.ai/dashboard/keys
- [ ] Lambda deployada com function.zip
- [ ] FAL_KEY configurada nas env vars
- [ ] Teste bem-sucedido (sem erro "Account balance")

## 📁 Arquivos Importantes

```
lambda/function.zip              ← Upload este arquivo
lambda/deploy-fal-ai.sh          ← Ou use este script
FAL_AI_MIGRATION_SUMMARY.md      ← Resumo completo
lambda/FAL_AI_INTEGRATION.md     ← Docs técnicos
```

## 🆘 Problemas?

### Erro: "FAL_KEY must be configured"
→ Configure env var na Lambda

### Erro: "Account balance not enough"  
→ Lambda ainda não foi deployada ou FAL_KEY incorreta

### Script não funciona
→ Use deploy manual via AWS Console

## 📞 Links Úteis

- **Fal AI Dashboard:** https://fal.ai/dashboard
- **API Keys:** https://fal.ai/dashboard/keys
- **Docs:** https://fal.ai/models/fal-ai/kling-video
- **Pricing:** Mesmo custo da API direta Kling

---

**Tempo Total:** ~5 minutos
**Status:** ZIP pronto, só falta deploy!

