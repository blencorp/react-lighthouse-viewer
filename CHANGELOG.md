# Changelog

Each version bundles the Lighthouse report renderer with the same major and minor version
(`13.5.x` bundles Lighthouse 13.5). This file lists the changes to the component itself. For
renderer changes, see the [Lighthouse releases](https://github.com/GoogleChrome/lighthouse/releases).

## Unreleased

## 13.5.3

- Error messages for `src` leave out the query string, which can hold a signed token.

## 13.5.2

- Server Components can call `isLighthouseReport` and read `lighthouseVersion`. Before, the whole
  package was a client module, and calling them on the server threw an error.
- When the renderer cannot draw a report, the error message now names the real problem, not
  "Cannot read properties of null".
- A relative `src`, such as `report.json`, loads again on a different page, because it points to a
  different file there.
- `fallback={null}` shows nothing while the report loads, as `<Suspense fallback={null}>` does.
- Optional props accept `undefined`, for projects that use `exactOptionalPropertyTypes`.
- The props no longer accept `dangerouslySetInnerHTML`, which could not work.

## 13.5.1

- The patch version now belongs to this package, so component changes can ship before the next
  Lighthouse release. The major and minor versions still match the bundled Lighthouse.
- New `url` prop: analyze a live website. PageSpeed Insights runs Lighthouse, and the component
  renders the result. Optional `apiKey` and `strategy` (`'mobile'` or `'desktop'`). See
  [the API key guide](https://github.com/blencorp/react-lighthouse-viewer/blob/main/docs/pagespeed-api-key.md).
- New `src` prop: show a saved Lighthouse JSON report from a URL.
- `report` also takes a promise of a report, read with `use()`, so a Server Component can pass one
  down.
- Built-in loading and error states, with `fallback` and `errorFallback` props to replace them.
  Each `url` and `src` result is cached, so two viewers with the same source share one request.
- The props allow exactly one of `url`, `src` or `report`, and every prop has documentation.
- Add `isLighthouseReport`, a type guard for JSON that users upload or that you fetch.
- Show a clear error when `report` is not a Lighthouse report.

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
