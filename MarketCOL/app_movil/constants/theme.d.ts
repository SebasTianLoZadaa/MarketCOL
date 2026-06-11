export const Colors: {
  light: { icon: string };
  dark: { icon: string };
  [key: string]: any;
};

export const Fonts: any;
export function getThemeColor(colorName: string, isDark?: boolean): string;
