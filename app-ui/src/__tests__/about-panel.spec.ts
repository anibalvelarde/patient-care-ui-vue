// H2 (meeting punch list 2026-07-07): Admin › About › Build Info must show the REST API
// build date. The API's GET /api/health/checks now returns `buildTimeUtc` (contract
// health-api.md); the panel renders it as an "API built" row and must tolerate older
// deployed APIs that omit the field.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import AboutPanel from '../components/admin/AboutPanel.vue';
import type { HealthCheckResponse } from '../interfaces/HealthCheck';

const { getHealthChecksMock } = vi.hoisted(() => ({
  getHealthChecksMock: vi.fn(),
}));

vi.mock('../services/HealthHttpClient', () => ({
  HealthHttpClient: vi.fn().mockImplementation(() => ({
    getHealthChecks: getHealthChecksMock,
  })),
}));

function healthResponse(overrides: Partial<HealthCheckResponse> = {}): HealthCheckResponse {
  return {
    version: '121.0.0.0',
    buildTimeUtc: '2026-07-11T18:24:03.1234567Z',
    statuses: [],
    ...overrides,
  };
}

function rowValue(wrapper: ReturnType<typeof mount>, label: string): string {
  const row = wrapper
    .findAll('dl > div')
    .find((r) => r.find('dt').text() === label);
  expect(row, `row "${label}" should exist`).toBeTruthy();
  return row!.find('dd').text();
}

describe('AboutPanel — API build date (H2)', () => {
  beforeEach(() => {
    getHealthChecksMock.mockReset();
  });

  it('renders the API version and formatted API build date', async () => {
    getHealthChecksMock.mockResolvedValue(healthResponse());
    const wrapper = mount(AboutPanel);
    await flushPromises();

    expect(rowValue(wrapper, 'API')).toBe('121.0.0.0');
    // Locale-formatted from the ISO stamp; assert on the stable date portion
    // (the hour depends on the test runner's timezone).
    expect(rowValue(wrapper, 'API built')).toMatch(/^7\/11\/2026, \d{1,2}:\d{2} (AM|PM)$/);
  });

  it('shows an em-dash when the API omits buildTimeUtc (builds ≤ v120)', async () => {
    getHealthChecksMock.mockResolvedValue(healthResponse({ buildTimeUtc: undefined }));
    const wrapper = mount(AboutPanel);
    await flushPromises();

    expect(rowValue(wrapper, 'API')).toBe('121.0.0.0');
    expect(rowValue(wrapper, 'API built')).toBe('—');
  });

  it('shows an em-dash for the "unknown" sentinel (unstamped assembly)', async () => {
    getHealthChecksMock.mockResolvedValue(healthResponse({ buildTimeUtc: 'unknown' }));
    const wrapper = mount(AboutPanel);
    await flushPromises();

    expect(rowValue(wrapper, 'API built')).toBe('—');
  });

  it('degrades both API rows when the health call fails', async () => {
    getHealthChecksMock.mockRejectedValue(new Error('network down'));
    const wrapper = mount(AboutPanel);
    await flushPromises();

    expect(rowValue(wrapper, 'API')).toBe('unavailable');
    expect(rowValue(wrapper, 'API built')).toBe('—');
  });

  it('still shows the UI version and UI build time rows', async () => {
    getHealthChecksMock.mockResolvedValue(healthResponse());
    const wrapper = mount(AboutPanel);
    await flushPromises();

    expect(rowValue(wrapper, 'UI')).not.toBe('');
    expect(rowValue(wrapper, 'UI built')).not.toBe('');
  });
});
