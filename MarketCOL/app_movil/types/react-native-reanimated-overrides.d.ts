declare module 'react-native-reanimated' {
  class AnimatedClass {
    static Text: any;
    static View: any;
    static ScrollView: any;
  }

  namespace AnimatedClass {
    type ScrollView = any;
  }

  const Animated: typeof AnimatedClass;
  export default Animated;

  export function interpolate(...args: any[]): any;
  export function useAnimatedRef<T = any>(...args: any[]): any;
  export function useAnimatedStyle<R = any>(callback: () => R, deps?: any[]): any;
  export function useScrollOffset(...args: any[]): any;
}

declare global {
  namespace Animated {
    type ScrollView = any;
  }
}
