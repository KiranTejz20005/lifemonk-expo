import { StyleProp, ViewStyle } from 'react-native';

/**
 * Merge conditional style arrays for React Native (replaces Tailwind cn for styles).
 * Filters out false/undefined and flattens arrays.
 */
export function cnStyle(
  ...inputs: (StyleProp<ViewStyle> | false | undefined | null)[]
): StyleProp<ViewStyle> {
  const filtered = inputs.filter(
    (x): x is StyleProp<ViewStyle> => x != null && x !== false
  );
  if (filtered.length === 0) return undefined;
  if (filtered.length === 1) return filtered[0];
  return filtered;
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
