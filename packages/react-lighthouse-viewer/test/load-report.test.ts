import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  forgetReport,
  loadReportFile,
  normalizeUrl,
  reportKey,
  runPageSpeed,
} from '../src/load-report.ts';
import { reportLatest } from './fixtures.ts';

const respond = (body: unknown, status = 200) =>
  vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(
      new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }),
    );

afterEach(() => {
  vi.restoreAllMocks();
});

describe('normalizeUrl', () => {
  test.each([
    ['www.blencorp.com', 'https://www.blencorp.com'],
    ['  blencorp.com/about ', 'https://blencorp.com/about'],
    ['https://www.usa.gov/', 'https://www.usa.gov/'],
    ['http://localhost:3000', 'http://localhost:3000'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizeUrl(input)).toBe(expected);
  });
});

describe('loadReportFile', () => {
  test('rejects a response that is not JSON', async () => {
    respond('<!doctype html>');
    await expect(loadReportFile('/load-a.html')).rejects.toThrow(
      '/load-a.html did not return JSON.',
    );
  });

  test('rejects JSON that is not a report', async () => {
    respond({ steps: [] });
    await expect(loadReportFile('/load-b.json')).rejects.toThrow(
      '/load-b.json is not a Lighthouse report.',
    );
  });

  test('keeps a failed load until it is forgotten, then loads again', async () => {
    const fetch = respond('Server error', 500);
    await expect(loadReportFile('/load-c.json')).rejects.toThrow('HTTP 500');
    await expect(loadReportFile('/load-c.json')).rejects.toThrow('HTTP 500');
    expect(fetch).toHaveBeenCalledTimes(1);

    forgetReport(reportKey({ src: '/load-c.json' }));
    respond(reportLatest);
    await expect(loadReportFile('/load-c.json')).resolves.toEqual(reportLatest);
  });
});

describe('runPageSpeed', () => {
  test('defaults to mobile and leaves out an empty key', async () => {
    const fetch = respond({ lighthouseResult: reportLatest });
    await runPageSpeed('https://psi-a.example', {});
    const request = fetch.mock.calls[0]?.[0] as URL;
    expect(request.searchParams.get('strategy')).toBe('MOBILE');
    expect(request.searchParams.has('key')).toBe(false);
  });

  test('explains the shared quota when there is no key', async () => {
    respond({ error: { code: 429, message: 'Quota exceeded' } }, 429);
    await expect(runPageSpeed('https://psi-b.example', {})).rejects.toThrow(
      'PageSpeed Insights quota exceeded. Pass an `apiKey`',
    );
  });

  test('passes on the API error message', async () => {
    respond(
      { error: { code: 400, message: 'Lighthouse returned error: FAILED_DOCUMENT_REQUEST.' } },
      400,
    );
    await expect(runPageSpeed('https://psi-c.example', { apiKey: 'k' })).rejects.toThrow(
      'PageSpeed Insights could not analyze the page: Lighthouse returned error: FAILED_DOCUMENT_REQUEST.',
    );
  });

  test('explains a network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(runPageSpeed('https://psi-e.example', {})).rejects.toThrow(
      'Could not reach PageSpeed Insights. Check the network, or pass an `apiKey`',
    );
  });

  test('rejects a response without a Lighthouse result', async () => {
    respond({ id: 'x' });
    await expect(runPageSpeed('https://psi-d.example', {})).rejects.toThrow(
      'PageSpeed Insights did not return a Lighthouse report.',
    );
  });
});
