import { mergeConfig, defineConfig } from 'vitest/config';
import viteConfig from './vite.config';

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
