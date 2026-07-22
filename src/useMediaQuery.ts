import type { ComputedRef, MaybeRefOrGetter } from 'vue';
import { computed, shallowRef, toValue, watchEffect } from 'vue';
import {
  defaultWindow,
  pxValue,
  type ConfigurableWindow,
  useMounted,
} from './utils.js';

export interface UseMediaQueryOptions extends ConfigurableWindow {
  /** Width used to evaluate min/max-width queries while rendering on the server. */
  ssrWidth?: number;
}

/**
 * Reactive Media Query.
 *
 * This is the minimal local dependency required by useBreakpoints.
 */
export function useMediaQuery(
  query: MaybeRefOrGetter<string>,
  options: UseMediaQueryOptions = {},
): ComputedRef<boolean> {
  const { window = defaultWindow, ssrWidth } = options;
  const isMounted = useMounted();
  const isSupported = computed(() => {
    // Keep this dependency so support is re-evaluated after component mount,
    // matching VueUse's useSupported().
    void isMounted.value;
    return Boolean(
      window &&
      'matchMedia' in window &&
      typeof window.matchMedia === 'function',
    );
  });
  const ssrSupport = shallowRef(typeof ssrWidth === 'number');
  const mediaQuery = shallowRef<MediaQueryList>();
  const matches = shallowRef(false);

  const handler = (event: MediaQueryListEvent) => {
    matches.value = event.matches;
  };

  watchEffect(() => {
    if (ssrSupport.value) {
      // Switch to the real browser query after mounting when it is available.
      ssrSupport.value = !isSupported.value;

      matches.value = toValue(query)
        .split(',')
        .some((queryString) => {
          const not = queryString.includes('not all');
          const minWidth = queryString.match(
            /\(\s*min-width:\s*(-?\d+(?:\.\d*)?[a-z]+\s*)\)/,
          );
          const maxWidth = queryString.match(
            /\(\s*max-width:\s*(-?\d+(?:\.\d*)?[a-z]+\s*)\)/,
          );
          let result = Boolean(minWidth || maxWidth);
          if (minWidth && result) result = ssrWidth! >= pxValue(minWidth[1]);
          if (maxWidth && result) result = ssrWidth! <= pxValue(maxWidth[1]);
          return not ? !result : result;
        });
      return;
    }

    if (!isSupported.value) return;

    mediaQuery.value = window!.matchMedia(toValue(query));
    matches.value = mediaQuery.value.matches;
  });

  // Kept separate from the query effect to retain VueUse's post-flush listener
  // registration and automatic cleanup on query changes/unmount.
  watchEffect(
    (onCleanup) => {
      const current = mediaQuery.value;
      if (!current) return;
      const listener = handler as EventListener;
      const listenerOptions = { passive: true } as EventListenerOptions;
      current.addEventListener('change', listener, listenerOptions);
      onCleanup(() =>
        current.removeEventListener('change', listener, listenerOptions),
      );
    },
    { flush: 'post' },
  );

  return computed(() => matches.value);
}
