#!/bin/bash

# 🚀 Script para criar API Gateway e conectar com Lambda
# Região: São Paulo (sa-east-1)

set -e

echo "🚀 Criando API Gateway..."

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m'

# Configurações
API_NAME="lumo-ai-api"
FUNCTION_NAME="lumo-ai-image-generation"
REGION="sa-east-1"
STAGE_NAME="prod"

# Pega o ARN da Lambda
FUNCTION_ARN=$(aws lambda get-function \
    --function-name $FUNCTION_NAME \
    --query 'Configuration.FunctionArn' \
    --output text \
    --region $REGION)

echo "Lambda ARN: $FUNCTION_ARN"

# Verifica se a API já existe
echo -e "${BLUE}🔍 Verificando se API já existe...${NC}"
EXISTING_API=$(aws apigatewayv2 get-apis --region $REGION --query "Items[?Name=='$API_NAME'].ApiId" --output text)

if [ ! -z "$EXISTING_API" ]; then
    echo -e "${YELLOW}⚠️  API já existe: $EXISTING_API${NC}"
    API_ID=$EXISTING_API
else
    # Cria a API
    echo -e "${BLUE}📝 Criando HTTP API...${NC}"
    API_ID=$(aws apigatewayv2 create-api \
        --name $API_NAME \
        --protocol-type HTTP \
        --region $REGION \
        --query 'ApiId' \
        --output text)
    
    echo -e "${GREEN}✅ API criada: $API_ID${NC}"
fi

# Cria integração com Lambda
echo -e "${BLUE}🔗 Criando integração com Lambda...${NC}"
INTEGRATION_ID=$(aws apigatewayv2 create-integration \
    --api-id $API_ID \
    --integration-type AWS_PROXY \
    --integration-uri $FUNCTION_ARN \
    --payload-format-version 2.0 \
    --region $REGION \
    --query 'IntegrationId' \
    --output text)

echo -e "${GREEN}✅ Integração criada: $INTEGRATION_ID${NC}"

# Cria rota POST /generate-image
echo -e "${BLUE}🛤️  Criando rota POST /generate-image...${NC}"
ROUTE_ID=$(aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key "POST /generate-image" \
    --target integrations/$INTEGRATION_ID \
    --region $REGION \
    --query 'RouteId' \
    --output text)

echo -e "${GREEN}✅ Rota criada: $ROUTE_ID${NC}"

# Configura CORS
echo -e "${BLUE}🌐 Configurando CORS...${NC}"
aws apigatewayv2 update-api \
    --api-id $API_ID \
    --cors-configuration AllowOrigins="*",AllowMethods="POST,OPTIONS",AllowHeaders="Content-Type,Authorization" \
    --region $REGION > /dev/null

echo -e "${GREEN}✅ CORS configurado${NC}"

# Cria ou atualiza stage
echo -e "${BLUE}🚀 Criando stage '$STAGE_NAME'...${NC}"
aws apigatewayv2 create-stage \
    --api-id $API_ID \
    --stage-name $STAGE_NAME \
    --auto-deploy \
    --region $REGION 2>/dev/null || \
aws apigatewayv2 update-stage \
    --api-id $API_ID \
    --stage-name $STAGE_NAME \
    --auto-deploy \
    --region $REGION > /dev/null

echo -e "${GREEN}✅ Stage configurado${NC}"

# Dá permissão para API Gateway invocar a Lambda
echo -e "${BLUE}🔐 Configurando permissões...${NC}"
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id apigateway-invoke-$API_ID \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:*:$API_ID/*/*/*" \
    --region $REGION 2>/dev/null || echo "Permissão já existe"

echo -e "${GREEN}✅ Permissões configuradas${NC}"

# Pega a URL da API
API_ENDPOINT=$(aws apigatewayv2 get-api \
    --api-id $API_ID \
    --region $REGION \
    --query 'ApiEndpoint' \
    --output text)

FULL_URL="$API_ENDPOINT/$STAGE_NAME/generate-image"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ API Gateway configurado com sucesso!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📝 Informações da API:${NC}"
echo "   API ID: $API_ID"
echo "   Endpoint: $API_ENDPOINT"
echo "   Stage: $STAGE_NAME"
echo ""
echo -e "${GREEN}🔗 URL completa:${NC}"
echo "   $FULL_URL"
echo ""
echo -e "${BLUE}📋 Próximo passo:${NC}"
echo "Cole essa URL no arquivo: src/constants/aiModels.ts"
echo ""
echo "apiUrl: '$FULL_URL',"
echo ""
echo -e "${BLUE}🧪 Testar:${NC}"
echo "curl -X POST $FULL_URL \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"userId\":\"test\",\"imageBase64\":\"test\",\"description\":\"test\"}'"
echo ""

