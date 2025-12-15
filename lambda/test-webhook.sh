#!/bin/bash

# Script para testar o webhook do RevenueCat localmente
# Usage: ./test-webhook.sh [ngrok-url] [user-id] [product-id]

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default values
NGROK_URL=${1:-"http://localhost:3000"}
USER_ID=${2:-"device_test_123"}
PRODUCT_ID=${3:-"mooviaproweekly"}

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🧪 Teste de Webhook RevenueCat              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}URL:${NC} $NGROK_URL/revenuecat-webhook"
echo -e "${YELLOW}User ID:${NC} $USER_ID"
echo -e "${YELLOW}Product ID:${NC} $PRODUCT_ID"
echo ""

# Test 1: Initial Purchase (Subscription)
echo -e "${GREEN}📋 Test 1: INITIAL_PURCHASE - Assinatura${NC}"
curl -X POST "$NGROK_URL/revenuecat-webhook" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-secret-token" \
  -d "{
    \"event\": {
      \"type\": \"INITIAL_PURCHASE\",
      \"app_user_id\": \"$USER_ID\",
      \"product_id\": \"$PRODUCT_ID\",
      \"purchased_at_ms\": $(date +%s)000,
      \"store\": \"app_store\",
      \"transaction_id\": \"test_$(date +%s)\",
      \"original_transaction_id\": \"test_$(date +%s)\"
    }
  }"
echo -e "\n"

sleep 2

# Test 2: One-time Purchase (Credits)
echo -e "${GREEN}📋 Test 2: NON_RENEWING_PURCHASE - Compra de Créditos${NC}"
curl -X POST "$NGROK_URL/revenuecat-webhook" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-secret-token" \
  -d "{
    \"event\": {
      \"type\": \"NON_RENEWING_PURCHASE\",
      \"app_user_id\": \"$USER_ID\",
      \"product_id\": \"moovia_credits_1000\",
      \"purchased_at_ms\": $(date +%s)000,
      \"store\": \"app_store\",
      \"transaction_id\": \"test_credits_$(date +%s)\",
      \"original_transaction_id\": \"test_credits_$(date +%s)\"
    }
  }"
echo -e "\n"

sleep 2

# Check balance
echo -e "${GREEN}📋 Test 3: Verificar Saldo${NC}"
curl -s "$NGROK_URL/credits/balance?userId=$USER_ID" | python3 -m json.tool
echo -e "\n"

# Check history
echo -e "${GREEN}📋 Test 4: Verificar Histórico${NC}"
curl -s "$NGROK_URL/credits/history?userId=$USER_ID" | python3 -m json.tool
echo -e "\n"

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ✅ Testes Concluídos!                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}💡 Próximos passos:${NC}"
echo "  1. Verifique os logs do servidor local"
echo "  2. Acesse http://localhost:4040 para ver detalhes no ngrok"
echo "  3. Verifique os créditos no MongoDB Compass"
echo ""


