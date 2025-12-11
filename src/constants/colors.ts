/**
 * 🎨 Moovia Brand Colors - Premium Dark Mode
 * Paleta cinematográfica inspirada em LumaAI + Midjourney + Runway
 * Com identidade única e vibe de vídeo AI premium
 */

export const COLORS = {
  // 🌑 Background Base (Dark Mode Premium)
  background: {
    primary: '#0C0D11',      // Black Aurora - preto profundo com nuance azulada
    secondary: '#14161C',    // Night Graphite - superfície/cards
    dark: '#0C0D11',         // Alias para compatibilidade
    light: '#F5F5F5',        // Light mode (se necessário no futuro)
  },

  // 🎭 Surfaces & Cards
  surface: {
    primary: '#14161C',      // Night Graphite - cards principais
    secondary: '#1A1D26',    // Variação um pouco mais clara
    elevated: '#1E2229',     // Cards elevados
  },

  // ⚡ Logo Gradient (Cores Principais da Marca)
  brand: {
    magenta: '#D247FF',      // Magenta Neon - top da logo
    violet: '#663CFF',       // Violeta Elétrico - centro da logo
    cyan: '#14C8FF',         // Azul Tech - base da logo
  },

  // 📝 Typography
  text: {
    primary: '#F5F7FA',      // Crystal White - texto principal
    secondary: '#A9B1C6',    // Soft Silver - texto secundário
    tertiary: '#6B7280',     // Texto terciário/desabilitado
    white: '#FFFFFF',        // Branco puro
    black: '#000000',        // Preto puro
  },

  // 🔲 UI Elements
  ui: {
    border: '#232833',       // Graphite Blue - bordas/dividers
    divider: '#232833',      // Dividers
    overlay: 'rgba(0, 0, 0, 0.8)',  // Overlay de modais
    card: '#14161C',         // Card background
    cardDark: '#0C0D11',     // Card mais escuro
    background: '#F5F5F5',   // Legacy
    backgroundDark: '#0C0D11',
    textDark: '#A9B1C6',     // Legacy
    white: '#FFFFFF',
    black: '#000000',
  },

  // 🎯 CTAs e Botões
  cta: {
    primary: '#009BFF',      // Cyber Blue - CTA principal
    secondary: '#7A2CFF',    // Hyper Violet - CTA secundário
    primaryHover: '#00B8FF', // Hover state
    secondaryHover: '#8B3CFF', // Hover state
  },

  // 🎨 Gradients (usando as cores da logo)
  gradients: {
    // Gradiente oficial da logo
    main: ['#D247FF', '#663CFF', '#14C8FF'],
    
    // Variações para diferentes contextos
    header: ['#D247FF', '#663CFF'],
    button: ['#663CFF', '#14C8FF'],
    card: ['#14161C', '#1A1D26'],
    
    // Background sutil
    darkBackground: ['#0C0D11', '#14161C', '#1A1D26'],
    
    // Overlay
    overlay: ['rgba(12, 13, 17, 0)', 'rgba(12, 13, 17, 0.8)', 'rgba(12, 13, 17, 1)'],
  },

  // ✅ Status Colors
  status: {
    success: '#10B981',      // Verde
    error: '#EF4444',        // Vermelho
    warning: '#F59E0B',      // Laranja
    info: '#3B82F6',         // Azul
  },

  // ⭐ Special Colors
  special: {
    gold: '#FFD700',         // Pro badge
    premium: '#D247FF',      // Premium features
    pro: '#FFD700',          // Legacy
  },

  // 🎭 Opacity Variants (para uso rápido)
  opacity: {
    // Brand colors com opacidade
    magenta10: 'rgba(210, 71, 255, 0.1)',
    magenta20: 'rgba(210, 71, 255, 0.2)',
    magenta30: 'rgba(210, 71, 255, 0.3)',
    
    violet10: 'rgba(102, 60, 255, 0.1)',
    violet20: 'rgba(102, 60, 255, 0.2)',
    violet30: 'rgba(102, 60, 255, 0.3)',
    
    cyan10: 'rgba(20, 200, 255, 0.1)',
    cyan20: 'rgba(20, 200, 255, 0.2)',
    cyan30: 'rgba(20, 200, 255, 0.3)',
    
    // White/Black opacity
    white10: 'rgba(255, 255, 255, 0.1)',
    white20: 'rgba(255, 255, 255, 0.2)',
    white30: 'rgba(255, 255, 255, 0.3)',
    white40: 'rgba(255, 255, 255, 0.4)',
    white60: 'rgba(255, 255, 255, 0.6)',
    white80: 'rgba(255, 255, 255, 0.8)',
    
    black10: 'rgba(0, 0, 0, 0.1)',
    black20: 'rgba(0, 0, 0, 0.2)',
    black50: 'rgba(0, 0, 0, 0.5)',
    black80: 'rgba(0, 0, 0, 0.8)',
  },

  // 🎬 Aliases para backward compatibility
  primary: {
    purple: '#D247FF',       // Magenta
    violet: '#663CFF',       // Violeta
    blue: '#009BFF',         // Cyber Blue
    cyan: '#14C8FF',         // Azul Tech
    darkPurple: '#7A2CFF',   // Hyper Violet
  },
} as const;

// 🎯 Exports para facilitar o uso
export const BACKGROUND = COLORS.background;
export const SURFACE = COLORS.surface;
export const BRAND = COLORS.brand;
export const TEXT = COLORS.text;
export const UI = COLORS.ui;
export const CTA = COLORS.cta;
export const GRADIENTS = COLORS.gradients;
export const STATUS = COLORS.status;
export const SPECIAL = COLORS.special;
export const OPACITY = COLORS.opacity;
export const PRIMARY = COLORS.primary; // Legacy

// 🎨 Helper function para gradientes
export const getGradient = (gradientName: keyof typeof COLORS.gradients) => {
  return COLORS.gradients[gradientName];
};

// 🎭 Helper para criar opacidade customizada
export const withOpacity = (hexColor: string, opacity: number): string => {
  // Remove # se existir
  const hex = hexColor.replace('#', '');
  
  // Converte hex para RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default COLORS;
