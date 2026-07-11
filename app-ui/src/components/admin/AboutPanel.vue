<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
    <div class="mb-6">
      <h2 class="text-lg font-semibold text-slate-800">Build Info</h2>
      <p class="text-sm text-slate-500 mt-1">
        Version and build identifiers for the running deployment.
      </p>
    </div>

    <dl class="divide-y divide-slate-100">
      <div class="py-3 flex items-baseline justify-between gap-4">
        <dt class="text-sm font-medium text-slate-600">UI</dt>
        <dd class="font-mono text-sm text-slate-800">{{ uiDisplay }}</dd>
      </div>

      <div class="py-3 flex items-baseline justify-between gap-4">
        <dt class="text-sm font-medium text-slate-600">UI built</dt>
        <dd class="font-mono text-sm text-slate-800">{{ formattedUiBuildTime }}</dd>
      </div>

      <div class="py-3 flex items-baseline justify-between gap-4">
        <dt class="text-sm font-medium text-slate-600">API</dt>
        <dd class="font-mono text-sm text-slate-800">
          <span v-if="apiLoading">…</span>
          <span v-else-if="apiError" class="text-slate-400 italic">unavailable</span>
          <span v-else>{{ apiVersion }}</span>
        </dd>
      </div>

      <div class="py-3 flex items-baseline justify-between gap-4">
        <dt class="text-sm font-medium text-slate-600">API built</dt>
        <dd class="font-mono text-sm text-slate-800">
          <span v-if="apiLoading">…</span>
          <span v-else-if="apiError || !apiBuildTime" class="text-slate-400">—</span>
          <span v-else>{{ formattedApiBuildTime }}</span>
        </dd>
      </div>
    </dl>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue'
import { HealthHttpClient } from '../../services/HealthHttpClient'

function formatTimestamp(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export default defineComponent({
  name: 'AboutPanel',
  setup() {
    const uiVersion = __APP_VERSION__
    const uiCommit = __APP_COMMIT__
    const buildTime = __APP_BUILD_TIME__

    const apiVersion = ref('')
    const apiBuildTime = ref('')
    const apiLoading = ref(true)
    const apiError = ref(false)

    const uiDisplay = computed(() => {
      const versionPart = uiVersion === 'dev' ? 'dev' : `v${uiVersion}`
      return `${versionPart} (${uiCommit})`
    })

    const formattedUiBuildTime = computed(() => formatTimestamp(buildTime))
    const formattedApiBuildTime = computed(() => formatTimestamp(apiBuildTime.value))

    onMounted(async () => {
      try {
        const data = await new HealthHttpClient().getHealthChecks()
        apiVersion.value = data.version
        // Absent on API builds ≤ v120; "unknown" if the assembly missed the stamp.
        apiBuildTime.value =
          data.buildTimeUtc && data.buildTimeUtc !== 'unknown' ? data.buildTimeUtc : ''
      } catch {
        apiError.value = true
      } finally {
        apiLoading.value = false
      }
    })

    return {
      uiDisplay,
      apiVersion,
      apiBuildTime,
      apiLoading,
      apiError,
      formattedUiBuildTime,
      formattedApiBuildTime,
    }
  },
})
</script>
