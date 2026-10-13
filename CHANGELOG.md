# Changelog

Each version bundles the Lighthouse report renderer with the same version number. This file
lists the changes to the component itself. For renderer changes, see the
[Lighthouse releases](https://github.com/GoogleChrome/lighthouse/releases).

## 13.5.0

A full rewrite on top of the official Lighthouse report renderer.

- Publish as `@blen/react-lighthouse-viewer`. The unscoped `react-lighthouse-viewer` package is
  deprecated.

- Bundle the Lighthouse 13.5.0 report renderer. Reports from Lighthouse 6 and later render.
- New API: `<LighthouseViewer report={...} options={...} />`, a named export.
- Accept all Lighthouse renderer options, such as `disableDarkMode`, `omitTopbar` and
  `onSaveFileOverride`.
- Pass `ref` and other `div` props to the container element.
- Mark the component as a client component for React Server Components and Next.js.
- Ship TypeScript types for the report, the options and the props.
- Require React 19.
- Change the license to Apache-2.0, the same license as Lighthouse.
- Publish from GitHub Actions with npm provenance.

See "Migrate from 6.x" in the README.

## 6.0.3 and earlier

These versions were published as `react-lighthouse-viewer` and copied the Lighthouse 6 report renderer. See the
[6.0.3 source](https://github.com/blencorp/react-lighthouse-viewer/tree/02093e8).
