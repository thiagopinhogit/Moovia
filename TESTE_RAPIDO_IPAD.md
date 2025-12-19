# Teste Rápido - Correção de Botões iPad

## 🎯 Objetivo
Verificar se os botões "Create Video" e "Buy More" estão responsivos no iPad após as correções.

## 📱 Dispositivo de Teste
- **iPad Air 11-inch (M3)** (mesmo da Apple Review)
- **iPadOS 18.6.2** ou superior

## ⚡ Teste Rápido (5 minutos)

### 1. Instalar no iPad
```bash
cd /Users/thiagopinho/Moovia/Moovia
npx expo run:ios --device
```

### 2. Teste do Botão "Buy More"
1. Abrir o app
2. Tocar no ícone de **Settings** (engrenagem) no canto superior direito
3. No modal de Settings, tocar no botão **"Buy More"**

**✅ Sucesso:**
- Botão responde ao toque (feedback háptico)
- Modal de Settings fecha
- Paywall de créditos abre OU
- Se paywall falhar, botão não trava (pode tentar novamente)

**❌ Falha:**
- Botão não responde ao toque
- App trava ou congela
- Erro "Failed to show subscription options" sem poder continuar

### 3. Teste do Botão "PRO" (Upgrade)
1. No mesmo modal de Settings
2. Tocar no botão **"PRO"** (ao lado de "Free")

**✅ Sucesso:**
- Botão responde ao toque (feedback háptico)
- Modal de Settings fecha
- Paywall de assinatura abre OU
- Se paywall falhar, botão não trava

**❌ Falha:**
- Botão não responde
- App trava

### 4. Teste do Botão "Create Video"
1. Na tela principal, tocar no botão **"+"** (Create)
2. Escolher "Text to Video"
3. Digitar qualquer descrição
4. Tocar em **"Create Video"**

**✅ Sucesso:**
- Botão responde ao toque
- Animação de loading inicia
- Se não for Pro, mostra paywall de assinatura
- Se não tiver créditos, mostra paywall de créditos
- Se houver erro, loading para e botão volta ao normal

**❌ Falha:**
- Botão não responde
- Loading infinito
- App trava

## 🔍 Verificar Logs no Xcode

### Abrir Console
1. Xcode > Window > Devices and Simulators
2. Selecionar o iPad conectado
3. Clicar em "Open Console"
4. Filtrar por: `Moovia`

### Logs Esperados

#### Ao tocar em "Buy More":
```
[HomeScreen] Buy More button pressed
[SubscriptionContext] showPaywall called with event: buy_credits
[SubscriptionContext] Initialization failed: false
[SubscriptionContext] Presenting paywall for event: buy_credits
🎯 [Paywall] Platform: ios, Version: 18.6.2
🎯 [Paywall] Attempting to show paywall: "buy_credits"
✅ [Paywall] Register completed for placement: "buy_credits"
```

#### Se Superwall falhar:
```
❌ [SubscriptionContext] Error initializing subscriptions: [erro]
⚠️ [SubscriptionContext] App will continue with limited subscription features
[HomeScreen] Buy More button pressed
[SubscriptionContext] showPaywall called with event: buy_credits
[SubscriptionContext] Initialization failed: true
⚠️ [SubscriptionContext] Cannot show paywall: subscription service not initialized
```

**✅ Importante:** Mesmo com erro, o botão deve responder e o app deve continuar funcionando!

## 🧪 Teste com Falha Simulada (Opcional)

### Teste em Modo Avião
1. Ativar modo avião no iPad
2. Force-close do app (swipe up)
3. Abrir app novamente
4. Tentar usar os botões

**✅ Sucesso:**
- App carrega normalmente (pode demorar até 15s)
- Botões respondem ao toque
- Feedback háptico funciona
- App não trava

## 📊 Checklist de Teste

- [ ] App instala e abre no iPad
- [ ] Botão "Buy More" responde ao toque
- [ ] Botão "PRO" responde ao toque
- [ ] Botão "Create Video" responde ao toque
- [ ] Feedback háptico funciona em todos os botões
- [ ] Se paywall falhar, botões não travam
- [ ] Logs aparecem no Console do Xcode
- [ ] Teste em modo avião: app continua funcionando

## 🚀 Se Tudo Passar

1. **Build de Produção:**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Upload para TestFlight**

3. **Testar novamente no TestFlight**

4. **Submeter para App Store Review**

## ❌ Se Algo Falhar

### Botões ainda não respondem?
1. Verificar logs no Xcode Console
2. Procurar por erros específicos
3. Verificar se Superwall está configurado no Dashboard
4. Verificar se RevenueCat tem os produtos configurados

### Erro "Failed to show subscription options"?
1. Verificar logs: `[Paywall]` e `[SubscriptionContext]`
2. Verificar se `initializationFailed` é `true`
3. Se sim, verificar por que a inicialização falhou
4. Possível causa: Superwall API key incorreta ou placements não configurados

### Loading infinito?
1. Verificar se `stopLoadingAnimations()` está sendo chamado
2. Verificar logs: `[EditScreen]`
3. Verificar se há erros não capturados

## 📞 Suporte

Se precisar de ajuda:
- Copiar logs completos do Xcode Console
- Tirar screenshots do problema
- Anotar os passos exatos que causam o problema

---

**Data:** Dezembro 17, 2025
**Versão:** 1.0.0 (Build 3)
**Nota:** Mantém version 1.0.0 pois ainda não foi aprovada

