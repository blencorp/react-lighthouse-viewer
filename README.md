# @blen/react-lighthouse-viewer

[![npm](https://img.shields.io/npm/v/@blen/react-lighthouse-viewer)](https://www.npmjs.com/package/@blen/react-lighthouse-viewer)
[![CI](https://github.com/blencorp/react-lighthouse-viewer/actions/workflows/ci.yml/badge.svg)](https://github.com/blencorp/react-lighthouse-viewer/actions/workflows/ci.yml)
[![License](https://img.shields.io/npm/l/@blen/react-lighthouse-viewer)](https://github.com/blencorp/react-lighthouse-viewer/blob/main/LICENSE)

Render [Lighthouse](https://github.com/GoogleChrome/lighthouse) JSON reports in React, with the
official Lighthouse report renderer.

**[Live demo →](https://blencorp.github.io/react-lighthouse-viewer/)**

![A Lighthouse report rendered by react-lighthouse-viewer](https://raw.githubusercontent.com/blencorp/react-lighthouse-viewer/main/.github/assets/screenshot.png)

- The report looks and works like the HTML report Lighthouse writes, because it uses the same renderer.
- Renders reports from Lighthouse 6 and later.
- The version matches Lighthouse: `@blen/react-lighthouse-viewer@13.5.0` bundles the Lighthouse 13.5.0 renderer.
- No runtime dependencies. React 19 is the only peer dependency.
- TypeScript types for the report and the renderer options.
- Works with server rendering and React Server Components (it is a client component).

## Install

```sh
npm install @blen/react-lighthouse-viewer
```

## Usage

```tsx
import { LighthouseViewer } from '@blen/react-lighthouse-viewer';

export function Report({ report }) {
  return <LighthouseViewer report={report} />;
}
```

`report` is the JSON that Lighthouse writes, for example with
`lighthouse https://example.com --output=json --output-path=report.json`.

### Load a report

Fetch the report and read it with React's `use`:

```tsx
import { Suspense, use } from 'react';
import { LighthouseViewer, type LighthouseReport } from '@blen/react-lighthouse-viewer';

const reportPromise: Promise<LighthouseReport> = fetch('/report.json').then((res) => res.json());

function Report() {
  return <LighthouseViewer report={use(reportPromise)} />;
}

export function App() {
  return (
    <Suspense fallback={<p>Loading report…</p>}>
      <Report />
    </Suspense>
  );
}
```

### Options

`options` goes to the Lighthouse renderer unchanged:

```tsx
<LighthouseViewer
  report={report}
  options={{ disableDarkMode: true, omitTopbar: true }}
  className="report"
/>
```

| Option                    | Type                                              | Description                                                                    |
| ------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------ |
| `disableDarkMode`         | `boolean`                                         | Do not switch to dark mode when the user prefers it.                           |
| `disableFireworks`        | `boolean`                                         | Do not show the fireworks when all core categories score 100.                  |
| `omitTopbar`              | `boolean`                                         | Hide the top bar (URL, tools menu, sticky score header).                       |
| `omitGlobalStyles`        | `boolean`                                         | Do not inject the report styles. Use this when the page already includes them. |
| `occupyEntireViewport`    | `boolean`                                         | Make the report fill the viewport. Use this when the report is the whole page. |
| `getStandaloneReportHTML` | `() => string`                                    | Shows **Save as HTML** in the tools menu and supplies the HTML to save.        |
| `onSaveFileOverride`      | `(blob: Blob, filename: string) => Promise<void>` | Called to save JSON or HTML, instead of a browser download.                    |
| `onPrintOverride`         | `(rootEl: HTMLElement) => Promise<void>`          | Called to print, instead of `window.print()`.                                  |
| `onViewTrace`             | `() => void`                                      | Shows a **View Trace** action and calls this when the user clicks it.          |
| `onPageAnchorRendered`    | `(link: HTMLAnchorElement) => void`               | Called for each in-report anchor link, so you can change its `href`.           |

All other `div` props (`className`, `style`, `id`, `ref`, …) go to the container element.

The report renders again when `report`, an option value, or a callback changes. Option values are
compared by value, so an inline `options={{ ... }}` object is fine. Callbacks are compared by
identity: a new function renders the report again, and the user loses scroll position and open
audits. [React Compiler](https://react.dev/learn/react-compiler) keeps inline callbacks stable for
you. Without it, wrap callbacks in `useCallback`.

### Next.js and React Server Components

The package marks itself as a client component (`'use client'`), so you can use it in a Server
Component. The server sends an empty container, and the report renders in the browser.

```tsx
// app/report/page.tsx
import { LighthouseViewer, type LighthouseReport } from '@blen/react-lighthouse-viewer';
import report from './report.json';

export default function Page() {
  return <LighthouseViewer report={report as LighthouseReport} />;
}
```

### Load the renderer only when it is needed

The renderer is about 200 kB (50 kB gzipped). To keep it out of your main bundle, load it with
`React.lazy`:

```tsx
import { lazy } from 'react';

const LighthouseViewer = lazy(() =>
  import('@blen/react-lighthouse-viewer').then((m) => ({ default: m.LighthouseViewer })),
);
```

### Styling and dark mode

The report brings its own styles. They apply only inside the report element (`.lh-vars`).

- **Dark mode** follows `prefers-color-scheme`. Set `disableDarkMode` to keep it light.
- **Theme** with the report's CSS variables:

```css
.report .lh-vars {
  --report-font-family: 'Inter', sans-serif;
  --report-content-max-width: 1200px;
}
```

### TypeScript

The package exports `LighthouseReport` (the Lighthouse result type), `RendererOptions`, and
`LighthouseViewerProps`. TypeScript widens string literals in imported JSON, so cast imported
reports: `report as LighthouseReport`.

`lighthouseVersion` is the Lighthouse version that the package bundles.

## Make a report

- **CLI:** `npx lighthouse https://example.com --output=json --output-path=report.json`
- **Node:** the [`lighthouse` Node API](https://github.com/GoogleChrome/lighthouse/blob/main/docs/readme.md#using-programmatically) returns the report as `runnerResult.lhr`.
- **PageSpeed Insights API:** the `lighthouseResult` field of the
  [response](https://developers.google.com/speed/docs/insights/v5/get-started) is a report.

## Versioning

The package version is the version of the Lighthouse renderer that it bundles. For example,
`13.5.0` bundles Lighthouse `13.5.0`. A workflow checks for new Lighthouse releases every day and
publishes the matching version. Changes to the component itself ship with the next Lighthouse
release, and the [changelog](https://github.com/blencorp/react-lighthouse-viewer/blob/main/CHANGELOG.md) lists them.

## Migrate from 6.x

Version 6.x was published as `react-lighthouse-viewer` and copied the Lighthouse 6 renderer.
Version 13 is published as `@blen/react-lighthouse-viewer` and uses the official renderer.

```sh
npm uninstall react-lighthouse-viewer
npm install @blen/react-lighthouse-viewer
```

- React 19 or later is required.
- Use the named export: `import { LighthouseViewer } from '@blen/react-lighthouse-viewer'`.
- Rename the `json` prop to `report`.
- The `id` prop no longer selects the container. Use `ref` to get the container element.

```diff
- import ReportViewer from 'react-lighthouse-viewer';
- <ReportViewer json={report} id="my-report" />
+ import { LighthouseViewer } from '@blen/react-lighthouse-viewer';
+ <LighthouseViewer report={report} />
```

## Limitations

- The package renders single reports. It does not render user flow reports (`FlowResult`).
- With the top bar on, the Lighthouse renderer adds `copy` and `afterprint` listeners to the page
  that it does not remove. If your app mounts and unmounts many reports, set `omitTopbar`.

## Contributing

See [CONTRIBUTING.md](https://github.com/blencorp/react-lighthouse-viewer/blob/main/CONTRIBUTING.md).

## License

[Apache-2.0](https://github.com/blencorp/react-lighthouse-viewer/blob/main/LICENSE). The bundled Lighthouse renderer is © Google LLC, also under Apache-2.0
(see [NOTICE](https://github.com/blencorp/react-lighthouse-viewer/blob/main/NOTICE)).

Made by [BLEN](https://blencorp.com) in Washington, DC.
