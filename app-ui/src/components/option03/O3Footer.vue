<template>
  <footer class="bg-slate-900 border-t border-slate-700/50">
    <div class="px-6 py-3 flex items-center justify-between">
      <p class="text-[10px] text-slate-600">
        &copy; {{ currentYear }} Neurocorp Therapy Center
      </p>
      <p class="text-[10px] text-slate-600">
        Option 03 &mdash; Modern Dark Mode
      </p>
    </div>
  </footer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'O3Footer',
  setup() {
    const currentYear = new Date().getFullYear();
    return { currentYear };
  },
});
</script>
