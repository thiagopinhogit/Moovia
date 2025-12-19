#!/bin/bash

# Deploy Lambda com Fal AI Integration
# Este script faz o deploy completo da Lambda atualizada

set -e

echo "🚀 Deploy Lambda - Fal AI Integration"
echo "======================================"
echo ""

# Check if FAL_KEY is set
if [ -z "$FAL_KEY" ]; then
    echo "⚠️  FAL_KEY não está configurada!"
    echo ""
    echo "Por favor, obtenha sua API Key em: https://fal.ai/dashboard/keys"
    echo ""
    read -p "Digite sua FAL_KEY: " FAL_KEY
    
    if [ -z "$FAL_KEY" ]; then
        echo "❌ FAL_KEY é obrigatória. Abortando."
        exit 1
    fi
fi

echo "✅ FAL_KEY configurada"
echo ""

# Check if function.zip exists
if [ ! -f "function.zip" ]; then
    echo "📦 function.zip não encontrado. Criando..."
    npm run build
    zip -r function.zip dist node_modules package.json
    echo "✅ ZIP criado"
fi

echo ""
echo "🔍 Verificando função Lambda..."

# Check if Lambda function exists
FUNCTION_NAME=${AWS_LAMBDA_FUNCTION_NAME:-moovia-api}
REGION=${AWS_REGION:-us-east-1}

if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION &>/dev/null; then
    echo "✅ Função $FUNCTION_NAME encontrada"
else
    echo "❌ Função $FUNCTION_NAME não encontrada na região $REGION"
    echo "   Configure AWS_LAMBDA_FUNCTION_NAME e AWS_REGION se necessário"
    exit 1
fi

echo ""
echo "📤 Fazendo upload do código..."

aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://function.zip \
    --region $REGION

echo "✅ Código atualizado"
echo ""

echo "⚙️  Configurando variáveis de ambiente..."

# Get existing environment variables
EXISTING_ENV=$(aws lambda get-function-configuration \
    --function-name $FUNCTION_NAME \
    --region $REGION \
    --query 'Environment.Variables' \
    --output json)

# Add FAL_KEY to existing variables
UPDATED_ENV=$(echo $EXISTING_ENV | jq --arg fal_key "$FAL_KEY" '. + {FAL_KEY: $fal_key}')

# Update environment variables
aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --environment "Variables=$UPDATED_ENV" \
    --region $REGION \
    --output json > /dev/null

echo "✅ Variáveis de ambiente atualizadas"
echo ""

echo "🎉 Deploy concluído com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "  1. Teste a API: curl https://seu-api-gateway/prod/generate-video"
echo "  2. Verifique logs: aws logs tail /aws/lambda/$FUNCTION_NAME --follow"
echo "  3. Monitore custos no dashboard da Fal AI"
echo ""
echo "📚 Documentação completa: FAL_AI_INTEGRATION.md"
echo ""

