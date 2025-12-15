#!/bin/bash

# Script para testar o webhook do RevenueCat em produção
# Este script envia um evento de teste para a Lambda em produção

set -e

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

# URL da API em produção
API_URL="https://krgq9pgvb0.execute-api.sa-east-1.amazonaws.com/prod"

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Testando RevenueCat Webhook (PRODUÇÃO)      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Carrega token do .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | grep REVENUECAT_WEBHOOK_SECRET | xargs)
fi

if [ -z "$REVENUECAT_WEBHOOK_SECRET" ]; then
    echo -e "${RED}❌ REVENUECAT_WEBHOOK_SECRET não encontrado no arquivo .env${NC}"
    echo ""
    echo "Por favor, adicione ao arquivo .env:"
    echo "  REVENUECAT_WEBHOOK_SECRET=seu_token_aqui"
    echo ""
    exit 1
fi

echo -e "${GREEN}URL:${NC} $API_URL/revenuecat-webhook"
echo ""

# Teste 1: Compra de créditos (1000 credits)
echo -e "${YELLOW}📦 Teste 1: Compra de 1000 créditos${NC}"
curl -X POST "$API_URL/revenuecat-webhook" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $REVENUECAT_WEBHOOK_SECRET" \
  -d '{
    "event": {
      "type": "NON_RENEWING_PURCHASE",
      "id": "test_event_'$(date +%s)'",
      "app_user_id": "device_8918A9A7-9902-4449-9638-59582C9EDE6B",
      "product_id": "moovia_credits_1000",
      "transaction_id": "test_txn_'$(date +%s)'",
      "original_transaction_id": "test_orig_txn_'$(date +%s)'",
      "store": "app_store",
      "purchased_at_ms": '$(date +%s000)'
    }
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo -e "${GREEN}✅ Teste 1 concluído${NC}"
echo ""
echo "───────────────────────────────────────────────"
echo ""

# Aguardar um pouco antes do próximo teste
sleep 2

# Teste 2: Assinatura Pro Weekly
echo -e "${YELLOW}📦 Teste 2: Assinatura Moovia Pro Weekly${NC}"
curl -X POST "$API_URL/revenuecat-webhook" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $REVENUECAT_WEBHOOK_SECRET" \
  -d '{
    "event": {
      "type": "INITIAL_PURCHASE",
      "id": "test_event_sub_'$(date +%s)'",
      "app_user_id": "device_8918A9A7-9902-4449-9638-59582C9EDE6B",
      "product_id": "mooviaproweekly",
      "transaction_id": "test_sub_txn_'$(date +%s)'",
      "original_transaction_id": "test_sub_orig_txn_'$(date +%s)'",
      "store": "app_store",
      "purchased_at_ms": '$(date +%s000)'
    }
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo -e "${GREEN}✅ Teste 2 concluído${NC}"
echo ""
echo "───────────────────────────────────────────────"
echo ""

# Verificar saldo de créditos
echo -e "${YELLOW}💰 Verificando saldo de créditos...${NC}"
curl -X GET "$API_URL/credits/device_8918A9A7-9902-4449-9638-59582C9EDE6B" \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.' || echo "(JSON inválido)"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Testes Concluídos                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📝 Próximos passos:${NC}"
echo "  1. Verifique se os créditos foram adicionados acima"
echo "  2. Se não funcionou, verifique os logs da Lambda:"
echo ""
echo "     aws logs tail /aws/lambda/moovia-ai-video-generation \\"
echo "       --region sa-east-1 \\"
echo "       --since 5m \\"
echo "       --filter-pattern \"REVENUECAT WEBHOOK\""
echo ""
