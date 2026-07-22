import { describe, expect, it } from 'vitest';
import { detectBreakpoint, useBreakpoints } from '../src/index.js';

describe('useBreakpoints SSR compatibility', () => {
  it('accepts a detected SSR breakpoint without changing browser options', () => {
    const breakpoints = { xs: 0, sm: 640, md: 768, lg: 1024 };
    const ssrBreakpoint = detectBreakpoint({
      breakpoints,
      headers: { 'sec-ch-viewport-width': '800' },
    });
    const viewport = useBreakpoints(breakpoints, { ssrBreakpoint });

    expect(viewport.sm.value).toBe(true);
    expect(viewport.md.value).toBe(true);
    expect(viewport.lg.value).toBe(false);
    expect(viewport.active().value).toBe('md');
  });

  it('prefers an explicit ssrWidth over ssrBreakpoint', () => {
    const viewport = useBreakpoints(
      { sm: 640, lg: 1024 },
      { ssrBreakpoint: 'lg', ssrWidth: 700 },
    );

    expect(viewport.sm.value).toBe(true);
    expect(viewport.lg.value).toBe(false);
  });
});
