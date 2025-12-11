# 🎨 Moovia Brand Guidelines

## Logo & Identity

A logo do Moovia apresenta um gradiente fluido e moderno que representa movimento e transformação por IA.

### Logo Colors

A logo utiliza um gradiente de 3 cores principais:

```
Roxo/Magenta (#C74DEE) → Azul (#6366F1) → Ciano (#00D4FF)
```

![Logo](../assets/images/logo.png)

---

## Color Palette

### Primary Colors

Baseadas no gradiente da logo:

- **Purple**: `#C74DEE` - Roxo vibrante (topo esquerdo da logo)
- **Violet**: `#8B5CF6` - Roxo médio  
- **Blue**: `#6366F1` - Azul (centro da logo)
- **Cyan**: `#00D4FF` - Ciano (base direita da logo)
- **Dark Purple**: `#5B3F9E` - Roxo escuro (backgrounds)

### Gradients

#### Main Gradient (Logo)
```typescript
['#C74DEE', '#8B5CF6', '#6366F1', '#00D4FF']
```
Usado para: Elementos principais, CTAs importantes

#### Header Gradient
```typescript
['#5B3F9E', '#7C3AED', '#8B5CF6']
```
Usado para: Cabeçalhos, navegação

#### Dark Background
```typescript
['#1a0b2e', '#2A1A5E', '#3D2B7A']
```
Usado para: Backgrounds escuros, splash, onboarding

#### Button Gradient
```typescript
['#8B5CF6', '#6366F1']
```
Usado para: Botões primários

---

## Typography

### Font Weights
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### Font Sizes
- Title: 48px
- Heading 1: 36px
- Heading 2: 28px
- Heading 3: 24px
- Body: 16px
- Small: 14px
- Tiny: 12px

---

## UI Elements

### Buttons

#### Primary Button
- Background: Gradient `['#8B5CF6', '#6366F1']`
- Text: `#FFFFFF`
- Border Radius: 16px
- Padding: 18px vertical

#### Secondary Button
- Background: `#FFFFFF`
- Text: `#5B3F9E`
- Border Radius: 16px
- Padding: 18px vertical

#### Ghost Button
- Background: `rgba(255, 255, 255, 0.2)`
- Text: `#FFFFFF`
- Border: 1px `rgba(255, 255, 255, 0.3)`
- Border Radius: 12px

### Cards
- Background: `#FFFFFF`
- Border Radius: 16px
- Shadow: `0 2px 8px rgba(0, 0, 0, 0.1)`

### Inputs
- Background: `#F5F5F5`
- Border: 1px `#E0E0E0`
- Border Radius: 12px
- Focus: Border `#8B5CF6`

---

## Status Colors

- **Success**: `#10B981` (Green)
- **Error**: `#EF4444` (Red)
- **Warning**: `#F59E0B` (Orange)
- **Info**: `#3B82F6` (Blue)

---

## Special Colors

- **Gold/Pro**: `#FFD700` - Para badges Pro, funcionalidades premium
- **Loading**: `#8B5CF6` - Para ActivityIndicator

---

## Usage Examples

### Splash Screen
```tsx
<LinearGradient
  colors={['#5B3F9E', '#3D2B7A', '#2A1A5E']}
  style={styles.container}
>
  {/* Logo */}
</LinearGradient>
```

### Header
```tsx
<LinearGradient
  colors={['#5B3F9E', '#7C3AED', '#8B5CF6']}
  style={styles.header}
>
  {/* Content */}
</LinearGradient>
```

### Primary CTA Button
```tsx
<LinearGradient
  colors={['#8B5CF6', '#6366F1']}
  style={styles.button}
>
  <Text style={{ color: '#FFFFFF' }}>Get Started</Text>
</LinearGradient>
```

### Pro Badge
```tsx
<View style={{
  backgroundColor: 'rgba(255, 215, 0, 0.2)',
  borderColor: 'rgba(255, 215, 0, 0.4)',
  borderWidth: 1,
}}>
  <Text style={{ color: '#FFD700' }}>PRO</Text>
</View>
```

---

## Dark Mode (Future)

Quando implementar dark mode:

### Backgrounds
- Primary: `#0F172A`
- Secondary: `#1E293B`
- Tertiary: `#334155`

### Text
- Primary: `#FFFFFF`
- Secondary: `#94A3B8`
- Tertiary: `#64748B`

---

## Accessibility

### Contrast Ratios

Todas as combinações de cor atendem aos padrões WCAG AA:

- White text on `#5B3F9E`: 7.1:1 ✅
- White text on `#8B5CF6`: 4.8:1 ✅
- `#5B3F9E` text on White: 7.1:1 ✅

---

## Don'ts ❌

- ❌ Não usar cores aleatórias fora da paleta
- ❌ Não aplicar gradientes em texto pequeno
- ❌ Não usar mais de 2 gradientes na mesma tela
- ❌ Não misturar "Gold" com gradientes principais
- ❌ Não usar cores muito saturadas para grandes áreas

---

## Assets Location

- Logo: `assets/images/logo.png`
- Icon: `assets/icon.png`
- Splash: `assets/splash-icon.png`
- Adaptive Icon: `assets/adaptive-icon.png`

---

## Code Reference

Para usar as cores no código, importe de `src/constants/colors.ts`:

```typescript
import { COLORS, GRADIENTS, PRIMARY, UI } from '../constants/colors';

// Examples:
backgroundColor: PRIMARY.purple
colors={GRADIENTS.main}
color: UI.text
```

---

**Última atualização**: Dezembro 2025  
**Versão**: 1.0

