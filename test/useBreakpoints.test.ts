import { nextTick } from 'vue';
import { describe, expect, it } from 'vitest';
import { useBreakpoints } from '../src/index.js';

interface MockQuery {
  listeners: Set<(event: MediaQueryListEvent) => void>;
  media: MediaQueryList;
  matches: () => boolean;
}

function createWindow(initialWidth: number) {
  let width = initialWidth;
  const queries: MockQuery[] = [];

  const window = {
    matchMedia(query: string) {
      const listeners = new Set<(event: MediaQueryListEvent) => void>();
      const matches = () => {
        const min = query.match(/min-width: ([0-9.]+)px/);
        const max = query.match(/max-width: ([0-9.]+)px/);
        return (
          (!min || width >= Number(min[1])) && (!max || width <= Number(max[1]))
        );
      };
      const media = {
        addEventListener: (
          _event: string,
          listener: (event: MediaQueryListEvent) => void,
        ) => listeners.add(listener),
        matches: matches(),
        removeEventListener: (
          _event: string,
          listener: (event: MediaQueryListEvent) => void,
        ) => listeners.delete(listener),
      } as unknown as MediaQueryList;
      queries.push({ listeners, matches, media });
      return media;
    },
  } as Window;

  return {
    setWidth(nextWidth: number) {
      width = nextWidth;
      for (const query of queries) {
        (query.media as { matches: boolean }).matches = query.matches();
        query.listeners.forEach((listener) =>
          listener({ matches: query.media.matches } as MediaQueryListEvent),
        );
      }
    },
    window,
  };
}

describe('useBreakpoints package contract', () => {
  it('exposes reactive shortcuts and methods', async () => {
    const browser = createWindow(800);
    const breakpoints = useBreakpoints(
      { xs: 0, sm: 640, md: 1024 },
      { window: browser.window },
    );

    expect(breakpoints.sm.value).toBe(true);
    expect(breakpoints.md.value).toBe(false);
    expect(breakpoints.current().value).toEqual(['xs', 'sm']);
    expect(breakpoints.active().value).toBe('sm');
    expect(breakpoints.greater('sm').value).toBe(true);
    expect(breakpoints.smaller('md').value).toBe(true);

    await nextTick();
    browser.setWidth(1200);

    expect(breakpoints.md.value).toBe(true);
    expect(breakpoints.active().value).toBe('md');
  });

  it('uses ssrWidth when no browser window is available', () => {
    const breakpoints = useBreakpoints(
      { sm: 640, lg: 1024 },
      { ssrWidth: 700 },
    );

    expect(breakpoints.sm.value).toBe(true);
    expect(breakpoints.lg.value).toBe(false);
  });
});
