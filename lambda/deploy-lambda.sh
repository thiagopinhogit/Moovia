#!/bin/bash

# 🚀 Script de deploy da Lambda para AWS
# Região: São Paulo (sa-east-1)

set -e  # Para se houver erro

echo "🚀 Iniciando deploy da Lambda Moovia AI..."

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configurações
FUNCTION_NAME="moovia-ai-video-generation"
REGION="sa-east-1"
RUNTIME="nodejs20.x"
HANDLER="dist/index.handler"
ROLE_NAME="moovia-lambda-execution-role"
MEMORY=512
TIMEOUT=120

echo -e "${BLUE}📦 Instalando dependências...${NC}"
npm install

echo -e "${BLUE}🔨 Compilando TypeScript...${NC}"
npm run build

echo -e "${BLUE}📦 Criando arquivo ZIP...${NC}"
npm run deploy

# Verifica se o arquivo .env existe
if [ ! -f .env ]; then
    echo -e "${RED}❌ Erro: Arquivo .env não encontrado!${NC}"
    echo "Crie o arquivo .env com as variáveis de ambiente necessárias."
    exit 1
fi

# Carrega variáveis do .env (exceto AWS_REGION, que é reservada)
echo -e "${BLUE}📝 Carregando variáveis de ambiente...${NC}"
export $(cat .env | grep -v '^#' | grep -v '^AWS_REGION=' | xargs)

# Verifica se a role existe, se não, cria
echo -e "${BLUE}🔍 Verificando IAM Role...${NC}"
if ! aws iam get-role --role-name $ROLE_NAME --region $REGION --no-cli-pager 2>/dev/null; then
    echo -e "${BLUE}📝 Criando IAM Role...${NC}"
    
    # Cria o trust policy
    cat > /tmp/trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

    aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document file:///tmp/trust-policy.json \
        --region $REGION \
        --no-cli-pager > /dev/null

    # Anexa política básica de execução
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
        --region $REGION

    echo -e "${GREEN}✅ IAM Role criada${NC}"
    echo "⏳ Aguardando 10 segundos para a role propagar..."
    sleep 10
else
    echo -e "${GREEN}✅ IAM Role já existe${NC}"
fi

# Pega o ARN da role
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text --region $REGION --no-cli-pager)
echo "Role ARN: $ROLE_ARN"

# Verifica se a função Lambda existe
echo -e "${BLUE}🔍 Verificando se a função Lambda existe...${NC}"
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --no-cli-pager 2>/dev/null; then
    echo -e "${BLUE}🔄 Atualizando código da função...${NC}"
    
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://function.zip \
        --region $REGION \
        --no-cli-pager > /dev/null
    
    echo -e "${YELLOW}⏳ Aguardando atualização do código finalizar...${NC}"
    aws lambda wait function-updated \
        --function-name $FUNCTION_NAME \
        --region $REGION
    
    echo -e "${BLUE}⚙️ Atualizando configuração...${NC}"
    
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --handler $HANDLER \
        --memory-size $MEMORY \
        --timeout $TIMEOUT \
        --environment "Variables={MONGODB_URI=$MONGODB_URI,KLING_ACCESS_KEY=${KLING_ACCESS_KEY:-},KLING_SECRET_KEY=${KLING_SECRET_KEY:-},GOOGLE_VEO_API_KEY=${GOOGLE_VEO_API_KEY:-},GOOGLE_VEO_PROJECT_ID=${GOOGLE_VEO_PROJECT_ID:-},GOOGLE_VEO_LOCATION=${GOOGLE_VEO_LOCATION:-us-central1},GEMINI_API_KEY=${GEMINI_API_KEY:-},NODE_ENV=${NODE_ENV:-production}}" \
        --region $REGION \
        --no-cli-pager > /dev/null
    
    echo -e "${GREEN}✅ Função atualizada com sucesso!${NC}"
else
    echo -e "${BLUE}📝 Criando nova função Lambda...${NC}"
    
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --role $ROLE_ARN \
        --handler $HANDLER \
        --zip-file fileb://function.zip \
        --memory-size $MEMORY \
        --timeout $TIMEOUT \
        --environment "Variables={MONGODB_URI=$MONGODB_URI,GOOGLE_API_KEY=$GOOGLE_API_KEY,GEMINI_MODEL=$GEMINI_MODEL,RATE_LIMIT_FREE=$RATE_LIMIT_FREE,RATE_LIMIT_PREMIUM=$RATE_LIMIT_PREMIUM,MAX_DAILY_COST_USD=$MAX_DAILY_COST_USD,MAX_MONTHLY_COST_USD=$MAX_MONTHLY_COST_USD,NODE_ENV=$NODE_ENV}" \
        --region $REGION \
        --no-cli-pager > /dev/null
    
    echo -e "${GREEN}✅ Função criada com sucesso!${NC}"
fi

# Pega informações da função
FUNCTION_ARN=$(aws lambda get-function --function-name $FUNCTION_NAME --query 'Configuration.FunctionArn' --output text --region $REGION --no-cli-pager)

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deploy da Lambda concluído!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📝 Informações da função:"
echo "   Nome: $FUNCTION_NAME"
echo "   ARN: $FUNCTION_ARN"
echo "   Região: $REGION"
echo ""
echo -e "${BLUE}📋 Próximos passos:${NC}"
echo "1. Execute: ./deploy-api-gateway.sh (para criar o API Gateway)"
echo "2. Ou crie manualmente no console"
echo ""
echo -e "${BLUE}🔍 Ver logs:${NC}"
echo "aws logs tail /aws/lambda/$FUNCTION_NAME --follow --region $REGION"
echo ""

