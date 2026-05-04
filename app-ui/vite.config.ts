import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { execSync } from 'node:child_process'

function gitShortSha(): string {
  try {
    return execSync('git rev-parse --short=7 HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim()
  } catch {
    return 'unknown'
  }
}

const appVersion = process.env.VITE_APP_VERSION ?? 'dev'
const appCommit = (process.env.VITE_APP_COMMIT ?? gitShortSha()).slice(0, 7)
const appBuildTime = process.env.VITE_APP_BUILD_TIME ?? new Date().toISOString()

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __APP_COMMIT__: JSON.stringify(appCommit),
    __APP_BUILD_TIME__: JSON.stringify(appBuildTime),
  },
  server: {
    port: 8080
  }
})
