#!/bin/bash

# Comandos para Build e Submissão - Moovia v1.0.0 (Build 3)
# Correção de Botões Não Responsivos no iPad
# Data: Dezembro 17, 2025

echo "🚀 Moovia - Build e Submissão v1.0.0 (Build 3)"
echo "======================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para perguntar sim/não
ask_continue() {
    read -p "$1 (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "${RED}❌ Operação cancelada${NC}"
        exit 1
    fi
}

echo "${YELLOW}📋 Checklist Pré-Build${NC}"
echo "----------------------"
echo "[ ] Testado no iPad físico"
echo "[ ] Todos os botões funcionam"
echo "[ ] Feedback háptico funciona"
echo "[ ] Sem erros de linter"
echo "[ ] Version: 1.0.0 (mantém)"
echo "[ ] Build Number: 3 (incrementado)"
echo ""

ask_continue "Todos os itens acima foram verificados?"

echo ""
echo "${GREEN}✅ Iniciando processo de build...${NC}"
echo ""

# 1. Limpar cache
echo "🧹 Limpando cache..."
rm -rf node_modules/.cache
rm -rf ios/build
echo "${GREEN}✅ Cache limpo${NC}"
echo ""

# 2. Verificar versão
echo "📱 Verificando versão no app.json..."
VERSION=$(grep -o '"version": "[^"]*' app.json | grep -o '[^"]*$')
BUILD=$(grep -o '"buildNumber": "[^"]*' app.json | grep -o '[^"]*$')
echo "Version: ${GREEN}${VERSION}${NC}"
echo "Build: ${GREEN}${BUILD}${NC}"
echo ""

if [ "$VERSION" != "1.0.0" ]; then
    echo "${RED}❌ Erro: Version deve ser 1.0.0 (ainda não aprovada)${NC}"
    exit 1
fi

if [ "$BUILD" != "3" ]; then
    echo "${RED}❌ Erro: Build Number deve ser 3${NC}"
    exit 1
fi

echo "${GREEN}✅ Versão correta${NC}"
echo ""

# 3. Escolher tipo de build
echo "🔨 Escolha o tipo de build:"
echo "1) Teste Local (npx expo run:ios --device)"
echo "2) Build de Produção (EAS Build)"
echo "3) Build via Xcode (Archive)"
echo ""
read -p "Escolha (1/2/3): " BUILD_TYPE

case $BUILD_TYPE in
    1)
        echo ""
        echo "${YELLOW}📱 Teste Local no iPad${NC}"
        echo "----------------------"
        echo "Conecte o iPad via cabo USB"
        echo ""
        ask_continue "iPad conectado?"
        
        echo ""
        echo "🚀 Instalando no iPad..."
        npx expo run:ios --device
        
        echo ""
        echo "${GREEN}✅ App instalado no iPad${NC}"
        echo ""
        echo "${YELLOW}📋 Próximos passos:${NC}"
        echo "1. Abrir o app no iPad"
        echo "2. Testar botões: Buy More, PRO, Create Video"
        echo "3. Verificar feedback háptico"
        echo "4. Verificar logs no Xcode Console"
        echo ""
        echo "Ver: TESTE_RAPIDO_IPAD.md para detalhes"
        ;;
        
    2)
        echo ""
        echo "${YELLOW}🏗️  Build de Produção (EAS)${NC}"
        echo "----------------------------"
        echo ""
        
        # Verificar se EAS está instalado
        if ! command -v eas &> /dev/null; then
            echo "${RED}❌ EAS CLI não encontrado${NC}"
            echo "Instale com: npm install -g eas-cli"
            exit 1
        fi
        
        echo "Tipo de build:"
        echo "1) Production (App Store)"
        echo "2) Preview (TestFlight interno)"
        echo ""
        read -p "Escolha (1/2): " EAS_PROFILE
        
        if [ "$EAS_PROFILE" = "1" ]; then
            PROFILE="production"
        else
            PROFILE="preview"
        fi
        
        echo ""
        echo "🚀 Iniciando EAS Build (profile: ${PROFILE})..."
        echo ""
        
        eas build --platform ios --profile $PROFILE
        
        echo ""
        echo "${GREEN}✅ Build iniciado${NC}"
        echo ""
        echo "${YELLOW}📋 Próximos passos:${NC}"
        echo "1. Aguardar build completar (15-30 min)"
        echo "2. Verificar em: https://expo.dev/accounts/[seu-user]/projects/moovia-ai-video/builds"
        echo "3. Fazer download do .ipa ou submeter para TestFlight"
        echo "4. Testar no TestFlight"
        echo "5. Submeter para App Store Review"
        ;;
        
    3)
        echo ""
        echo "${YELLOW}🔨 Build via Xcode${NC}"
        echo "-------------------"
        echo ""
        echo "Passos:"
        echo "1. Abrir Xcode"
        echo "2. Abrir workspace: ios/Moovia.xcworkspace"
        echo "3. Selecionar scheme: Moovia"
        echo "4. Selecionar device: Any iOS Device (arm64)"
        echo "5. Product > Archive"
        echo "6. Aguardar build completar"
        echo "7. Distribute App > App Store Connect"
        echo ""
        
        ask_continue "Abrir Xcode agora?"
        
        echo ""
        echo "🚀 Abrindo Xcode..."
        open ios/Moovia.xcworkspace
        
        echo ""
        echo "${GREEN}✅ Xcode aberto${NC}"
        echo ""
        echo "${YELLOW}📋 Lembre-se:${NC}"
        echo "- Verificar signing & capabilities"
        echo "- Verificar bundle identifier: com.moovia.app"
        echo "- Verificar version: 1.0.2"
        echo "- Verificar build: 3"
        ;;
        
    *)
        echo "${RED}❌ Opção inválida${NC}"
        exit 1
        ;;
esac

echo ""
echo "${GREEN}✅ Processo concluído${NC}"
echo ""
echo "${YELLOW}📝 Notas para App Store Review:${NC}"
echo "-----------------------------------"
cat << EOF
IMPORTANT: This app is designed for iPhone only and does not support 
native iPad features. It runs on iPad in iPhone compatibility mode only.

Fixed critical issue where 'Create Video' and 'Buy More' buttons were 
unresponsive when running in iPad compatibility mode (Submission ID: 
0c14f82d-f825-4d49-a76e-fabcb5306534).

Changes implemented:
- Improved error handling for subscription services to handle slower 
  StoreKit responses on iPad compatibility mode
- Increased initialization timeout to 25 seconds to accommodate 
  StoreKit delays when running on iPad
- Added graceful degradation when services fail
- Added haptic feedback to all interactive buttons
- Fixed loading state management
- Added detailed logging for debugging

The app now remains fully functional even if subscription services 
temporarily fail or take longer to initialize (as can happen in iPad 
compatibility mode), ensuring all buttons remain responsive.

Note: This is an iPhone-only app. iPad users will experience it in 
iPhone compatibility mode, which is expected and supported.
EOF
echo ""
echo "${YELLOW}💾 Copie o texto acima para as notas de review${NC}"
echo ""

