import { describe, expect, it } from 'vitest';
import { detectBreakpoint } from '../src/detectBreakpoint.js';

const breakpoints = { xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280 };

describe('detectBreakpoint', () => {
  it('chooses the largest minimum-width breakpoint at or below an explicit width', () => {
    expect(detectBreakpoint({ breakpoints, width: 1024 })).toBe('lg');
    expect(detectBreakpoint({ breakpoints, width: 767 })).toBe('sm');
    expect(detectBreakpoint({ breakpoints, width: 1 })).toBe('xs');
    expect(
      detectBreakpoint({ breakpoints: { sm: 640, lg: 1024 }, width: 1 }),
    ).toBe('sm');
  });

  it('sorts unordered and Tailwind-style breakpoint maps', () => {
    expect(
      detectBreakpoint({
        breakpoints: { xl: 1280, sm: 640, '2xl': 1536 },
        width: 1400,
      }),
    ).toBe('xl');
  });

  it('uses Client Hint viewport widths before UA hints', () => {
    expect(
      detectBreakpoint({
        breakpoints,
        headers: { 'Sec-CH-Viewport-Width': '800', 'Sec-CH-UA-Mobile': '?1' },
      }),
    ).toBe('md');
    expect(
      detectBreakpoint({
        breakpoints,
        headers: new Headers({ 'Viewport-Width': '1100' }),
      }),
    ).toBe('lg');
  });

  it('uses the Client Hints mobile signal when no viewport width exists', () => {
    expect(
      detectBreakpoint({ breakpoints, headers: { 'sec-ch-ua-mobile': '?1' } }),
    ).toBe('xs');
    expect(
      detectBreakpoint({ breakpoints, headers: { 'sec-ch-ua-mobile': '?0' } }),
    ).toBe('xl');
  });

  it('uses mobile, tablet, and desktop user-agent fallbacks', () => {
    expect(
      detectBreakpoint({
        breakpoints,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
      }),
    ).toBe('xs');
    expect(
      detectBreakpoint({
        breakpoints,
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0)',
      }),
    ).toBe('md');
    expect(
      detectBreakpoint({
        breakpoints,
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
      }),
    ).toBe('xl');
  });

  it('honors detection strategies and fallback values', () => {
    expect(
      detectBreakpoint({
        breakpoints,
        width: 1200,
        strategy: 'client-hints',
        fallback: 'sm',
      }),
    ).toBe('sm');
    expect(
      detectBreakpoint({
        breakpoints,
        headers: { 'viewport-width': '1200' },
        strategy: 'width',
        fallback: 'md',
      }),
    ).toBe('md');
    expect(
      detectBreakpoint({ breakpoints, strategy: 'user-agent', fallback: 'sm' }),
    ).toBe('sm');
    expect(
      detectBreakpoint({
        breakpoints,
        headers: { 'viewport-width': 'invalid' },
        fallback: 'lg',
      }),
    ).toBe('lg');
  });

  it('never throws for invalid input', () => {
    expect(detectBreakpoint({ breakpoints: {}, fallback: 'fallback' })).toBe(
      'fallback',
    );
    expect(detectBreakpoint({ breakpoints: {} })).toBe('');
    expect(
      detectBreakpoint({ breakpoints, width: Number.NaN, fallback: 'sm' }),
    ).toBe('sm');
    const throwingBreakpoints = new Proxy(
      {},
      {
        ownKeys: () => {
          throw new Error('nope');
        },
      },
    );
    expect(
      detectBreakpoint({ breakpoints: throwingBreakpoints, fallback: 'safe' }),
    ).toBe('safe');
    expect(detectBreakpoint({ breakpoints: throwingBreakpoints })).toBe('');
  });
});
