#!/bin/bash

# Deploy das mudanças de migração Kling para Fal AI
# Executar este script para fazer deploy das alterações no Lambda

set -e

echo "🚀 Iniciando deploy da migração Kling -> Fal AI..."
echo ""

# 1. Build
echo "📦 [1/4] Compilando TypeScript..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Erro na compilação!"
  exit 1
fi

echo "✅ Compilação concluída!"
echo ""

# 2. Verificar .env
echo "🔍 [2/4] Verificando variáveis de ambiente..."

if [ ! -f ".env" ]; then
  echo "⚠️  Arquivo .env não encontrado!"
  echo "Por favor, crie um arquivo .env baseado em env.example"
  exit 1
fi

# Check if FAL_KEY exists
if ! grep -q "^FAL_KEY=" .env; then
  echo "⚠️  FAL_KEY não encontrada no .env!"
  echo "Por favor, adicione sua FAL_KEY no arquivo .env:"
  echo "FAL_KEY=your_fal_api_key_here"
  exit 1
fi

echo "✅ Variáveis de ambiente OK!"
echo ""

# 3. Create deployment package
echo "📦 [3/4] Criando pacote de deploy..."
npm run deploy

if [ $? -ne 0 ]; then
  echo "❌ Erro ao criar pacote de deploy!"
  exit 1
fi

echo "✅ Pacote criado!"
echo ""

# 4. Deploy to Lambda (if AWS CLI is configured)
echo "☁️  [4/4] Deploy no Lambda..."

if command -v aws &> /dev/null; then
  echo "AWS CLI encontrado. Fazendo upload..."
  
  # Get function name from env or use default
  FUNCTION_NAME="${AWS_LAMBDA_FUNCTION_NAME:-moovia-api}"
  
  echo "Function: $FUNCTION_NAME"
  
  aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://function.zip \
    --no-cli-pager
  
  if [ $? -eq 0 ]; then
    echo "✅ Deploy concluído com sucesso!"
    echo ""
    echo "🎯 Próximos passos:"
    echo "1. Teste o endpoint de geração de vídeo"
    echo "2. Verifique os logs no CloudWatch"
    echo "3. Monitore o uso de créditos da Fal AI"
  else
    echo "❌ Erro no deploy!"
    echo "Por favor, faça upload manual do function.zip no console da AWS"
  fi
else
  echo "⚠️  AWS CLI não encontrado"
  echo "Por favor, faça upload manual do function.zip no console da AWS Lambda"
fi

echo ""
echo "📝 Documentação: lambda/MIGRACAO_KLING_PARA_FAL_AI.md"
echo "🔧 Testes: lambda/test-fal-ai.ts"
echo ""
echo "✨ Deploy finalizado!"

