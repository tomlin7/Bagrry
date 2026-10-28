# Hiroshi documentation

The docs site for the Hiroshi cockpit. It is a [Mintlify](https://mintlify.com)
project: `docs.json` describes the navigation and the theme, and the `.mdx`
files next to it are the pages.

Mintlify picks the site up on its own, because this folder holds `docs.json` at
its root.

## Preview it locally

```bash
npm i -g mint
cd docs
mint dev
```

## Write

The navigation lives in `docs/docs.json`. A page that is not in the
navigation is still built, it is just not in the sidebar. A page that is in
the navigation but does not exist fails the build, so keep the two in step.

Add an asset under `docs/public` and point at it with a root relative path,
for example `/logo/dark.svg`.
