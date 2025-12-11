#!/bin/bash

# 🚀 Script ALL-IN-ONE: Deploy completo da Lambda + API Gateway

set -e

echo "🚀 Deploy COMPLETO - Lambda + API Gateway"
echo "=========================================="
echo ""

# Executa deploy da Lambda
echo "📦 Passo 1/2: Deploy da Lambda..."
./deploy-lambda.sh

echo ""
echo "⏳ Aguardando 5 segundos..."
sleep 5
echo ""

# Executa deploy do API Gateway
echo "🌐 Passo 2/2: Configurando API Gateway..."
./deploy-api-gateway.sh

echo ""
echo "🎉 Deploy completo finalizado!"
echo ""

