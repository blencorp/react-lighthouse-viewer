# react-lighthouse-viewer

If you have generated lighthouse report using lighthouse CLI, you can use this component to render the JSON report inside React.

## Installation

```sh
yarn add react-lighthouse-viewer
```

## Usage

```Javascript
import React from 'react';
import { render } from 'react-dom';
import ReportViewer from 'react-lighthouse-viewer';

import jsonReport from './report.json';

const App = () => (
    <ReportViewer json={jsonReport} />
);
render(<App />, document.getElementById("root"));
```

## To generate lighthouse reports, use CLI

### Install lighthouse globally

```sh
npm install -g lighthouse
```

**Run CLI**: `lighthouse https://blencorp.com --output=json --output-path=./report.json`

By default, Lighthouse writes the report to an HTML file. You can control the output format by passing flags.

### CLI options

```sh
$ lighthouse --help

lighthouse <url>

Logging:
  --verbose  Displays verbose logging                                                                                                      [boolean]
  --quiet    Displays no progress, debug logs or errors                                                                                    [boolean]

Configuration:
  --save-assets                  Save the trace & devtools log to disk                                                                     [boolean]
  --list-all-audits              Prints a list of all available audits and exits                                                           [boolean]
  --list-trace-categories        Prints a list of all required trace categories and exits                                                  [boolean]
  --print-config                 Print the normalized config for the given config and options, then exit.                                  [boolean]
  --additional-trace-categories  Additional categories to capture with the trace (comma-delimited).
  --config-path                  The path to the config JSON.
  --chrome-flags                 Custom flags to pass to Chrome (space-delimited). For a full list of flags, see
                                 http://peter.sh/experiments/chromium-command-line-switches/.

                                 Environment variables:
                                 CHROME_PATH: Explicit path of intended Chrome binary. If set must point to an executable of a build of
                                 Chromium version 66.0 or later. By default, any detected Chrome Canary or Chrome (stable) will be launched.
                                                                                                                                       [default: ""]
  --port                         The port to use for the debugging protocol. Use 0 for a random port                                    [default: 0]
  --preset                       Use a built-in configuration.                                            [choices: "full", "perf", "mixed-content"]
  --hostname                     The hostname to use for the debugging protocol.                                              [default: "localhost"]
  --max-wait-for-load            The timeout (in milliseconds) to wait before the page is considered done loading and the run should continue.
                                 WARNING: Very high values can lead to large traces and instability                                 [default: 45000]
  --emulated-form-factor         Controls the emulated device form factor (mobile vs. desktop) if not disabled                      [choices: "mobile", "desktop", "none"] [default: "mobile"]
  --enable-error-reporting       Enables error reporting, overriding any saved preference. --no-enable-error-reporting will do the opposite. More:
                                 https://git.io/vFFTO
  --gather-mode, -G              Collect artifacts from a connected browser and save to disk. If audit-mode is not also enabled, the run will quit
                                 early.                                                                                                    [boolean]
  --audit-mode, -A               Process saved artifacts from disk                                                                         [boolean]

Output:
  --output       Reporter for the results, supports multiple values                        [choices: "csv", "json", "html"] [default: "html"]
  --output-path  The file path to output the results. Use 'stdout' to write to stdout.
                 If using JSON or CSV output, default is stdout.
                 If using HTML output, default is a file in the working directory with a name based on the test URL and date.
                 If using multiple outputs, --output-path is appended with the standard extension for each output type. "reports/my-run" -> "reports/my-run.report.html", "reports/my-run.report.json", etc.
                 Example: --output-path=./lighthouse-results.html
  --view         Open HTML report in your browser                                                                                          [boolean]

Options:
  --help                        Show help                                                                                                  [boolean]
  --version                     Show version number                                                                                        [boolean]
  --blocked-url-patterns        Block any network requests to the specified URL patterns                                                     [array]
  --disable-storage-reset       Disable clearing the browser cache and other storage APIs before a run                                     [boolean]
  --disable-device-emulation    Disable all device form factor emulation. Deprecated: use --emulated-form-factor=none instead              [boolean]
  --throttling-method                  Controls throttling method         [choices: "devtools", "provided", "simulate"]
  --throttling.rttMs                   Controls simulated network RTT (TCP layer)
  --throttling.throughputKbps          Controls simulated network download throughput
  --throttling.requestLatencyMs        Controls emulated network RTT (HTTP layer)
  --throttling.downloadThroughputKbps  Controls emulated network download throughput
  --throttling.uploadThroughputKbps    Controls emulated network upload throughput
  --throttling.cpuSlowdownMultiplier   Controls simulated + emulated CPU throttling
  --extra-headers               Set extra HTTP Headers to pass with request                                                                 [string]

Examples:
  lighthouse <url> --view                                                   Opens the HTML report in a browser after the run completes
  lighthouse <url> --config-path=./myconfig.js                              Runs Lighthouse with your own configuration: custom audits, report
                                                                            generation, etc.
  lighthouse <url> --output=json --output-path=./report.json --save-assets  Save trace, devtoolslog, and named JSON report.
  lighthouse <url> --disable-device-emulation                               Disable device emulation and all throttling.
    --throttling-method=provided
  lighthouse <url> --chrome-flags="--window-size=412,660"                   Launch Chrome with a specific window size
  lighthouse <url> --quiet --chrome-flags="--headless"                      Launch Headless Chrome, turn off logging
  lighthouse <url> --extra-headers "{\"Cookie\":\"monster=blue\"}"          Stringify\'d JSON HTTP Header key/value pairs to send in requests
  lighthouse <url> --extra-headers=./path/to/file.json                      Path to JSON file of HTTP Header key/value pairs to send in requests

For more information on Lighthouse, see https://developers.google.com/web/tools/lighthouse/.
```

## Cool Guide by Brad Stiff

**A guide to building a React component with webpack 4, publishing to npm, and deploying the demo to GitHub Pages** [Read more](https://medium.com/dailyjs/building-a-react-component-with-webpack-publish-to-npm-deploy-to-github-guide-6927f60b3220) :+1:

---

Hacked with ❤️ by [BLEN](https://blencorp.com) Corp in Washington, DC.
