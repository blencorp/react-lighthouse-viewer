import { describe, expect, test } from 'vitest';
import { isLighthouseReport } from '../src/index.ts';
import { report6, reportLatest } from './fixtures.ts';

describe('isLighthouseReport', () => {
  test('accepts current and old Lighthouse reports', () => {
    expect(isLighthouseReport(reportLatest)).toBe(true);
    expect(isLighthouseReport(report6)).toBe(true);
  });

  test.each([
    ['null', null],
    ['a string', 'report.json'],
    ['an array', []],
    ['an empty object', {}],
    ['a user flow result', { name: 'flow', steps: [] }],
    [
      'a report without audits',
      { lighthouseVersion: '13.5.0', categories: {}, configSettings: {} },
    ],
    [
      'a non-string version',
      { lighthouseVersion: 13, categories: {}, audits: {}, configSettings: {} },
    ],
  ])('rejects %s', (_name, value) => {
    expect(isLighthouseReport(value)).toBe(false);
  });
});
