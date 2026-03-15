<template>
  <footer class="bg-white border-t border-gray-200">
    <div class="px-6 py-2.5 flex items-center justify-between gap-2">
      <p class="text-[10px] text-gray-400">
        &copy; {{ currentYear }} Neurocorp Therapy Center
      </p>
      <ApiHealthStatus class="text-[10px]" />
      <p class="text-[10px] text-gray-400">
        Option 04 &mdash; Kanban Board
      </p>
    </div>
  </footer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ApiHealthStatus from '../shared/ApiHealthStatus.vue';

export default defineComponent({
  name: 'O4Footer',
  components: { ApiHealthStatus },
  setup() {
    const currentYear = new Date().getFullYear();
    return { currentYear };
  },
});
</script>
