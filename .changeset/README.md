# Changesets

Add a changeset for every user-facing package change:

```sh
npm run changeset
```

The release workflow consumes merged changesets, opens a version PR, and publishes the merged version PR through npm trusted publishing.
