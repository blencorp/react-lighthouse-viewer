# Changelog

Each version bundles the Lighthouse report renderer with the same version number. This file
lists the changes to the component itself. For renderer changes, see the
[Lighthouse releases](https://github.com/GoogleChrome/lighthouse/releases).

## Unreleased

- `report` also takes a promise of a report. The component reads it with `use()`, so it works with
  `<Suspense>` and with promises that Server Components pass down.
- Add `fetchLighthouseReport(url)`, which fetches a report, checks it, and returns a promise for
  the viewer.
- Add `isLighthouseReport`, a type guard for JSON that users upload or that you fetch.
- Throw a clear `TypeError` when `report` is not a Lighthouse report, for error boundaries to show.

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
- Publish later versions from GitHub Actions with npm trusted publishing and provenance.

See "Migrate from 6.x" in the README.

## 6.0.3 and earlier

These versions were published as `react-lighthouse-viewer` and copied the Lighthouse 6 report renderer. See the
[6.0.3 source](https://github.com/blencorp/react-lighthouse-viewer/tree/02093e8).
