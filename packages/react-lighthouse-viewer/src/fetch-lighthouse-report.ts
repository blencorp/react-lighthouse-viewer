import { isLighthouseReport } from './is-lighthouse-report.ts';
import type { LighthouseReport } from './types.ts';

/**
 * Fetches a Lighthouse JSON report from a URL and checks it with `isLighthouseReport`. Pass the
 * returned promise to `<LighthouseViewer report={...} />`. The promise rejects with a readable
 * error when the request fails, the response is not JSON, or the JSON is not a report. The URL
 * must allow cross-origin requests (CORS) if it is on another origin.
 */
export async function fetchLighthouseReport(
  url: string | URL,
  init?: RequestInit,
): Promise<LighthouseReport> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Could not load ${String(url)}: HTTP ${response.status}.`);
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new Error(`${String(url)} did not return JSON.`);
  }
  if (!isLighthouseReport(json)) {
    throw new Error(`${String(url)} is not a Lighthouse report.`);
  }
  return json;
}
