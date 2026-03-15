<template>
  <!-- Loading -->
  <span v-if="loading" :class="textClass">
    <span class="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse mr-1 align-middle"></span>
    API&nbsp;&hellip;
  </span>

  <!-- Error / unreachable -->
  <span v-else-if="error" :class="textClass">
    <span class="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 mr-1 align-middle"></span>
    API Unavailable
  </span>

  <!-- Loaded -->
  <span v-else :class="textClass">
    <span
      class="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle"
      :class="statusDotClass"
    ></span>
    API {{ version }}
    <span class="mx-0.5">|</span>
    <span :class="statusTextClass">{{ overallStatus }}</span>
    <span class="hidden sm:inline">
      <span class="mx-0.5">|</span>
      As of {{ formattedTimestamp }}
    </span>
  </span>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { HealthHttpClient } from '../../services/HealthHttpClient';
import type { HealthCheckStatus } from '../../interfaces/HealthCheck';

function deriveOverallStatus(statuses: HealthCheckStatus[]): 'Healthy' | 'Degraded' | 'Unhealthy' {
  if (statuses.some(s => s.status === 'Unhealthy')) return 'Unhealthy';
  if (statuses.some(s => s.status === 'Degraded')) return 'Degraded';
  return 'Healthy';
}

export default defineComponent({
  name: 'ApiHealthStatus',
  props: {
    textClass: { type: String, default: 'text-gray-400' },
    healthyClass: { type: String, default: 'text-emerald-500' },
    degradedClass: { type: String, default: 'text-amber-500' },
    unhealthyClass: { type: String, default: 'text-red-500' },
  },
  setup(props) {
    const loading = ref(true);
    const error = ref(false);
    const version = ref('');
    const overallStatus = ref<'Healthy' | 'Degraded' | 'Unhealthy'>('Healthy');
    const formattedTimestamp = ref('');

    const statusDotClass = ref('');
    const statusTextClass = ref('');

    const updateStatusClasses = () => {
      const map = {
        Healthy: props.healthyClass,
        Degraded: props.degradedClass,
        Unhealthy: props.unhealthyClass,
      };
      const colorClass = map[overallStatus.value];
      statusTextClass.value = colorClass;
      // Dot uses bg- equivalent: replace 'text-' with 'bg-'
      statusDotClass.value = colorClass.replace(/\btext-/g, 'bg-');
    };

    onMounted(async () => {
      try {
        const client = new HealthHttpClient();
        const data = await client.getHealthChecks();
        version.value = data.version;
        overallStatus.value = deriveOverallStatus(data.statuses);
        formattedTimestamp.value = new Date().toLocaleString('en-US', {
          month: 'numeric',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        updateStatusClasses();
      } catch {
        error.value = true;
      } finally {
        loading.value = false;
      }
    });

    return {
      loading,
      error,
      version,
      overallStatus,
      formattedTimestamp,
      statusDotClass,
      statusTextClass,
    };
  },
});
</script>
