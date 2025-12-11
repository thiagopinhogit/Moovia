#!/bin/bash

# 🗑️ Script para deletar toda a infraestrutura (se precisar)

set -e

FUNCTION_NAME="lumo-ai-image-generation"
API_NAME="lumo-ai-api"
ROLE_NAME="lumo-lambda-execution-role"
REGION="sa-east-1"

echo "🗑️  Deletando infraestrutura..."

# Deleta API Gateway
echo "Deletando API Gateway..."
API_ID=$(aws apigatewayv2 get-apis --region $REGION --query "Items[?Name=='$API_NAME'].ApiId" --output text 2>/dev/null || echo "")
if [ ! -z "$API_ID" ]; then
    aws apigatewayv2 delete-api --api-id $API_ID --region $REGION
    echo "✅ API Gateway deletado"
else
    echo "⚠️  API Gateway não encontrado"
fi

# Deleta Lambda
echo "Deletando Lambda..."
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>/dev/null; then
    aws lambda delete-function --function-name $FUNCTION_NAME --region $REGION
    echo "✅ Lambda deletada"
else
    echo "⚠️  Lambda não encontrada"
fi

# Deleta role (opcional)
echo "Deletando IAM Role..."
if aws iam get-role --role-name $ROLE_NAME --region $REGION 2>/dev/null; then
    aws iam detach-role-policy --role-name $ROLE_NAME --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole 2>/dev/null || echo ""
    aws iam delete-role --role-name $ROLE_NAME 2>/dev/null || echo ""
    echo "✅ IAM Role deletada"
else
    echo "⚠️  IAM Role não encontrada"
fi

echo ""
echo "✅ Limpeza concluída!"

