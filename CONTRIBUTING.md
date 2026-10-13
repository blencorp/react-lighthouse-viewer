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

## Repo layout

| Path                                 | What it is                                             |
| ------------------------------------ | ------------------------------------------------------ |
| `packages/react-lighthouse-viewer`   | The published package.                                 |
| `example`                            | The demo site, deployed to GitHub Pages.               |
| `scripts/sync-lighthouse.ts`         | Updates the bundled Lighthouse version.                |
| `scripts/generate-sample-reports.ts` | Makes the demo sample reports. They are not committed. |
| `.github/workflows`                  | CI, release, Lighthouse sync and Pages workflows.      |

## Scripts

Run these from the repo root:

| Command          | What it does                                                           |
| ---------------- | ---------------------------------------------------------------------- |
| `pnpm dev`       | Starts the demo site. Run `pnpm build` and `pnpm reports` first.       |
| `pnpm reports`   | Runs Lighthouse on the demo websites to make the sample reports.       |
| `pnpm build`     | Builds the package with tsdown.                                        |
| `pnpm test`      | Runs the tests in Chromium (Vitest browser mode) and the server tests. |
| `pnpm lint`      | Runs Oxlint and checks formatting with oxfmt.                          |
| `pnpm format`    | Formats the code and applies lint fixes.                               |
| `pnpm typecheck` | Type checks all projects.                                              |
| `pnpm check`     | Runs everything that CI runs.                                          |

## Pull requests

- Run `pnpm check` before you open a pull request.
- Add or update tests for behavior changes.
- Add a line under the next version in `CHANGELOG.md` if users will notice the change.

## Versions and releases

The package version always equals the bundled Lighthouse version. You do not change it by hand.

1. Every day, the **Lighthouse sync** workflow checks npm for a new Lighthouse version. If there
   is one, it updates Lighthouse, the package version, the sample report and the changelog, runs
   `pnpm check`, and opens a pull request.
2. A maintainer reviews and merges the pull request.
3. The **Release** workflow sees a version that is not on npm yet. It runs CI, publishes to npm
   with provenance (npm trusted publishing, no tokens), and creates the GitHub release.

Component fixes merge to `main` at any time and ship with the next Lighthouse release.
