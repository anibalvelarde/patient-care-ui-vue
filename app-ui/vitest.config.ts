import { mergeConfig, defineConfig } from 'vitest/config';
import viteConfig from './vite.config';

// WP-60: run every spec in the clinic's time zone (America/Panama, UTC-5) so "a day early" and
// "tomorrow after 7 PM" bugs fail here — CI runs in UTC, where they are invisible. Set before any
// worker starts; forked workers inherit it.
process.env.TZ = 'America/Panama';

// Reuse the app's Vite config (the `@` alias + build-time __APP_*__ defines) and layer the
// Vitest test settings on top, so tests resolve modules exactly like the app does.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      include: ['src/**/*.{test,spec}.ts'],
    },
  }),
);
