# Contributing

Thanks for contributing. This repository deliberately contains only the VueUse `useBreakpoints` dependency slice, so changes should preserve that narrow scope.

## Setup

Use Node.js 20 or later and npm 10.9.8:

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Run `npm run format` before committing. CI treats formatting and lint warnings as failures.

## Pull requests

Keep pull requests focused, include tests for behavior changes, and update documentation when the public API, SSR behavior, or browser support changes. Do not add a VueUse composable merely for convenience; inline only the minimal behavior required by `useBreakpoints`.

Add a changeset for every user-facing change:

```sh
npm run changeset
```

Use patch releases for fixes, minor releases for backwards-compatible features, and major releases for breaking changes.

## Upstream synchronization

When syncing VueUse, compare the files listed in the README and preserve VueUse copyright notices. Explain all intentional deviations in the README and test any changed reactive or SSR behavior.
