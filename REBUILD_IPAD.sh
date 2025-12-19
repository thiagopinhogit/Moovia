#!/bin/bash
# Script para fazer rebuild do app iOS e testar no iPad
# Execute: chmod +x REBUILD_IPAD.sh && ./REBUILD_IPAD.sh

echo "🔨 Passo 1: Limpando build anterior..."
cd ios
rm -rf build
rm -rf Pods
rm -f Podfile.lock
cd ..

echo "📦 Passo 2: Fazendo prebuild do iOS..."
npx expo prebuild --clean --platform ios

echo "🍎 Passo 3: Instalando Pods..."
cd ios
pod install
cd ..

echo "✅ Build preparado!"
echo ""
echo "📱 Próximos passos:"
echo "1. Para testar no iPad físico conectado:"
echo "   npx expo run:ios --device"
echo ""
echo "2. Para testar no simulador iPad Air 11-inch:"
echo "   npx expo run:ios --simulator=\"iPad Air 11-inch (M3)\""
echo ""
echo "3. Ou abra o Xcode e rode manualmente:"
echo "   open ios/Moovia.xcworkspace"
echo ""

