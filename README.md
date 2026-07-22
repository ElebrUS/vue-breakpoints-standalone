# vue-breakpoints-standalone

[![CI](https://github.com/ElebrUS/vue-breakpoints-standalone/actions/workflows/ci.yml/badge.svg)](https://github.com/ElebrUS/vue-breakpoints-standalone/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/vue-breakpoints-standalone)](https://www.npmjs.com/package/vue-breakpoints-standalone)
[![license](https://img.shields.io/npm/l/vue-breakpoints-standalone)](./LICENSE)

Tiny Vue breakpoint utilities with framework-agnostic SSR detection. Vue is the only runtime dependency.

## Install

```sh
npm install vue-breakpoints-standalone
```

Vue 3.3+ is required as a peer dependency.

## Browser usage

```ts
import { useBreakpoints } from 'vue-breakpoints-standalone';

const breakpoints = useBreakpoints({ xs: 0, sm: 640, md: 768, lg: 1024 });

const isDesktop = breakpoints.greaterOrEqual('lg');
const active = breakpoints.active();
```

Numbers are interpreted as pixels. CSS length strings such as `'48rem'` are also supported by `useBreakpoints`.

## SSR detection

`detectBreakpoint` is a pure TypeScript function: it does not import Vue, access browser globals, or depend on Nuxt, Nitro, or Vite.

```ts
import { detectBreakpoint, useBreakpoints } from 'vue-breakpoints-standalone';

const breakpoints = { xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280 };

const ssrBreakpoint = detectBreakpoint({
  breakpoints,
  headers: request.headers,
  userAgent: request.headers.get('user-agent') ?? undefined,
  fallback: 'xl',
});

const viewport = useBreakpoints(breakpoints, { ssrBreakpoint });
```

With `strategy: 'auto'` (the default), detection uses this order:

1. explicit `width`
2. `Sec-CH-Viewport-Width`
3. `Viewport-Width`
4. `Sec-CH-UA-Mobile`
5. `userAgent`
6. `fallback`

Breakpoints are sorted by minimum width, so ordinary min-width and Tailwind-style maps work naturally. For a width between two breakpoints, the largest matching minimum width is returned. The function never throws; an empty or unusable map returns `fallback` or `''`.

### Nuxt server route or plugin

Pass request data in your server code; the utility has no Nuxt import:

```ts
const ssrBreakpoint = detectBreakpoint({
  breakpoints,
  headers: Object.fromEntries(getRequestHeaders(event)),
  userAgent: getHeader(event, 'user-agent') ?? undefined,
  fallback: 'xl',
});
```

Use the resulting value as `ssrBreakpoint` when calling `useBreakpoints`. Keep this request-specific value in request or app state rather than a module singleton.

### Generic Node/Express SSR

```ts
const ssrBreakpoint = detectBreakpoint({
  breakpoints,
  headers: req.headers as Record<string, string>,
  userAgent: req.get('user-agent'),
  fallback: 'xl',
});
```

### Hydration

`useBreakpoints` evaluates the supplied server breakpoint until a browser `window.matchMedia` implementation is available, then continues using the browser query. Pass the same map on the server and client to avoid an avoidable hydration mismatch.

## API

### `detectBreakpoint(options)`

```ts
detectBreakpoint({
  breakpoints: { xs: 0, sm: 640, lg: 1024 },
  width: 800,
  headers,
  userAgent,
  fallback: 'lg',
  strategy: 'auto', // 'width' | 'client-hints' | 'user-agent'
});
```

### `useBreakpoints(breakpoints, options)`

All VueUse-compatible helpers remain available: shortcut refs, `active`, `current`, `greater`, `greaterOrEqual`, `smaller`, `smallerOrEqual`, `between`, `isGreater`, `isGreaterOrEqual`, `isSmaller`, `isSmallerOrEqual`, and `isInBetween`.

`options.ssrBreakpoint` accepts a key from the supplied map. `options.ssrWidth` remains available and takes precedence when both are set.

## Development

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run coverage
npm run build
npm pack --dry-run
```

## License

MIT. This package contains code derived from VueUse; see [LICENSE](./LICENSE) for both required copyright notices.
