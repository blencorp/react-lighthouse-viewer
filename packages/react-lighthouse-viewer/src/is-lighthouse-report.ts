import type { LighthouseReport } from './types.ts';

/**
 * Checks that a value has the top-level shape of a Lighthouse report (LHR): `lighthouseVersion`,
 * `categories`, `audits` and `configSettings`. Use it on JSON that you fetch or that users upload.
 * It does not check every audit, and it accepts reports from older Lighthouse versions, which the
 * renderer upgrades.
 */
export function isLighthouseReport(value: unknown): value is LighthouseReport {
  return (
    isObject(value) &&
    typeof value['lighthouseVersion'] === 'string' &&
    isObject(value['categories']) &&
    isObject(value['audits']) &&
    isObject(value['configSettings'])
  );
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
