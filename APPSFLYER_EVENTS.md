# AppsFlyer Events Documentation

Este documento lista todos os eventos do AppsFlyer implementados no app Moovia para rastreamento de conversões e otimização de campanhas (Meta Ads, TikTok Ads, etc).

## 📊 Eventos Implementados

### 1. `af_complete_registration`
**Quando dispara:** Quando o usuário completa o onboarding inicial do app.

**Parâmetros:**
- `af_registration_method`: `"onboarding"`

**Arquivo:** `src/screens/OnboardingScreen.tsx`

**Importância:** 
- Evento fundamental para campanhas de instalação
- Indica que o usuário concluiu o setup inicial
- Usado para otimizar campanhas de acquisition

---

### 2. `af_subscribe`
**Quando dispara:** Quando o usuário completa uma compra de assinatura (semanal ou anual).

**Parâmetros:**
- `af_content_type`: `"subscription"`
- `af_content_id`: ID do produto (ex: `"mooviaproweekly"`, `"mooviaproannual"`)
- `af_price`: Valor da assinatura
- `af_currency`: `"USD"`
- `af_transaction_id`: ID único da transação
- `subscription_name`: Nome da assinatura (ex: `"Moovia Pro Weekly"`)

**Arquivo:** `src/hooks/usePurchaseListener.ts`

**Importância:**
- Evento de alta conversão para ROI
- Rastreia receita recorrente
- Permite otimizar campanhas para assinantes de alto valor

---

### 3. `af_purchase`
**Quando dispara:** Quando o usuário compra créditos avulsos (one-time purchase).

**Parâmetros:**
- `af_content_type`: `"credits"`
- `af_content_id`: ID do produto (ex: `"moovia_credits_1000"`)
- `af_quantity`: Quantidade de créditos comprados
- `af_revenue`: Valor pago
- `af_currency`: `"USD"`
- `af_transaction_id`: ID único da transação

**Arquivo:** `src/hooks/usePurchaseListener.ts`

**Importância:**
- Rastreia compras únicas
- Complementa dados de receita
- Identifica usuários que preferem comprar créditos vs assinaturas

---

### 4. `af_content_create`
**Quando dispara:** Quando o usuário inicia a geração de um vídeo.

**Parâmetros:**
- `af_content_type`: `"video"`
- `af_content_id`: ID do modelo AI usado
- `model_name`: Nome do modelo (ex: `"Kling AI Pro"`, `"Google Veo"`)
- `duration`: Duração do vídeo (5, 10 segundos, etc)
- `aspect_ratio`: Proporção do vídeo (`"16:9"`, `"9:16"`, `"1:1"`)
- `has_image`: Boolean indicando se foi usado image-to-video

**Arquivo:** `src/screens/EditScreen.tsx`

**Importância:**
- Evento de engajamento principal
- Indica que o usuário está usando ativamente o app
- Permite otimizar campanhas para usuários que criam conteúdo

---

### 5. `af_test_event` (Debug apenas)
**Quando dispara:** Manualmente através da tela de Debug (apenas em `__DEV__`).

**Parâmetros:**
- `test_param`: `"test_value"`
- `timestamp`: Data/hora atual

**Arquivo:** `src/screens/DebugSubscriptionScreen.tsx`

**Importância:**
- Usado apenas para testar a integração
- Não deve aparecer em produção

---

## 🎯 Eventos Padrão do AppsFlyer (Automáticos)

Além dos eventos customizados acima, o AppsFlyer SDK também rastreia automaticamente:

- **`Launch`** - Quando o app é aberto
- **`af_first_launch`** - Primeira vez que o app é aberto após instalação
- **`af_app_opened`** - App aberto via deep link
- **`af_initiated_checkout`** - Usuário iniciou processo de compra (se implementado no paywall)

---

## 📈 Como usar no dashboard do AppsFlyer

### Para Meta Ads:
1. Acesse o AppsFlyer dashboard
2. Vá em **"Marketing"** > **"Integrated Partners"**
3. Selecione **"Meta (Facebook)"**
4. Configure os eventos que deseja otimizar:
   - `af_subscribe` - Para campanhas de assinatura
   - `af_purchase` - Para campanhas de compra de créditos
   - `af_content_create` - Para campanhas de engajamento

### Para TikTok Ads:
1. Acesse o AppsFlyer dashboard
2. Vá em **"Marketing"** > **"Integrated Partners"**
3. Selecione **"TikTok"**
4. Mapeie os eventos:
   - `af_complete_registration` → Complete Registration
   - `af_subscribe` → Subscribe
   - `af_purchase` → Purchase
   - `af_content_create` → Complete Payment / Custom Event

---

## 🔧 Configuração Técnica

### Customer User ID
O app está configurado para enviar o **RevenueCat App User ID** como Customer User ID do AppsFlyer, permitindo:
- Análise cross-platform consistente
- Rastreamento de receita alinhado com RevenueCat
- Segmentação de usuários pagantes

**Implementação:** `src/services/appsflyer.ts` e `src/services/subscription.ts`

### IDFA/IDFV
- **IDFV (Identifier for Vendor):** Sempre disponível, usado para testes
- **IDFA (Identifier for Advertisers):** Requer consentimento ATT (iOS 14.5+)

**Mensagem ATT:** Configurada em `app.json`:
```
"NSUserTrackingUsageDescription": "We use device data to measure ad performance and improve the app experience."
```

---

## 🧪 Como testar eventos

1. Abra o app em modo Debug (`__DEV__`)
2. Vá em **Settings** > **Debug (Subscriptions + AppsFlyer)**
3. Use os botões:
   - **Get IDFV** - Copie o IDFV para registrar dispositivo de teste
   - **Send AppsFlyer Test Event** - Envia evento de teste

4. No AppsFlyer Dashboard:
   - Vá em **"SDK Integration Tests"** > **"Live event viewer"**
   - Registre seu dispositivo com o IDFV
   - Verifique se os eventos aparecem em tempo real

---

## 📝 Próximos passos

Eventos adicionais que podem ser implementados:
- `af_add_to_cart` - Quando usuário visualiza paywall
- `af_initiated_checkout` - Quando usuário inicia processo de compra
- `af_search` - Quando usuário pesquisa efeitos/templates
- `af_share` - Quando usuário compartilha vídeo criado
- `af_tutorial_completion` - Se houver tutorial in-app adicional
- `af_achievement_unlocked` - Para gamification (se implementado)

---

## 📚 Recursos

- [AppsFlyer SDK - React Native](https://dev.appsflyer.com/hc/docs/react-native-sdk-reference)
- [AppsFlyer Events Standard](https://dev.appsflyer.com/hc/docs/in-app-events-sdk)
- [Meta Ads + AppsFlyer](https://support.appsflyer.com/hc/en-us/articles/360001559405)
- [TikTok Ads + AppsFlyer](https://support.appsflyer.com/hc/en-us/articles/360014272298)

