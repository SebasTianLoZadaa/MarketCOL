/**
 * Colores corporativos de MarketCOL - MerkaCiro
 * Rojo principal: #D92B2B
 * Rojo oscuro:    #B01F1F
 */

import { Platform } from 'react-native';

// Colores corporativos MarketCOL
const primaryRed = '#D92B2B';
const primaryRedDark = '#B01F1F';
const secondaryGray = '#1A1A1A';

const tintColorLight = primaryRed;
const tintColorDark = primaryRedDark;

export const Colors = {
  // Paleta corporativa
  primary: primaryRed,
  secondary: secondaryGray,
  darkColor: primaryRedDark,
  
  // Colores de estados de pedido (MarketCOL)
  estadoPendiente: '#ffc107',    // Amarillo
  estadoPreparando: '#17a2b8',  // Azul info
  estadoListo: '#28a745',       // Verde primario
  estadoEntregado: '#198754',   // Verde success
  estadoCancelado: '#dc3545',   // Rojo danger
  
  // Colores de estado de pago
  pagoPendiente: '#ffc107',     // Amarillo warning
  pagoConfirmado: '#28a745',    // Verde success
  
  // Colores de roles
  rolAdmin: '#dc3545',          // Rojo
  rolAuxiliar: '#ffc107',       // Amarillo
  rolCliente: '#17a2b8',        // Azul info
  
  // Colores de stock
  stockAlto: '#28a745',         // Verde (> 10)
  stockMedio: '#ffc107',        // Amarillo (1-10)
  stockBajo: '#dc3545',         // Rojo (0)
  
  // Tema claro
  lightText: '#111827',
  lightBackground: '#F4F4F4',
  lightTint: tintColorLight,
  lightIcon: '#374151',
  lightTabIconDefault: '#6B7280',
  lightTabIconSelected: tintColorLight,
  lightCard: '#FFFFFF',
  lightBorder: '#E5E5E5',
  
  // Tema oscuro
  darkText: '#ECEDEE',
  darkBackground: '#151718',
  darkTint: tintColorDark,
  darkIcon: '#9BA1A6',
  darkTabIconDefault: '#9BA1A6',
  darkTabIconSelected: tintColorDark,
  darkCard: '#1F2937',
  darkBorder: '#374151',
};

// Helper para obtener el color según el tema (para usar en componentes)
export const getThemeColor = (colorName, isDark = false) => {
  const lightColors = {
    text: Colors.lightText,
    background: Colors.lightBackground,
    tint: Colors.lightTint,
    icon: Colors.lightIcon,
    tabIconDefault: Colors.lightTabIconDefault,
    tabIconSelected: Colors.lightTabIconSelected,
    card: Colors.lightCard,
    border: Colors.lightBorder,
  };

  const darkColors = {
    text: Colors.darkText,
    background: Colors.darkBackground,
    tint: Colors.darkTint,
    icon: Colors.darkIcon,
    tabIconDefault: Colors.darkTabIconDefault,
    tabIconSelected: Colors.darkTabIconSelected,
    card: Colors.darkCard,
    border: Colors.darkBorder,
  };

  return isDark ? darkColors[colorName] : lightColors[colorName];
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});