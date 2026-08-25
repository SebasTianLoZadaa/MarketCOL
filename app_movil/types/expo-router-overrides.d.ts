declare module 'expo-router' {
  import type { ComponentType, ReactNode } from 'react';

  export type Href = any;

  export interface LinkProps {
    href: string;
    dismissTo?: boolean | string;
    onPress?: (...args: any[]) => any;
    style?: any;
    target?: string;
    children?: ReactNode;
  }

  export const Link: ComponentType<LinkProps>;
  export const Stack: any;
  export const Tabs: any;
  export const router: {
    replace: (path: string) => void;
    push: (path: string) => void;
    back?: () => void;
  };
  export function useLocalSearchParams<T = any>(): T;
  export function useRouter(): { replace: (path: string) => void; push: (path: string) => void; back?: () => void };
}
