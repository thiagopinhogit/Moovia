# 🔧 Como Corrigir o Erro do MongoDB Atlas

## Problema Identificado

A Lambda está retornando erro 500 porque **não consegue conectar ao MongoDB Atlas**:

```
❌ MongoDB connection error: Could not connect to any servers in your MongoDB Atlas cluster.
One common reason is that you're trying to access the database from an IP that isn't whitelisted.
```

## Solução: Adicionar 0.0.0.0/0 na Whitelist

### Opção 1: Via Console do MongoDB Atlas (RECOMENDADO)

1. **Acesse**: https://cloud.mongodb.com/
2. **Login** com sua conta
3. **Selecione** seu projeto "lumoai"  
4. **Clique** em "Network Access" no menu lateral esquerdo
5. **Clique** no botão verde "+ ADD IP ADDRESS"
6. **Selecione** "ALLOW ACCESS FROM ANYWHERE"
   - Isso automaticamente adiciona: `0.0.0.0/0`
7. **Adicione um comentário**: "Lambda Access"
8. **Clique** em "Confirm"
9. **Aguarde** ~2 minutos para propagar

### Opção 2: Via Atlas CLI (se instalado)

```bash
atlas accessLists create 0.0.0.0/0 \
  --comment "Allow Lambda Access" \
  --projectId YOUR_PROJECT_ID
```

## Após Liberar o IP

1. **Aguarde 2 minutos** para a whitelist propagar
2. **Teste novamente** no app - deve funcionar!

## 🔒 Segurança

⚠️ **Nota de Segurança**: 
- `0.0.0.0/0` permite acesso de qualquer IP
- É seguro porque você ainda precisa da **senha do MongoDB** para conectar
- Para produção, considere usar:
  - AWS PrivateLink
  - VPC Peering
  - IPs específicos (mas Lambda usa IPs dinâmicos)

## Verificar se Funcionou

Depois de adicionar o IP, teste a Lambda:

```bash
cd lambda
aws lambda invoke \
  --function-name lumo-ai-image-generation \
  --region sa-east-1 \
  --profile lumo \
  --payload file:///tmp/test-payload.json \
  --cli-binary-format raw-in-base64-out \
  /tmp/response.json

cat /tmp/response.json
```

Você deve ver:
- ✅ `statusCode: 200` (ou 403 por falta de subscription - mas não erro 500!)
- ✅ Logs no CloudWatch mostrando "MongoDB connected successfully"

## Status Atual

- ✅ Lambda deployed e funcionando
- ✅ Código corrigido (getters para env vars)
- ✅ Logs do CloudWatch funcionando
- ⏳ **Aguardando**: Liberação do IP no MongoDB Atlas

## Próximos Passos

1. [ ] Liberar IP 0.0.0.0/0 no MongoDB Atlas
2. [ ] Testar no app novamente
3. [ ] Verificar logs no CloudWatch
4. [ ] Celebrar! 🎉

