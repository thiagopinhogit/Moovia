#!/bin/bash

# Script para atualizar variáveis de ambiente da Lambda
# Importante: Configure o REVENUECAT_WEBHOOK_SECRET antes de executar

set -e

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

FUNCTION_NAME="moovia-ai-video-generation"
REGION="sa-east-1"

echo -e "${BLUE}🔧 Atualizando variáveis de ambiente da Lambda...${NC}"

# Carrega variáveis do arquivo .env se existir
if [ -f .env ]; then
    echo -e "${GREEN}✅ Carregando variáveis do arquivo .env${NC}"
    export $(grep -v '^#' .env | xargs)
else
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado. Por favor, crie um baseado no env.example${NC}"
    echo -e "${YELLOW}    cp env.example .env${NC}"
    exit 1
fi

# Verifica se REVENUECAT_WEBHOOK_SECRET está definida
if [ -z "$REVENUECAT_WEBHOOK_SECRET" ]; then
    echo -e "${RED}❌ REVENUECAT_WEBHOOK_SECRET não está definida no arquivo .env!${NC}"
    echo -e "${YELLOW}📝 Para obter o token:${NC}"
    echo "   1. Acesse: https://app.revenuecat.com/"
    echo "   2. Vá em: Project Settings > Integrations > Webhooks"
    echo "   3. Copie o 'Authorization Bearer Token'"
    echo "   4. Adicione no .env: REVENUECAT_WEBHOOK_SECRET=seu_token_aqui"
    echo ""
    read -p "Deseja continuar sem o REVENUECAT_WEBHOOK_SECRET? (s/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

# Atualiza variáveis de ambiente
echo -e "${BLUE}🚀 Atualizando Lambda...${NC}"

aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --region $REGION \
    --environment "Variables={
        MONGODB_URI='${MONGODB_URI:-}',
        KLING_ACCESS_KEY='${KLING_ACCESS_KEY:-}',
        KLING_SECRET_KEY='${KLING_SECRET_KEY:-}',
        GOOGLE_VEO_API_KEY='${GOOGLE_VEO_API_KEY:-}',
        GOOGLE_VEO_PROJECT_ID='${GOOGLE_VEO_PROJECT_ID:-}',
        GOOGLE_VEO_LOCATION='${GOOGLE_VEO_LOCATION:-us-central1}',
        GEMINI_API_KEY='${GEMINI_API_KEY:-}',
        REVENUECAT_WEBHOOK_SECRET='${REVENUECAT_WEBHOOK_SECRET:-}',
        NODE_ENV='${NODE_ENV:-production}',
        AWS_REGION='${AWS_REGION:-sa-east-1}'
    }" \
    --output json > /dev/null

echo -e "${GREEN}✅ Variáveis de ambiente atualizadas!${NC}"
echo ""
echo -e "${BLUE}📋 Verificando configuração...${NC}"

aws lambda get-function-configuration \
    --function-name $FUNCTION_NAME \
    --region $REGION \
    --query 'Environment.Variables' \
    --output json

echo ""
echo -e "${GREEN}✅ Configuração concluída!${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "   A Lambda pode levar alguns segundos para aplicar as mudanças."
echo "   Aguarde ~30 segundos antes de testar o webhook."
echo ""

