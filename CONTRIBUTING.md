# Contributing

Thanks for helping. Bug reports, fixes and docs improvements are welcome. This project follows
the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Set up

You need Node.js 24 (see `.nvmrc`) and pnpm. The repo pins the pnpm version in `package.json`;
`corepack enable` or [pnpm's installer](https://pnpm.io/installation) picks it up.

```sh
pnpm install
pnpm --filter @blen/react-lighthouse-viewer exec playwright install chromium
```

### PageSpeed Insights key (optional)

The demo's "Analyze" box runs Lighthouse through PageSpeed Insights. Without a key it shares a
public quota that is often used up. To use your own key locally, create
`example/.env.local` (Git ignores it):

```sh
VITE_PAGESPEED_API_KEY=your-key
```

[docs/pagespeed-api-key.md](./docs/pagespeed-api-key.md) explains how to create and restrict a
key. The Pages workflow reads the deployed site's key from the `PAGESPEED_API_KEY` repository
secret.

## Repo layout

| Path                                 | What it is                                                              |
| ------------------------------------ | ----------------------------------------------------------------------- |
| `packages/react-lighthouse-viewer`   | The published package.                                                  |
| `example`                            | The demo site, deployed to GitHub Pages.                                |
| `docs`                               | Guides, such as the PageSpeed Insights API key.                         |
| `scripts/prepare-release.ts`         | Prepares the next release, with a newer Lighthouse when there is one.   |
| `scripts/generate-sample-reports.ts` | Makes the demo sample reports. They are not committed.                  |
| `scripts/check-install.ts`           | Installs the packed package with npm, pnpm, yarn or bun and imports it. |
| `.github/workflows`                  | CI, release, release pull request and Pages workflows.                  |

## Scripts

Run these from the repo root:

| Command          | What it does                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| `pnpm dev`       | Starts the demo site. Run `pnpm build` and `pnpm reports` first.                                        |
| `pnpm reports`   | Runs Lighthouse on the demo websites to make the sample reports. Needs Google Chrome, or `CHROME_PATH`. |
| `pnpm build`     | Builds the package with tsdown.                                                                         |
| `pnpm test`      | Runs the tests in Chromium (Vitest browser mode) and the server tests.                                  |
| `pnpm lint`      | Runs Oxlint and checks formatting with oxfmt.                                                           |
| `pnpm format`    | Formats the code and applies lint fixes.                                                                |
| `pnpm typecheck` | Type checks all projects.                                                                               |
| `pnpm check`     | Runs everything that CI runs.                                                                           |

## Pull requests

- Run `pnpm check` before you open a pull request.
- Add or update tests for behavior changes.
- Add a line under `## Unreleased` in `CHANGELOG.md` if users will notice the change.

## Versions and releases

The package's major and minor versions equal the bundled Lighthouse's major and minor versions.
The patch number is ours. You do not change the version by hand.

1. The **Release pull request** workflow prepares a release. It sets the next version, moves the
   changelog's `## Unreleased` section under that version, runs `pnpm check`, and opens a pull
   request.
   - Every day, it checks npm for a new Lighthouse version. If there is one, it also updates
     Lighthouse and the test report. A new Lighthouse minor or major version starts a new `X.Y.0`;
     a Lighthouse patch, or a release of component changes, raises our patch number.
   - To release component changes without a new Lighthouse, run it by hand: **Actions → Release
     pull request → Run workflow**.
2. The pull request opens as a draft. A maintainer clicks **Ready for review**, which runs CI,
   then reviews and merges it.
3. The **Release** workflow sees a version that has no release yet. It runs CI, publishes to npm
   with provenance (npm trusted publishing, no tokens), and creates the tag and the GitHub release.
4. The **Pages** workflow deploys the example site with fresh sample reports.

Component changes merge to `main` at any time, with a line under `## Unreleased` in the changelog.
