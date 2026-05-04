<template>
  <footer class="bg-white border-t border-gray-200">
    <div class="px-6 py-3 flex items-center justify-between gap-2">
      <p class="text-[10px] text-gray-400">
        &copy; {{ currentYear }} Neurocorp Therapy Center
      </p>
      <div class="flex items-center gap-2 text-[10px]">
        <UiVersion class="text-[10px]" />
        <span class="text-gray-300">|</span>
        <ApiHealthStatus class="text-[10px]" />
      </div>
      <router-link
        to="/design-options"
        class="text-[10px] text-violet-500 hover:text-violet-700 font-medium transition-colors md:hidden"
      >
        &larr; Back to Options
      </router-link>
    </div>
  </footer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ApiHealthStatus from '../shared/ApiHealthStatus.vue';
import UiVersion from '../shared/UiVersion.vue';

export default defineComponent({
  name: 'O2Footer',
  components: { ApiHealthStatus, UiVersion },
  setup() {
    const currentYear = new Date().getFullYear();
    return { currentYear };
  },
});
</script>
