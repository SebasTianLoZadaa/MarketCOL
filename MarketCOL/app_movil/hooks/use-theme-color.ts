/**
 * Hook para obtener colores según el tema (claro/oscuro)
 * Adaptado a la estructura plana de MarketCOL
 */

import { Colors, getThemeColor } from '../constants/theme';
import { useColorScheme } from '../hooks/use-color-scheme';

// Lista de nombres de color válidos para el tema
type ThemeColorName = 
  | 'text'
  | 'background'
  | 'tint'
  | 'icon'
  | 'tabIconDefault'
  | 'tabIconSelected'
  | 'card'
  | 'border';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ThemeColorName
) {
  const theme = useColorScheme() ?? 'light';
  const isDark = theme === 'dark';
  
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return getThemeColor(colorName, isDark);
  }
}