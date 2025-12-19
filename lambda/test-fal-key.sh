#!/bin/bash

# Quick Test - Fal AI API Key
# Testa se sua API key está funcionando

set -e

echo "🧪 Teste Rápido - Fal AI API Key"
echo "================================="
echo ""

# Check if FAL_KEY is set
if [ -z "$FAL_KEY" ]; then
    echo "⚠️  FAL_KEY não configurada!"
    echo ""
    read -p "Digite sua FAL_KEY: " FAL_KEY
    
    if [ -z "$FAL_KEY" ]; then
        echo "❌ FAL_KEY é obrigatória"
        exit 1
    fi
fi

echo "✅ FAL_KEY: ${FAL_KEY:0:20}..."
echo ""

# Test API key with simple request
echo "🔍 Testando API key..."
echo ""

# Use curl to test Fal AI API
RESPONSE=$(curl -s -X POST https://queue.fal.run/fal-ai/kling-video/v2.5-turbo/pro/image-to-video \
  -H "Authorization: Key $FAL_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "prompt": "A beautiful sunset over the ocean",
      "duration": "5"
    }
  }')

echo "Response:"
echo "$RESPONSE"
echo ""

# Check if response contains request_id
if echo "$RESPONSE" | grep -q "request_id"; then
    REQUEST_ID=$(echo "$RESPONSE" | grep -o '"request_id":"[^"]*"' | cut -d'"' -f4)
    echo "✅ API Key válida!"
    echo "✅ Request ID: $REQUEST_ID"
    echo ""
    echo "🎉 Tudo funcionando!"
    echo ""
    echo "📝 Próximos passos:"
    echo "1. Configure FAL_KEY na Lambda"
    echo "2. Deploy: ./deploy-fal-ai.sh"
    echo "3. Teste o app"
    echo ""
elif echo "$RESPONSE" | grep -q "unauthorized\|invalid"; then
    echo "❌ API Key inválida!"
    echo ""
    echo "Verifique se você copiou a key corretamente de:"
    echo "https://fal.ai/dashboard/keys"
    echo ""
    exit 1
else
    echo "⚠️  Resposta inesperada. Possível erro de rede."
    echo ""
fi

