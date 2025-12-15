#!/bin/bash

# Script para atualizar variáveis de ambiente da Lambda

set -e

FUNCTION_NAME="moovia-ai-video-generation"
REGION="sa-east-1"

echo "🔧 Atualizando variáveis de ambiente da Lambda..."
echo ""

# Carrega variáveis do .env
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "   Copie o env.example para .env e preencha os valores:"
    echo "   cp env.example .env"
    exit 1
fi

# Exporta variáveis do .env
export $(grep -v '^#' .env | grep -v '^$' | xargs)

# Verifica variáveis obrigatórias
MISSING_VARS=""

if [ -z "$MONGODB_URI" ]; then MISSING_VARS="$MISSING_VARS\n  - MONGODB_URI"; fi
if [ -z "$KLING_ACCESS_KEY" ]; then MISSING_VARS="$MISSING_VARS\n  - KLING_ACCESS_KEY"; fi
if [ -z "$KLING_SECRET_KEY" ]; then MISSING_VARS="$MISSING_VARS\n  - KLING_SECRET_KEY"; fi

if [ ! -z "$MISSING_VARS" ]; then
    echo "❌ Variáveis obrigatórias faltando no .env:"
    echo -e "$MISSING_VARS"
    echo ""
    echo "Por favor, edite o arquivo .env e adicione os valores."
    exit 1
fi

echo "✅ Todas as variáveis obrigatórias encontradas"
echo ""
echo "📤 Atualizando Lambda..."

# Atualiza variáveis de ambiente
aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --region $REGION \
    --environment "Variables={
        MONGODB_URI='${MONGODB_URI}',
        KLING_ACCESS_KEY='${KLING_ACCESS_KEY}',
        KLING_SECRET_KEY='${KLING_SECRET_KEY}',
        GOOGLE_VEO_API_KEY='${GOOGLE_VEO_API_KEY:-}',
        GOOGLE_VEO_PROJECT_ID='${GOOGLE_VEO_PROJECT_ID:-}',
        GOOGLE_VEO_LOCATION='${GOOGLE_VEO_LOCATION:-us-central1}',
        GEMINI_API_KEY='${GEMINI_API_KEY:-}',
        NODE_ENV='${NODE_ENV:-production}'
    }" \
    --output json > /dev/null

echo "✅ Variáveis atualizadas com sucesso!"
echo ""
echo "📋 Verificando configuração..."
echo ""

aws lambda get-function-configuration \
    --function-name $FUNCTION_NAME \
    --region $REGION \
    --query 'Environment.Variables' \
    --output json | jq 'with_entries(
        if .key == "MONGODB_URI" or .key == "KLING_ACCESS_KEY" or .key == "KLING_SECRET_KEY" or .key == "GOOGLE_VEO_API_KEY" or .key == "GEMINI_API_KEY"
        then .value = "***"
        else . end
    )'

echo ""
echo "✅ Configuração completa!"
echo "⏳ Aguarde ~30 segundos para a Lambda aplicar as mudanças."

