<template>
  <footer class="bg-slate-900 border-t border-slate-700/50">
    <div class="px-6 py-3 flex items-center justify-between gap-2">
      <p class="text-[10px] text-slate-600">
        &copy; {{ currentYear }} Neurocorp Therapy Center
      </p>
      <ApiHealthStatus
        class="text-[10px]"
        text-class="text-slate-600"
        healthy-class="text-emerald-400"
        degraded-class="text-amber-400"
        unhealthy-class="text-red-400"
      />
      <p class="text-[10px] text-slate-600">
        Option 03 &mdash; Modern Dark Mode
      </p>
    </div>
  </footer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ApiHealthStatus from '../shared/ApiHealthStatus.vue';

export default defineComponent({
  name: 'O3Footer',
  components: { ApiHealthStatus },
  setup() {
    const currentYear = new Date().getFullYear();
    return { currentYear };
  },
});
</script>
