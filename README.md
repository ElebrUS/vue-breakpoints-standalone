# vue-breakpoints-standalone

[![CI](https://github.com/ElebrUS/vue-breakpoints-standalone/actions/workflows/ci.yml/badge.svg)](https://github.com/ElebrUS/vue-breakpoints-standalone/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/vue-breakpoints-standalone)](https://www.npmjs.com/package/vue-breakpoints-standalone)
[![license](https://img.shields.io/npm/l/vue-breakpoints-standalone)](./LICENSE)

A tiny, Vue-only standalone implementation of VueUse's `useBreakpoints`. It keeps the familiar API while avoiding the rest of the VueUse dependency tree.

## Why this package exists

Use it when your application needs VueUse-compatible breakpoint reactivity but you want the smallest possible runtime surface: Vue is the only runtime dependency. The implementation is intentionally limited to `useBreakpoints`, its local `useMediaQuery` dependency, and the few utilities that support them.

## Installation

```sh
npm install vue-breakpoints-standalone
```

Vue 3.3 or newer is required as a peer dependency.

## Quick start

```ts
import { useBreakpoints } from 'vue-breakpoints-standalone';

const breakpoints = useBreakpoints({
  xs: 0,
  sm: 640,
  md: '768px',
  lg: '1024px',
});

const active = breakpoints.active();
const isDesktop = breakpoints.greaterOrEqual('lg');
```

Shortcut refs are created from every key in your breakpoint map, so `breakpoints.md` is a reactive `ComputedRef<boolean>`.

## API

```ts
const breakpoints = useBreakpoints(map, {
  strategy: 'min-width', // or 'max-width'
  ssrWidth: 1024,
  window, // optional custom Window, useful for iframes and tests
});
```

`map` accepts numeric pixel values, CSS length strings such as `'48rem'`, and reactive Vue values. It exposes one shortcut ref per key and these methods:

| Method                                                           | Result                                                |
| ---------------------------------------------------------------- | ----------------------------------------------------- |
| `greater(key)` / `greaterOrEqual(key)`                           | Reactive strict / inclusive minimum-width query       |
| `smaller(key)` / `smallerOrEqual(key)`                           | Reactive strict / inclusive maximum-width query       |
| `between(a, b)`                                                  | Reactive inclusive-lower, exclusive-upper range query |
| `isGreater`, `isGreaterOrEqual`, `isSmaller`, `isSmallerOrEqual` | Immediate boolean versions                            |
| `isInBetween(a, b)`                                              | Immediate range boolean                               |
| `current()`                                                      | Computed list of matching breakpoint keys             |
| `active()`                                                       | Computed active key, or `''` when none match          |

`useMediaQuery(query, options)` is also exported for the composable's underlying reactive query behavior.

## SSR

Without a browser `window`, media queries safely return `false`. To provide a deterministic SSR result for `min-width` and `max-width` queries, pass `ssrWidth`:

```ts
const breakpoints = useBreakpoints({ sm: 640, lg: 1024 }, { ssrWidth: 1024 });
```

The composable switches to `matchMedia` in the browser when available. As with VueUse, string values are parsed as pixels for SSR (`rem` is treated as 16px); avoid relying on that conversion for exact server-side typography calculations.

## Migrating from VueUse

Replace the import:

```diff
- import { useBreakpoints } from '@vueuse/core'
+ import { useBreakpoints } from 'vue-breakpoints-standalone'
```

| Capability                                | VueUse | This package                       |
| ----------------------------------------- | ------ | ---------------------------------- |
| `useBreakpoints` API and shortcut refs    | Yes    | Yes                                |
| Per-call `ssrWidth`                       | Yes    | Yes                                |
| Custom breakpoint maps                    | Yes    | Yes                                |
| `useMediaQuery`                           | Yes    | Yes, minimal local dependency      |
| Preset maps such as `breakpointsTailwind` | Yes    | No — define or import your own map |
| `provideSSRWidth()` injection             | Yes    | No — pass `ssrWidth` per call      |
| Other VueUse composables                  | Yes    | No                                 |

## Browser compatibility

Supports modern browsers with `Window.matchMedia()` and `MediaQueryList` `change` events: current Chrome, Edge, Firefox, and Safari. Server rendering and non-browser environments are supported without accessing `window` at module evaluation time. Legacy browsers that only implement `MediaQueryList.addListener()` are not supported, matching current VueUse behavior.

## TypeScript

The package ships ESM and declaration files. `useBreakpoints` preserves VueUse's generic key inference, so literal keys from your breakpoint map are available as typed shortcut refs and method arguments.

## Development

```sh
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm pack --dry-run
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution and upstream-sync guidance.

## Releases

This project uses Changesets. Add one for every user-facing change with `npm run changeset`. After changesets merge to `main`, GitHub Actions opens a version PR. Merging that PR publishes to npm through trusted publishing with provenance and creates the GitHub release.

The npm package must be configured once for [trusted publishing](https://docs.npmjs.com/trusted-publishers) with this repository's `main` workflow before the first release.

## License

MIT. The package includes code derived from VueUse, which is also MIT-licensed; see [LICENSE](./LICENSE) for both required copyright notices.
