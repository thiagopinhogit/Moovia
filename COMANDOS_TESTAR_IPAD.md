# 🚀 Como Testar no iPad - Correção do Erro RNLocalize

## ❌ O Problema

Você está recebendo este erro:
```
ERROR: 'RNLocalize' could not be found
```

**Causa:** O app usa módulos nativos (react-native-localize) que não estão disponíveis no Expo Go.

## ✅ Solução: Development Build

### Opção 1: Rodar Direto no Simulador (RECOMENDADO)

**1. Pare o Metro bundler atual (terminal 13):**
```bash
# Pressione Ctrl+C no terminal onde está rodando "expo start"
```

**2. Limpe e reconstrua o iOS:**
```bash
cd /Users/thiagopinho/Moovia/Moovia
cd ios
rm -rf build
pod install
cd ..
```

**3. Rode no simulador iPad Air:**
```bash
npx expo run:ios --simulator="iPad Air (5th generation)"
```

Ou se tiver o iPad Air 11-inch disponível:
```bash
npx expo run:ios --simulator="iPad Air 11-inch (M3)"
```

**4. Para listar simuladores disponíveis:**
```bash
xcrun simctl list devices | grep -i "ipad"
```

### Opção 2: Rodar no iPad Físico

**1. Conecte seu iPad via USB**

**2. Execute:**
```bash
npx expo run:ios --device
```

**3. Selecione seu iPad quando perguntado**

### Opção 3: Usar Xcode (Mais Confiável)

**1. Abra o workspace:**
```bash
cd /Users/thiagopinho/Moovia/Moovia
open ios/Moovia.xcworkspace
```

**2. No Xcode:**
- Selecione o target: iPad Air 11-inch (M3) ou seu iPad físico
- Aperte Cmd+R para rodar
- Espere o build e instalação

## 🎯 O Que Verificar Após Rodar

### ✅ Checklist de Teste no iPad:

1. **Tela inicial carrega?**
   - [ ] App abre (não fica em tela branca)
   - [ ] Splash screen aparece
   - [ ] Onboarding carrega em até 15 segundos

2. **Carousel está visível?**
   - [ ] Cards de vídeo aparecem
   - [ ] Animação do carousel funciona
   - [ ] Cards têm tamanho adequado (não muito grandes)

3. **Título está visível?**
   - [ ] "Create amazing videos with AI" aparece
   - [ ] Fonte está legível
   - [ ] Não está cortado

4. **GIF/Logo está visível?**
   - [ ] Animação do logo aparece
   - [ ] Tamanho adequado

5. **BOTÃO "Get Started" ESTÁ VISÍVEL?** ⭐ CRÍTICO
   - [ ] Botão está na tela SEM precisar rolar
   - [ ] Ou: Se precisa rolar, há indicador de scroll visível
   - [ ] Botão é clicável
   - [ ] Ao clicar, vai para o tutorial

6. **Footer com Terms & Privacy está visível?**
   - [ ] Texto aparece abaixo do botão
   - [ ] Links são clicáveis

### 📸 Tire Screenshots!

Depois que rodar, tire screenshots no simulador:
```bash
# No simulador, aperte: Cmd+S
# Ou: File > Save Screen
```

Salve screenshots de:
1. Tela inicial completa (mostrando o botão!)
2. Se precisar rolar, mostre antes e depois do scroll

## 🐛 Troubleshooting

### Se ainda der erro de módulo nativo:

**1. Limpe tudo:**
```bash
cd /Users/thiagopinho/Moovia/Moovia
cd ios
rm -rf build
rm -rf Pods
rm Podfile.lock
cd ..
npx expo prebuild --clean --platform ios
cd ios
pod install
cd ..
```

**2. Rode novamente:**
```bash
npx expo run:ios --simulator="iPad Air (5th generation)"
```

### Se o simulador não abrir:

**1. Abra o simulador manualmente:**
```bash
open -a Simulator
```

**2. Escolha iPad Air:
- Hardware > Device > iPad Air (5th generation)

**3. Depois rode:**
```bash
npx expo run:ios
```

## 📊 Próximos Passos Após Teste

### Se o botão ESTÁ visível: ✅
1. Tire screenshot
2. Faça build de produção:
   ```bash
   eas build --platform ios --profile production
   ```
3. Suba para TestFlight
4. Resubmeta para Apple Review

### Se o botão NÃO está visível: ❌
1. Tire screenshot mostrando o problema
2. Me avise com o screenshot
3. Faremos mais ajustes no layout

## 💡 Dica Importante

**NÃO use `expo start` + Expo Go** para testar este app!

**USE sempre:**
- `npx expo run:ios` (faz build nativo automaticamente)
- Ou Xcode diretamente

O Expo Go só funciona com apps que não têm módulos nativos customizados.

---

**Data:** Dezembro 16, 2025
**Correções implementadas:** Carousel menor, margens reduzidas, scroll indicator no iPad

