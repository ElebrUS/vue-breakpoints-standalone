import { getCurrentInstance, onMounted, shallowRef } from 'vue';

export interface ConfigurableWindow {
  /** A custom window, useful for iframes and tests. */
  window?: Window;
}

export const defaultWindow =
  typeof window !== 'undefined' && typeof document !== 'undefined'
    ? window
    : undefined;

/** Increment a CSS length while retaining its unit. */
export function increaseWithUnit(target: number, delta: number): number;
export function increaseWithUnit(target: string, delta: number): string;
export function increaseWithUnit(
  target: string | number,
  delta: number,
): string | number;
export function increaseWithUnit(
  target: string | number,
  delta: number,
): string | number {
  if (typeof target === 'number') return target + delta;

  const value = target.match(/^-?\d+\.?\d*/)?.[0] || '';
  const unit = target.slice(value.length);
  const result = Number.parseFloat(value) + delta;
  return Number.isNaN(result) ? target : result + unit;
}

/** Convert a CSS length to pixels for VueUse-compatible SSR comparisons. */
export function pxValue(value: string): number {
  return value.endsWith('rem')
    ? Number.parseFloat(value) * 16
    : Number.parseFloat(value);
}

/** VueUse's mounted-state primitive, kept local to avoid importing another composable. */
export function useMounted() {
  const isMounted = shallowRef(false);
  const instance = getCurrentInstance();
  if (instance)
    onMounted(() => {
      isMounted.value = true;
    }, instance);
  return isMounted;
}

/** Run after mount in a component, or immediately outside one. */
export function tryOnMounted(fn: () => void) {
  const instance = getCurrentInstance();
  if (instance) onMounted(fn, instance);
  else fn();
}
