import type { ComputedRef, MaybeRefOrGetter } from 'vue';
import { computed, shallowRef, toValue } from 'vue';
import { useMediaQuery } from './useMediaQuery.js';
import {
  defaultWindow,
  increaseWithUnit,
  pxValue,
  tryOnMounted,
  type ConfigurableWindow,
} from './utils.js';

export type Breakpoints<K extends string = string> = Record<
  K,
  MaybeRefOrGetter<number | string>
>;

export interface UseBreakpointsOptions extends ConfigurableWindow {
  /** @default "min-width" */
  strategy?: 'min-width' | 'max-width';
  /**
   * Named breakpoint used for SSR. Its configured numeric/string value becomes
   * the SSR width unless `ssrWidth` is also provided.
   */
  ssrBreakpoint?: string;
  ssrWidth?: number;
}

export type UseBreakpointReturn<K extends string = string> = Record<
  K,
  ComputedRef<boolean>
> & {
  greaterOrEqual: (k: MaybeRefOrGetter<K>) => ComputedRef<boolean>;
  smallerOrEqual: (k: MaybeRefOrGetter<K>) => ComputedRef<boolean>;
  greater: (k: MaybeRefOrGetter<K>) => ComputedRef<boolean>;
  smaller: (k: MaybeRefOrGetter<K>) => ComputedRef<boolean>;
  between: (
    a: MaybeRefOrGetter<K>,
    b: MaybeRefOrGetter<K>,
  ) => ComputedRef<boolean>;
  isGreater: (k: MaybeRefOrGetter<K>) => boolean;
  isGreaterOrEqual: (k: MaybeRefOrGetter<K>) => boolean;
  isSmaller: (k: MaybeRefOrGetter<K>) => boolean;
  isSmallerOrEqual: (k: MaybeRefOrGetter<K>) => boolean;
  isInBetween: (a: MaybeRefOrGetter<K>, b: MaybeRefOrGetter<K>) => boolean;
  current: () => ComputedRef<K[]>;
  active: () => ComputedRef<K | ''>;
};

/** Reactively evaluate viewport breakpoints. */
export function useBreakpoints<K extends string>(
  breakpoints: Breakpoints<K>,
  options: UseBreakpointsOptions = {},
): UseBreakpointReturn<K> {
  function getValue(k: MaybeRefOrGetter<K>, delta?: number) {
    let value = toValue(breakpoints[toValue(k)]);
    if (delta != null) value = increaseWithUnit(value, delta);
    return typeof value === 'number' ? `${value}px` : value;
  }

  const {
    window = defaultWindow,
    strategy = 'min-width',
    ssrBreakpoint,
    ssrWidth = ssrBreakpoint && ssrBreakpoint in breakpoints
      ? pxValue(String(toValue(breakpoints[ssrBreakpoint as K])))
      : undefined,
  } = options;
  const mediaOptions = { ...options, ssrWidth };
  const ssrSupport = typeof ssrWidth === 'number';
  const mounted = ssrSupport ? shallowRef(false) : { value: true };
  if (ssrSupport)
    tryOnMounted(() => {
      mounted.value = !!window;
    });

  function match(query: 'min' | 'max', size: string): boolean {
    if (!mounted.value && ssrSupport)
      return query === 'min'
        ? ssrWidth! >= pxValue(size)
        : ssrWidth! <= pxValue(size);
    return window
      ? window.matchMedia(`(${query}-width: ${size})`).matches
      : false;
  }

  const greaterOrEqual = (k: MaybeRefOrGetter<K>) =>
    useMediaQuery(() => `(min-width: ${getValue(k)})`, mediaOptions);
  const smallerOrEqual = (k: MaybeRefOrGetter<K>) =>
    useMediaQuery(() => `(max-width: ${getValue(k)})`, mediaOptions);

  const shortcutMethods = (Object.keys(breakpoints) as K[]).reduce(
    (shortcuts, k) => {
      Object.defineProperty(shortcuts, k, {
        get: () =>
          strategy === 'min-width' ? greaterOrEqual(k) : smallerOrEqual(k),
        enumerable: true,
        configurable: true,
      });
      return shortcuts;
    },
    {} as Record<K, ReturnType<typeof greaterOrEqual>>,
  );

  function current() {
    const points = (Object.keys(breakpoints) as K[])
      .map((k) => [k, shortcutMethods[k], pxValue(getValue(k))] as const)
      .sort((a, b) => a[2] - b[2]);
    return computed(() =>
      points.filter(([, value]) => value.value).map(([key]) => key),
    );
  }

  return Object.assign(shortcutMethods, {
    greaterOrEqual,
    smallerOrEqual,
    greater: (k: MaybeRefOrGetter<K>) =>
      useMediaQuery(() => `(min-width: ${getValue(k, 0.1)})`, mediaOptions),
    smaller: (k: MaybeRefOrGetter<K>) =>
      useMediaQuery(() => `(max-width: ${getValue(k, -0.1)})`, mediaOptions),
    between: (a: MaybeRefOrGetter<K>, b: MaybeRefOrGetter<K>) =>
      useMediaQuery(
        () =>
          `(min-width: ${getValue(a)}) and (max-width: ${getValue(b, -0.1)})`,
        mediaOptions,
      ),
    isGreater: (k: MaybeRefOrGetter<K>) => match('min', getValue(k, 0.1)),
    isGreaterOrEqual: (k: MaybeRefOrGetter<K>) => match('min', getValue(k)),
    isSmaller: (k: MaybeRefOrGetter<K>) => match('max', getValue(k, -0.1)),
    isSmallerOrEqual: (k: MaybeRefOrGetter<K>) => match('max', getValue(k)),
    isInBetween: (a: MaybeRefOrGetter<K>, b: MaybeRefOrGetter<K>) =>
      match('min', getValue(a)) && match('max', getValue(b, -0.1)),
    current,
    active: () => {
      const breakpoints = current();
      return computed(() =>
        breakpoints.value.length === 0
          ? ''
          : breakpoints.value.at(strategy === 'min-width' ? -1 : 0)!,
      );
    },
  });
}
