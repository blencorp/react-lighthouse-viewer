import { afterEach, describe, expect, test, vi } from 'vitest';
import { fetchLighthouseReport } from '../src/index.ts';
import { reportLatest } from './fixtures.ts';

const respond = (body: string, status = 200) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body, { status }));

describe('fetchLighthouseReport', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('returns the report', async () => {
    const fetch = respond(JSON.stringify(reportLatest));
    const init = { headers: { authorization: 'Bearer token' } };

    await expect(fetchLighthouseReport('https://example.com/report.json', init)).resolves.toEqual(
      reportLatest,
    );
    expect(fetch).toHaveBeenCalledWith('https://example.com/report.json', init);
  });

  test('rejects when the request fails', async () => {
    respond('Not found', 404);
    await expect(fetchLighthouseReport('/missing.json')).rejects.toThrow(
      'Could not load /missing.json: HTTP 404.',
    );
  });

  test('rejects when the response is not JSON', async () => {
    respond('<!doctype html>');
    await expect(fetchLighthouseReport('/index.html')).rejects.toThrow(
      '/index.html did not return JSON.',
    );
  });

  test('rejects when the JSON is not a report', async () => {
    respond('{"steps":[]}');
    await expect(fetchLighthouseReport('/flow.json')).rejects.toThrow(
      '/flow.json is not a Lighthouse report.',
    );
  });
});
