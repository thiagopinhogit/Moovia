#!/bin/bash

# 👤 Script para criar usuário premium no Moovia
# Uso: ./create-user.sh [userId]
# Se não fornecer userId, cria um automaticamente

set -e

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}👤 Moovia - Criar Usuário Premium${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verifica se passou userId como argumento
if [ -z "$1" ]; then
    # Cria um userId automático
    USER_ID="moovia-deploy-user-$(date +%s)"
    echo -e "${YELLOW}⚠️  Nenhum userId fornecido. Criando automaticamente...${NC}"
else
    USER_ID="$1"
fi

echo -e "${BLUE}📝 Criando usuário: ${GREEN}${USER_ID}${NC}"
echo ""

# Executa o script Node.js
node add-premium-user.js "$USER_ID"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Usuário criado com sucesso!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📋 Para usar no app:${NC}"
echo -e "   User ID: ${GREEN}${USER_ID}${NC}"
echo ""
echo -e "${BLUE}💡 Dica:${NC} Salve esse User ID para usar no app!"
echo ""




