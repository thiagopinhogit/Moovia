#!/bin/bash

# 🚀 Quick Start: Testar Webhook com ngrok
# Execute este script para iniciar tudo de uma vez

echo "╔════════════════════════════════════════════════╗"
echo "║   🔗 Setup Webhook RevenueCat + ngrok         ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok não está instalado!"
    echo ""
    echo "📥 Instale com:"
    echo "   brew install ngrok"
    echo ""
    echo "   Ou baixe em: https://ngrok.com/download"
    exit 1
fi

echo "✅ ngrok instalado"
echo ""

# Check if server is already running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Servidor já está rodando na porta 3000"
else
    echo "⚠️  Servidor NÃO está rodando!"
    echo ""
    echo "📋 Para iniciar:"
    echo "   1. Abra um novo terminal"
    echo "   2. cd lambda"
    echo "   3. npm run dev"
    echo ""
    read -p "Pressione ENTER quando o servidor estiver rodando..."
fi

echo ""
echo "🚀 Iniciando ngrok..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 COPIE a URL HTTPS que aparecer abaixo"
echo "   Exemplo: https://abcd-1234.ngrok-free.app"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Próximos passos:"
echo "   1. Copie a URL do ngrok"
echo "   2. Acesse: https://app.revenuecat.com"
echo "   3. Vá em Project Settings > Integrations > Webhooks"
echo "   4. Configure a URL: https://sua-url.ngrok-free.app/revenuecat-webhook"
echo "   5. Selecione os eventos: INITIAL_PURCHASE, RENEWAL, NON_RENEWING_PURCHASE"
echo ""
echo "🔍 Para ver detalhes das requisições:"
echo "   Acesse: http://localhost:4040"
echo ""

# Start ngrok
ngrok http 3000


